import { useState } from "react";
import { Search, Phone, MapPin, Cake, Pencil, Trash2, HeartPulse, ImageIcon } from "lucide-react";
import Badge from "./ui/Badge";
import Avatar from "./ui/Avatar";
import Odontogram from "./Odontogram";
import { inputCls } from "./ui/Field";
import { fmtDate, ageFrom } from "../utils/helpers";

export default function Customers({ data, setData, openAdd, registerAdd, onEdit }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);

  registerAdd(() => openAdd("customer"));

  const svc = (id) => data.services.find((s) => s.id === id);
  const updateTeeth = (teeth) =>
    setData?.({ ...data, customers: data.customers.map((c) => c.id === sel ? { ...c, teeth } : c) });
  const removeCustomer = (c) => {
    if (!window.confirm(`Xoá khách hàng "${c.name}"? Hành động này không thể hoàn tác.`)) return;
    setData?.({ ...data, customers: data.customers.filter((x) => x.id !== c.id) });
    setSel(null);
  };

  const list = data.customers.filter((c) =>
    (c.name + c.phone + c.code).toLowerCase().includes(q.toLowerCase())
  );
  const selCust  = data.customers.find((c) => c.id === sel);
  const histAppts = data.appts.filter((a) => a.customerId === sel);
  const histCare  = data.care.filter((c) => c.customerId === sel);

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Danh sách */}
      <div className="lg:w-96 shrink-0">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên, SĐT, mã KH"
            className={inputCls + " pl-9"}
          />
        </div>
        <ul className="card divide-y divide-slate-50 max-h-[70vh] overflow-y-auto">
          {list.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSel(c.id)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition flex items-center gap-3 ${sel === c.id ? "bg-emerald-50/60" : ""}`}
              >
                <Avatar src={c.avatar} name={c.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-800 text-sm truncate">{c.name}</span>
                    <span className="text-[11px] text-emerald-600 font-mono shrink-0">{c.code}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Phone size={11} />{c.phone}
                  </div>
                </div>
              </button>
            </li>
          ))}
          {list.length === 0 && (
            <li className="p-6 text-center text-slate-400 text-sm">Không tìm thấy khách hàng.</li>
          )}
        </ul>
      </div>

      {/* Hồ sơ */}
      <div className="flex-1">
        {!selCust ? (
          <div className="card h-full min-h-[40vh] flex items-center justify-center text-center text-slate-400 text-sm p-8">
            Chọn một khách hàng để xem hồ sơ và lịch sử.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar src={selCust.avatar} name={selCust.name} size={64} rounded="2xl" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{selCust.name}</h3>
                    <p className="text-sm text-slate-500">{selCust.gender} · {ageFrom(selCust.dob)} · {selCust.group}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-600">{selCust.code}</span>
                  <button onClick={() => onEdit?.(selCust)} title="Sửa hồ sơ"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => removeCustomer(selCust)} title="Xoá khách hàng"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="mt-4 grid sm:grid-cols-2 gap-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><Phone size={14} className="text-slate-400" />{selCust.phone}</div>
                <div className="flex items-center gap-2 text-slate-600"><MapPin size={14} className="text-slate-400" />{selCust.address || "—"}</div>
                <div className="flex items-center gap-2 text-slate-600"><Cake size={14} className="text-slate-400" />{fmtDate(selCust.dob)}</div>
              </div>
              {selCust.note && (
                <p className="mt-3 text-sm bg-amber-50 text-amber-800 rounded-lg px-3 py-2">Ghi chú: {selCust.note}</p>
              )}
            </div>

            {(selCust.allergy || selCust.medicalHistory || selCust.guardianName || selCust.emergency) && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <HeartPulse size={15} className="text-rose-500" />
                  <span className="font-medium text-slate-700 text-sm">Thông tin y tế</span>
                </div>
                {selCust.allergy && (
                  <div className="mb-2 text-sm bg-rose-50 text-rose-700 rounded-lg px-3 py-2">
                    <b>⚠ Dị ứng:</b> {selCust.allergy}
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-y-1 gap-x-4 text-sm text-slate-600">
                  {selCust.medicalHistory && <div><span className="text-slate-400">Tiền sử:</span> {selCust.medicalHistory}</div>}
                  {selCust.guardianName && <div><span className="text-slate-400">Người giám hộ:</span> {selCust.guardianName} {selCust.guardianPhone && `· ${selCust.guardianPhone}`}</div>}
                  {selCust.emergency && <div><span className="text-slate-400">Liên hệ khẩn:</span> {selCust.emergency}</div>}
                </div>
              </div>
            )}

            {selCust.files?.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon size={15} className="text-sky-500" />
                  <span className="font-medium text-slate-700 text-sm">Ảnh X-quang / Tài liệu ({selCust.files.length})</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {selCust.files.map((doc, i) => (
                    <a key={i} href={doc.url} target="_blank" rel="noreferrer" title={doc.name}>
                      <img src={doc.url} alt={doc.name} className="w-full h-20 object-cover rounded-lg border border-slate-200 hover:ring-2 hover:ring-emerald-400 transition" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="card p-5">
              <div className="font-medium text-slate-700 text-sm mb-3">Sơ đồ răng</div>
              <Odontogram value={selCust.teeth} onChange={updateTeeth} />
            </div>

            <div className="card">
              <div className="px-5 py-3 border-b border-slate-100 font-medium text-slate-700 text-sm">Lịch sử lịch hẹn</div>
              {histAppts.length === 0 ? (
                <div className="p-5 text-sm text-slate-400">Chưa có lịch hẹn.</div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {histAppts.map((a) => (
                    <li key={a.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-800">{svc(a.serviceId)?.name}</div>
                        <div className="text-xs text-slate-500">{fmtDate(a.date)} · {a.time} · {a.doctor}</div>
                      </div>
                      <Badge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <div className="px-5 py-3 border-b border-slate-100 font-medium text-slate-700 text-sm">Ghi chú chăm sóc</div>
              {histCare.length === 0 ? (
                <div className="p-5 text-sm text-slate-400">Chưa có.</div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {histCare.map((c) => (
                    <li key={c.id} className="px-5 py-3">
                      <div className="text-sm text-slate-800">{c.type} — {c.content}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{c.status} · gọi lại {fmtDate(c.callback)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
