import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { uid, todayStr, fmtDate } from "../utils/helpers";

const inp = "w-full px-3 py-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500";

// Tab ghi nhận chung: lưu mảng bản ghi vào customer[field]
// columns: [{ key, label, type: "text"|"textarea"|"select"|"staff", options? }]
export default function CustomerRecordTab({ data, setData, customer, field, title, subtitle, columns }) {
  const records = customer[field] || [];
  const staff = data.staff || [];
  const [adding, setAdding] = useState(false);
  const blank = Object.fromEntries(columns.map((c) => [c.key, c.type === "select" ? (c.options?.[0] || "") : ""]));
  const [form, setForm] = useState(blank);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const valid = columns.some((c) => (form[c.key] || "").toString().trim());

  const save = () => {
    if (!valid) return;
    const rec = { id: uid("rc"), date: todayStr(), time: new Date().toTimeString().slice(0, 5), ...form };
    setData({ ...data, customers: data.customers.map((x) => x.id === customer.id ? { ...x, [field]: [...(x[field] || []), rec] } : x) });
    setForm(blank); setAdding(false);
  };
  const remove = (id) => {
    if (!window.confirm("Xoá mục này?")) return;
    setData({ ...data, customers: data.customers.map((x) => x.id === customer.id ? { ...x, [field]: (x[field] || []).filter((r) => r.id !== id) } : x) });
  };

  const renderInput = (col) => {
    if (col.type === "textarea")
      return <textarea rows={2} className={inp + " resize-none"} value={form[col.key]} onChange={(e) => set(col.key, e.target.value)} placeholder={col.label} />;
    if (col.type === "staff")
      return <select className={inp} value={form[col.key]} onChange={(e) => set(col.key, e.target.value)}><option value="">-- chọn --</option>{staff.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}</select>;
    if (col.type === "select")
      return <select className={inp} value={form[col.key]} onChange={(e) => set(col.key, e.target.value)}>{col.options.map((o) => <option key={o}>{o}</option>)}</select>;
    return <input className={inp} value={form[col.key]} onChange={(e) => set(col.key, e.target.value)} placeholder={col.label} />;
  };

  const statusCls = (v) =>
    v === "Đã xử lý" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : v === "Đang xử lý" ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="bg-white rounded shadow-sm border border-slate-100">
      <div className="flex justify-between items-center p-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-700">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        <button onClick={() => setAdding((a) => !a)} className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 flex items-center gap-1.5"><Plus size={14} /> Thêm</button>
      </div>

      {adding && (
        <div className="p-3 border-b border-slate-100 bg-slate-50 space-y-2">
          {columns.map((col) => (
            <div key={col.key}>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{col.label}</label>
              {renderInput(col)}
            </div>
          ))}
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setAdding(false); setForm(blank); }} className="px-4 py-1.5 rounded text-slate-600 hover:bg-slate-100 text-sm">Hủy</button>
            <button onClick={save} className={"px-4 py-1.5 rounded bg-emerald-600 text-white text-sm font-medium " + (valid ? "" : "opacity-50 pointer-events-none")}>Lưu</button>
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">Chưa có dữ liệu.</div>
      ) : (
        <ul className="divide-y divide-slate-50">
          {[...records].reverse().map((r) => (
            <li key={r.id} className="p-3 flex items-start gap-3 text-sm hover:bg-slate-50">
              <div className="text-xs text-slate-400 w-24 shrink-0">{r.time} {fmtDate(r.date)}</div>
              <div className="flex-1 min-w-0 space-y-0.5">
                {columns.map((col) => r[col.key] ? (
                  col.type === "select" ? (
                    <span key={col.key} className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusCls(r[col.key])}`}>{r[col.key]}</span>
                  ) : (
                    <div key={col.key} className="text-slate-700"><span className="text-slate-400 text-xs">{col.label}: </span>{r[col.key]}</div>
                  )
                ) : null)}
              </div>
              <button onClick={() => remove(r.id)} className="text-slate-400 hover:text-rose-500 shrink-0"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
