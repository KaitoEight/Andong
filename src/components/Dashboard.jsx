import { useMemo } from "react";
import {
  CalendarDays, Users, Wallet, AlertCircle, Clock, ChevronRight, TrendingUp,
} from "lucide-react";
import Badge from "./ui/Badge";
import Avatar from "./ui/Avatar";
import { todayStr, fmtVND } from "../utils/helpers";

export default function Dashboard({ data, go }) {
  const t = todayStr();
  const thisMonth = t.slice(0, 7);
  const cust = (id) => data.customers.find((c) => c.id === id);
  const svc  = (id) => data.services.find((s) => s.id === id);
  const invoices = data.invoices || [];

  const todayAppts = useMemo(() =>
    data.appts.filter((a) => a.date === t).sort((a, b) => a.time.localeCompare(b.time)),
    [data.appts, t]
  );

  const monthPaid = invoices.filter((i) => i.date?.startsWith(thisMonth)).reduce((s, i) => s + (i.paid || 0), 0);
  const debt      = invoices.reduce((s, i) => s + ((i.total || 0) - (i.paid || 0)), 0);
  const newCust   = data.customers.filter((c) => c.code).length; // all (no createdAt in model)

  const stats = [
    { label: "Lịch hẹn hôm nay", value: todayAppts.length,     icon: CalendarDays, grad: "from-emerald-500 to-teal-600", view: "appt-today" },
    { label: "Khách hàng",        value: data.customers.length, icon: Users,        grad: "from-sky-500 to-blue-600",    view: "customers" },
    { label: "Đã thu tháng này",  value: fmtVND(monthPaid),     icon: Wallet,       grad: "from-violet-500 to-purple-600", view: "acc-invoice", small: true },
    { label: "Công nợ",           value: fmtVND(debt),          icon: AlertCircle,  grad: "from-rose-500 to-red-600",    view: "acc-invoice", small: true },
  ];

  const doneToday = todayAppts.filter((a) => a.status === "done").length;
  const arrived   = todayAppts.filter((a) => a.status === "arrived" || a.status === "done").length;

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <button key={s.label} onClick={() => go(s.view)}
            className="text-left card p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{s.label}</span>
              <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.grad} text-white grid place-items-center shadow-md`}>
                <s.icon size={17} />
              </span>
            </div>
            <div className={`mt-2 font-bold text-slate-900 ${s.small ? "text-lg" : "text-3xl"}`}>{s.value}</div>
          </button>
        ))}
      </div>

      {/* Tiến độ hôm nay */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-emerald-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Tiến độ hôm nay</h3>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div><span className="text-2xl font-bold text-slate-800">{todayAppts.length}</span> <span className="text-slate-500">lịch hẹn</span></div>
          <div><span className="text-2xl font-bold text-rose-500">{arrived}</span> <span className="text-slate-500">đã đến</span></div>
          <div><span className="text-2xl font-bold text-emerald-600">{doneToday}</span> <span className="text-slate-500">hoàn thành</span></div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all"
            style={{ width: `${todayAppts.length ? (doneToday / todayAppts.length) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Lịch hẹn hôm nay */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Lịch hẹn hôm nay</h3>
          <button onClick={() => go("appt-today")}
            className="text-sm text-emerald-600 font-medium flex items-center gap-0.5 hover:text-emerald-700">
            Xem tất cả <ChevronRight size={15} />
          </button>
        </div>
        {todayAppts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Chưa có lịch hẹn cho hôm nay.</div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {todayAppts.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-14 text-sm font-semibold text-slate-700 flex items-center gap-1">
                  <Clock size={13} className="text-slate-400" />{a.time}
                </div>
                <Avatar src={cust(a.customerId)?.avatar} name={cust(a.customerId)?.name} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{cust(a.customerId)?.name}</div>
                  <div className="text-xs text-slate-500 truncate">{svc(a.serviceId)?.name} · {a.doctor}</div>
                </div>
                <Badge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
