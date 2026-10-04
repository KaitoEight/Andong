#!/usr/bin/env node
/*
 * Nhập DỊCH VỤ ĐÃ CHỐT của từng khách từ các file Excel theo tháng (thang4dv.xlsx, thang5dv.xlsx, …)
 * xuất từ phần mềm cũ (VTTECH), mỗi dòng = 1 dịch vụ của 1 khách.
 *
 * Cách dùng (chạy từ thư mục gốc dự án):
 *   node server/scripts/import-services.js                 # CHẠY THỬ: chỉ đọc DB, in báo cáo, không ghi gì
 *   node server/scripts/import-services.js --commit        # ghi thật (tự sao lưu trước)
 *
 * Tuỳ chọn:
 *   --dir "thư mục"        thư mục chứa các file *.xlsx (mặc định: data/import/dichvu)
 *   --catalog replace|merge|skip
 *                          replace (mặc định): bảng giá = danh mục dịch vụ trong file; các dịch vụ cũ không thuộc file
 *                                              được LƯU BẢN SAO vào "Dữ liệu đã xoá" rồi mới gỡ khỏi bảng giá
 *                          merge: giữ bảng giá hiện có, chỉ thêm dịch vụ chưa có (theo mã)
 *                          skip : không đụng tới bảng giá
 *   --no-treatments        không tạo trạng thái điều trị (% hoàn thành) từ file
 *   --offline              không kết nối DB (chỉ đọc file + báo cáo)
 *
 * Quy tắc:
 *   - Mỗi khách: các dịch vụ thật thay cho dòng "Số dư chuyển từ phần mềm cũ" (Σ Thành tiền = Doanh số cũ).
 *     Nếu Σ nhỏ hơn Doanh số thì phần chênh được giữ lại thành 1 dòng số dư; nếu lớn hơn thì BỎ QUA khách đó và báo.
 *   - Hoá đơn / công nợ KHÔNG đổi (đã khớp Doanh số, Doanh thu từ lần nhập danh sách khách).
 *   - Idempotent: chạy lại không tạo trùng. Ghi theo từng khách (không ghi đè cả tài liệu).
 *   - SAU KHI --commit: mọi trình duyệt đang mở app phải F5 trước khi thao tác (app đang ghi đè cả dữ liệu bằng bản cũ).
 */
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..", "..");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { readXlsxRows } = require("./lib/xlsx");

// ─── tham số ─────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const DIR = path.resolve(opt("--dir", path.join(ROOT, "data", "import", "dichvu")));
const COMMIT = flag("--commit");
const OFFLINE = flag("--offline");
const CATALOG = opt("--catalog", "replace");
const WITH_TREATMENTS = !flag("--no-treatments");
if (!["replace", "merge", "skip"].includes(CATALOG)) { console.error("--catalog chỉ nhận replace | merge | skip"); process.exit(1); }

// ─── tiện ích ────────────────────────────────────────────────────────────────
const clean = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const num = (s) => { const n = Number(clean(s)); return Number.isFinite(n) ? n : 0; };
const vnd = (n) => Number(n).toLocaleString("vi-VN") + " ₫";
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
const count = (arr, f) => arr.reduce((m, x) => { const k = f(x) || "(trống)"; m[k] = (m[k] || 0) + 1; return m; }, {});
const pick = (counter) => Object.entries(counter).sort((a, b) => b[1] - a[1] || String(b[0]).localeCompare(String(a[0])))[0][0];

function dateTime(s) { // "11:46 28-04-2026"
  const m = /^(\d{2}):(\d{2}) (\d{2})-(\d{2})-(\d{4})$/.exec(clean(s));
  return m ? { date: `${m[5]}-${m[4]}-${m[3]}`, time: `${m[1]}:${m[2]}` } : { date: "", time: "" };
}
function dmy(s) { // "28-04-2026"
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(clean(s));
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}
function mapSource(raw) {
  const s = clean(raw), k = s.toLowerCase();
  if (!s || k === "khách vãng lai") return { source: "Khách Vãng Lai", sourceDetail: "" };
  if (k === "khách giới thiệu" || k === "giới thiệu") return { source: "Giới thiệu", sourceDetail: "" };
  if (k === "facebook") return { source: "Facebook", sourceDetail: "" };
  if (k.includes("facebook")) return { source: "Facebook", sourceDetail: s };
  if (k.includes("zalo")) return { source: "Zalo", sourceDetail: s };
  if (k.includes("google")) return { source: "Google", sourceDetail: s };
  return { source: "Khác", sourceDetail: s };
}
const invStatus = (total, paid) => (paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : "unpaid");

