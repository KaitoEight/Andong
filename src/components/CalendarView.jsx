import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { todayStr, toLocalISODate } from "../utils/helpers";
import { STATUS_CYCLE } from "../utils/constants";

const HOUR_H   = 64;   // px mỗi tiếng
const START_H  = 7;
const END_H    = 20;
const HOURS    = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);

const DAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const APPT_COLORS = {
  pending:   "bg-amber-100  border-amber-400  text-amber-900",
  confirmed: "bg-violet-100 border-violet-400 text-violet-900",
  arrived:   "bg-rose-100   border-rose-400   text-rose-900",
  done:      "bg-emerald-100 border-emerald-500 text-emerald-900",
  cancelled: "bg-slate-100  border-slate-300  text-slate-400 line-through",
  noshow:    "bg-slate-100  border-slate-300  text-slate-500",
};

function getMondayOf(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return toLocalISODate(d);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toLocalISODate(d);
}

function getWeekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function timeToTop(time) {
  const [h, m] = time.split(":").map(Number);
  return ((h - START_H) + m / 60) * HOUR_H;
}

function minsToHeight(mins) {
  return Math.max(((mins || 30) / 60) * HOUR_H, 28);
}

export default function CalendarView({ data, setData }) {
  const today = todayStr();
  const [monday, setMonday] = useState(() => getMondayOf(today));
  const scrollRef = useRef(null);

  const days = useMemo(() => getWeekDays(monday), [monday]);
  const isCurrentWeek = days.includes(today);

  const cust = (id) => data.customers.find((c) => c.id === id);
  const svc  = (id) => data.services.find((s) => s.id === id);

  // Scroll tới giờ hiện tại khi mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      scrollRef.current.scrollTop = Math.max(0, ((now.getHours() - START_H - 1)) * HOUR_H);
    }
  }, []);

  const apptsByDay = useMemo(() => {
    const map = Object.fromEntries(days.map(d => [d, []]));
    data.appts.forEach(a => { if (map[a.date]) map[a.date].push(a); });
    return map;
  }, [data.appts, days]);

  const prevWeek = () => setMonday(addDays(monday, -7));
  const nextWeek = () => setMonday(addDays(monday, 7));

  const cycleStatus = (a, dir) => {
    const idx  = STATUS_CYCLE.indexOf(a.status);
    const next = STATUS_CYCLE[(idx + dir + STATUS_CYCLE.length) % STATUS_CYCLE.length];
    setData({ ...data, appts: data.appts.map(x => x.id === a.id ? { ...x, status: next } : x) });
  };

  // Vị trí đường giờ hiện tại
  const now = new Date();
  const nowTop = ((now.getHours() - START_H) + now.getMinutes() / 60) * HOUR_H;

  const weekLabel = `${new Date(days[0] + "T00:00:00").toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} – ${new Date(days[6] + "T00:00:00").toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;

  return (
    <div className="card overflow-hidden flex flex-col"
      style={{ height: "calc(100vh - 200px)", minHeight: 480 }}>

      {/* Header tuần */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
        <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-slate-700 min-w-[200px] text-center">{weekLabel}</span>
        <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
          <ChevronRight size={18} />
        </button>
        {!isCurrentWeek && (
          <button onClick={() => setMonday(getMondayOf(today))}
            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition flex items-center gap-1">
            <CalendarDays size={12} /> Tuần này
          </button>
        )}
      </div>

      {/* Header ngày */}
      <div className="grid shrink-0 border-b border-slate-100"
        style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
        <div className="border-r border-slate-100" />
        {days.map((d, i) => {
          const dt      = new Date(d + "T00:00:00");
          const isToday = d === today;
          const count   = apptsByDay[d]?.length || 0;
          return (
            <div key={d} className={`text-center py-2 border-r border-slate-100 ${isToday ? "bg-emerald-50" : ""}`}>
              <div className={`text-[11px] font-medium ${isToday ? "text-emerald-600" : "text-slate-400"}`}>
                {DAY_SHORT[i]}
              </div>
              <div className={`text-base font-bold leading-tight ${isToday ? "text-white bg-emerald-500 rounded-full w-7 h-7 grid place-items-center mx-auto" : "text-slate-800"}`}>
                {dt.getDate()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {count > 0 ? `${count} hẹn` : ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid giờ cuộn được */}
      <div ref={scrollRef} className="overflow-y-auto flex-1">
        <div className="relative grid" style={{ gridTemplateColumns: "52px repeat(7, 1fr)", height: HOURS.length * HOUR_H }}>

          {/* Cột giờ */}
          <div className="border-r border-slate-100 relative">
            {HOURS.map(h => (
              <div key={h} className="absolute right-2 text-[11px] text-slate-400 leading-none"
                style={{ top: (h - START_H) * HOUR_H - 7 }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Cột từng ngày */}
          {days.map((d, di) => {
            const isToday  = d === today;
            const appts    = apptsByDay[d] || [];

            return (
              <div key={d} className={`relative border-r border-slate-100 ${isToday ? "bg-emerald-50/20" : ""}`}>
                {/* Đường giờ */}
                {HOURS.map(h => (
                  <div key={h} className="absolute w-full border-t border-slate-100"
                    style={{ top: (h - START_H) * HOUR_H }} />
                ))}
                {/* Đường 30 phút (mờ hơn) */}
                {HOURS.map(h => (
                  <div key={"h" + h} className="absolute w-full border-t border-slate-50"
                    style={{ top: (h - START_H) * HOUR_H + HOUR_H / 2 }} />
                ))}

                {/* Đường giờ hiện tại */}
                {isToday && nowTop >= 0 && nowTop <= HOURS.length * HOUR_H && (
                  <div className="absolute w-full z-20 flex items-center pointer-events-none"
                    style={{ top: nowTop }}>
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 -ml-1.5" />
                    <div className="flex-1 h-[1.5px] bg-rose-500" />
                  </div>
                )}

                {/* Các lịch hẹn */}
                {appts.map((a) => {
                  const service  = svc(a.serviceId);
                  const customer = cust(a.customerId);
                  const top      = timeToTop(a.time);
                  const height   = minsToHeight(service?.mins);
                  if (top < 0 || top > HOURS.length * HOUR_H) return null;

                  return (
                    <div key={a.id}
                      className={`absolute left-0.5 right-0.5 rounded border-l-2 px-1.5 overflow-hidden select-none ${APPT_COLORS[a.status] || APPT_COLORS.pending}`}
                      style={{ top: top + 1, height: height - 2 }}>
                      <div className="text-[10px] font-semibold truncate leading-tight mt-0.5">
                        {a.time} · {customer?.name}
                      </div>
                      {height > 40 && (
                        <div className="text-[10px] opacity-70 truncate">{service?.name}</div>
                      )}
                      {/* Mũi tên đổi trạng thái */}
                      {height > 50 && (
                        <div className="absolute bottom-0.5 right-0.5 flex gap-0.5">
                          <button onClick={() => cycleStatus(a, -1)}
                            className="p-0.5 rounded hover:bg-black/10 transition">
                            <ChevronLeft size={10} />
                          </button>
                          <button onClick={() => cycleStatus(a, 1)}
                            className="p-0.5 rounded hover:bg-black/10 transition">
                            <ChevronRight size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
