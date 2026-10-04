#!/usr/bin/env node
/*
 * Migrate "Danh sách khách hàng.xlsx" (xuất từ phần mềm cũ VTTECH) vào database Nha Khoa Victoria.
 *
 * Cách dùng (chạy từ thư mục gốc dự án):
 *   node server/scripts/import-customers.js                 # CHẠY THỬ: chỉ đọc, in báo cáo, không ghi gì
 *   node server/scripts/import-customers.js --commit        # ghi thật (tự sao lưu trước)
 *
 * Tuỳ chọn:
 *   --file "đường dẫn.xlsx"   file nguồn (mặc định: "Danh sách khách hàng.xlsx" ở thư mục gốc)
 *   --no-finance              chỉ nhập hồ sơ khách, bỏ qua Doanh số / Doanh thu / Công nợ
 *   --include-test            nhập cả khách thử nghiệm (tên chứa "test" và SĐT giả)
 *   --allow-phone-clash       vẫn nhập khách có SĐT trùng với khách ĐÃ CÓ trong DB (mặc định: bỏ qua để tránh trùng người)
 *   --replace                 THAY THẾ dữ liệu khách cũ bằng dữ liệu trong file (xoá khách/lịch hẹn/chăm sóc/hoá đơn cũ,
 *                             GIỮ nguyên bảng giá dịch vụ, nhân viên, khuyến mãi). Cần --commit; tự xuất dữ liệu cũ ra data/backup/.
 *   --restore file.json       khôi phục dữ liệu từ file xuất ở trên (cần --commit)
 *   --offline                 không kết nối DB (chỉ chuyển đổi + in báo cáo, không kiểm tra trùng với DB)
 *   --out file.json           ghi kết quả chuyển đổi ra file JSON để xem trước
 *
 * An toàn:
 *   - Idempotent: chạy lại nhiều lần không tạo trùng (khách đã có cùng mã/id sẽ bị bỏ qua).
 *   - Dùng $push nguyên tử, KHÔNG ghi đè cả tài liệu => không làm mất dữ liệu người khác vừa nhập.
 *   - Trước khi ghi, lưu bản sao toàn bộ dữ liệu hiện tại vào data/backup/.
 *   - SAU KHI --commit: mọi trình duyệt đang mở app phải F5 (tải lại) trước khi thao tác, vì app hiện ghi đè
 *     toàn bộ dữ liệu bằng bản cũ trong bộ nhớ của nó và sẽ làm mất khách vừa nhập.
 */
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");

const ROOT = path.join(__dirname, "..", "..");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// ─── tham số dòng lệnh ───────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const FILE = path.resolve(opt("--file", path.join(ROOT, "Danh sách khách hàng.xlsx")));
const COMMIT = flag("--commit");
const WITH_FINANCE = !flag("--no-finance");
const INCLUDE_TEST = flag("--include-test");
const OFFLINE = flag("--offline");
const ALLOW_PHONE_CLASH = flag("--allow-phone-clash");
const REPLACE = flag("--replace");
const RESTORE = opt("--restore", "");
const OUT = opt("--out", "");

// ─── đọc xlsx: xem lib/xlsx.js
const { readXlsxRows } = require("./lib/xlsx");

// ─── chuyển đổi dữ liệu ──────────────────────────────────────────────────────
const clean = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();

function dmyToIso(s) {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(clean(s));
  if (!m) return "";
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}

const money = (s) => { const n = Number(clean(s)); return Number.isFinite(n) ? n : 0; };

// Nguồn: gộp về danh sách của form (Khách Vãng Lai / Giới thiệu / Facebook / Zalo / Google / Khác),
// giữ nguyên bản gốc ở "Nguồn chi tiết" khi có thay đổi.
function mapSource(raw) {
  const s = clean(raw);
  if (!s) return { source: "Khách Vãng Lai", sourceDetail: "" };
  const k = s.toLowerCase();
  if (k === "khách vãng lai") return { source: "Khách Vãng Lai", sourceDetail: "" };
  if (k === "khách giới thiệu" || k === "giới thiệu") return { source: "Giới thiệu", sourceDetail: "" };
  if (k === "facebook") return { source: "Facebook", sourceDetail: "" };
  if (k.includes("facebook")) return { source: "Facebook", sourceDetail: s };
  if (k.includes("zalo")) return { source: "Zalo", sourceDetail: s };
  if (k.includes("google")) return { source: "Google", sourceDetail: s };
  return { source: "Khác", sourceDetail: s };
}

