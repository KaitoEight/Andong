import { useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Search, X, CalendarDays,
  List, Filter, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown, Plus,
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

// Outlined status pills + row tint, theo phong cách ảnh mẫu
const STATUS_PILL = {
  pending:   { label: "CHƯA ĐẾN",    cls: "border-violet-300 text-violet-600" },
  confirmed: { label: "ĐÃ XÁC NHẬN", cls: "border-sky-300 text-sky-600" },
  arrived:   { label: "ĐÃ ĐẾN",      cls: "border-rose-300 text-rose-500" },
  done:      { label: "HOÀN THÀNH",  cls: "border-emerald-400 text-emerald-600" },
  noshow:    { label: "KHÔNG ĐẾN",   cls: "border-slate-300 text-slate-400" },
  cancelled: { label: "ĐÃ HỦY",      cls: "border-rose-300 text-rose-400" },
};

const ROW_BG = {
  pending:   "bg-violet-50",
  confirmed: "bg-violet-50",
  arrived:   "bg-rose-50",
  done:      "bg-emerald-50",
  cancelled: "bg-slate-50 opacity-70",
  noshow:    "bg-slate-50 opacity-70",
};

const ROW_BAR = {
  pending:   "border-l-violet-400",
  confirmed: "border-l-sky-400",
  arrived:   "border-l-rose-400",
  done:      "border-l-emerald-500",
  cancelled: "border-l-slate-300",
  noshow:    "border-l-slate-300",
};

function fmtDateVN(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const thu = ["Chủ Nhật","Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy"][d.getDay()];
  return `${thu} , ${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
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

  // Giá trị dùng để sắp xếp theo từng cột
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

  // Header cột có sắp xếp
  const Th = ({ label, sortKey, className = "" }) => {
    const active = sort.key === sortKey;
    const Icon = !sortKey ? null : !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
    return (
      <th className={`px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${className}`}>
        {sortKey ? (
          <button onClick={() => toggleSort(sortKey)} className="inline-flex items-center gap-1 hover:text-slate-700 transition">
            {label}
            <Icon size={12} className={active ? "text-emerald-600" : "text-slate-300"} />
          </button>
        ) : label}
      </th>
    );
  };

  return (
    <div className="space-y-3">
      {/* Điều hướng ngày + thống kê */}
      <div className="card px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setDate(shiftDate(date, -1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <ChevronLeft size={18} />
          </button>
          <div>
            <div className="font-semibold text-slate-800 text-sm">{fmtDateVN(date)}</div>
            {isToday && <div className="text-[11px] text-emerald-600 font-semibold tracking-wide">HÔM NAY</div>}
          </div>
          <button onClick={() => setDate(shiftDate(date, 1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <ChevronRight size={18} />
          </button>
          {!isToday && (
            <button onClick={() => setDate(todayStr())}
              className="ml-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition flex items-center gap-1">
              <CalendarDays size={12} /> Hôm nay
            </button>
          )}
        </div>

        {/* Stat badges */}
        <div className="flex items-center gap-2.5 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="min-w-[24px] h-6 px-1 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold grid place-items-center shadow shadow-emerald-500/30">{stats.total}</span>
            <span className="text-slate-500">Lịch hẹn</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="min-w-[24px] h-6 px-1 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 text-white text-xs font-bold grid place-items-center shadow shadow-rose-500/30">{stats.arrived}</span>
            <span className="text-slate-500">Đã đến</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="min-w-[24px] h-6 px-1 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-bold grid place-items-center shadow shadow-red-500/30">{stats.cancelled}</span>
            <span className="text-slate-500">Hủy</span>
          </span>
        </div>
      </div>

      {/* Toolbar: tìm kiếm + khung giờ + tạo lịch */}
      <div className="flex flex-col xl:flex-row gap-2 xl:items-center">
        {/* Ô tìm kiếm kèm nhóm icon */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 shadow-sm shadow-slate-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="eg .lọc dữ liệu"
              className="pl-8 pr-3 py-2 text-sm w-56 focus:outline-none"
            />
          </div>
          <button title="Danh sách" className="px-2.5 py-2 border-l border-slate-200 text-slate-400 hover:bg-slate-50 transition">
            <List size={15} />
          </button>
          <button title="Chỉ hiện lịch chưa hủy" onClick={() => setHideCancelled((v) => !v)}
            className={`px-2.5 py-2 border-l border-slate-200 transition ${hideCancelled ? "bg-emerald-50 text-emerald-600" : "text-slate-400 hover:bg-slate-50"}`}>
            <Filter size={15} />
          </button>
          <button title="Tùy chọn" className="px-2 py-2 border-l border-slate-200 bg-emerald-600 text-white hover:bg-emerald-700 transition">
            <ChevronDown size={15} />
          </button>
        </div>

        {/* Khung giờ */}
        <div className="flex gap-1.5 flex-wrap flex-1">
          {TIME_SLOTS.map((s, i) => {
            const active = activeSlot === i;
            return (
              <button key={i} onClick={() => setActiveSlot(active ? null : i)}
                className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  active ? "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm shadow-emerald-500/15" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }`}>
                <span className={`min-w-[24px] h-6 px-1 rounded-lg grid place-items-center text-xs font-bold ${
                  slotCounts[i] > 0 ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow shadow-emerald-500/25" : "bg-slate-100 text-slate-400"
                }`}>{slotCounts[i]}</span>
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Tạo lịch hẹn */}
        <button onClick={() => openAdd("appt")} className="btn-grad shrink-0">
          <Plus size={16} /> Tạo lịch hẹn
        </button>
      </div>

      {/* Bảng lịch hẹn */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-left">
              <Th label="#" sortKey={null} className="text-center w-12" />
              <Th label="Thời Gian"      sortKey="time" />
              <Th label="Mã Khách Hàng"  sortKey="code" />
              <Th label="Khách Hàng"     sortKey="name" />
              <Th label="Số Điện Thoại"  sortKey="phone" />
              <Th label="Nội Dung"       sortKey="content" />
              <Th label="Trạng Thái"     sortKey={null} className="text-center" />
              <Th label="Hủy"            sortKey={null} className="text-center w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">
                  Không có lịch hẹn {isToday ? "hôm nay" : "ngày " + date}. Nhấn "Tạo lịch hẹn" để thêm mới.
                </td>
              </tr>
            ) : (
              list.map((a, idx) => {
                const c   = cust(a.customerId);
                const s   = svc(a.serviceId);
                const pill = STATUS_PILL[a.status] || STATUS_PILL.pending;
                return (
                  <tr key={a.id} onClick={() => onEdit?.(a)}
                    className={`border-l-4 cursor-pointer ${ROW_BAR[a.status] || "border-l-slate-200"} ${ROW_BG[a.status] || ""} hover:brightness-95 transition`}>
                    <td className="px-4 py-3 text-center font-semibold text-slate-400">{idx + 1}</td>

                    {/* Thời gian */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{a.time} - {endTime(a.time, a.mins ?? s?.mins)}</div>
                      <div className="text-[11px] text-slate-400">{a.doctor}</div>
                    </td>

                    {/* Mã KH */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-[13px] text-emerald-700/80">{c?.code}</span>
                    </td>

                    {/* Khách hàng */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={c?.avatar} name={c?.name} size={32} />
                        <span className="font-medium text-slate-800">{c?.name}</span>
                      </div>
                    </td>

                    {/* SĐT */}
                    <td className="px-4 py-3 text-slate-600">{c?.phone}</td>

                    {/* Nội dung */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{s?.group}</div>
                      <div className="text-slate-600">{s?.name}</div>
                      {a.note && <div className="text-xs text-slate-400 mt-0.5">{a.note}</div>}
                      {s?.price > 0 && <div className="text-xs text-emerald-600 mt-0.5">{fmtVND(s.price)}</div>}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-3 text-center">
                      <button onClick={(e) => { e.stopPropagation(); cycleStatus(a); }} title="Bấm để đổi trạng thái"
                        className={`text-[11px] font-semibold px-3 py-1 rounded-md border bg-white whitespace-nowrap hover:shadow-sm transition ${pill.cls}`}>
                        {pill.label}
                      </button>
                    </td>

                    {/* Hủy */}
                    <td className="px-4 py-3 text-center">
                      {a.status !== "cancelled" && (
                        <button onClick={(e) => { e.stopPropagation(); cancel(a); }} title="Hủy lịch hẹn"
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-500 transition">
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