// ─── đọc các file tháng ──────────────────────────────────────────────────────
const REQUIRED = ["Mã khách hàng", "Khách hàng", "Dịch vụ", "Mã dịch vụ", "Mã lên đơn", "Giá ban đầu", "Tổng giảm", "Thành tiền", "Thanh toán", "Ngày tạo"];

function readRows() {
  if (!fs.existsSync(DIR)) throw new Error(`Không thấy thư mục dữ liệu: ${DIR}\nGiải nén dichvu.rar vào đó (các file thang4dv.xlsx, thang5dv.xlsx, …).`);
  const files = fs.readdirSync(DIR).filter((f) => /\.xlsx$/i.test(f) && !f.startsWith("~$")).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  if (!files.length) throw new Error(`Thư mục ${DIR} không có file .xlsx nào.`);
  const rows = [], perFile = {};
  for (const f of files) {
    const data = readXlsxRows(path.join(DIR, f));
    const hdr = data[0].map(clean);
    for (const h of REQUIRED) if (!hdr.includes(h)) throw new Error(`File ${f} thiếu cột bắt buộc "${h}".`);
    let n = 0;
    for (const line of data.slice(1)) {
      if (line.every((c) => !clean(c))) continue;
      const o = {};
      hdr.forEach((h, i) => { o[h] = clean(line[i]); });
      o._file = f;
      rows.push(o); n++;
    }
    perFile[f] = n;
  }
  return { rows, perFile };
}

function buildPlan(rows) {
  const skipped = [], warnings = [], seenOrders = new Set(), usable = [];
  for (const r of rows) {
    if (r["Mã khách hàng"] === "NDD00000001" || /vttest/i.test(r["Khách hàng"])) { skipped.push({ r, why: "khách thử nghiệm" }); continue; }
    if (!r["Dịch vụ"] || !r["Mã lên đơn"]) { skipped.push({ r, why: "thiếu tên dịch vụ / mã lên đơn" }); continue; }
    if (seenOrders.has(r["Mã lên đơn"])) { skipped.push({ r, why: "trùng mã lên đơn" }); continue; }
    seenOrders.add(r["Mã lên đơn"]);
    usable.push(r);
  }

  // Danh mục dịch vụ (bảng giá) từ chính các dòng
  const bySv = {};
  for (const r of usable) {
    const k = r["Mã dịch vụ"] || "SV?" + slug(r["Dịch vụ"]);
    const e = (bySv[k] = bySv[k] || { names: {}, groups: {}, prices: {} });
    e.names[r["Dịch vụ"]] = (e.names[r["Dịch vụ"]] || 0) + 1;
    e.groups[r["Loại dịch vụ"] || "Khác"] = (e.groups[r["Loại dịch vụ"] || "Khác"] || 0) + 1;
    const p = num(r["Giá ban đầu"]); e.prices[p] = (e.prices[p] || 0) + 1;
  }
  const catalog = Object.entries(bySv).map(([code, e]) => ({
    id: "sv_" + slug(code), code, name: pick(e.names), group: pick(e.groups), type: "Dịch vụ",
    price: Number(pick(e.prices)), unit: "Lần", mins: 30, active: true, imported: "VTTECH",
  })).sort((a, b) => a.code.localeCompare(b.code));
  const svId = (r) => "sv_" + slug(r["Mã dịch vụ"] || "SV?" + slug(r["Dịch vụ"]));

  // Dòng dịch vụ + điều trị theo từng khách
  const byCust = {};
  for (const r of usable) {
    const code = r["Mã khách hàng"];
    const dt = dateTime(r["Ngày tạo"]);
    if (!dt.date) warnings.push({ msg: `Ngày tạo không đọc được "${r["Ngày tạo"]}" (${r["Mã lên đơn"]})` });
    const price = num(r["Giá ban đầu"]), total = num(r["Thành tiền"]);
    const detail = r["Chi tiết dịch vụ"], note = r["Ghi chú"];
    const key = slug(r["Mã lên đơn"]);
    const completion = Math.max(0, Math.min(100, num(r["Hoàn thành%"])));
    const lastTreat = dmy(r["Ngày điều trị cuối"]);
    const line = {
      id: "cs_" + key, code: r["Mã lên đơn"], serviceId: catalog.some((c) => c.id === svId(r)) ? svId(r) : "",
      name: r["Dịch vụ"], group: r["Loại dịch vụ"], price, qty: 1, discount: Math.max(0, price - total), total, treatCount: 0,
      note: [note, detail && !note.includes(detail) ? detail : ""].filter(Boolean).join(" · "),
      consultant: r["Người tư vấn"], staff: r["Người chịu trách nhiệm"], closed: true,
      date: dt.date, time: dt.time, paid: num(r["Thanh toán"]), completion, imported: "VTTECH",
    };
    const treat = {
      id: "tr_" + key, date: lastTreat || dt.date, time: lastTreat ? "" : dt.time, serviceId: line.serviceId, serviceName: line.name,
      status: completion >= 100 ? "Điều trị xong" : "Đang điều trị", completion,
      doctor: line.staff || line.consultant || "", tech: "", support: "",
      content: `Nhập từ phần mềm cũ: ${line.name}${detail ? ` (${detail})` : ""}`, imported: "VTTECH",
    };
    (byCust[code] = byCust[code] || { code, name: r["Khách hàng"], first: r, lines: [], treats: [] });
    byCust[code].lines.push(line); byCust[code].treats.push(treat);
  }
  return { usable, skipped, warnings, catalog, byCust };
}