// Nhóm khách: dựa vào hạng thành viên của phần mềm cũ.
function mapGroup(tier) {
  const t = clean(tier).toLowerCase();
  if (t === "diamond" || t === "platinum") return "VIP";
  if (t === "gold" || t === "silver") return "Khách quen";
  return "Mới";
}

const isTestCustomer = (r) => /\btest\b|vttest/i.test(r.name) && (/^0+\d{0,2}$/.test(r.phone));

function convert(rows, importedAt) {
  const hdr = rows[0].map(clean);
  const need = ["Mã khách hàng", "Tên khách", "Điện thoại"];
  for (const h of need) if (!hdr.includes(h)) throw new Error(`Thiếu cột bắt buộc "${h}" trong file.`);
  const ix = Object.fromEntries(hdr.map((h, i) => [h, i]));
  const get = (r, h) => (ix[h] === undefined ? "" : clean(r[ix[h]]));

  const customers = [];
  const invoices = [];
  const skipped = [];
  const warnings = [];
  const seenCodes = new Set();
  let today = new Date(); today = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  rows.slice(1).forEach((r, idx) => {
    const line = idx + 2; // số dòng trong Excel
    if (r.every((c) => !clean(c))) return;
    const code = get(r, "Mã khách hàng");
    const name = get(r, "Tên khách");
    const phone = get(r, "Điện thoại");
    if (!code || !name) { skipped.push({ line, reason: "thiếu mã hoặc tên", code, name }); return; }
    if (seenCodes.has(code)) { skipped.push({ line, reason: "mã trùng trong file", code, name }); return; }
    seenCodes.add(code);
    if (!INCLUDE_TEST && isTestCustomer({ name, phone })) { skipped.push({ line, reason: "khách thử nghiệm", code, name }); return; }

    const dobRaw = get(r, "Ngày sinh");
    const dob = dmyToIso(dobRaw);
    if (dobRaw && !dob) warnings.push({ line, code, msg: `Ngày sinh không hợp lệ "${dobRaw}" — bỏ trống` });
    const dobYearOnly = !!dob && dob.endsWith("-01-01"); // phần mềm cũ ghi 01-01-năm khi chỉ biết năm sinh
    const src = mapSource(get(r, "Nguồn"));
    const tier = get(r, "Thành viên");
    const created = dmyToIso(get(r, "Ngày tạo"));
    const firstPay = dmyToIso(get(r, "Ngày thanh toán đầu tiên"));
    const id = "kh_" + code.toLowerCase();

    const cust = {
      id, code, name,
      gender: get(r, "Giới tính") === "Nữ" ? "Nữ" : "Nam",
      dob, dobYearOnly,
      phone,
      email: get(r, "Email"),
      address: get(r, "Địa chỉ"), ward: get(r, "Phường xã"), province: get(r, "Thành phố"),
      nationality: "Vietnam", language: "Tiếng Việt",
      group: mapGroup(tier),
      source: src.source, sourceDetail: src.sourceDetail,
      oldCode: get(r, "MSKH cũ"),
      note: "",
      createdAt: created,
      legacy: {
        system: "VTTECH", file: path.basename(FILE), importedAt, line,
        group: get(r, "Nhóm"), tier,
        firstPaymentDate: firstPay,
        lastTreatmentDate: dmyToIso(get(r, "Ngày điều trị cuối cùng")),
        lastCareDate: dmyToIso(get(r, "Ngày chăm sóc gần nhất")),
        lastApptDate: dmyToIso(get(r, "Ngày hẹn gần nhất")),
        createdBy: get(r, "Người tạo"),
        careStaff: get(r, "Nhân viên chăm sóc"), tele: get(r, "Tele phụ trách"),
        billed: money(get(r, "Doanh số")), collected: money(get(r, "Doanh thu")), debt: money(get(r, "Công nợ")),
      },
    };

    // Phát hiện SĐT bất thường để báo cáo (không sửa — giữ nguyên dữ liệu gốc)
    const digits = phone.replace(/\D/g, "");
    if (!/^0\d{9}$/.test(phone)) warnings.push({ line, code, msg: `SĐT bất thường: "${phone}" (${digits.length} số)` });

    if (WITH_FINANCE) {
      const billed = money(get(r, "Doanh số"));
      const paid = money(get(r, "Doanh thu"));
      if (billed > 0 || paid > 0) {
        const total = Math.max(billed, paid);
        if (paid > billed) warnings.push({ line, code, msg: `Doanh thu (${paid}) lớn hơn Doanh số (${billed}) — lấy Doanh số = Doanh thu` });
        const date = firstPay || created || today;
        const label = "Số dư chuyển từ phần mềm cũ";
        cust.services = [{
          id: "cs_" + code.toLowerCase(), code: "SPCU." + code, serviceId: "", name: label, group: "",
          price: total, qty: 1, discount: 0, total, treatCount: 0,
          note: "Nhập từ Excel (VTTECH): gộp toàn bộ doanh số trước thời điểm chuyển hệ thống",
          consultant: "", staff: "", closed: true, date, time: "", legacy: true,
        }];
        invoices.push({
          id: "inv_" + code.toLowerCase(), code: "HDCU" + code.replace(/\D/g, ""),
          customerId: id, customerName: name, customerPhone: phone,
          date, time: "",
          items: [{ name: label, qty: 1, price: total }],
          total, paid,
          method: "Chuyển từ phần mềm cũ", staff: "Phần mềm cũ",
          status: paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : "unpaid",
          note: "Nhập từ Excel (VTTECH)", legacy: true,
        });
      }
    }
    customers.push(cust);
  });

  // SĐT dùng chung giữa nhiều khách (chỉ cảnh báo)
  const byPhone = {};
  customers.forEach((c) => { if (c.phone.replace(/\D/g, "").length >= 9) (byPhone[c.phone] = byPhone[c.phone] || []).push(c); });
  Object.entries(byPhone).filter(([, v]) => v.length > 1).forEach(([p, v]) =>
    warnings.push({ line: v.map((c) => c.legacy.line).join("/"), code: v.map((c) => c.code).join(", "), msg: `SĐT ${p} dùng chung cho ${v.length} khách (vẫn nhập cả hai)` }));

  return { customers, invoices, skipped, warnings };
}

