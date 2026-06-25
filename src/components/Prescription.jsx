import { useState, useEffect } from "react";
import { Plus, Trash2, Pill, FileText, Printer } from "lucide-react";
import Modal from "./ui/Modal";
import Field, { inputCls, btnPrimary, btnGhost } from "./ui/Field";
import { uid, todayStr, fmtDate } from "../utils/helpers";
import { printPrescription } from "../utils/print";

const STORAGE_KEY = "denta:prescriptions";

function loadPrescriptions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePrescriptions(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

const emptyMed = () => ({ id: uid("med"), name: "", unit: "viên", qty: 1, usage: "" });

export default function Prescription() {
  const [prescriptions, setPrescriptions] = useState(loadPrescriptions);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    patient: "", date: todayStr(), note: "",
    medicines: [emptyMed()],
  });

  useEffect(() => { savePrescriptions(prescriptions); }, [prescriptions]);

  const setF = (k, v) => setForm({ ...form, [k]: v });

  const addMed = () =>
    setForm({ ...form, medicines: [...form.medicines, emptyMed()] });

  const removeMed = (id) =>
    setForm({ ...form, medicines: form.medicines.filter((m) => m.id !== id) });

  const setMed = (id, k, v) =>
    setForm({
      ...form,
      medicines: form.medicines.map((m) => m.id === id ? { ...m, [k]: v } : m),
    });

  const valid = form.patient.trim() && form.medicines.some((m) => m.name.trim());

  const save = () => {
    if (!valid) return;
    const newRx = {
      id:   uid("rx"),
      ...form,
      createdAt: new Date().toISOString(),
    };
    setPrescriptions([newRx, ...prescriptions]);
    setForm({ patient: "", date: todayStr(), note: "", medicines: [emptyMed()] });
    setShowAdd(false);
  };

  const deleteRx = (id) => {
    setPrescriptions(prescriptions.filter((rx) => rx.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 card p-4">
        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700"><Pill size={20} /></div>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-800">Đơn Thuốc</h2>
          <p className="text-xs text-slate-500">{prescriptions.length} đơn · lưu trữ cục bộ</p>
        </div>
        <button onClick={() => setShowAdd(true)} className={btnPrimary}>
          <Plus size={15} /> Thêm đơn thuốc
        </button>
      </div>

      {/* List */}
      {prescriptions.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <FileText size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 text-sm">Chưa có đơn thuốc nào.</p>
            <button onClick={() => setShowAdd(true)} className={btnPrimary}>
              <Plus size={14} /> Tạo đơn thuốc đầu tiên
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Pill size={15} className="text-emerald-600" />
                    <span className="font-semibold text-slate-800">{rx.patient}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Ngày kê: {fmtDate(rx.date)}</div>
                  {rx.note && <div className="text-xs text-slate-500 mt-0.5">{rx.note}</div>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => printPrescription({ date: rx.date, meds: rx.medicines, note: rx.note }, { name: rx.patient })}
                    title="In đơn thuốc"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                  >
                    <Printer size={14} />
                  </button>
                  <button
                    onClick={() => deleteRx(rx.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 font-medium">
                      <th className="px-3 py-2 text-left">Thuốc</th>
                      <th className="px-3 py-2 text-center">ĐV</th>
                      <th className="px-3 py-2 text-center">SL</th>
                      <th className="px-3 py-2 text-left">Cách dùng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rx.medicines.filter((m) => m.name).map((m) => (
                      <tr key={m.id}>
                        <td className="px-3 py-2 font-medium text-slate-700">{m.name}</td>
                        <td className="px-3 py-2 text-center text-slate-500">{m.unit}</td>
                        <td className="px-3 py-2 text-center text-slate-700">{m.qty}</td>
                        <td className="px-3 py-2 text-slate-500">{m.usage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <Modal
          title="Thêm Đơn Thuốc"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className={btnGhost} onClick={() => setShowAdd(false)}>Hủy</button>
              <button
                className={btnPrimary + (valid ? "" : " opacity-50 pointer-events-none")}
                onClick={save}
              >
                Lưu đơn
              </button>
            </>
          }
        >
          <Field label="Tên bệnh nhân">
            <input className={inputCls} value={form.patient} onChange={(e) => setF("patient", e.target.value)} placeholder="Họ tên bệnh nhân..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày kê đơn">
              <input type="date" className={inputCls} value={form.date} onChange={(e) => setF("date", e.target.value)} />
            </Field>
            <Field label="Ghi chú">
              <input className={inputCls} value={form.note} onChange={(e) => setF("note", e.target.value)} placeholder="Chuẩn đoán, lưu ý..." />
            </Field>
          </div>

          <div className="mt-1 mb-2">
            <div className="text-xs font-medium text-slate-500 mb-2">Danh sách thuốc</div>
            <div className="space-y-2">
              {form.medicines.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <input
                    className={inputCls + " flex-[3]"}
                    placeholder="Tên thuốc"
                    value={m.name}
                    onChange={(e) => setMed(m.id, "name", e.target.value)}
                  />
                  <input
                    className={inputCls + " w-20"}
                    placeholder="ĐV"
                    value={m.unit}
                    onChange={(e) => setMed(m.id, "unit", e.target.value)}
                  />
                  <input
                    type="number"
                    className={inputCls + " w-16"}
                    placeholder="SL"
                    value={m.qty}
                    min={1}
                    onChange={(e) => setMed(m.id, "qty", e.target.value)}
                  />
                  <input
                    className={inputCls + " flex-[2]"}
                    placeholder="Cách dùng"
                    value={m.usage}
                    onChange={(e) => setMed(m.id, "usage", e.target.value)}
                  />
                  {form.medicines.length > 1 && (
                    <button
                      onClick={() => removeMed(m.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addMed}
              className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"
            >
              <Plus size={13} /> Thêm thuốc
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
