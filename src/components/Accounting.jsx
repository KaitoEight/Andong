import { useState, useMemo } from "react";
import { TrendingUp, BookOpen, ClipboardCheck, Download, CheckSquare } from "lucide-react";
import { fmtVND, fmtDate, todayStr } from "../utils/helpers";

function monthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

// ─── Lịch Sử Thu Chi ────────────────────────────────────────────────────────
function AccHistory({ data }) {
  const today = todayStr();
  const defStart = monthStart();

  const [from, setFrom] = useState(defStart);
  const [to,   setTo]   = useState(today);

  const cust = (id) => data.customers.find((c) => c.id === id);
  const svc  = (id) => data.services.find((s) => s.id === id);

  const rows = useMemo(() =>
    data.appts
      .filter((a) => a.status === "done" && a.date >= from && a.date <= to)
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
    [data.appts, from, to]
  );

  const total = useMemo(() =>
    rows.reduce((sum, a) => sum + (svc(a.serviceId)?.price || 0), 0),
    [rows]
  );

  return (
    <div className="space-y-4">
      {/* Header + filter */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700"><TrendingUp size={20} /></div>
          <div>
            <h2 className="font-semibold text-slate-800">Lịch Sử Thu Chi</h2>
            <p className="text-xs text-slate-500">Doanh thu từ các lịch hẹn hoàn thành</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-slate-500 text-xs">Từ</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          <label className="text-slate-500 text-xs">Đến</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-emerald-600 text-white rounded-xl p-5 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium opacity-80">Tổng Thu</div>
          <div className="text-2xl font-bold mt-1">{fmtVND(total)}</div>
        </div>
        <div className="text-right">
          <div className="text-sm opacity-80">{rows.length} giao dịch</div>
          <div className="text-xs opacity-60 mt-1">{fmtDate(from)} → {fmtDate(to)}</div>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">
          Không có giao dịch nào trong khoảng thời gian này.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                <th className="px-4 py-2.5 text-left">Ngày</th>
                <th className="px-4 py-2.5 text-left">Mã KH</th>
                <th className="px-4 py-2.5 text-left">Khách Hàng</th>
                <th className="px-4 py-2.5 text-left">Dịch Vụ</th>
                <th className="px-4 py-2.5 text-left">Bác Sĩ</th>
                <th className="px-4 py-2.5 text-right">Số Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((a) => {
                const c = cust(a.customerId);
                const s = svc(a.serviceId);
                return (
                  <tr key={a.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-slate-600">{fmtDate(a.date)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-emerald-600 font-mono">{c?.code}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{c?.name}</td>
                    <td className="px-4 py-3 text-slate-700">{s?.name}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{a.doctor}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmtVND(s?.price || 0)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td colSpan={5} className="px-4 py-3 font-semibold text-slate-700 text-sm">Tổng Thu</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700 text-base">{fmtVND(total)}</td>
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
  const svc = (id) => data.services.find((s) => s.id === id);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const doneAppts = useMemo(() =>
    data.appts.filter((a) => a.status === "done" && a.date.startsWith(thisMonth)),
    [data.appts, thisMonth]
  );

  // Group by date
  const byDate = useMemo(() => {
    const map = {};
    doneAppts.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [doneAppts]);

  const totalMonth = useMemo(() =>
    doneAppts.reduce((sum, a) => sum + (svc(a.serviceId)?.price || 0), 0),
    [doneAppts]
  );

  const avgPerDay = byDate.length > 0 ? Math.round(totalMonth / byDate.length) : 0;

  let running = 0;

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-sky-50 text-sky-700"><BookOpen size={20} /></div>
        <div>
          <h2 className="font-semibold text-slate-800">Sổ Quỹ & Chốt Sổ</h2>
          <p className="text-xs text-slate-500">Tháng {now.getMonth() + 1}/{now.getFullYear()}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <div className="text-xs text-slate-500 mb-1">Tổng Tháng</div>
          <div className="text-lg font-bold text-emerald-700">{fmtVND(totalMonth)}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-slate-500 mb-1">Số Ngày Có Doanh Thu</div>
          <div className="text-lg font-bold text-slate-800">{byDate.length}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-slate-500 mb-1">Trung Bình / Ngày</div>
          <div className="text-lg font-bold text-sky-700">{fmtVND(avgPerDay)}</div>
        </div>
      </div>

      {/* Daily table */}
      {byDate.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">
          Chưa có doanh thu tháng này.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                <th className="px-4 py-2.5 text-left">Ngày</th>
                <th className="px-4 py-2.5 text-center">Số Lịch</th>
                <th className="px-4 py-2.5 text-right">Doanh Thu</th>
                <th className="px-4 py-2.5 text-right">Lũy Kế</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byDate.map(([date, appts]) => {
                const dayRev = appts.reduce((sum, a) => sum + (svc(a.serviceId)?.price || 0), 0);
                running += dayRev;
                return (
                  <tr key={date} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-700">{fmtDate(date)}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{appts.length}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-medium">{fmtVND(dayRev)}</td>
                    <td className="px-4 py-3 text-right text-slate-800 font-semibold">{fmtVND(running)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td className="px-4 py-3 font-bold text-slate-700">Tổng Tháng</td>
                <td className="px-4 py-3 text-center font-bold text-slate-700">{doneAppts.length}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmtVND(totalMonth)}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmtVND(totalMonth)}</td>
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
  { key: "sang",  label: "Ca Sáng",  from: "07:00", to: "12:00", color: "amber"   },
  { key: "chieu", label: "Ca Chiều", from: "12:00", to: "17:00", color: "sky"     },
  { key: "toi",   label: "Ca Tối",   from: "17:00", to: "20:00", color: "violet"  },
];

function AccShift({ data }) {
  const today = todayStr();
  const svc  = (id) => data.services.find((s) => s.id === id);
  const cust = (id) => data.customers.find((c) => c.id === id);

  const dayAppts = useMemo(() =>
    data.appts.filter((a) => a.date === today).sort((a, b) => a.time.localeCompare(b.time)),
    [data.appts, today]
  );

  const shiftAppts = (from, to) =>
    dayAppts.filter((a) => a.time >= from && a.time < to);

  const colorMap = {
    amber:  { bg: "bg-amber-50 border-amber-200",  text: "text-amber-700", badge: "bg-amber-100 text-amber-800" },
    sky:    { bg: "bg-sky-50 border-sky-200",      text: "text-sky-700",   badge: "bg-sky-100 text-sky-800"   },
    violet: { bg: "bg-violet-50 border-violet-200", text: "text-violet-700", badge: "bg-violet-100 text-violet-800" },
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-50 text-violet-700"><ClipboardCheck size={20} /></div>
        <div>
          <h2 className="font-semibold text-slate-800">Chốt Ca</h2>
          <p className="text-xs text-slate-500">Hôm nay: {fmtDate(today)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {SHIFTS.map((shift) => {
          const appts   = shiftAppts(shift.from, shift.to);
          const done    = appts.filter((a) => a.status === "done");
          const revenue = done.reduce((sum, a) => sum + (svc(a.serviceId)?.price || 0), 0);
          const col     = colorMap[shift.color];

          return (
            <div key={shift.key} className={`rounded-xl border ${col.bg} overflow-hidden`}>
              <div className={`flex items-center justify-between px-5 py-3 border-b ${col.bg}`}>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold ${col.text}`}>{shift.label}</span>
                  <span className="text-xs text-slate-500">{shift.from} – {shift.to}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.badge}`}>
                    {appts.length} lịch
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Doanh thu</div>
                    <div className={`font-bold text-sm ${col.text}`}>{fmtVND(revenue)}</div>
                  </div>
                  <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${col.text} bg-white border border-current hover:opacity-80`}>
                    <CheckSquare size={13} /> Chốt ca
                  </button>
                </div>
              </div>

              {appts.length === 0 ? (
                <div className="px-5 py-4 text-sm text-slate-400">Không có lịch hẹn trong ca này.</div>
              ) : (
                <div className="divide-y divide-white/60">
                  {appts.map((a) => {
                    const c = cust(a.customerId);
                    const s = svc(a.serviceId);
                    return (
                      <div key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                        <span className="font-semibold text-slate-700 w-12 text-sm">{a.time}</span>
                        <span className="font-medium text-slate-800 flex-1">{c?.name}</span>
                        <span className="text-xs text-slate-500">{s?.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          a.status === "done" ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-500 border border-slate-200"
                        }`}>
                          {a.status === "done" ? "Xong" : a.status}
                        </span>
                        {a.status === "done" && s?.price > 0 && (
                          <span className="text-xs font-medium text-emerald-700">{fmtVND(s.price)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
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