// ─── báo cáo ─────────────────────────────────────────────────────────────────
const vnd = (n) => Number(n).toLocaleString("vi-VN") + " ₫";
const count = (arr, f) => arr.reduce((m, x) => { const k = f(x) || "(trống)"; m[k] = (m[k] || 0) + 1; return m; }, {});

function report(conv, existing) {
  const { customers, invoices, skipped, warnings } = conv;
  console.log("\n══════════ BÁO CÁO MIGRATE ══════════");
  console.log(`File nguồn : ${FILE}`);
  console.log(`Chế độ     : ${COMMIT ? "GHI THẬT (--commit)" : "CHẠY THỬ (không ghi gì)"}${WITH_FINANCE ? "" : " | bỏ qua tài chính"}${OFFLINE ? " | offline" : ""}`);
  console.log(`\nKhách hàng sẽ nhập : ${customers.length}`);
  console.log(`Hoá đơn số dư đầu  : ${invoices.length}`);
  if (WITH_FINANCE) {
    const b = invoices.reduce((s, i) => s + i.total, 0), p = invoices.reduce((s, i) => s + i.paid, 0);
    console.log(`   Doanh số ${vnd(b)} | Đã thu ${vnd(p)} | Công nợ ${vnd(b - p)}`);
    console.log(`   Trạng thái: ${JSON.stringify(count(invoices, (i) => i.status))}`);
  }
  console.log(`\nBỏ qua: ${skipped.length}`);
  skipped.forEach((s) => console.log(`   - dòng ${s.line}: ${s.reason} (${s.code} · ${s.name})`));
  console.log("\nÁnh xạ:");
  console.log("   Nhóm KH  :", JSON.stringify(count(customers, (c) => c.group)), " (theo hạng thành viên: Diamond/Platinum→VIP, Gold/Silver→Khách quen, còn lại→Mới)");
  console.log("   Nguồn    :", JSON.stringify(count(customers, (c) => c.source + (c.sourceDetail ? ` [${c.sourceDetail}]` : ""))));
  console.log("   Tỉnh/TP  :", JSON.stringify(count(customers, (c) => c.province)));
  console.log("   Giới tính:", JSON.stringify(count(customers, (c) => c.gender)));
  console.log(`   Ngày sinh: có ${customers.filter((c) => c.dob).length}, trong đó chỉ biết năm (01-01) ${customers.filter((c) => c.dobYearOnly).length}, trống ${customers.filter((c) => !c.dob).length}`);
  if (warnings.length) {
    console.log(`\nCảnh báo (${warnings.length}) — dữ liệu vẫn được nhập nguyên văn:`);
    warnings.forEach((w) => console.log(`   - dòng ${w.line} (${w.code}): ${w.msg}`));
  }
  if (existing) {
    console.log("\nDatabase hiện tại:");
    console.log(`   khách ${existing.customers.length} | lịch hẹn ${existing.appts.length} | hoá đơn ${existing.invoices.length} | dịch vụ ${existing.services.length}`);
    console.log(`   Khách đã tồn tại (trùng id hoặc mã) → sẽ bỏ qua: ${existing.dupes}`);
    console.log(`   Khách MỚI sẽ thêm: ${existing.toAdd}`);
    if (existing.phoneClash.length) {
      console.log(`   SĐT trùng với khách ĐANG CÓ trong DB (${existing.phoneClash.length}) → ${ALLOW_PHONE_CLASH ? "vẫn nhập (--allow-phone-clash)" : "BỎ QUA, cần xử lý tay"}:`);
      existing.phoneClash.slice(0, 10).forEach((x) => console.log(`      - ${x}`));
    }
  }
}

