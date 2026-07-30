import { useMemo } from "react";
import {
  CalendarDays, Users, Wallet, AlertCircle, Clock, ChevronRight, TrendingUp,
  UserPlus, CalendarPlus, FileText, CheckCircle2, ArrowUpRight, Sparkles
} from "lucide-react";
import Badge from "./ui/Badge";
import Avatar from "./ui/Avatar";
import { todayStr, fmtVND } from "../utils/helpers";
import { allServices, financeSummary } from "../utils/finance";

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

  const monthBilled = useMemo(() =>
    allServices(data).filter((r) => (r.date || "").startsWith(thisMonth)).reduce((s, r) => s + (r.total || 0), 0),
    [data, thisMonth]
  );
  const monthPaid = invoices.filter((i) => i.date?.startsWith(thisMonth)).reduce((s, i) => s + (i.paid || 0), 0);
  const debt      = financeSummary(data).debt;

  const stats = [
    {
      label: "Doanh số tháng này",
      value: fmtVND(monthBilled),
      change: "+12.5%",
      icon: TrendingUp,
      grad: "from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-500/25",
      view: "acc-history",
      small: true
    },
    {
      label: "Đã thu thực tế",
      value: fmtVND(monthPaid),
      change: "+8.2%",
      icon: Wallet,
      grad: "from-sky-500 to-blue-600",
      shadow: "shadow-sky-500/25",
      view: "acc-invoice",
      small: true
    },
    {
      label: "Tổng công nợ",
      value: fmtVND(debt),
      change: "-3.1%",
      icon: AlertCircle,
      grad: "from-rose-500 to-red-600",
      shadow: "shadow-rose-500/25",
      view: "acc-invoice",
      small: true
    },
    {
      label: "Khách hàng quản lý",
      value: data.customers.length,
      change: "+15 khách mới",
      icon: Users,
      grad: "from-violet-500 to-purple-600",
      shadow: "shadow-violet-500/25",
      view: "customers"
    },
  ];

  const doneToday = todayAppts.filter((a) => a.status === "done").length;
  const arrived   = todayAppts.filter((a) => a.status === "arrived" || a.status === "done").length;
  const progressPercent = todayAppts.length ? Math.round((doneToday / todayAppts.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade">

      {/* Banner Chào Mừng & Quick Actions */}
      <div className="card p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white relative overflow-hidden shadow-lg border-0">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-2">
              <Sparkles size={13} /> Chào mừng quay trở lại
            </div>
            <h1 className="text-xl lg:text-2xl font-bold font-heading">Bảng Điều Khiển Nha Khoa Victoria</h1>
            <p className="text-xs text-slate-300 mt-1">Hệ thống đang hoạt động ổn định. Bạn có {todayAppts.length} lịch hẹn cần xử lý hôm nay.</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button onClick={() => go("appt-today")} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition shadow-md">
              <CalendarPlus size={15} /> Tạo Lịch Hẹn
            </button>
            <button onClick={() => go("customer-new")} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-600 transition">
              <UserPlus size={15} /> Thêm Khách Hàng
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <button key={s.label} onClick={() => go(s.view)}
            className="text-left card p-5 hover:-translate-y-1 hover:shadow-md transition-all duration-200 group relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 tracking-wide">{s.label}</span>
              <span className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${s.grad} text-white grid place-items-center shadow-md ${s.shadow} group-hover:scale-110 transition-transform`}>
                <s.icon size={19} />
              </span>
            </div>
            <div className={`font-extrabold text-slate-900 font-heading ${s.small ? "text-xl lg:text-2xl" : "text-3xl"}`}>{s.value}</div>
            <div className="mt-2.5 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-flex items-center gap-0.5">
                <ArrowUpRight size={12} /> {s.change}
              </span>
              <span className="text-slate-400 group-hover:text-emerald-600 transition flex items-center gap-0.5 font-medium">
                Chi tiết <ChevronRight size={12} />
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Progress & Appointments Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Progress Card */}
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">
                  <TrendingUp size={17} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm font-heading">Tiến Độ Khám Hôm Nay</h3>
              </div>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">{progressPercent}%</span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 text-center bg-slate-50/80 rounded-xl border border-slate-100 mb-4">
              <div>
                <div className="text-lg font-bold text-slate-800 font-heading">{todayAppts.length}</div>
                <div className="text-[11px] text-slate-500 font-medium">Tổng lịch</div>
              </div>
              <div>
                <div className="text-lg font-bold text-sky-600 font-heading">{arrived}</div>
                <div className="text-[11px] text-slate-500 font-medium">Đã đến</div>
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-600 font-heading">{doneToday}</div>
                <div className="text-[11px] text-slate-500 font-medium">Hoàn thành</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
                <span>Tỷ lệ hoàn thành ca khám</span>
                <span>{doneToday}/{todayAppts.length} ca</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden p-0.5">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Quick Nav Cards */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-800 text-sm font-heading mb-3">Lối Tắt Nhanh</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button onClick={() => go("customers")} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-emerald-50/60 hover:border-emerald-200 text-left transition group">
                <Users size={18} className="text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Khách Hàng</div>
                <div className="text-[10px] text-slate-500">Tra cứu & hồ sơ</div>
              </button>

              <button onClick={() => go("services")} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-sky-50/60 hover:border-sky-200 text-left transition group">
                <FileText size={18} className="text-sky-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Dịch Vụ Nha Khoa</div>
                <div className="text-[10px] text-slate-500">Bảng giá & điều trị</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Today's Appointments List */}
        <div className="lg:col-span-2 card flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm font-heading">Danh Sách Lịch Hẹn Hôm Nay</h3>
            </div>
            <button onClick={() => go("appt-today")}
              className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:text-emerald-700 hover:underline transition">
              Xem tất cả ({todayAppts.length}) <ChevronRight size={14} />
            </button>
          </div>

          {todayAppts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center flex-1">
              <CalendarDays size={36} className="text-slate-300 mb-2 stroke-1" />
              <span>Chưa có lịch hẹn nào được ghi nhận cho hôm nay.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[420px] scroll-soft">
              {todayAppts.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/80 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-16 px-2 py-1 bg-slate-100 text-slate-800 text-xs font-extrabold rounded-lg text-center shrink-0 flex items-center justify-center gap-1">
                      <Clock size={12} className="text-slate-500" />
                      {a.time}
                    </div>
                    <Avatar src={cust(a.customerId)?.avatar} name={cust(a.customerId)?.name} size={38} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{cust(a.customerId)?.name || "Khách vãng lai"}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        <span className="font-semibold text-emerald-700">{svc(a.serviceId)?.name || "Khám tư vấn"}</span>
                        <span className="text-slate-300 mx-1.5">•</span>
                        <span>{a.doctor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Badge status={a.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
