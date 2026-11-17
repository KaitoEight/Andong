// Số liệu khách hàng để đánh giá hiệu quả marketing: khách mới theo ngày tạo hồ sơ trong một kỳ,
// chia theo nguồn khách, kèm doanh số / đã thu của chính nhóm khách đó (tính đến hôm nay).
import { todayStr, toLocalISODate } from "./helpers";

export const NO_SOURCE = "Chưa rõ nguồn";
export const sourceOf = (c) => (c.source || "").trim() || NO_SOURCE;

const sum = (arr, f) => arr.reduce((s, x) => s + (Number(f(x)) || 0), 0);
const isoOf = (d) => toLocalISODate(d);
const parseIso = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

// Danh sách các kỳ (ngày "YYYY-MM-DD" hoặc tháng "YYYY-MM") từ from đến to, kể cả kỳ không có khách
export function periodKeys(from, to, groupBy) {
  const out = [];
  if (!from || !to || from > to) return out;
  if (groupBy === "month") {
    let [y, m] = from.slice(0, 7).split("-").map(Number);
    const end = to.slice(0, 7);
    for (let k = `${y}-${String(m).padStart(2, "0")}`; k <= end && out.length < 1200; ) {
      out.push(k);
      m += 1; if (m > 12) { m = 1; y += 1; }
      k = `${y}-${String(m).padStart(2, "0")}`;
    }
    return out;
  }
  for (let d = parseIso(from); isoOf(d) <= to && out.length < 4000; d.setDate(d.getDate() + 1)) out.push(isoOf(d));
  return out;
}

// Số liệu từng khách: doanh số (dịch vụ đã chốt), đã thu (phiếu thu), lịch hẹn, lần đến khám
function statsFor(c, invoicesByCust, apptsByCust) {
  const services = c.services || [];
  const invs = invoicesByCust.get(c.id) || [];
  const appts = apptsByCust.get(c.id) || [];
  const billed = sum(services, (s) => s.total);
  const paid = sum(invs, (i) => i.paid);
  const firstService = services.map((s) => s.date).filter(Boolean).sort()[0] || "";
  return {
    billed, paid, debt: Math.max(0, billed - paid),
    nServices: services.length,
    serviceNames: services.map((s) => s.name).filter(Boolean).join("; "),
    firstService,
    nAppts: appts.length,
    nVisits: appts.filter((a) => a.status === "arrived" || a.status === "done").length,
    used: services.length > 0 || paid > 0,
  };
}

export function buildCustomerReport(data, { from, to, source = "all", groupBy = "day" }) {
  const today = todayStr();
  const invoicesByCust = new Map(), apptsByCust = new Map();
  for (const i of data.invoices || []) { if (!invoicesByCust.has(i.customerId)) invoicesByCust.set(i.customerId, []); invoicesByCust.get(i.customerId).push(i); }
  for (const a of data.appts || []) { if (!apptsByCust.has(a.customerId)) apptsByCust.set(a.customerId, []); apptsByCust.get(a.customerId).push(a); }

  const customers = (data.customers || [])
    .map((c) => ({ c, created: c.createdAt || today }))
    .filter(({ c, created }) => created >= from && created <= to && (source === "all" || sourceOf(c) === source))
    .sort((a, b) => (a.created < b.created ? -1 : a.created > b.created ? 1 : 0))
    .map(({ c, created }) => ({ c, created, src: sourceOf(c), ...statsFor(c, invoicesByCust, apptsByCust) }));

  // Theo nguồn
  const bySrc = new Map();
  for (const r of customers) {
    const e = bySrc.get(r.src) || { source: r.src, count: 0, used: 0, billed: 0, paid: 0 };
    e.count += 1; e.used += r.used ? 1 : 0; e.billed += r.billed; e.paid += r.paid;
    bySrc.set(r.src, e);
  }
  const total = customers.length;
  const bySource = [...bySrc.values()]
    .map((e) => ({ ...e, conversion: e.count ? e.used / e.count : 0, avgBilled: e.count ? e.billed / e.count : 0, share: total ? e.count / total : 0 }))
    .sort((a, b) => b.count - a.count || b.billed - a.billed);
  const totals = {
    count: total, used: sum(customers, (r) => (r.used ? 1 : 0)),
    billed: sum(customers, (r) => r.billed), paid: sum(customers, (r) => r.paid),
  };
  totals.conversion = total ? totals.used / total : 0;
  totals.avgBilled = total ? totals.billed / total : 0;

  // Theo kỳ × nguồn
  const sources = bySource.map((s) => s.source);
  const periods = periodKeys(from, to, groupBy);
  const idx = new Map(periods.map((p, i) => [p, i]));
  const matrix = periods.map((p) => ({ period: p, bySource: Object.fromEntries(sources.map((s) => [s, 0])), count: 0, billed: 0 }));
  for (const r of customers) {
    const k = groupBy === "month" ? r.created.slice(0, 7) : r.created;
    const row = matrix[idx.get(k)];
    if (!row) continue;
    row.bySource[r.src] += 1; row.count += 1; row.billed += r.billed;
  }
  return { customers, bySource, totals, sources, byPeriod: matrix };
}