// ─── sao lưu / khôi phục ─────────────────────────────────────────────────────
const COLLECTIONS = ["services", "customers", "appts", "care", "staff", "discounts", "invoices"];
const csvCell = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;

function exportOldData(old, stamp) {
  const dir = path.join(ROOT, "data", "backup");
  fs.mkdirSync(dir, { recursive: true });
  const jsonFile = path.join(dir, `clinic-OLD-data-${stamp}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(old, null, 2));
  // CSV khách cũ (đọc nhanh bằng Excel) — UTF-8 có BOM
  const cols = ["code", "name", "phone", "gender", "dob", "address", "group", "source", "note"];
  const csv = "﻿" + [cols.join(",")].concat((old.customers || []).map((c) => cols.map((k) => csvCell(c[k])).join(","))).join("\r\n");
  const csvFile = path.join(dir, `clinic-OLD-customers-${stamp}.csv`);
  fs.writeFileSync(csvFile, csv);
  // Đọc lại để chắc chắn file ghi đủ trước khi cho phép xoá
  const back = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  for (const k of COLLECTIONS) {
    if ((back[k] || []).length !== (old[k] || []).length) throw new Error(`File sao lưu không khớp ở "${k}" — dừng, chưa thay đổi gì.`);
  }
  return { jsonFile, csvFile };
}

// ─── main ────────────────────────────────────────────────────────────────────
(async () => {
  if (RESTORE) {
    const rf = path.resolve(RESTORE);
    if (!fs.existsSync(rf)) { console.error("Không tìm thấy file khôi phục:", rf); process.exit(1); }
    const snap = JSON.parse(fs.readFileSync(rf, "utf8"));
    const mongoose = require("mongoose");
    const connectDB = require("../db");
    const ClinicData = require("../models/ClinicData");
    await connectDB();
    try {
      const doc = await ClinicData.findOne();
      if (!doc) { console.error("Database chưa có dữ liệu."); process.exitCode = 1; return; }
      console.log("\nKHÔI PHỤC từ", rf);
      COLLECTIONS.forEach((k) => console.log(`   ${k.padEnd(10)} hiện ${String((doc[k] || []).length).padStart(4)} → sẽ thành ${String((snap[k] || []).length).padStart(4)}`));
      if (!COMMIT) { console.log("\n→ CHẠY THỬ: chưa ghi gì. Thêm --commit để khôi phục thật."); return; }
      const t = new Date().toISOString().replace(/[:.]/g, "-");
      const keep = exportOldData(doc.toObject(), "before-restore-" + t);
      console.log("Đã lưu bản hiện tại trước khi khôi phục →", keep.jsonFile);
      const set = {};
      COLLECTIONS.forEach((k) => { set[k] = snap[k] || []; });
      await ClinicData.updateOne({ _id: doc._id }, { $set: set });
      const after = await ClinicData.findOne();
      const ok = COLLECTIONS.every((k) => (after[k] || []).length === (snap[k] || []).length);
      console.log(ok ? "Khôi phục xong ✓" : "✗ Số lượng sau khôi phục không khớp — kiểm tra lại!");
      if (!ok) process.exitCode = 1;
      console.log("⚠ Các trình duyệt đang mở app phải F5 trước khi thao tác.");
    } finally { await mongoose.disconnect(); }
    return;
  }
  if (!fs.existsSync(FILE)) { console.error("Không tìm thấy file:", FILE); process.exit(1); }
  const importedAt = new Date().toISOString();
  const rows = readXlsxRows(FILE);
  const conv = convert(rows, importedAt);

  if (OUT) { fs.writeFileSync(OUT, JSON.stringify({ customers: conv.customers, invoices: conv.invoices }, null, 2)); console.log("Đã ghi", OUT); }

  if (OFFLINE) {
    if (COMMIT) { console.error("--commit không dùng được với --offline."); process.exit(1); }
    report(conv, null);
    console.log("\n(offline: chưa kiểm tra trùng với database)");
    return;
  }

  const mongoose = require("mongoose");
  const connectDB = require("../db");
  const ClinicData = require("../models/ClinicData");
  await connectDB();
  try {
    const doc = await ClinicData.findOne();
    if (!doc) {
      console.error("\nDatabase chưa có dữ liệu phòng khám. Hãy mở app và đăng nhập một lần (để khởi tạo), rồi chạy lại.");
      process.exitCode = 1; return;
    }
    if (REPLACE) {
      const cnt = (o) => Object.fromEntries(COLLECTIONS.map((k) => [k, (o[k] || []).length]));
      const old = doc.toObject();
      const oc = cnt(old);
      report(conv, null);
      console.log("\n══════════ KẾ HOẠCH THAY THẾ ══════════");
      console.log("XOÁ  (dữ liệu cũ):  khách", oc.customers, "| lịch hẹn", oc.appts, "| chăm sóc", oc.care, "| hoá đơn", oc.invoices);
      console.log("GIỮ  (cấu hình)  :  dịch vụ", oc.services, "| nhân viên", oc.staff, "| khuyến mãi", oc.discounts);
      console.log("THÊM (từ file)   :  khách", conv.customers.length, "| hoá đơn", conv.invoices.length, "| lịch hẹn 0 | chăm sóc 0");
      if (!COMMIT) { console.log("\n→ CHẠY THỬ: chưa ghi gì. Thêm --commit để xuất dữ liệu cũ và thay thế thật."); return; }

      const stamp = importedAt.replace(/[:.]/g, "-");
      const files = exportOldData(old, stamp);          // ném lỗi (và dừng) nếu file xuất không khớp
      console.log("\nĐã xuất dữ liệu cũ (đã đọc lại để kiểm tra khớp):");
      console.log("   JSON đầy đủ :", files.jsonFile);
      console.log("   CSV khách cũ:", files.csvFile);

      const res = await ClinicData.updateOne({ _id: doc._id },
        { $set: { customers: conv.customers, appts: [], care: [], invoices: conv.invoices } });
      const after = (await ClinicData.findOne()).toObject();
      const ac = cnt(after);
      const ok = ac.customers === conv.customers.length && ac.invoices === conv.invoices.length && ac.appts === 0 && ac.care === 0
        && ac.services === oc.services && ac.staff === oc.staff && ac.discounts === oc.discounts;
      console.log(`\nKết quả: matched=${res.matchedCount}, modified=${res.modifiedCount}`);
      console.log("   sau khi thay:", JSON.stringify(ac), ok ? "✓ khớp kế hoạch" : "✗ KHÔNG KHỚP — dùng --restore để quay lại");
      if (!ok) process.exitCode = 1;
      console.log(`\nKhôi phục dữ liệu cũ nếu cần:  node server/scripts/import-customers.js --restore "${files.jsonFile}" --commit`);
      console.log("\n⚠ BẮT BUỘC: tất cả trình duyệt đang mở app phải bấm F5 (tải lại) trước khi thao tác,");
      console.log("  nếu không bản dữ liệu cũ trong trình duyệt sẽ ghi đè lại dữ liệu mới.");
      return;
    }
    const have = new Set();
    (doc.customers || []).forEach((c) => { if (c.id) have.add(c.id); if (c.code) have.add("code:" + c.code); });
    const fresh = conv.customers.filter((c) => !have.has(c.id) && !have.has("code:" + c.code));
    const phoneExisting = {};
    (doc.customers || []).forEach((c) => { if (c.phone) (phoneExisting[c.phone] = phoneExisting[c.phone] || []).push(c); });
    const clashing = fresh.filter((c) => phoneExisting[c.phone] && c.phone.replace(/\D/g, "").length >= 9);
    const clashIds = new Set(ALLOW_PHONE_CLASH ? [] : clashing.map((c) => c.id));
    const toAdd = fresh.filter((c) => !clashIds.has(c.id));
    const addIds = new Set(toAdd.map((c) => c.id));
    const invHave = new Set((doc.invoices || []).map((i) => i.id));
    const invToAdd = conv.invoices.filter((i) => addIds.has(i.customerId) && !invHave.has(i.id));
    const phoneClash = clashing
      .map((c) => `${c.name} (${c.code}) ↔ ${phoneExisting[c.phone].map((x) => `${x.name} (${x.code})`).join(", ")} · ${c.phone}`);

    report({ ...conv, customers: toAdd, invoices: invToAdd },
      { customers: doc.customers || [], appts: doc.appts || [], invoices: doc.invoices || [], services: doc.services || [],
        dupes: conv.customers.length - fresh.length, toAdd: toAdd.length, phoneClash });

    if (!toAdd.length) { console.log("\nKhông có gì mới để nhập."); return; }

    if (!COMMIT) {
      console.log("\n→ CHẠY THỬ: chưa ghi gì. Xem lại báo cáo, nếu đúng thì chạy lại với --commit");
      console.log("\nMẫu 1 bản ghi sẽ được tạo:");
      console.log(JSON.stringify(toAdd[1] || toAdd[0], null, 2));
      return;
    }

    // Sao lưu trước khi ghi
    const dir = path.join(ROOT, "data", "backup");
    fs.mkdirSync(dir, { recursive: true });
    const stamp = importedAt.replace(/[:.]/g, "-");
    const backupFile = path.join(dir, `clinic-before-import-${stamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(doc.toObject(), null, 2));
    console.log("\nĐã sao lưu dữ liệu hiện tại →", backupFile);

    const before = { customers: doc.customers.length, invoices: (doc.invoices || []).length };
    const upd = { customers: { $each: toAdd } };
    if (invToAdd.length) upd.invoices = { $each: invToAdd };
    const res = await ClinicData.updateOne({ _id: doc._id }, { $push: upd });

    const after = await ClinicData.findOne();
    const okC = after.customers.length === before.customers + toAdd.length;
    const okI = (after.invoices || []).length === before.invoices + invToAdd.length;
    console.log(`\nKết quả: matched=${res.matchedCount}, modified=${res.modifiedCount}`);
    console.log(`   khách   ${before.customers} → ${after.customers.length}  ${okC ? "✓" : "✗ KHÔNG KHỚP"}`);
    console.log(`   hoá đơn ${before.invoices} → ${(after.invoices || []).length}  ${okI ? "✓" : "✗ KHÔNG KHỚP"}`);
    if (!okC || !okI) { console.error("Số lượng không khớp — hãy kiểm tra và khôi phục từ file sao lưu nếu cần."); process.exitCode = 1; }
    console.log("\n⚠ BẮT BUỘC: tất cả trình duyệt đang mở app phải bấm F5 (tải lại) trước khi thao tác,");
    console.log("  nếu không bản dữ liệu cũ trong trình duyệt sẽ ghi đè và làm mất khách vừa nhập.");
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => { console.error("LỖI:", e.message); process.exit(1); });
