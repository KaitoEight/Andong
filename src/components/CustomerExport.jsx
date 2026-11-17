import { useMemo, useState } from "react";
import { FileSpreadsheet, Download, Users, TrendingUp, Wallet, Receipt, Info } from "lucide-react";
import { inputCls } from "./ui/Field";
import { todayStr, toLocalISODate, fmtVND, fmtDate } from "../utils/helpers";
import { buildCustomerReport, reportSheets, sourceOf } from "../utils/customerReport";
import { downloadXlsx } from "../utils/xlsxWriter";

const pct = (x) => (x * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + "%";
const monthOf = (iso) => iso.slice(0, 7);
const lastDayOfMonth = (ym) => { const [y, m] = ym.split("-").map(Number); return toLocalISODate(new Date(y, m, 0)); };
const fmtPeriod = (p, groupBy) => (groupBy === "month" ? `${p.slice(5, 7)}/${p.slice(0, 4)}` : fmtDate(p));

// Kỳ chọn nhanh
function preset(key) {
  const now = new Date(), today = todayStr();
  const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  switch (key) {
    case "today": return { mode: "day", from: today, to: today };
    case "7d": { const d = new Date(); d.setDate(d.getDate() - 6); return { mode: "day", from: toLocalISODate(d), to: today }; }
    case "thisMonth": return { mode: "month", fromM: ym(now), toM: ym(now) };
    case "lastMonth": { const d = new Date(now.getFullYear(), now.getMonth() - 1, 1); return { mode: "month", fromM: ym(d), toM: ym(d) }; }
    case "3m": { const d = new Date(now.getFullYear(), now.getMonth() - 2, 1); return { mode: "month", fromM: ym(d), toM: ym(now) }; }
    case "year": return { mode: "month", fromM: `${now.getFullYear()}-01`, toM: ym(now) };
    default: return null;
  }
}
const PRESETS = [["today", "Hôm nay"], ["7d", "7 ngày qua"], ["thisMonth", "Tháng này"], ["lastMonth", "Tháng trước"], ["3m", "3 tháng gần nhất"], ["year", "Năm nay"]];

// Xuất dữ liệu khách hàng theo ngày / tháng để đánh giá hiệu quả marketing theo nguồn khách
export default function CustomerExport({ data }) {
  const today = todayStr();
  const [mode, setMode] = useState("month");             // "day" | "month"
  const [from, setFrom] = useState(today.slice(0, 8) + "01");
  const [to, setTo] = useState(today);
  const [fromM, setFromM] = useState(monthOf(today));
  const [toM, setToM] = useState(monthOf(today));
  const [groupBy, setGroupBy] = useState("day");
  const [source, setSource] = useState("all");
  const [active, setActive] = useState("thisMonth");

  const applyPreset = (key) => {
    const p = preset(key);
    setActive(key); setMode(p.mode);
    if (p.mode === "day") { setFrom(p.from); setTo(p.to); setGroupBy("day"); }
    else { setFromM(p.fromM); setToM(p.toM); setGroupBy(p.fromM === p.toM ? "day" : "month"); }
  };

  // Kỳ thực tế (đảo lại nếu chọn ngược)
  const range = useMemo(() => {
    let a = mode === "day" ? from : `${fromM}-01`;
    let b = mode === "day" ? to : lastDayOfMonth(toM);
    if (!a || !b) return null;
    const swapped = a > b;
    if (swapped) { const t = a; a = b; b = t; if (mode === "month") { a = `${toM}-01`; b = lastDayOfMonth(fromM); } }
    return { from: a, to: b, swapped };
  }, [mode, from, to, fromM, toM]);

  const sources = useMemo(() => [...new Set((data.customers || []).map(sourceOf))].sort((a, b) => a.localeCompare(b, "vi")), [data.customers]);
  const rep = useMemo(() => (range ? buildCustomerReport(data, { ...range, source, groupBy }) : null), [data, range, source, groupBy]);

  const exportExcel = () => {
    if (!rep) return;
    const name = `khach-hang_${range.from}_den_${range.to}${source !== "all" ? "_" + source.replace(/\s+/g, "-") : ""}.xlsx`;
    downloadXlsx(name, reportSheets(rep, { groupBy }));
  };

  const pill = (on) => `px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${on ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`;
  const Stat = ({ icon: Icon, label, value, sub, cls }) => (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl grid place-items-center ${cls}`}><Icon size={19} /></div>
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-lg font-bold text-slate-900">{value}</div>
        {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade">
      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-700"><FileSpreadsheet size={20} /></div>
            <div>
              <h2 className="font-semibold text-slate-800">Xuất Dữ Liệu Khách Hàng</h2>
              <p className="text-xs text-slate-500">Khách mới theo ngày tạo hồ sơ trong kỳ, chia theo nguồn — để xem hiệu quả marketing</p>
            </div>
          </div>
          <button onClick={exportExcel} disabled={!rep || !rep.totals.count}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:from-emerald-800 hover:to-teal-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
            <Download size={15} /> Xuất Excel ({rep?.totals.count || 0} khách)
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(([k, l]) => <button key={k} onClick={() => applyPreset(k)} className={pill(active === k)}>{l}</button>)}
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-slate-100">
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1.5">Chọn kỳ</div>
            <div className="flex gap-1.5">
              <button onClick={() => { setMode("day"); setActive(""); }} className={pill(mode === "day")}>Theo ngày</button>
              <button onClick={() => { setMode("month"); setActive(""); }} className={pill(mode === "month")}>Theo tháng</button>
            </div>
          </div>
          {mode === "day" ? (
            <div className="flex items-end gap-2">
              <label className="text-xs text-slate-500">Từ ngày<input type="date" value={from} max={today} onChange={(e) => { setFrom(e.target.value); setActive(""); }} className={inputCls + " py-2 text-xs mt-1"} aria-label="Từ ngày" /></label>
              <label className="text-xs text-slate-500">Đến ngày<input type="date" value={to} onChange={(e) => { setTo(e.target.value); setActive(""); }} className={inputCls + " py-2 text-xs mt-1"} aria-label="Đến ngày" /></label>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <label className="text-xs text-slate-500">Từ tháng<input type="month" value={fromM} onChange={(e) => { setFromM(e.target.value); setActive(""); }} className={inputCls + " py-2 text-xs mt-1"} aria-label="Từ tháng" /></label>
              <label className="text-xs text-slate-500">Đến tháng<input type="month" value={toM} onChange={(e) => { setToM(e.target.value); setActive(""); }} className={inputCls + " py-2 text-xs mt-1"} aria-label="Đến tháng" /></label>
            </div>
          )}
          <label className="text-xs text-slate-500">Nguồn khách
            <select value={source} onChange={(e) => setSource(e.target.value)} className={inputCls + " py-2 text-xs mt-1"} aria-label="Lọc theo nguồn khách">
              <option value="all">Tất cả nguồn</option>
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-500">Thống kê theo
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className={inputCls + " py-2 text-xs mt-1"} aria-label="Thống kê theo ngày hay tháng">
              <option value="day">Từng ngày</option>
              <option value="month">Từng tháng</option>
            </select>
          </label>
        </div>
        {range && (
          <div className="text-xs text-slate-500">
            Kỳ: <b className="text-slate-700">{fmtDate(range.from)}</b> → <b className="text-slate-700">{fmtDate(range.to)}</b>
            {range.swapped && <span className="text-amber-600 font-semibold"> · đã tự đảo thứ tự từ – đến</span>}
          </div>
        )}
      </div>

      {rep && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={Users} label="Khách mới trong kỳ" value={rep.totals.count.toLocaleString("vi-VN")} cls="bg-violet-50 text-violet-700" />
            <Stat icon={TrendingUp} label="Đã dùng dịch vụ" value={rep.totals.used.toLocaleString("vi-VN")} sub={`Tỷ lệ chuyển đổi ${pct(rep.totals.conversion)}`} cls="bg-sky-50 text-sky-700" />
            <Stat icon={Receipt} label="Doanh số của nhóm khách này" value={fmtVND(rep.totals.billed)} sub={`TB ${fmtVND(Math.round(rep.totals.avgBilled))} / khách`} cls="bg-emerald-50 text-emerald-700" />
            <Stat icon={Wallet} label="Đã thu" value={fmtVND(rep.totals.paid)} cls="bg-amber-50 text-amber-700" />
          </div>

          <div className="table-container">
            <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800 text-sm">Hiệu quả theo nguồn khách</div>
            <table className="w-full min-w-[760px] text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <th className="p-3 text-left">Nguồn</th><th className="p-3 text-right">Khách mới</th><th className="p-3 text-right">Tỷ trọng</th>
                  <th className="p-3 text-right">Dùng dịch vụ</th><th className="p-3 text-right">Chuyển đổi</th>
                  <th className="p-3 text-right">Doanh số</th><th className="p-3 text-right">Đã thu</th><th className="p-3 text-right">TB / khách</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rep.bySource.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500">Không có khách mới nào trong kỳ này.</td></tr>
                ) : rep.bySource.map((e) => (
                  <tr key={e.source} className="table-row">
                    <td className="p-3 font-semibold text-slate-800">{e.source}</td>
                    <td className="p-3 text-right font-bold">{e.count}</td>
                    <td className="p-3 text-right text-slate-500">{pct(e.share)}</td>
                    <td className="p-3 text-right">{e.used}</td>
                    <td className="p-3 text-right font-semibold text-sky-700">{pct(e.conversion)}</td>
                    <td className="p-3 text-right font-semibold text-emerald-700">{fmtVND(e.billed)}</td>
                    <td className="p-3 text-right">{fmtVND(e.paid)}</td>
                    <td className="p-3 text-right text-slate-500">{fmtVND(Math.round(e.avgBilled))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-container">
            <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800 text-sm">
              Khách mới theo {groupBy === "month" ? "tháng" : "ngày"} và nguồn
            </div>
            <div className="max-h-[420px] overflow-y-auto scroll-soft">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="text-slate-500 uppercase font-semibold">
                    <th className="p-3 text-left">{groupBy === "month" ? "Tháng" : "Ngày"}</th>
                    {rep.sources.map((s) => <th key={s} className="p-3 text-right normal-case">{s}</th>)}
                    <th className="p-3 text-right">Tổng</th><th className="p-3 text-right">Doanh số</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rep.byPeriod.map((r) => (
                    <tr key={r.period} className={`table-row ${r.count ? "" : "text-slate-400"}`}>
                      <td className="p-3 font-medium">{fmtPeriod(r.period, groupBy)}</td>
                      {rep.sources.map((s) => <td key={s} className="p-3 text-right">{r.bySource[s] || ""}</td>)}
                      <td className="p-3 text-right font-bold">{r.count}</td>
                      <td className="p-3 text-right">{r.billed ? fmtVND(r.billed) : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
            <Info size={13} className="shrink-0 mt-0.5" />
            Khách mới = khách có ngày tạo hồ sơ trong kỳ. Doanh số / đã thu là của chính nhóm khách này tính đến hôm nay (kể cả dịch vụ làm sau kỳ).
            "Đã dùng dịch vụ" = có dịch vụ đã chốt hoặc đã thanh toán. File Excel gồm 3 sheet: Theo nguồn, Theo ngày/tháng, Danh sách khách.
          </p>
        </>
      )}
    </div>
  );
}