// Ba sheet Excel từ báo cáo trên
export function reportSheets(rep, { groupBy }) {
  const pct = (x) => Math.round(x * 1000) / 1000;
  const list = {
    name: "Danh sách khách",
    columns: [
      { header: "Mã KH", width: 14 }, { header: "Họ tên", width: 26 }, { header: "Số điện thoại", width: 14 },
      { header: "Giới tính", width: 9 }, { header: "Năm sinh", width: 9, type: "int" },
      { header: "Ngày tạo hồ sơ", width: 13, type: "date" }, { header: "Tháng tạo", width: 10 },
      { header: "Nguồn", width: 16 }, { header: "Nguồn chi tiết", width: 20 }, { header: "Nhóm KH", width: 11 },
      { header: "Tỉnh/TP", width: 22 }, { header: "Phường/xã", width: 16 }, { header: "Địa chỉ", width: 30 },
      { header: "Đã dùng dịch vụ", width: 10 }, { header: "Số dịch vụ đã chốt", width: 10, type: "int" },
      { header: "Dịch vụ đã chốt", width: 40 }, { header: "Ngày dịch vụ đầu tiên", width: 13, type: "date" },
      { header: "Doanh số", width: 14, type: "money" }, { header: "Đã thu", width: 14, type: "money" }, { header: "Còn nợ", width: 14, type: "money" },
      { header: "Số lịch hẹn", width: 9, type: "int" }, { header: "Số lần đến khám", width: 9, type: "int" },
    ],
    rows: rep.customers.map(({ c, created, src, ...s }) => [
      c.code || "", c.name || "", (c.phone || "").trim(), c.gender || "",
      /^\d{4}/.test(c.dob || "") ? Number(c.dob.slice(0, 4)) : null,
      created, created.slice(0, 7), src, c.sourceDetail || "", c.group || "",
      c.province || "", c.ward || "", c.address || "",
      s.used ? "Có" : "Không", s.nServices, s.serviceNames, s.firstService || null,
      s.billed, s.paid, s.debt, s.nAppts, s.nVisits,
    ]),
  };
  const bySource = {
    name: "Theo nguồn",
    columns: [
      { header: "Nguồn", width: 20 }, { header: "Khách mới", width: 11, type: "int" }, { header: "Tỷ trọng khách", width: 12, type: "percent" },
      { header: "Đã dùng dịch vụ", width: 13, type: "int" }, { header: "Tỷ lệ chuyển đổi", width: 13, type: "percent" },
      { header: "Doanh số", width: 16, type: "money" }, { header: "Đã thu", width: 16, type: "money" }, { header: "Doanh số TB / khách", width: 16, type: "money" },
    ],
    rows: rep.bySource.map((e) => [e.source, e.count, pct(e.share), e.used, pct(e.conversion), e.billed, e.paid, Math.round(e.avgBilled)]),
    totalRow: ["Tổng", rep.totals.count, rep.totals.count ? 1 : 0, rep.totals.used, pct(rep.totals.conversion), rep.totals.billed, rep.totals.paid, Math.round(rep.totals.avgBilled)],
  };
  const byPeriod = {
    name: groupBy === "month" ? "Theo tháng" : "Theo ngày",
    columns: [
      { header: groupBy === "month" ? "Tháng" : "Ngày", width: 12, type: groupBy === "month" ? "text" : "date" },
      ...rep.sources.map((s) => ({ header: s, width: Math.max(10, Math.min(20, s.length + 2)), type: "int" })),
      { header: "Tổng khách mới", width: 13, type: "int" }, { header: "Doanh số", width: 16, type: "money" },
    ],
    rows: rep.byPeriod.map((r) => [r.period, ...rep.sources.map((s) => r.bySource[s]), r.count, r.billed]),
    totalRow: ["Tổng", ...rep.sources.map((s) => rep.bySource.find((e) => e.source === s).count), rep.totals.count, rep.totals.billed],
  };
  return [bySource, byPeriod, list];
}
