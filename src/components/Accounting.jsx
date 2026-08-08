import { useState, useMemo } from "react";
import { TrendingUp, BookOpen, ClipboardCheck, Wallet, AlertCircle } from "lucide-react";
import { fmtVND, fmtDate, todayStr } from "../utils/helpers";
import { allServices } from "../utils/finance";

function monthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

const Kpi = ({ icon: Icon, grad, label, value }) => (
  <div className="card p-4 flex items-center gap-3">
    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} text-white grid place-items-center shadow-sm`}><Icon size={20} /></div>
    <div><div className="text-xs text-slate-500">{label}</div><div className="text-lg font-bold text-slate-800">{value}</div></div>
  </div>
);

// ─── Lịch Sử Thu Chi ────────────────────────────────────────────────────────
function AccHistory({ data }) {
  const [from, setFrom] = useState(monthStart());
  const [to,   setTo]   = useState(todayStr());

  const services = useMemo(() =>
    allServices(data)
      .filter((r) => r.date >= from && r.date <= to)
      .sort((a, b) => (b.date + (b.time || "")).localeCompare(a.date + (a.time || ""))),
    [data, from, to]
  );
  const invoices = useMemo(() =>
    (data.invoices || []).filter((i) => i.date >= from && i.date <= to),
    [data.invoices, from, to]
  );

  const billed    = services.reduce((s, r) => s + (r.total || 0), 0);
  const collected = invoices.reduce((s, i) => s + (i.paid || 0), 0);

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700"><TrendingUp size={20} /></div>
          <div>
            <h2 className="font-semibold text-slate-800">Lịch Sử Thu Chi</h2>
            <p className="text-xs text-slate-500">Doanh số từ dịch vụ đã chốt của khách hàng</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-slate-500 text-xs">Từ</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          <label className="text-slate-500 text-xs">Đến</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Kpi icon={TrendingUp}  grad="from-emerald-500 to-teal-600" label="Doanh số (phát sinh)" value={fmtVND(billed)} />
        <Kpi icon={Wallet}      grad="from-sky-500 to-blue-600"     label="Đã thu"               value={fmtVND(collected)} />
        <Kpi icon={AlertCircle} grad="from-rose-500 to-red-600"     label="Công nợ"              value={fmtVND(billed - collected)} />
      </div>

      {services.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">Không có dịch vụ nào trong khoảng thời gian này.</div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                <th className="px-4 py-2.5 text-left">Ngày</th>
                <th className="px-4 py-2.5 text-left">Mã KH</th>
                <th className="px-4 py-2.5 text-left">Khách Hàng</th>
                <th className="px-4 py-2.5 text-left">Dịch Vụ</th>
                <th className="px-4 py-2.5 text-left">NV Chốt</th>
                <th className="px-4 py-2.5 text-right">Số Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-slate-600">{r.time} {fmtDate(r.date)}</td>
                  <td className="px-4 py-3"><span className="text-xs text-emerald-600 font-mono">{r.customerCode}</span></td>
                  <td className="px-4 py-3 font-medium text-slate-800">{r.customerName}</td>
                  <td className="px-4 py-3 text-slate-700">{r.name}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{r.staff || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmtVND(r.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td colSpan={5} className="px-4 py-3 font-semibold text-slate-700 text-sm">Tổng doanh số</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700 text-base">{fmtVND(billed)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Sổ Quỹ ─────────────────────────────────────────────────────────────────
function AccFund({ data }) {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const svcMonth = useMemo(() => allServices(data).filter((r) => (r.date || "").startsWith(thisMonth)), [data, thisMonth]);
  const invMonth = useMemo(() => (data.invoices || []).filter((i) => (i.date || "").startsWith(thisMonth)), [data.invoices, thisMonth]);

  const dates = useMemo(() => {
    const set = new Set([...svcMonth.map((r) => r.date), ...invMonth.map((i) => i.date)]);
    return [...set].filter(Boolean).sort();
  }, [svcMonth, invMonth]);

  const billedMonth    = svcMonth.reduce((s, r) => s + (r.total || 0), 0);
  const collectedMonth = invMonth.reduce((s, i) => s + (i.paid || 0), 0);

  let running = 0;

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-sky-50 text-sky-700"><BookOpen size={20} /></div>
        <div><h2 className="font-semibold text-slate-800">Sổ Quỹ &amp; Chốt Sổ</h2><p className="text-xs text-slate-500">Tháng {now.getMonth() + 1}/{now.getFullYear()}</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Kpi icon={TrendingUp} grad="from-emerald-500 to-teal-600" label="Doanh số tháng"   value={fmtVND(billedMonth)} />
        <Kpi icon={Wallet}     grad="from-sky-500 to-blue-600"     label="Đã thu tháng"      value={fmtVND(collectedMonth)} />
        <Kpi icon={BookOpen}   grad="from-violet-500 to-purple-600" label="Số ngày phát sinh" value={dates.length} />
      </div>

      {dates.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">Chưa có phát sinh tháng này.</div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                <th className="px-4 py-2.5 text-left">Ngày</th>
                <th className="px-4 py-2.5 text-right">Doanh Số</th>
                <th className="px-4 py-2.5 text-right">Đã Thu</th>
                <th className="px-4 py-2.5 text-right">Lũy Kế Thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dates.map((d) => {
                const dayBill = svcMonth.filter((r) => r.date === d).reduce((s, r) => s + (r.total || 0), 0);
                const dayCol  = invMonth.filter((i) => i.date === d).reduce((s, i) => s + (i.paid || 0), 0);
                running += dayCol;
                return (
                  <tr key={d} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-700">{fmtDate(d)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{fmtVND(dayBill)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-medium">{fmtVND(dayCol)}</td>
                    <td className="px-4 py-3 text-right text-slate-800 font-semibold">{fmtVND(running)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td className="px-4 py-3 font-bold text-slate-700">Tổng tháng</td>
                <td className="px-4 py-3 text-right font-bold text-slate-700">{fmtVND(billedMonth)}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmtVND(collectedMonth)}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmtVND(collectedMonth)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Chốt Ca ─────────────────────────────────────────────────────────────────
const SHIFTS = [
  { key: "sang",  label: "Ca Sáng",  from: "07:00", to: "12:00", color: "amber"  },
  { key: "chieu", label: "Ca Chiều", from: "12:00", to: "17:00", color: "sky"    },
  { key: "toi",   label: "Ca Tối",   from: "17:00", to: "23:59", color: "violet" },
];

function AccShift({ data }) {
  const today = todayStr();
  const dayServices = useMemo(() =>
    allServices(data).filter((r) => r.date === today).sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    [data, today]
  );

  const colorMap = {
    amber:  { bg: "bg-amber-50 border-amber-200",   text: "text-amber-700"  },
    sky:    { bg: "bg-sky-50 border-sky-200",       text: "text-sky-700"    },
    violet: { bg: "bg-violet-50 border-violet-200", text: "text-violet-700" },
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-50 text-violet-700"><ClipboardCheck size={20} /></div>
        <div><h2 className="font-semibold text-slate-800">Chốt Ca</h2><p className="text-xs text-slate-500">Hôm nay: {fmtDate(today)}</p></div>
      </div>

      {SHIFTS.map((shift) => {
        const items   = dayServices.filter((r) => (r.time || "00:00") >= shift.from && (r.time || "00:00") < shift.to);
        const revenue = items.reduce((s, r) => s + (r.total || 0), 0);
        const col     = colorMap[shift.color];
        return (
          <div key={shift.key} className={`rounded-xl border ${col.bg} overflow-hidden`}>
            <div className={`flex items-center justify-between px-5 py-3 border-b ${col.bg}`}>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${col.text}`}>{shift.label}</span>
                <span className="text-xs text-slate-500">{shift.from} – {shift.to}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/70">{items.length} dịch vụ</span>
              </div>
              <div className="text-right"><div className="text-xs text-slate-500">Doanh số</div><div className={`font-bold text-sm ${col.text}`}>{fmtVND(revenue)}</div></div>
            </div>
            {items.length === 0 ? (
              <div className="px-5 py-4 text-sm text-slate-400">Không có dịch vụ trong ca này.</div>
            ) : (
              <div className="divide-y divide-white/60">
                {items.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="font-semibold text-slate-700 w-12 text-sm">{r.time}</span>
                    <span className="font-medium text-slate-800 flex-1">{r.customerName}</span>
                    <span className="text-xs text-slate-500">{r.name}</span>
                    <span className="text-xs font-medium text-emerald-700">{fmtVND(r.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── main export ────────────────────────────────────────────────────────────
export default function Accounting({ data, view }) {
  switch (view) {
    case "acc-history": return <AccHistory data={data} />;
    case "acc-fund":    return <AccFund    data={data} />;
    case "acc-shift":   return <AccShift   data={data} />;
    default:            return null;
  }
}
