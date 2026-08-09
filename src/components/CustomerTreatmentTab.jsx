import { useState } from "react";
import {
  Plus, Trash2, Printer, ChevronDown, Filter, Info, CalendarCheck, RotateCw, Send, Check, Pencil
} from "lucide-react";
import { uid, todayStr, fmtDate } from "../utils/helpers";

const inp = "w-full px-3 py-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500";
const lbl = "text-[13px] font-medium text-slate-600 mb-1 block";

export default function CustomerTreatmentTab({ data, setData, customer }) {
  const [mode, setMode]     = useState("list"); // list | add | edit
  const [editId, setEditId] = useState(null);
  const [quick, setQuick]   = useState("");
  const treatments = customer.treatments || [];
  const staff   = data.staff || [];
  const doctors = staff.filter((s) => s.role === "Bác Sĩ");
  const techs   = staff.filter((s) => s.role !== "Bác Sĩ");
  const custServices = customer.services || [];

  // ── Thanh trạng thái lịch hẹn gần nhất ─────────────────────────────────
  const appts = data.appts.filter((a) => a.customerId === customer.id)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const latest = appts[0];
  const arrived = latest && (latest.status === "arrived" || latest.status === "done");
  const cycleStatus = () => {
    if (!latest) return;
    const order = ["pending", "arrived", "done"];
    const next = order[(order.indexOf(latest.status) + 1) % order.length] || "arrived";
    setData({ ...data, appts: data.appts.map((a) => a.id === latest.id ? { ...a, status: next } : a) });
  };

  // ── Form điều trị ─────────────────────────────────────────────────
  const blank = {
    serviceId: "", serviceName: "", status: "Đang điều trị", completion: "",
    doctor: doctors[0]?.name || "", tech: "", support: "",
    content: "", nextDate: "", nextContent: "", diseaseNote: "",
  };
  const [form, setForm] = useState(blank);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const persist = (rec) =>
    setData({ ...data, customers: data.customers.map((x) => x.id === customer.id ? { ...x, treatments: [...(x.treatments || []), rec] } : x) });

  const save = (cont) => {
    const sName = form.serviceName
      || custServices.find((s) => s.id === form.serviceId)?.name
      || data.services.find((s) => s.id === form.serviceId)?.name || "";
    if (!sName && !form.content.trim()) return;

    if (mode === "edit" && editId) {
      const updatedTreatments = treatments.map((t) =>
        t.id === editId
          ? {
              ...t,
              ...form,
              serviceName: sName,
              completion: Number(form.completion) || (form.status === "Điều trị xong" ? 100 : 0),
            }
          : t
      );
      setData({
        ...data,
        customers: data.customers.map((x) => (x.id === customer.id ? { ...x, treatments: updatedTreatments } : x)),
      });
      setEditId(null);
      setForm(blank);
      setMode("list");
      return;
    }

    const rec = {
      id: uid("tr"), date: todayStr(), time: new Date().toTimeString().slice(0, 5),
      ...form, serviceName: sName,
      completion: Number(form.completion) || (form.status === "Điều trị xong" ? 100 : 0),
    };
    persist(rec);
    setForm(blank);
    if (!cont) setMode("list");
  };

  const startEdit = (r) => {
    setEditId(r.id);
    setForm({
      serviceId: r.serviceId || "",
      serviceName: r.serviceName || "",
      status: r.status || "Đang điều trị",
      completion: r.completion !== undefined ? String(r.completion) : "",
      doctor: r.doctor || doctors[0]?.name || "",
      tech: r.tech || "",
      support: r.support || "",
      content: r.content || "",
      nextDate: r.nextDate || "",
      nextContent: r.nextContent || "",
      diseaseNote: r.diseaseNote || "",
    });
    setMode("edit");
  };

  const quickAdd = () => {
    if (!quick.trim()) return;
    persist({ id: uid("tr"), date: todayStr(), time: new Date().toTimeString().slice(0, 5), serviceName: "", status: "Đang điều trị", completion: 0, content: quick.trim() });
    setQuick("");
  };

  const remove = (id) => {
    if (!window.confirm("Xoá phiên điều trị này?")) return;
    setData({ ...data, customers: data.customers.map((x) => x.id === customer.id ? { ...x, treatments: (x.treatments || []).filter((r) => r.id !== id) } : x) });
  };

  // ── Thanh trạng thái + ghi chú nhanh (đầu trang) ───────────────────────
  const StatusBar = (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
      <div className="flex-1" />
      <div className="flex flex-col items-center">
        <div className="text-sm"><span className="text-slate-400">-</span> <span className="font-medium text-emerald-600">{latest?.time || "--:--"}</span></div>
        <div className="flex items-center gap-1 mt-1">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="w-12 h-0.5 bg-slate-200" />
          <span className={`w-3 h-3 rounded-full ${arrived ? "bg-emerald-500" : "bg-slate-300"}`} />
        </div>
        <div className="flex gap-8 text-xs text-slate-500 mt-1"><span>Chưa Đến</span><span>Đã Đến</span></div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-slate-500 text-sm font-medium">#{appts.length || 0}</span>
          <button onClick={() => { setMode("list"); setEditId(null); }} className="px-3 py-1 rounded bg-slate-400 text-white text-xs font-medium hover:bg-slate-500">Quay lại</button>
          <button onClick={cycleStatus} disabled={!latest} className={`px-3 py-1 rounded text-white text-xs font-medium ${latest ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-300"}`}>Chuyển trạng thái</button>
        </div>
      </div>
      <div className="flex-1 flex justify-end w-full lg:w-auto">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 w-full lg:w-72 bg-slate-50">
          <input value={quick} onChange={(e) => setQuick(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") quickAdd(); }}
            placeholder="eg .nội dung" className="flex-1 bg-transparent text-sm focus:outline-none" />
          <button onClick={quickAdd} className="text-emerald-600 hover:text-emerald-700"><Send size={16} /></button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────── ADD / EDIT MODE ──
  if (mode === "add" || mode === "edit") {
    return (
      <div>
        {StatusBar}
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-emerald-500 text-emerald-600 text-sm font-medium bg-white mb-4">
          <CalendarCheck size={15} /> {mode === "edit" ? "Cập Nhật Phiên Điều Trị" : "Điều Trị Mới"}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Trái */}
          <div className="bg-white p-4 rounded shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center gap-5">
              {["Đang điều trị", "Điều trị xong"].map((st) => (
                <label key={st} className="flex items-center gap-2 cursor-pointer text-sm" onClick={() => set("status", st)}>
                  <span className={`w-4 h-4 rounded-full border-2 grid place-items-center ${form.status === st ? "border-emerald-500" : "border-slate-300"}`}>
                    {form.status === st && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </span>
                  <span className={form.status === st ? "text-slate-800 font-medium" : "text-slate-500"}>{st}</span>
                </label>
              ))}
            </div>

            <div><label className={lbl}>Dịch vụ điều trị</label>
              <select className={inp} value={form.serviceId} onChange={(e) => { const s = custServices.find((x) => x.id === e.target.value) || data.services.find((x) => x.id === e.target.value); set("serviceId", e.target.value); set("serviceName", s?.name || ""); }}>
                <option value="">-- chọn dịch vụ --</option>
                {custServices.length > 0 && <optgroup label="Dịch vụ đã chốt">{custServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>}
                <optgroup label="Tất cả dịch vụ">{data.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>
              </select>
            </div>

            <div><label className={lbl}>Hoàn thành (%)</label>
              <input type="number" min={0} max={100} className={inp} value={form.completion} onChange={(e) => set("completion", e.target.value)} placeholder={form.status === "Điều trị xong" ? "100" : "0"} /></div>

            <div><label className={lbl}>Nội dung điều trị</label>
              <textarea rows={2} className={inp + " resize-none"} value={form.content} onChange={(e) => set("content", e.target.value)} placeholder="eg .nội dung" /></div>

            {/* Timeline các phiên đã có */}
            {treatments.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-semibold text-slate-500 mb-2">Đã điều trị</div>
                <ul className="space-y-2">
                  {[...treatments].reverse().slice(0, 6).map((r) => (
                    <li key={r.id} className="flex items-start gap-2 text-xs">
                      <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      <div><div className="text-slate-400">{r.time} {fmtDate(r.date)}</div><div className="font-medium text-slate-700">{r.serviceName || r.content}</div></div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Phải */}
          <div className="bg-white p-4 rounded shadow-sm border border-slate-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={lbl}>Bác sĩ</label>
                <select className={inp} value={form.doctor} onChange={(e) => set("doctor", e.target.value)}>
                  <option value="">-- chọn --</option>{doctors.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select></div>
              <div><label className={lbl}>PT/KTV</label>
                <select className={inp} value={form.tech} onChange={(e) => set("tech", e.target.value)}>
                  <option value="">-- chọn --</option>{techs.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select></div>
              <div><label className={lbl}>Hỗ trợ chuyên môn</label>
                <select className={inp} value={form.support} onChange={(e) => set("support", e.target.value)}>
                  <option value="">-- chọn --</option>{staff.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select></div>
              <div><label className={lbl}>Ngày điều trị kế tiếp</label>
                <input type="date" className={inp} value={form.nextDate} onChange={(e) => set("nextDate", e.target.value)} /></div>
            </div>
            <div><label className={lbl}>Nội dung kế tiếp</label>
              <textarea rows={2} className={inp + " resize-none"} value={form.nextContent} onChange={(e) => set("nextContent", e.target.value)} placeholder="eg .nội dung kế tiếp" /></div>
            <div><label className={lbl}>Đặc điểm bệnh</label>
              <textarea rows={2} className={inp + " resize-none"} value={form.diseaseNote} onChange={(e) => set("diseaseNote", e.target.value)} placeholder="eg .đặc điểm bệnh" /></div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => { setMode("list"); setEditId(null); setForm(blank); }} className="px-5 py-2 rounded bg-slate-400 text-white text-sm font-medium hover:bg-slate-500">Đóng</button>
          {mode === "add" && <button onClick={() => save(true)} className="px-5 py-2 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">Lưu và tiếp tục</button>}
          <button onClick={() => save(false)} className="px-5 py-2 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">{mode === "edit" ? "Cập Nhật Phiên Điều Trị" : "Lưu"}</button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────── LIST MODE ──
  return (
    <div>
      {StatusBar}
      <div className="bg-white rounded shadow-sm border border-slate-100">
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <div className="flex items-center gap-3 text-slate-400"><Filter size={16} /><Info size={16} /></div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setForm(blank); setEditId(null); setMode("add"); }} className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 flex items-center gap-1.5"><Plus size={14} /> Điều trị</button>
            <button className="px-3 py-1.5 rounded bg-slate-700 text-white text-sm font-medium flex items-center gap-1 hover:bg-slate-800"><Printer size={13} /> In <ChevronDown size={12} /></button>
          </div>
        </div>

        <div className="overflow-x-auto scroll-soft text-xs">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <th className="p-2 border-r border-b border-slate-100 text-center w-10">#</th>
                <th className="p-2 border-r border-b border-slate-100">Ngày Điều Trị ({treatments.length})</th>
                <th className="p-2 border-r border-b border-slate-100">Dịch Vụ</th>
                <th className="p-2 border-r border-b border-slate-100">Bác Sĩ</th>
                <th className="p-2 border-r border-b border-slate-100">PT/KTV</th>
                <th className="p-2 border-r border-b border-slate-100">Nội Dung</th>
                <th className="p-2 border-r border-b border-slate-100 text-center">Lịch Hẹn</th>
                <th className="p-2 border-b border-slate-100 text-center w-16">Xử Lý</th>
              </tr>
            </thead>
            <tbody>
              {treatments.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">Chưa có điều trị. Bấm "Điều trị".</td></tr>
              ) : [...treatments].reverse().map((r, i) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="p-2 border-r border-slate-50 text-center text-slate-500">{i + 1}</td>
                  <td className="p-2 border-r border-slate-50 text-slate-600">{fmtDate(r.date)}</td>
                  <td className="p-2 border-r border-slate-50">
                    <div className="font-medium text-emerald-600">{r.serviceName || r.content}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-500">Hoàn thành: <b className="text-slate-700">{r.completion || 0}%</b></span>
                      <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, r.completion || 0)}%` }} /></div>
                    </div>
                  </td>
                  <td className="p-2 border-r border-slate-50 text-slate-600">{r.doctor || "—"}</td>
                  <td className="p-2 border-r border-slate-50 text-slate-600">{r.tech || ""}</td>
                  <td className="p-2 border-r border-slate-50 text-slate-600">{r.content || ""}</td>
                  <td className="p-2 border-r border-slate-50 text-center text-slate-500">{r.nextDate ? <span title={"Kế tiếp: " + fmtDate(r.nextDate)}><CalendarCheck size={15} className="inline text-slate-600" /></span> : ""}</td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => startEdit(r)} title="Sửa phiên điều trị" className="text-slate-400 hover:text-amber-600"><Pencil size={14} /></button>
                      <button onClick={() => remove(r.id)} title="Xóa phiên điều trị" className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