// ─── báo cáo ─────────────────────────────────────────────────────────────────
function report(plan, perFile, db) {
  const { usable, skipped, warnings, catalog, byCust } = plan;
  console.log("\n══════════ BÁO CÁO NHẬP DỊCH VỤ ══════════");
  console.log(`Thư mục    : ${DIR}`);
  console.log(`Chế độ     : ${COMMIT ? "GHI THẬT (--commit)" : "CHẠY THỬ (không ghi gì)"} | bảng giá: ${CATALOG} | điều trị: ${WITH_TREATMENTS ? "có" : "không"}${OFFLINE ? " | offline" : ""}`);
  console.log("File       :", JSON.stringify(perFile));
  console.log(`Dòng dịch vụ dùng được: ${usable.length} | khách có dịch vụ: ${Object.keys(byCust).length} | danh mục: ${catalog.length} dịch vụ`);
  const lines = Object.values(byCust).flatMap((c) => c.lines);
  console.log(`Σ Thành tiền ${vnd(lines.reduce((s, l) => s + l.total, 0))} | Σ Thanh toán ${vnd(lines.reduce((s, l) => s + l.paid, 0))} | dòng miễn phí (0đ): ${lines.filter((l) => l.total <= 0).length}`);
  console.log(`Theo nhóm : ${JSON.stringify(count(lines, (l) => l.group))}`);
  console.log(`Hoàn thành: ${JSON.stringify(count(lines, (l) => l.completion + "%"))}`);
  console.log(`Người chịu trách nhiệm: ${JSON.stringify(count(lines, (l) => l.staff))}`);
  console.log(`Người tư vấn: ${JSON.stringify(count(lines, (l) => l.consultant))}`);
  if (skipped.length) { console.log(`\nBỏ qua ${skipped.length} dòng:`); skipped.forEach((s) => console.log(`   - ${s.r._file}: ${s.why} (${s.r["Khách hàng"] || "?"} · ${s.r["Mã lên đơn"] || "?"})`)); }
  warnings.forEach((w) => console.log("   ! " + w.msg));
  if (db) {
    console.log("\nSo với database hiện tại:");
    console.log(`   khách ${db.customers} | dịch vụ trong bảng giá ${db.services} | hoá đơn ${db.invoices}`);
    console.log(`   khách đã có sẽ cập nhật dịch vụ: ${db.update.length} | khách MỚI sẽ tạo: ${db.create.length}${db.create.length ? " → " + db.create.map((c) => `${c.code} ${c.name}`).join(", ") : ""}`);
    console.log(`   dòng số dư cũ sẽ được thay: ${db.replacedPlaceholder} | giữ lại số dư phần chênh: ${db.residual.length} | BỎ QUA khách (tổng dịch vụ > Doanh số): ${db.conflict.length}`);
    db.residual.forEach((x) => console.log(`      · còn dư ${vnd(x.residual)}: ${x.code} ${x.name}`));
    db.conflict.forEach((x) => console.log(`      ✗ ${x.code} ${x.name}: Doanh số ${vnd(x.billed)} < tổng dịch vụ ${vnd(x.sum)}`));
    console.log(`   dịch vụ đã có sẵn (đã nhập trước đó): ${db.alreadyLines} dòng sẽ được bỏ qua`);
    console.log(`   bảng giá (${CATALOG}): ${db.catalogNote}`);
    console.log(`   Σ Thành tiền toàn hệ thống sau khi nhập: ${vnd(db.afterBilled)} | Σ Doanh số (hoá đơn) ${vnd(db.invoiceTotal)}`);
  }
}

