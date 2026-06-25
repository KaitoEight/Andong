import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Stethoscope, CheckCircle2 } from "lucide-react";
import Badge from "./ui/Badge";
import Avatar from "./ui/Avatar";
import { todayStr, fmtDate, fmtVND, toLocalISODate } from "../utils/helpers";

function shiftDate(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}

function fmtDateVN(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const thu = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][d.getDay()];
  return `${thu}, ${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

export default function DoctorSchedule({ data, setData, openAdd, registerAdd }) {
  const [date, setDate] = useState(todayStr());

  registerAdd(() => {});

  const cust = (id) => data.customers.find((c) => c.id === id);
  const svc  = (id) => data.services.find((s) => s.id === id);
  const isToday = date === todayStr();

  // Build doctor list: staff filtered by Bác Sĩ + any doctor names found in appointments (not in staff)
  const doctors = useMemo(() => {
    const staffDoctors = (data.staff || [])
      .filter((s) => s.role === "Bác Sĩ")
      .map((s) => s.name);

    const apptDoctors = [...new Set(data.appts.map((a) => a.doctor).filter(Boolean))];

    const allNames = [...new Set([...staffDoctors, ...apptDoctors])];
    return allNames;
  }, [data.staff, data.appts]);

  const dayAppts = useMemo(() =>
    data.appts
      .filter((a) => a.date === date)
      .sort((a, b) => a.time.localeCompare(b.time)),
    [data.appts, date]
  );

  // Group by doctor
  const byDoctor = useMemo(() => {
    const map = {};
    doctors.forEach((d) => { map[d] = []; });
    dayAppts.forEach((a) => {
      if (!map[a.doctor]) map[a.doctor] = [];
      map[a.doctor].push(a);
    });
    return map;
  }, [doctors, dayAppts]);

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="card px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <div className="font-semibold text-slate-800 text-sm">{fmtDateVN(date)}</div>
            {isToday && <div className="text-[11px] text-emerald-600 font-medium">HÔM NAY</div>}
          </div>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
          >
            <ChevronRight size={18} />
          </button>
          {!isToday && (
            <button
              onClick={() => setDate(todayStr())}
              className="ml-2 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition flex items-center gap-1"
            >
              <CalendarDays size={12} /> Hôm nay
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-medium text-slate-700">{dayAppts.length}</span> lịch hẹn · {doctors.length} bác sĩ
        </div>
      </div>

      {/* Doctor sections */}
      <div className="space-y-4">
        {doctors.map((doctor) => {
          const appts = byDoctor[doctor] || [];
          const done  = appts.filter((a) => a.status === "done").length;

          return (
            <div key={doctor} className="card overflow-hidden">
              {/* Doctor header */}
              <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  {doctor.replace("BS. ", "").charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-800">{doctor}</div>
                  <div className="text-xs text-slate-500">
                    {appts.length} lịch hẹn · {done} hoàn thành
                  </div>
                </div>
                {appts.length > 0 && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 font-medium">
                      {appts.length} lịch
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                      {done} xong
                    </span>
                  </div>
                )}
              </div>

              {/* Appointments */}
              {appts.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">
                  Không có lịch hẹn {isToday ? "hôm nay" : `ngày ${fmtDate(date)}`}.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {appts.map((a) => {
                    const c = cust(a.customerId);
                    const s = svc(a.serviceId);
                    return (
                      <div key={a.id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition">
                        <div className="w-16 text-center">
                          <div className="font-semibold text-slate-800 text-sm">{a.time}</div>
                        </div>
                        <Avatar src={c?.avatar} name={c?.name} size={34} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">{c?.name}</span>
                            <span className="text-xs text-slate-400">{c?.phone}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <Stethoscope size={11} />
                            <span>{s?.name}</span>
                            {s?.price > 0 && <span className="text-emerald-600">{fmtVND(s.price)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {a.status === "done" && <CheckCircle2 size={16} className="text-emerald-600" />}
                          <Badge status={a.status} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {doctors.length === 0 && (
          <div className="card p-12 text-center text-slate-400 text-sm">
            Chưa có bác sĩ nào trong hệ thống.
          </div>
        )}
      </div>
    </div>
  );
}
