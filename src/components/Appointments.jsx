import { useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Search, X, CalendarDays,
  List, Filter, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown, Plus, CalendarPlus
} from "lucide-react";
import { todayStr, fmtVND, toLocalISODate } from "../utils/helpers";
import { STATUS_CYCLE } from "../utils/constants";
import Avatar from "./ui/Avatar";

const TIME_SLOTS = [
  { label: "07:00 - 10:00", from: "07:00", to: "10:00" },
  { label: "10:00 - 13:00", from: "10:00", to: "13:00" },
  { label: "13:00 - 17:00", from: "13:00", to: "17:00" },
  { label: "17:00 - 20:00", from: "17:00", to: "20:00" },
];

const STATUS_PILL = {
  pending:   { label: "CHƯA ĐẾN",    cls: "border-violet-300 bg-violet-50 text-violet-700 font-bold" },
  confirmed: { label: "ĐÃ XÁC NHẬN", cls: "border-sky-300 bg-sky-50 text-sky-700 font-bold" },
  arrived:   { label: "ĐÃ ĐẾN",      cls: "border-amber-300 bg-amber-50 text-amber-800 font-bold" },
  done:      { label: "HOÀN THÀNH",  cls: "border-emerald-300 bg-emerald-50 text-emerald-700 font-bold" },
  noshow:    { label: "KHÔNG ĐẾN",   cls: "border-slate-300 bg-slate-100 text-slate-500 font-bold" },
  cancelled: { label: "ĐÃ HỦY",      cls: "border-rose-300 bg-rose-50 text-rose-700 font-bold" },
};

