import { useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search, X, AlertTriangle, Printer,
} from "lucide-react";
import { uid, todayStr, toLocalISODate } from "../utils/helpers";
import { printAppointment } from "../utils/print";
import Avatar from "./ui/Avatar";

const WEEK = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTHS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
const DURATIONS = [15, 30, 45, 60, 90, 120];

// Khung giờ hiển thị trên thanh thời gian
const RULER_START = 6;
const RULER_END   = 21;

function pad(n) { return String(n).padStart(2, "0"); }
function hhmm(h, m) { return `${pad(h)}:${pad(m)}`; }
function timeToFloat(t) { const [h, m] = t.split(":").map(Number); return h + m / 60; }
function pct(h) { return Math.min(100, Math.max(0, ((h - RULER_START) / (RULER_END - RULER_START)) * 100)); }

// Ô số tăng/giảm (giờ : phút)
function Spinner({ value, onChange, max, step = 1 }) {
  const up   = () => onChange((value + step) % (max + 1));
  const down = () => onChange((value - step + (max + 1)) % (max + 1));
  return (
    <div className="flex flex-col items-center">
      <button onClick={up}   className="text-slate-300 hover:text-emerald-500 transition"><ChevronUp size={16} /></button>
      <span className="text-2xl font-bold text-slate-800 tabular-nums w-10 text-center">{pad(value)}</span>
      <button onClick={down} className="text-slate-300 hover:text-emerald-500 transition"><ChevronDown size={16} /></button>
    </div>
  );
}

const fieldCls =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition";
const labelCls = "text-[13px] font-semibold text-slate-600 mb-1.5 block";

