import { useState } from "react";
import {
  Plus, Trash2, Printer, ChevronDown, Filter, Info, ClipboardList, Pill, X, Pencil, CheckCircle2
} from "lucide-react";
import Modal from "./ui/Modal";
import Field, { inputCls, btnPrimary } from "./ui/Field";
import { uid, todayStr, fmtDate } from "../utils/helpers";

const num = (n) => (n || 0).toLocaleString("vi-VN");

export default function CustomerServiceTab({ data, setData, customer }) {
  const [mode, setMode]       = useState("list");   // list | add
  const [editItem, setEditItem] = useState(null); // Record to edit
  const records = customer.services || [];
  const staff = data.staff || [];
  const groups = [...new Set((data.services || []).map((s) => s.group).filter(Boolean))];

  // ── Form thêm dịch vụ ───────────────────────────────────────────────────
  const blank = { group: groups[0] || "", serviceId: "", name: "", price: "", qty: 1, discount: "", treatCount: "1", note: "" };
  const [line, setLine]           = useState(blank);
  const [selected, setSelected]   = useState([]);
  const [consultant, setConsultant] = useState("");
  const [responsible, setResponsible] = useState("");
  const [closed, setClosed]       = useState(true);

  const svcOptions = (data.services || []).filter((s) => (line.group ? (s.group || "") === line.group : true) && s.active !== false);
  const pickService = (id) => {
    const s = data.services.find((x) => x.id === id);
    setLine((l) => ({ ...l, serviceId: id, name: s?.name || "", price: String(s?.price ?? "") }));
  };
  const lineTotal = (Number(line.price) || 0) * (Number(line.qty) || 0) - (Number(line.discount) || 0);

  const addLine = () => {
    if (!line.serviceId && !line.name.trim()) return;
    setSelected((s) => [...s, {
      ...line, id: uid("ln"),
      price: Number(line.price) || 0, qty: Number(line.qty) || 1, discount: Number(line.discount) || 0,
      total: lineTotal,
    }]);
    setLine({ ...blank, group: line.group });
  };
  const removeLine = (id) => setSelected((s) => s.filter((x) => x.id !== id));

  const sumBase  = selected.reduce((a, l) => a + l.price * l.qty, 0);
  const sumDisc  = selected.reduce((a, l) => a + (l.discount || 0), 0);
  const sumTotal = selected.reduce((a, l) => a + l.total, 0);

  const save = () => {
    if (!selected.length) return;
    const n0 = records.length;
    const recs = selected.map((l, i) => ({
      id: uid("cs"),
      code: "SP" + todayStr().replace(/-/g, "") + "." + (n0 + i + 1),
      serviceId: l.serviceId, name: l.name, group: l.group,
      price: l.price, qty: l.qty, discount: l.discount, total: l.total,
      treatCount: Number(l.treatCount) || 0, note: l.note,
      consultant, staff: responsible, closed,
      date: todayStr(), time: new Date().toTimeString().slice(0, 5),
    }));
    setData({ ...data, customers: data.customers.map((c) => c.id === customer.id ? { ...c, services: [...(c.services || []), ...recs] } : c) });
    setSelected([]); setMode("list");
  };

  const handleSaveEditService = () => {
    if (!editItem) return;
    const p = Number(editItem.price) || 0;
    const q = Number(editItem.qty) || 1;
    const d = Number(editItem.discount) || 0;
    const tot = p * q - d;

    const updatedServices = records.map((s) =>
      s.id === editItem.id
        ? {
            ...s,
            name: editItem.name,
            group: editItem.group,
            price: p,
            qty: q,
            discount: d,
            total: tot,
            consultant: editItem.consultant,
            staff: editItem.staff,
            note: editItem.note,
          }
        : s
    );

    setData({
      ...data,
      customers: data.customers.map((c) => (c.id === customer.id ? { ...c, services: updatedServices } : c)),
    });

    setEditItem(null);
  };

  const removeRecord = (id) => {
    if (!window.confirm("Xoá dịch vụ này khỏi hồ sơ khách?")) return;
    setData({ ...data, customers: data.customers.map((c) => c.id === customer.id ? { ...c, services: (c.services || []).filter((x) => x.id !== id) } : c) });
  };

  const labelCls = "text-[13px] font-medium text-slate-600 mb-1 block";
  const inp = "w-full px-3 py-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500";

  // ── Thanh sub-tab (Dịch vụ / Đơn thuốc) ─────────────────────────────────
  const SubTabs = (
    <div className="flex items-center gap-2 mb-4">
      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-emerald-500 text-emerald-600 text-sm font-medium bg-white">
        <ClipboardList size={15} /> Dịch vụ
      </button>
      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 text-slate-500 text-sm hover:bg-slate-50">
        <Pill size={15} /> Đơn thuốc
      </button>
    </div>
  );

  // ─────────────────────────────────────────────────────────── ADD MODE ──
  if (mode === "add") {
    return (
      <div>
        {SubTabs}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Form */}
          <div className="lg:col-span-2 bg-white p-4 rounded shadow-sm border border-slate-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className={labelCls}>Người chịu trách nhiệm</label>
                <select className={inp} value={responsible} onChange={(e) => setResponsible(e.target.value)}>
                  <option value="">-- chọn --</option>{staff.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select></div>
              <div><label className={labelCls}>Người tư vấn</label>
                <select className={inp} value={consultant} onChange={(e) => setConsultant(e.target.value)}>
                  <option value="">-- chọn --</option>{staff.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select></div>
              <div><label className={labelCls}>Lần điều trị</label>
                <input type="number" min={0} className={inp} value={line.treatCount} onChange={(e) => setLine({ ...line, treatCount: e.target.value })} /></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={labelCls}>Nhóm dịch vụ</label>
                <select className={inp} value={line.group} onChange={(e) => setLine({ ...line, group: e.target.value, serviceId: "", name: "", price: "" })}>
                  <option value="">-- tất cả --</option>{groups.map((g) => <option key={g} value={g}>{g}</option>)}
                </select></div>
              <div><label className={labelCls}>Dịch vụ</label>
                <select className={inp} value={line.serviceId} onChange={(e) => pickService(e.target.value)}>
                  <option value="">-- chọn dịch vụ --</option>{svcOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select></div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelCls}>Đơn giá <span className="text-rose-500">*</span></label>
                <input type="number" className={inp + " text-right font-medium"} value={line.price} onChange={(e) => setLine({ ...line, price: e.target.value })} placeholder="0" /></div>
              <div><label className={labelCls}>SL</label>
                <input type="number" min={1} className={inp + " text-center"} value={line.qty} onChange={(e) => setLine({ ...line, qty: e.target.value })} /></div>
              <div><label className={labelCls}>C.Khấu (₫)</label>
                <input type="number" min={0} className={inp + " text-right"} value={line.discount} onChange={(e) => setLine({ ...line, discount: e.target.value })} placeholder="0" /></div>
            </div>
            <p className="text-[11px] text-slate-400">Đơn giá có thể sửa tự do khi deal giá với khách.</p>

            <div><label className={labelCls}>Ghi chú</label>
              <textarea rows={2} className={inp + " resize-none"} value={line.note} onChange={(e) => setLine({ ...line, note: e.target.value })} placeholder="eg .ghi chú" /></div>

            {/* Dịch vụ chọn */}
            <div className="border-t border-slate-100 pt-3">
              <div className="text-sm font-semibold text-slate-700 mb-2">Dịch vụ chọn ({selected.length})</div>
              {selected.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 border border-dashed border-slate-200 rounded text-center">Chưa chọn dịch vụ nào. Bấm "THÊM DỊCH VỤ".</div>
              ) : (
                <div className="space-y-1.5">
                  {selected.map((l) => (
                    <div key={l.id} className="flex items-center gap-2 text-sm bg-slate-50 rounded px-2.5 py-1.5">
                      <span className="flex-1 min-w-0 truncate">{l.name || "Dịch vụ"} <span className="text-slate-400">x{l.qty}</span></span>
                      <span className="font-medium text-slate-700">{num(l.total)}</span>
                      <button onClick={() => removeLine(l.id)} className="text-slate-400 hover:text-rose-500"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: thành tiền + nút */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded shadow-sm border border-slate-100">
              <div className="text-sm text-slate-500 mb-1">Thành tiền dòng hiện tại</div>
              <div className="text-2xl font-bold text-emerald-600">{num(lineTotal)}</div>
              <label className="flex items-center gap-2 text-sm text-slate-600 mt-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-emerald-600" checked={closed} onChange={(e) => setClosed(e.target.checked)} /> Chốt dịch vụ
              </label>
              <button onClick={addLine}
                className="mt-3 w-full py-2.5 rounded-lg text-white font-bold bg-gradient-to-r from-amber-400 to-rose-500 hover:opacity-90 transition flex items-center justify-center gap-2">
                THÊM DỊCH VỤ <Plus size={16} />
              </button>
            </div>

            <div className="bg-white p-4 rounded shadow-sm border border-slate-100 text-sm">
              <div className="font-semibold text-slate-700 mb-2">Tổng</div>
              <div className="flex justify-between py-1"><span className="text-slate-500">Tổng tiền</span><span className="font-medium">{num(sumBase)}</span></div>
              <div className="flex justify-between py-1"><span className="text-slate-500">Giảm &amp; Cấn trừ</span><span className="font-medium text-rose-600">{num(sumDisc)}</span></div>
              <div className="flex justify-between py-1 border-t border-slate-100 mt-1 pt-2"><span className="font-semibold text-slate-700">Thành tiền</span><span className="font-bold text-emerald-600 text-base">{num(sumTotal)}</span></div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setMode("list"); setSelected([]); }} className="flex-1 py-2 rounded-lg bg-slate-400 text-white font-medium hover:bg-slate-500 transition">Đóng</button>
                <button onClick={save} disabled={!selected.length}
                  className={`flex-1 py-2 rounded-lg text-white font-semibold transition ${selected.length ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-300 cursor-not-allowed"}`}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────── LIST MODE ──
  return (
    <div>
      {SubTabs}
      <div className="bg-white rounded shadow-sm border border-slate-100">
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <div className="flex items-center gap-3 text-slate-400">
            <Info size={16} /><Filter size={16} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMode("add")} className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 flex items-center gap-1.5"><Plus size={14} /> Thêm mới</button>
            <button className="px-3 py-1.5 rounded bg-slate-700 text-white text-sm font-medium flex items-center gap-1 hover:bg-slate-800"><Printer size={13} /> In <ChevronDown size={12} /></button>
          </div>
        </div>

        <div className="overflow-x-auto scroll-soft text-xs">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <th className="p-2 border-r border-b border-slate-100 text-center w-10">#</th>
                <th className="p-2 border-r border-b border-slate-100">Dịch Vụ</th>
                <th className="p-2 border-r border-b border-slate-100 text-right w-56">Thành Tiền</th>
                <th className="p-2 border-r border-b border-slate-100">Tư Vấn</th>
                <th className="p-2 border-r border-b border-slate-100">Ghi Chú</th>
                <th className="p-2 border-r border-b border-slate-100">Chốt Dịch Vụ</th>
                <th className="p-2 border-b border-slate-100 text-center w-16">Xử Lý</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Chưa có dịch vụ. Bấm "Thêm mới".</td></tr>
              ) : records.map((r, i) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="p-2 border-r border-slate-50 text-center text-slate-500">{i + 1}</td>
                  <td className="p-2 border-r border-slate-50">
                    <div className="font-medium text-emerald-600">{r.code} <span className="text-slate-700">{r.name}</span></div>
                    <div className="flex items-center gap-2 mt-1"><span className="text-slate-500">100 %</span><div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-full" /></div></div>
                    {r.group && <div className="text-[11px] text-slate-400 mt-0.5">{r.group}</div>}
                  </td>
                  <td className="p-2 border-r border-slate-50 text-right">
                    {r.discount > 0 && (
                      <div className="text-slate-500">Giá: {num(r.price * r.qty)} · Giảm: {num(r.discount)}</div>
                    )}
                    <div className="font-bold text-slate-800">{num(r.total)}</div>
                  </td>
                  <td className="p-2 border-r border-slate-50 text-slate-600">{r.consultant || "—"}</td>
                  <td className="p-2 border-r border-slate-50 text-slate-600">{r.note || ""}</td>
                  <td className="p-2 border-r border-slate-50">
                    <div className="text-slate-700">{r.staff || "—"}</div>
                    <div className="text-[11px] text-slate-400">{r.time} {fmtDate(r.date)}</div>
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => setEditItem({ ...r, price: String(r.price || 0), qty: String(r.qty || 1), discount: String(r.discount || 0) })} title="Sửa dịch vụ" className="text-slate-400 hover:text-amber-600"><Pencil size={14} /></button>
                      <button onClick={() => removeRecord(r.id)} title="Xóa dịch vụ" className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chỉnh Sửa Dịch Vụ */}
      {editItem && (
        <Modal title={`Chỉnh Sửa Dịch Vụ: ${editItem.name}`} onClose={() => setEditItem(null)}>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs space-y-1">
              <div className="flex justify-between text-slate-600"><span>Mã dịch vụ:</span> <b className="font-mono text-emerald-700">{editItem.code}</b></div>
              <div className="flex justify-between text-slate-600"><span>Ngày chốt:</span> <b>{fmtDate(editItem.date)} {editItem.time || ""}</b></div>
            </div>

            <Field label="Tên dịch vụ">
              <input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} className={inputCls} />
            </Field>

            <Field label="Nhóm dịch vụ">
              <select value={editItem.group} onChange={(e) => setEditItem({ ...editItem, group: e.target.value })} className={inputCls}>
                {groups.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Đơn giá (₫)">
                <input type="number" value={editItem.price} onChange={(e) => setEditItem({ ...editItem, price: e.target.value })} className={inputCls + " text-right font-medium"} />
              </Field>
              <Field label="Số lượng">
                <input type="number" min={1} value={editItem.qty} onChange={(e) => setEditItem({ ...editItem, qty: e.target.value })} className={inputCls + " text-center"} />
              </Field>
              <Field label="Giảm giá (₫)">
                <input type="number" min={0} value={editItem.discount} onChange={(e) => setEditItem({ ...editItem, discount: e.target.value })} className={inputCls + " text-right"} />
              </Field>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between font-bold">
              <span>Thành tiền sau giảm:</span>
              <span className="text-emerald-700 text-sm">{num((Number(editItem.price) || 0) * (Number(editItem.qty) || 1) - (Number(editItem.discount) || 0))} ₫</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Người tư vấn">
                <select value={editItem.consultant || ""} onChange={(e) => setEditItem({ ...editItem, consultant: e.target.value })} className={inputCls}>
                  <option value="">-- chọn --</option>
                  {staff.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Người chốt / Phụ trách">
                <select value={editItem.staff || ""} onChange={(e) => setEditItem({ ...editItem, staff: e.target.value })} className={inputCls}>
                  <option value="">-- chọn --</option>
                  {staff.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Ghi chú">
              <textarea rows={2} value={editItem.note || ""} onChange={(e) => setEditItem({ ...editItem, note: e.target.value })} className={inputCls + " resize-none"} />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition">Hủy</button>
              <button onClick={handleSaveEditService} className={btnPrimary}>Cập Nhật Dịch Vụ</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