function fmtDateVN(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const thu = ["Chủ Nhật","Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy"][d.getDay()];
  return `${thu}, Ngày ${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function shiftDate(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}

function endTime(time, mins) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + (mins || 30);
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function inSlot(time, slot) {
  return time >= slot.from && time < slot.to;
}

export default function Appointments({ data, setData, openAdd, registerAdd, onEdit }) {
  const [date, setDate]             = useState(todayStr());
  const [activeSlot, setActiveSlot] = useState(null);
  const [q, setQ]                   = useState("");
  const [hideCancelled, setHideCancelled] = useState(false);
  const [sort, setSort]             = useState({ key: "time", dir: "asc" });

  const cust = (id) => data.customers.find((c) => c.id === id);
  const svc  = (id) => data.services.find((s) => s.id === id);

  registerAdd(() => openAdd("appt"));

  const dayAppts = useMemo(() =>
    data.appts.filter((a) => a.date === date),
    [data.appts, date]
  );

  const slotCounts = useMemo(() =>
    TIME_SLOTS.map((s) => dayAppts.filter((a) => inSlot(a.time, s)).length),
    [dayAppts]
  );

  const sortVal = (a, key) => {
    const c = cust(a.customerId);
    const s = svc(a.serviceId);
    switch (key) {
      case "time":    return a.time;
      case "code":    return c?.code || "";
      case "name":    return (c?.name || "").toLowerCase();
      case "phone":   return c?.phone || "";
      case "content": return (s?.name || "").toLowerCase();
      default:        return a.time;
    }
  };

  const list = useMemo(() => {
    let result = dayAppts;
    if (activeSlot !== null) result = result.filter((a) => inSlot(a.time, TIME_SLOTS[activeSlot]));
    if (hideCancelled) result = result.filter((a) => a.status !== "cancelled");
    if (q.trim()) {
      const ql = q.toLowerCase();
      result = result.filter((a) => {
        const c = cust(a.customerId);
        return (c?.name + c?.phone + c?.code + svc(a.serviceId)?.name).toLowerCase().includes(ql);
      });
    }
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...result].sort((a, b) =>
      String(sortVal(a, sort.key)).localeCompare(String(sortVal(b, sort.key)), "vi") * dir
    );
  }, [dayAppts, activeSlot, q, hideCancelled, sort]);

  const stats = useMemo(() => ({
    total:     dayAppts.length,
    arrived:   dayAppts.filter((a) => a.status === "arrived" || a.status === "done").length,
    cancelled: dayAppts.filter((a) => a.status === "cancelled").length,
  }), [dayAppts]);

  const cycleStatus = (appt) => {
    const idx  = STATUS_CYCLE.indexOf(appt.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    setData({ ...data, appts: data.appts.map((x) => x.id === appt.id ? { ...x, status: next } : x) });
  };

  const cancel = (appt) => {
    setData({ ...data, appts: data.appts.map((x) => x.id === appt.id ? { ...x, status: "cancelled" } : x) });
  };

  const toggleSort = (key) =>
    setSort((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });

  const isToday = date === todayStr();

  const Th = ({ label, sortKey, className = "" }) => {
    const active = sort.key === sortKey;
    const Icon = !sortKey ? null : !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
    return (
      <th className={`px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider ${className}`}>
        {sortKey ? (
          <button onClick={() => toggleSort(sortKey)} className="inline-flex items-center gap-1 hover:text-slate-900 transition">
            {label}
            <Icon size={12} className={active ? "text-emerald-600 font-bold" : "text-slate-300"} />
          </button>
        ) : label}
      </th>
    );
  };

  return (
    <div className="space-y-4 animate-fade">
      {/* Ngày điều hướng + Stat Counter Bar */}
      <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setDate(shiftDate(date, -1))} className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setDate(shiftDate(date, 1))} className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition">
              <ChevronRight size={18} />
            </button>
          </div>

          <div>
            <div className="font-bold text-slate-900 text-sm font-heading">{fmtDateVN(date)}</div>
            {isToday && <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider">Hôm nay</span>}
          </div>

          {!isToday && (
            <button onClick={() => setDate(todayStr())}
              className="text-xs px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition flex items-center gap-1 border border-emerald-200/60">
              <CalendarDays size={13} /> Quay về Hôm nay
            </button>
          )}
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold grid place-items-center text-xs">{stats.total}</span>
            <span className="font-semibold text-slate-600">Tổng lịch</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold grid place-items-center text-xs">{stats.arrived}</span>
            <span className="font-semibold text-slate-600">Đã đến</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="w-6 h-6 rounded-lg bg-rose-500 text-white font-bold grid place-items-center text-xs">{stats.cancelled}</span>
            <span className="font-semibold text-slate-600">Đã hủy</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Time Slot Filter Bar */}
      <div className="card p-4 flex flex-col xl:flex-row gap-3 xl:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Lọc tên, SĐT, dịch vụ..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <button title="Lọc hủy" onClick={() => setHideCancelled((v) => !v)}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              hideCancelled ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}>
            <Filter size={14} /> {hideCancelled ? "Đang ẩn đã hủy" : "Hiện tất cả"}
          </button>
        </div>

        {/* Time Slot Selector */}
        <div className="flex gap-1.5 overflow-x-auto scroll-soft py-0.5">
          {TIME_SLOTS.map((s, i) => {
            const active = activeSlot === i;
            return (
              <button key={i} onClick={() => setActiveSlot(active ? null : i)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  active ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100"
                }`}>
                <span className={`w-5 h-5 rounded-md text-[10px] font-bold grid place-items-center ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {slotCounts[i]}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>

        <button onClick={() => openAdd("appt")} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition">
          <CalendarPlus size={15} /> Tạo Lịch Hẹn
        </button>
      </div>

      {/* Appointments Data Table */}
      <div className="table-container">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80">
              <Th label="STT" sortKey={null} className="text-center w-12" />
              <Th label="Giờ Khám" sortKey="time" />
              <Th label="Mã KH" sortKey="code" />
              <Th label="Khách Hàng" sortKey="name" />
              <Th label="Số Điện Thoại" sortKey="phone" />
              <Th label="Dịch Vụ & Bác Sĩ" sortKey="content" />
              <Th label="Trạng Thái" sortKey={null} className="text-center" />
              <Th label="Hủy" sortKey={null} className="text-center w-14" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400 text-xs">
                  Không tìm thấy lịch hẹn cho {isToday ? "hôm nay" : "ngày " + date}.
                </td>
              </tr>
            ) : (
              list.map((a, idx) => {
                const c   = cust(a.customerId);
                const s   = svc(a.serviceId);
                const pill = STATUS_PILL[a.status] || STATUS_PILL.pending;
                return (
                  <tr key={a.id} onClick={() => onEdit?.(a)}
                    className="table-row cursor-pointer hover:bg-slate-50/80">
                    <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900 text-xs">{a.time} - {endTime(a.time, a.mins ?? s?.mins)}</div>
                    </td>

                    <td className="p-3">
                      <span className="font-mono text-emerald-700 font-semibold">{c?.code || "—"}</span>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={c?.avatar} name={c?.name} size={30} />
                        <span className="font-bold text-slate-800">{c?.name || "Vắng tên"}</span>
                      </div>
                    </td>

                    <td className="p-3 font-semibold text-slate-600">{c?.phone || "—"}</td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900">{svc(a.serviceId)?.name || a.category || "Khám tư vấn"}</div>
                      <div className="text-[11px] text-slate-500">BS: <span className="font-medium text-slate-700">{a.doctor || "Chưa phân công"}</span></div>
                    </td>

                    <td className="p-3 text-center">
                      <button onClick={(e) => { e.stopPropagation(); cycleStatus(a); }} title="Nhấp để chuyển đổi trạng thái tiếp theo"
                        className={`text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full border shadow-xs transition hover:scale-105 ${pill.cls}`}>
                        {pill.label}
                      </button>
                    </td>

                    <td className="p-3 text-center">
                      {a.status !== "cancelled" && (
                        <button onClick={(e) => { e.stopPropagation(); cancel(a); }} title="Hủy lịch hẹn này"
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition grid place-items-center">
                          <X size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
