import { CheckCircle2, CalendarClock } from "lucide-react";
import { fmtDate } from "../utils/helpers";

export default function Care({ data, setData, openAdd, registerAdd }) {
  registerAdd(() => openAdd("care"));

  const cust = (id) => data.customers.find((c) => c.id === id);

  const toggle = (c) =>
    setData({
      ...data,
      care: data.care.map((x) =>
        x.id === c.id ? { ...x, status: x.status === "Đã xử lý" ? "Chưa xử lý" : "Đã xử lý" } : x
      ),
    });

  if (data.care.length === 0)
    return (
      <div className="card p-10 text-center text-slate-400 text-sm">
        Chưa có nội dung chăm sóc.
      </div>
    );

  return (
    <div className="space-y-2">
      {data.care.map((c) => (
        <div key={c.id} className="card p-4 flex items-start gap-3">
          <button
            onClick={() => toggle(c)}
            className={`mt-0.5 ${c.status === "Đã xử lý" ? "text-emerald-600" : "text-slate-300"}`}
          >
            <CheckCircle2 size={20} />
          </button>
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-800">{cust(c.customerId)?.name} · {c.type}</div>
            <div className="text-sm text-slate-600">{c.content}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <CalendarClock size={12} />Gọi lại: {fmtDate(c.callback)}
            </div>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
            c.status === "Đã xử lý"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {c.status}
          </span>
        </div>
      ))}
    </div>
  );
}