// ─── main ────────────────────────────────────────────────────────────────────
(async () => {
  const { rows, perFile } = readRows();
  const plan = buildPlan(rows);

  if (OFFLINE) {
    if (COMMIT) { console.error("--commit không dùng được với --offline."); process.exit(1); }
    report(plan, perFile, null);
    console.log("\n(offline: chưa so sánh với database)");
    return;
  }

  const mongoose = require("mongoose");
  const connectDB = require("../db");
  const ClinicData = require("../models/ClinicData");
  const Trash = require("../models/Trash");
  await connectDB();
  try {
    const doc = await ClinicData.findOne();
    if (!doc) { console.error("\nDatabase chưa có dữ liệu phòng khám."); process.exitCode = 1; return; }
    const d = doc.toObject();
    const custById = new Map(d.customers.map((c) => [c.id, c]));
    const ops = [], update = [], create = [], residual = [], conflict = [];
    let replacedPlaceholder = 0, alreadyLines = 0, afterBilledNew = 0;
    const newInvoices = [];

    for (const bc of Object.values(byCustSorted(plan.byCust))) {
      const id = "kh_" + slug(bc.code);
      const cur = custById.get(id);
      if (!cur) {
        // Khách chưa có trong hệ thống (mới tạo sau lần xuất danh sách khách): tạo hồ sơ + hoá đơn số dư
        const r = bc.first, dt = dateTime(r["Ngày tạo"]), src = mapSource(r["Nguồn"]);
        const billed = bc.lines.reduce((s, l) => s + l.total, 0), paid = bc.lines.reduce((s, l) => s + l.paid, 0);
        const cust = {
          id, code: bc.code, name: bc.name, gender: r["Giới tính"] === "Nữ" ? "Nữ" : "Nam", dob: "", dobYearOnly: false,
          phone: r["Số điện thoại"], email: "", address: "", ward: "", province: r["Tỉnh/Thành phố"], nationality: "Vietnam", language: "Tiếng Việt",
          group: "Mới", source: src.source, sourceDetail: src.sourceDetail, oldCode: "", note: "", createdAt: dt.date,
          legacy: { system: "VTTECH", file: "dichvu", importedAt: new Date().toISOString(), billed, collected: paid, debt: billed - paid, ageGroup: r["Tuổi"] },
          services: bc.lines, treatments: WITH_TREATMENTS ? bc.treats : [],
        };
        const inv = billed > 0 || paid > 0 ? {
          id: "inv_" + slug(bc.code), code: "HDCU" + bc.code.replace(/\D/g, ""), customerId: id, customerName: bc.name, customerPhone: cust.phone,
          date: dt.date, time: dt.time, items: [{ name: "Số dư chuyển từ phần mềm cũ", qty: 1, price: billed }], total: billed, paid,
          method: "Chuyển từ phần mềm cũ", staff: "Phần mềm cũ", status: invStatus(billed, paid), note: "Nhập từ Excel (VTTECH)", legacy: true,
        } : null;
        create.push({ code: bc.code, name: bc.name, cust, inv });
        afterBilledNew += billed;
        continue;
      }
      const existingServices = cur.services || [];
      const have = new Set(existingServices.map((s) => s.id));
      const newLines = bc.lines.filter((l) => !have.has(l.id));
      alreadyLines += bc.lines.length - newLines.length;
      const placeholders = existingServices.filter((s) => s.legacy === true && String(s.id).startsWith("cs_ndd"));
      const keep = existingServices.filter((s) => !placeholders.includes(s));
      const sumReal = [...keep, ...newLines].reduce((s, x) => s + (x.total || 0), 0);
      const billed = cur.legacy && typeof cur.legacy.billed === "number" ? cur.legacy.billed : sumReal;
      const diff = billed - sumReal;
      let services;
      if (Math.abs(diff) < 1) { services = [...keep, ...newLines]; replacedPlaceholder += placeholders.length; }
      else if (diff > 0) {
        const ph = placeholders[0] ? { ...placeholders[0], price: diff, total: diff, note: "Phần Doanh số cũ chưa có chi tiết dịch vụ" } : null;
        services = ph ? [...keep, ...newLines, ph] : [...keep, ...newLines];
        residual.push({ code: bc.code, name: bc.name, residual: diff }); replacedPlaceholder += placeholders.length ? 1 : 0;
      } else { conflict.push({ code: bc.code, name: bc.name, billed, sum: sumReal }); continue; }
      const treatHave = new Set((cur.treatments || []).map((t) => t.id));
      const treatments = WITH_TREATMENTS ? [...(cur.treatments || []), ...bc.treats.filter((t) => !treatHave.has(t.id))] : (cur.treatments || []);
      if (!newLines.length && services.length === existingServices.length && treatments.length === (cur.treatments || []).length) continue; // không có gì mới
      update.push({ code: bc.code, name: bc.name, id });
      ops.push({ updateOne: { filter: { _id: doc._id, "customers.id": id }, update: { $set: { "customers.$.services": services, "customers.$.treatments": treatments } } } });
    }

    // Bảng giá
    const oldServices = d.services || [];
    let catalogNote = "không đổi";
    const removable = oldServices.filter((s) => s.imported !== "VTTECH");
    const haveSvCode = new Set(oldServices.map((s) => s.code).filter(Boolean));
    if (CATALOG === "replace") {
      const same = oldServices.length === plan.catalog.length && oldServices.every((s) => s.imported === "VTTECH");
      if (!same) catalogNote = `thay ${oldServices.length} dịch vụ cũ bằng ${plan.catalog.length} dịch vụ từ file (${removable.length} dịch vụ cũ sẽ được LƯU BẢN SAO vào "Dữ liệu đã xoá")`;
    } else if (CATALOG === "merge") {
      const add = plan.catalog.filter((c) => !haveSvCode.has(c.code));
      catalogNote = add.length ? `thêm ${add.length} dịch vụ mới, giữ nguyên ${oldServices.length} dịch vụ hiện có` : "không có dịch vụ mới để thêm";
    }
    const billedAfter = d.customers.reduce((s, c) => s + (c.services || []).reduce((x, l) => x + (l.total || 0), 0), 0);
    const afterBilled = billedAfter + afterBilledNew + 0; // dịch vụ mới được cộng; dòng số dư thay thế có tổng bằng nhau nên không đổi
    const invoiceTotal = d.invoices.reduce((s, i) => s + (i.total || 0), 0) + create.reduce((s, c) => s + (c.inv ? c.inv.total : 0), 0);

    report(plan, perFile, {
      customers: d.customers.length, services: oldServices.length, invoices: d.invoices.length,
      update, create: create.map((c) => ({ code: c.code, name: c.name })), replacedPlaceholder, residual, conflict, alreadyLines,
      catalogNote, afterBilled, invoiceTotal,
    });

    const catalogChange = CATALOG === "replace" ? catalogNote !== "không đổi" : CATALOG === "merge" ? catalogNote.startsWith("thêm") : false;
    if (!ops.length && !create.length && !catalogChange) { console.log("\nKhông có gì mới để nhập."); return; }

    if (!COMMIT) {
      console.log("\n→ CHẠY THỬ: chưa ghi gì. Xem lại báo cáo, nếu đúng thì chạy lại với --commit");
      const sample = Object.values(plan.byCust).find((c) => c.lines.length > 1) || Object.values(plan.byCust)[0];
      console.log("\nMẫu 1 dòng dịch vụ sẽ được tạo:\n" + JSON.stringify(sample.lines[0], null, 2));
      console.log("Mẫu 1 bản ghi điều trị:\n" + JSON.stringify(sample.treats[0], null, 2));
      return;
    }

    // ── Ghi thật ──
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dir = path.join(ROOT, "data", "backup");
    fs.mkdirSync(dir, { recursive: true });
    const backup = path.join(dir, `clinic-before-services-${stamp}.json`);
    fs.writeFileSync(backup, JSON.stringify(d, null, 2));
    console.log("\nĐã sao lưu dữ liệu hiện tại →", backup);

    if (CATALOG === "replace" && removable.length) {
      for (const s of removable) {
        await Trash.create({
          type: "service", label: s.name || s.code || "(dịch vụ)", summary: `${s.group || "Khác"} · ${vnd(s.price || 0)} · bị thay khi nhập bảng giá từ file Excel`,
          payload: { service: s }, deletedBy: { id: "script", username: "cong-cu-nhap-lieu", fullName: "Công cụ nhập dữ liệu", role: "Quản lý" },
        });
      }
      console.log(`Đã lưu bản sao ${removable.length} dịch vụ cũ vào "Dữ liệu đã xoá"`);
    }
    if (CATALOG === "replace") ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { services: plan.catalog } } } });
    if (CATALOG === "merge") {
      const add = plan.catalog.filter((c) => !haveSvCode.has(c.code));
      if (add.length) ops.push({ updateOne: { filter: { _id: doc._id }, update: { $push: { services: { $each: add } } } } });
    }
    for (const c of create) {
      const push = { customers: c.cust }; if (c.inv) push.invoices = c.inv;
      ops.push({ updateOne: { filter: { _id: doc._id }, update: { $push: push } } });
    }
    const res = await ClinicData.collection.bulkWrite(ops, { ordered: false });
    console.log(`Kết quả ghi: ${res.modifiedCount} thao tác thành công / ${ops.length}`);

    // ── Kiểm tra lại ──
    const after = (await ClinicData.findOne()).toObject();
    let bad = 0, withSvc = 0;
    for (const c of after.customers) {
      if (!c.legacy || typeof c.legacy.billed !== "number") continue;
      const sum = (c.services || []).reduce((s, x) => s + (x.total || 0), 0);
      if ((c.services || []).length) withSvc++;
      if (Math.abs(sum - c.legacy.billed) >= 1) { bad++; if (bad <= 5) console.log(`   ✗ lệch: ${c.code} ${c.name}: Doanh số ${vnd(c.legacy.billed)} ≠ Σ dịch vụ ${vnd(sum)}`); }
    }
    const billed = after.customers.reduce((s, c) => s + (c.services || []).reduce((x, l) => x + (l.total || 0), 0), 0);
    const invB = after.invoices.reduce((s, i) => s + (i.total || 0), 0), invP = after.invoices.reduce((s, i) => s + (i.paid || 0), 0);
    console.log(`\nKiểm tra sau khi ghi:`);
    console.log(`   khách ${after.customers.length} (có dịch vụ: ${withSvc}) | dịch vụ trong bảng giá ${after.services.length} | hoá đơn ${after.invoices.length}`);
    console.log(`   Σ dịch vụ (Dashboard "Doanh số") ${vnd(billed)} | Σ hoá đơn ${vnd(invB)} | đã thu ${vnd(invP)} | công nợ ${vnd(billed - invP)}`);
    console.log(`   khách có tổng dịch vụ ≠ Doanh số cũ: ${bad} ${bad ? "✗ KIỂM TRA LẠI" : "✓"}`);
    if (bad) process.exitCode = 1;
    console.log(`\nKhôi phục nếu cần: node server/scripts/import-customers.js --restore "${backup}" --commit`);
    console.log("\n⚠ BẮT BUỘC: tất cả trình duyệt đang mở app phải bấm F5 (tải lại) trước khi thao tác,");
    console.log("  nếu không bản dữ liệu cũ trong trình duyệt sẽ ghi đè và làm mất dịch vụ vừa nhập.");
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => { console.error("LỖI:", e.message); process.exit(1); });

// Sắp xếp theo mã khách để báo cáo ổn định
function byCustSorted(o) { return Object.fromEntries(Object.entries(o).sort((a, b) => a[0].localeCompare(b[0]))); }