export default function AppointmentForm({ data, setData, onClose, editing, initialCustomerId }) {
  const today = todayStr();
  const ed = editing || null;
  const initCust = ed
    ? data.customers.find((c) => c.id === ed.customerId)
    : (initialCustomerId ? data.customers.find((c) => c.id === initialCustomerId) : null);
  const edCust = initCust;
  const [edH, edM] = ed?.time ? ed.time.split(":").map(Number) : [9, 0];
  const initDate = ed?.date || today;

  const [tab, setTab]           = useState("main");
  const [category, setCategory] = useState(ed?.category || "Tư Vấn");
  const [view, setView]         = useState(() => { const d = new Date(initDate + "T00:00:00"); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [date, setDate]         = useState(initDate);
  const [hour, setHour]         = useState(edH);
  const [minute, setMinute]     = useState(edM);

  const [q, setQ]               = useState(edCust?.name || "");
  const [custId, setCustId]     = useState(ed?.customerId || initialCustomerId || "");
  const [showResults, setShowResults] = useState(false);

  const [doctors, setDoctors]   = useState(ed?.doctors || (ed?.doctor ? [ed.doctor] : []));
  const [tech, setTech]         = useState(ed?.tech || "");
  const [duration, setDuration] = useState(ed?.mins || 30);
  const [serviceIds, setServiceIds] = useState(ed?.serviceIds || (ed?.serviceId ? [ed.serviceId] : []));
  const [tag, setTag]           = useState(ed?.tag || "");
  const [note, setNote]         = useState(ed?.note || "");
  const [dayPart, setDayPart]   = useState("morning");
  // Tab "Khác"
  const [deposit, setDeposit]           = useState(String(ed?.deposit ?? ""));
  const [remind, setRemind]             = useState(ed?.remind ?? true);
  const [remindBefore, setRemindBefore] = useState(String(ed?.remindBefore ?? "24"));
  const [source, setSource]             = useState(ed?.source || "");
  const [internalNote, setInternalNote] = useState(ed?.internalNote || "");

  const doctorOptions = (data.staff || []).filter((s) => s.role === "Bác Sĩ");
  const techs   = (data.staff || []).filter((s) => s.role !== "Bác Sĩ");

  const addDoctor = (name) => { if (name && !doctors.includes(name)) setDoctors([...doctors, name]); };
  const removeDoctor = (name) => setDoctors(doctors.filter((d) => d !== name));
  const addService = (id) => { if (id && !serviceIds.includes(id)) setServiceIds([...serviceIds, id]); };
  const removeService = (id) => setServiceIds(serviceIds.filter((s) => s !== id));
  const svcName = (id) => data.services.find((s) => s.id === id)?.name || "";

  const cust = data.customers.find((c) => c.id === custId);

  const results = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return [];
    return data.customers
      .filter((c) => (c.name + c.phone + c.code).toLowerCase().includes(ql))
      .slice(0, 6);
  }, [q, data.customers]);

  // ── Lưới lịch tháng (6 hàng × 7 cột) ──────────────────────────────────────
  const cells = useMemo(() => {
    const { y, m } = view;
    const firstDow = (new Date(y, m, 1).getDay() + 6) % 7; // Mon-first
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const out = [];
    for (let i = firstDow - 1; i >= 0; i--) out.push({ day: prevDays - i, cur: false });
    for (let d = 1; d <= daysInMonth; d++) out.push({ day: d, cur: true, ds: `${y}-${pad(m + 1)}-${pad(d)}` });
    let nd = 1;
    while (out.length < 42) out.push({ day: nd++, cur: false });
    return out;
  }, [view]);

  const prevMonth = () => setView((v) => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  const nextMonth = () => setView((v) => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });

  // ── Lịch hẹn trong ngày đã chọn (cho thanh thời gian) ─────────────────────
  const dayAppts = useMemo(() =>
    data.appts.filter((a) => a.date === date && a.status !== "cancelled"),
    [data.appts, date]
  );
  const morningCount   = dayAppts.filter((a) => timeToFloat(a.time) < 12).length;
  const afternoonCount = dayAppts.filter((a) => timeToFloat(a.time) >= 12).length;

  const selStart = hour + minute / 60;
  const selEnd   = selStart + duration / 60;

  // Cảnh báo trùng giờ bác sĩ
  const conflicts = useMemo(() => {
    if (!doctors.length) return [];
    return data.appts.filter((a) => {
      if (a.id === ed?.id) return false;
      if (a.date !== date || a.status === "cancelled") return false;
      const aDoctors = a.doctors || (a.doctor ? [a.doctor] : []);
      if (!aDoctors.some((d) => doctors.includes(d))) return false;
      const s = timeToFloat(a.time);
      const e = s + (a.mins || 30) / 60;
      return selStart < e && s < selEnd; // giao nhau
    });
  }, [data.appts, doctors, date, selStart, selEnd, ed]);

  const valid = !!custId;

  const save = () => {
    if (!valid) return;
    const targetCust = data.customers.find((c) => c.id === custId);
    const code = ed?.code || ("LH" + String((data.appts || []).length + 1).padStart(3, "0"));
    const sName = serviceIds.map((sid) => svcName(sid)).filter(Boolean).join(", ") || category;

    const payload = {
      code,
      customerId: custId,
      customerName: targetCust?.name || "",
      customerCode: targetCust?.code || "",
      phone: targetCust?.phone || "",
      service: sName,
      serviceName: sName,
      serviceIds,
      serviceId: serviceIds[0] || "",
      doctors,
      doctor: doctors[0] || "",
      tech,
      date,
      time: hhmm(hour, minute),
      mins: duration,
      category,
      tag,
      note,
      deposit: Number(deposit) || 0,
      remind, remindBefore: Number(remindBefore) || 0,
      source, internalNote,
    };
    if (ed) {
      setData({ ...data, appts: data.appts.map((a) => a.id === ed.id ? { ...a, ...payload } : a) });
    } else {
      setData({ ...data, appts: [...(data.appts || []), { id: uid("ap"), status: "pending", ...payload }] });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 animate-fade" onClick={onClose}>
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200/60 max-h-[94vh] flex flex-col animate-pop"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-9 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
            <div>
              <h2 className="font-bold text-slate-900 leading-tight">Lịch hẹn</h2>
              <p className="text-xs text-slate-400">{ed ? "Sửa lịch hẹn" : "Lịch hẹn khách hàng"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button onClick={() => setTab("main")}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${tab === "main" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              Thông tin chung
            </button>
            <button onClick={() => setTab("other")}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${tab === "other" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              Khác
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scroll-soft px-6 pb-2">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── Cột trái: lịch + giờ ─────────────────────────────────── */}
            <div className="lg:w-72 shrink-0">
              {/* Điều hướng tháng */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><ChevronLeft size={18} /></button>
                <div className="font-semibold text-slate-700">{MONTHS[view.m]} <span className="text-slate-400 font-normal">{view.y}</span></div>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><ChevronRight size={18} /></button>
              </div>

              {/* Lưới lịch */}
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {WEEK.map((w) => <div key={w} className="text-[11px] font-semibold text-slate-400 pb-1">{w}</div>)}
                {cells.map((c, i) => {
                  if (!c.cur) return <div key={i} className="text-sm text-slate-300 py-1.5">{c.day}</div>;
                  const isSel   = c.ds === date;
                  const isToday = c.ds === today;
                  return (
                    <div key={i} className="py-0.5 flex justify-center">
                      <button onClick={() => setDate(c.ds)}
                        className={`w-8 h-8 rounded-full text-sm font-medium grid place-items-center transition ${
                          isSel
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30"
                            : isToday
                              ? "text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-50"
                              : "text-slate-600 hover:bg-slate-100"
                        }`}>
                        {c.day}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Chọn giờ */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <Spinner value={hour}   onChange={setHour}   max={23} />
                <span className="text-2xl font-bold text-slate-300 pb-1">:</span>
                <Spinner value={minute} onChange={setMinute} max={55} step={5} />
              </div>

              {/* Tổng lịch */}
              <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200/70 p-3">
                <div className="text-sm">
                  <span className="text-slate-400">Tổng lịch</span>{" "}
                  <span className="font-semibold text-slate-700">{date.split("-").reverse().join("-")}</span>
                </div>
                <div className="text-sm font-medium text-slate-600 mb-2">Nha Khoa Victoria</div>
                <div className="flex gap-2">
                  <button onClick={() => setDayPart("morning")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${dayPart === "morning" ? "bg-white shadow-sm text-emerald-700 ring-1 ring-emerald-200" : "text-slate-500 hover:bg-white/60"}`}>
                    Buổi sáng <span className="text-slate-400">({morningCount})</span>
                  </button>
                  <button onClick={() => setDayPart("afternoon")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${dayPart === "afternoon" ? "bg-white shadow-sm text-emerald-700 ring-1 ring-emerald-200" : "text-slate-500 hover:bg-white/60"}`}>
                    Buổi chiều <span className="text-slate-400">({afternoonCount})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Cột phải: form ───────────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {tab === "main" ? (
                <>
                  {/* Loại */}
                  <div className="flex items-center gap-6 mb-4">
                    {["Tư Vấn", "Điều Trị"].map((c) => (
                      <label key={c} className="flex items-center gap-2 cursor-pointer">
                        <span className={`w-4 h-4 rounded-full border-2 grid place-items-center transition ${category === c ? "border-emerald-500" : "border-slate-300"}`}>
                          {category === c && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                        </span>
                        <input type="radio" className="hidden" checked={category === c} onChange={() => setCategory(c)} />
                        <span className={`text-sm font-medium ${category === c ? "text-slate-800" : "text-slate-500"}`}>{c}</span>
                      </label>
                    ))}
                  </div>

                  {/* Khách hàng - tìm kiếm */}
                  <div className="mb-4 relative">
                    <label className={labelCls}>Khách hàng</label>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition">
                      <Search size={15} className="text-slate-400 shrink-0" />
                      <span className="text-sm font-medium text-slate-500 shrink-0">Tìm kiếm</span>
                      <input
                        value={q}
                        onChange={(e) => { setQ(e.target.value); setShowResults(true); }}
                        onFocus={() => setShowResults(true)}
                        placeholder="eg .tìm tên, tìm số điện thoại, mã..."
                        className="flex-1 min-w-0 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                      />
                      {(q || custId) && (
                        <button onClick={() => { setQ(""); setCustId(""); setShowResults(false); }}
                          className="text-slate-300 hover:text-rose-400 transition shrink-0">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    {showResults && results.length > 0 && (
                      <ul className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/60 overflow-hidden animate-pop">
                        {results.map((c) => (
                          <li key={c.id}>
                            <button
                              onClick={() => { setCustId(c.id); setQ(c.name); setShowResults(false); }}
                              className="w-full text-left px-3 py-2 hover:bg-emerald-50 transition flex items-center gap-2.5">
                              <Avatar src={c.avatar} name={c.name} size={30} />
                              <span className="text-sm font-medium text-slate-700 flex-1">{c.name}</span>
                              <span className="text-xs text-slate-400">{c.phone} · {c.code}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Tên / Mã / SĐT */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className={labelCls}>Tên</label>
                      <input readOnly value={cust?.name || ""} placeholder="eg .tên" className={fieldCls + " bg-slate-50"} />
                    </div>
                    <div>
                      <label className={labelCls}>Mã</label>
                      <input readOnly value={cust?.code || ""} placeholder="eg .mã" className={fieldCls + " bg-slate-50"} />
                    </div>
                    <div>
                      <label className={labelCls}>Số điện thoại</label>
                      <input readOnly value={cust?.phone || ""} placeholder="eg .số điện thoại" className={fieldCls + " bg-slate-50"} />
                    </div>
                  </div>

                  {/* Bác sĩ (nhiều) / KTV / Dự kiến */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className={labelCls}>Bác sĩ <span className="text-slate-400 font-normal">(chọn nhiều)</span></label>
                      <select value="" onChange={(e) => addDoctor(e.target.value)} className={fieldCls}>
                        <option value="">+ Thêm bác sĩ</option>
                        {doctorOptions.filter((d) => !doctors.includes(d.name)).map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                      {doctors.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {doctors.map((d) => (
                            <span key={d} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium">
                              {d}<button onClick={() => removeDoctor(d)} className="hover:text-rose-500"><X size={12} /></button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>Kỹ thuật viên/phụ tá</label>
                      <select value={tech} onChange={(e) => setTech(e.target.value)} className={fieldCls}>
                        <option value="">eg .kỹ thuật viên/phụ tá</option>
                        {techs.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Dự kiến</label>
                      <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={fieldCls}>
                        {DURATIONS.map((m) => <option key={m} value={m}>{m} Phút</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Chi nhánh / Dịch vụ (nhiều) / Tag */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className={labelCls}>Chi nhánh</label>
                      <select className={fieldCls} defaultValue="victoria">
                        <option value="victoria">Nha Khoa Victoria</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Dịch vụ <span className="text-slate-400 font-normal">(chọn nhiều)</span></label>
                      <select value="" onChange={(e) => addService(e.target.value)} className={fieldCls}>
                        <option value="">+ Thêm dịch vụ</option>
                        {data.services.filter((s) => !serviceIds.includes(s.id) && s.active !== false).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      {serviceIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {serviceIds.map((id) => (
                            <span key={id} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-medium">
                              {svcName(id)}<button onClick={() => removeService(id)} className="hover:text-rose-500"><X size={12} /></button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>Tag</label>
                      <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="eg .tag" className={fieldCls} />
                    </div>
                  </div>

                  {/* Nội dung */}
                  <div className="mb-4">
                    <label className={labelCls}>Nội dung lịch hẹn</label>
                    <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="eg .nội dung" className={fieldCls + " resize-none"} />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Tiền đặt cọc (₫)</label>
                      <input type="number" min={0} value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="0" className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Nguồn khách</label>
                      <select value={source} onChange={(e) => setSource(e.target.value)} className={fieldCls}>
                        <option value="">-- Chọn nguồn --</option>
                        <option>Khách vãng lai</option>
                        <option>Giới thiệu</option>
                        <option>Facebook</option>
                        <option>Zalo</option>
                        <option>Google</option>
                        <option>Khác</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded accent-emerald-600" checked={remind} onChange={(e) => setRemind(e.target.checked)} />
                      Nhắc lịch hẹn cho khách
                    </label>
                    {remind && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <span>Nhắc trước</span>
                        <select value={remindBefore} onChange={(e) => setRemindBefore(e.target.value)}
                          className="rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                          <option value="1">1 giờ</option>
                          <option value="3">3 giờ</option>
                          <option value="24">1 ngày</option>
                          <option value="48">2 ngày</option>
                          <option value="72">3 ngày</option>
                        </select>
                        <span>trước giờ hẹn</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Ghi chú nội bộ <span className="text-slate-400 font-normal">(khách không thấy)</span></label>
                    <textarea rows={3} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder="Ghi chú riêng cho nhân viên..." className={fieldCls + " resize-none"} />
                  </div>
                </div>
              )}

              {/* Thanh thời gian */}
              <div className="mt-2">
                <div className="relative h-10">
                  {/* Track */}
                  <div className="absolute left-0 right-0 top-5 h-[2px] bg-slate-200" />
                  {/* Ticks + labels */}
                  {Array.from({ length: RULER_END - RULER_START + 1 }, (_, i) => RULER_START + i).map((h) => (
                    <div key={h} className="absolute -translate-x-1/2 top-3.5" style={{ left: `${pct(h)}%` }}>
                      <div className="w-px h-2 bg-slate-300 mx-auto" />
                      {h % 2 === 0 && <div className="text-[10px] text-slate-400 mt-0.5">{pad(h)}:00</div>}
                    </div>
                  ))}
                  {/* Lịch hẹn hiện có (xanh dương) */}
                  {dayAppts.map((a) => {
                    const s = timeToFloat(a.time);
                    const e = s + (a.mins || 30) / 60;
                    return <div key={a.id} className="absolute top-[14px] h-2 rounded-full bg-sky-300"
                      style={{ left: `${pct(s)}%`, width: `${pct(e) - pct(s)}%` }} title={a.time} />;
                  })}
                  {/* Slot đang chọn (cam) */}
                  <div className="absolute top-[14px] h-2 rounded-full bg-orange-400 shadow shadow-orange-400/40"
                    style={{ left: `${pct(selStart)}%`, width: `${Math.max(1, pct(selEnd) - pct(selStart))}%` }} />
                </div>
                {/* Chú thích */}
                <div className="flex items-center gap-5 mt-1 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-6 h-1 rounded-full bg-emerald-400" /> Lịch làm việc</span>
                  <span className="flex items-center gap-1.5"><span className="w-6 h-1 rounded-full bg-sky-300" /> Lịch hẹn</span>
                  <span className="flex items-center gap-1.5"><span className="w-6 h-1 rounded-full bg-orange-400" /> Lịch đang chọn</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cảnh báo trùng giờ */}
        {conflicts.length > 0 && (
          <div className="mx-6 mb-1 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <span>
              <b>{doctors.join(", ")}</b> đã có {conflicts.length} lịch trùng giờ ngày {date.split("-").reverse().join("-")}:{" "}
              {conflicts.map((c) => c.time).join(", ")}. Bạn vẫn có thể lưu.
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100">
          {ed && (
            <button
              onClick={() => printAppointment(
                { ...ed, date, time: hhmm(hour, minute), doctor: doctors[0] || ed.doctor, note },
                cust,
                serviceIds.map((id) => svcName(id)).filter(Boolean).join(", ")
              )}
              className="mr-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
              <Printer size={15} /> In phiếu hẹn
            </button>
          )}
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-400 text-white text-sm font-medium hover:bg-slate-500 transition">
            Đóng
          </button>
          <button onClick={save} disabled={!valid}
            className={`px-6 py-2 rounded-xl text-white text-sm font-semibold transition-all duration-200 ${
              valid ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5" : "bg-slate-300 cursor-not-allowed"
            }`}>
            {ed ? "Cập nhật" : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
