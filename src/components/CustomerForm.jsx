import { useState, useRef } from "react";
import { Info, CircleUserRound, Camera, X } from "lucide-react";
import { uid, todayStr } from "../utils/helpers";

// Đọc file ảnh, thu nhỏ về tối đa `max` px rồi trả về data URL (nhẹ để lưu DB)
function fileToDataUrl(file, max = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const fieldCls =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition";
const labelCls = "text-[13px] font-semibold text-slate-600 mb-1.5 block";

const GROUPS       = ["Mới", "Khách quen", "VIP"];
const SOURCES      = ["Khách Vãng Lai", "Giới thiệu", "Facebook", "Zalo", "Google", "Khác"];
const NATIONS      = ["Vietnam", "Khác"];
const PROVINCES    = ["Thành phố Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Bình Dương", "Đồng Nai", "Khác"];
const LANGUAGES    = ["Tiếng Việt", "English"];

function initFrom(ed) {
  return {
    name: ed?.name || "",
    gender: ed?.gender || "Nam",
    dob: ed?.dob || "",
    phone: ed?.phone || "",
    group: ed?.group || "",
    email: ed?.email || "",
    source: ed?.source || "Khách Vãng Lai",
    sourceDetail: ed?.sourceDetail || "",
    nationality: ed?.nationality || "Vietnam",
    occupation: ed?.occupation || "",
    address: ed?.address || "",
    province: ed?.province || "Thành phố Hồ Chí Minh",
    ward: ed?.ward || "",
    oldCode: ed?.oldCode || "",
    language: ed?.language || "Tiếng Việt",
    note: ed?.note || "",
    idCard: ed?.idCard || "",
    idDate: ed?.idDate || "",
    idPlace: ed?.idPlace || "",
    avatar: ed?.avatar || "",
    // Tab "Khác"
    medicalHistory: ed?.medicalHistory || "",
    allergy: ed?.allergy || "",
    guardianName: ed?.guardianName || "",
    guardianPhone: ed?.guardianPhone || "",
    emergency: ed?.emergency || "",
    files: ed?.files || [],   // ảnh X-quang / tài liệu: [{name, url}]
    makeAppt: false,
  };
}

export default function CustomerForm({ data, setData, onClose, editing, onCreateAppt }) {
  const ed = editing || null;
  const [tab, setTab] = useState("main");
  const [f, setF] = useState(() => initFrom(ed));
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const fileRef = useRef(null);

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Vui lòng chọn tệp ảnh."); return; }
    try {
      const url = await fileToDataUrl(file, 256);
      set("avatar", url);
    } catch {
      alert("Không đọc được ảnh. Thử ảnh khác nhé.");
    }
    e.target.value = ""; // cho phép chọn lại cùng 1 file
  };

  const docRef = useRef(null);
  const pickDocs = async (e) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    const added = [];
    for (const file of list) {
      if (!file.type.startsWith("image/")) continue;
      try { added.push({ name: file.name, url: await fileToDataUrl(file, 900) }); } catch { /* bỏ qua */ }
    }
    if (added.length) setF((p) => ({ ...p, files: [...p.files, ...added] }));
    e.target.value = "";
  };
  const removeDoc = (idx) => setF((p) => ({ ...p, files: p.files.filter((_, i) => i !== idx) }));

  const valid = f.name.trim() && f.phone.trim();

  const save = () => {
    if (!valid) return;
    const fields = {
      name: f.name.trim(), gender: f.gender, dob: f.dob, phone: f.phone.trim(),
      group: f.group || "Mới", email: f.email, source: f.source, sourceDetail: f.sourceDetail,
      nationality: f.nationality, occupation: f.occupation, address: f.address,
      province: f.province, ward: f.ward, oldCode: f.oldCode, language: f.language,
      note: f.note, idCard: f.idCard, idDate: f.idDate, idPlace: f.idPlace,
      avatar: f.avatar,
      medicalHistory: f.medicalHistory, allergy: f.allergy,
      guardianName: f.guardianName, guardianPhone: f.guardianPhone, emergency: f.emergency,
      files: f.files,
    };
    if (ed) {
      setData({ ...data, customers: data.customers.map((c) => c.id === ed.id ? { ...c, ...fields } : c) });
      onClose();
    } else {
      const n = data.customers.length + 1;
      const newCust = { id: uid("kh"), code: "NK" + String(n).padStart(6, "0"), ...fields };
      setData({ ...data, customers: [...data.customers, newCust] });
      onClose();
      if (f.makeAppt) onCreateAppt?.(newCust.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 animate-fade" onClick={onClose}>
      <div className="bg-slate-50 w-full max-w-5xl rounded-3xl shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200/60 max-h-[94vh] flex flex-col animate-pop"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3 bg-white rounded-t-3xl border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-1 h-9 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
            <div>
              <h2 className="font-bold text-slate-900 leading-tight">Hồ sơ khách hàng</h2>
              <p className="text-xs text-slate-400">{ed ? "Chỉnh sửa thông tin" : "Thông tin cá nhân"}</p>
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
        <div className="flex-1 overflow-y-auto scroll-soft p-6 space-y-5">
          {tab === "main" ? (
            <>
              {/* Card thông tin cá nhân */}
              <div className="bg-white rounded-2xl border border-slate-200/70 p-5">
                {/* Hàng điều khiển trên */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-5">
                    {["Nam", "Nữ"].map((g) => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer">
                        <span className={`w-4 h-4 rounded-full border-2 grid place-items-center transition ${f.gender === g ? "border-emerald-500" : "border-slate-300"}`}>
                          {f.gender === g && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                        </span>
                        <span className={`text-sm ${f.gender === g ? "text-slate-800 font-medium" : "text-slate-500"}`}>{g}</span>
                      </label>
                    ))}
                    {!ed && (
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                        <input type="checkbox" className="w-4 h-4 rounded accent-emerald-600" checked={f.makeAppt} onChange={(e) => set("makeAppt", e.target.checked)} />
                        Tạo lịch hẹn
                      </label>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Bắt buộc</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tùy chọn</span>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-5">
                  {/* Avatar */}
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
                    <button type="button" onClick={() => fileRef.current?.click()}
                      title="Bấm để chọn ảnh"
                      className="group relative w-32 h-32 rounded-2xl bg-slate-100 border border-slate-200 grid place-items-center text-slate-300 overflow-hidden hover:border-emerald-400 transition">
                      {f.avatar ? (
                        <img src={f.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <CircleUserRound size={56} strokeWidth={1.2} />
                      )}
                      <span className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition flex flex-col items-center justify-center gap-1 text-white opacity-0 group-hover:opacity-100">
                        <Camera size={22} />
                        <span className="text-[11px] font-medium">{f.avatar ? "Đổi ảnh" : "Chọn ảnh"}</span>
                      </span>
                    </button>
                    {f.avatar ? (
                      <button type="button" onClick={() => set("avatar", "")}
                        className="text-xs text-rose-500 font-medium flex items-center gap-1 hover:text-rose-600">
                        <X size={12} /> Xoá ảnh
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Info size={12} /> Hướng dẫn</span>
                    )}
                  </div>

                  {/* Fields */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Họ và tên <span className="text-rose-500">*</span></label>
                        <input className={fieldCls} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="eg .họ và tên" />
                      </div>
                      <div>
                        <label className={labelCls}>Ngày sinh</label>
                        <input type="date" className={fieldCls} value={f.dob} onChange={(e) => set("dob", e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>Số điện thoại <span className="text-rose-500">*</span></label>
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition">
                          <span className="text-base">🇻🇳</span>
                          <input className="flex-1 min-w-0 text-sm focus:outline-none bg-transparent" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="eg .số điện thoại" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Chi nhánh</label>
                        <select className={fieldCls} defaultValue="andong"><option value="andong">Nha Khoa Victoria</option></select>
                      </div>
                      <div>
                        <label className={labelCls}>Nhóm khách hàng</label>
                        <select className={fieldCls} value={f.group} onChange={(e) => set("group", e.target.value)}>
                          <option value="">nhóm khách hàng</option>
                          {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Email</label>
                        <input className={fieldCls} value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="eg .email" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className={labelCls}>Nguồn khách hàng</label>
                        <select className={fieldCls} value={f.source} onChange={(e) => set("source", e.target.value)}>
                          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Nguồn chi tiết</label>
                        <input className={fieldCls} value={f.sourceDetail} onChange={(e) => set("sourceDetail", e.target.value)} placeholder="nguồn chi tiết" />
                      </div>
                      <div>
                        <label className={labelCls}>Quốc tịch</label>
                        <select className={fieldCls} value={f.nationality} onChange={(e) => set("nationality", e.target.value)}>
                          {NATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Nghề nghiệp</label>
                        <input className={fieldCls} value={f.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="nghề nghiệp" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className={labelCls}>Địa chỉ</label>
                        <input className={fieldCls} value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="eg .địa chỉ" />
                      </div>
                      <div>
                        <label className={labelCls}>Tỉnh/Thành phố</label>
                        <select className={fieldCls} value={f.province} onChange={(e) => set("province", e.target.value)}>
                          {PROVINCES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Phường xã</label>
                        <input className={fieldCls} value={f.ward} onChange={(e) => set("ward", e.target.value)} placeholder="phường xã" />
                      </div>
                      <div>
                        <label className={labelCls}>Mã khách cũ</label>
                        <input className={fieldCls} value={f.oldCode} onChange={(e) => set("oldCode", e.target.value)} placeholder="mã khách hàng cũ" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Ngôn ngữ</label>
                        <select className={fieldCls} value={f.language} onChange={(e) => set("language", e.target.value)}>
                          {LANGUAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Ghi chú</label>
                      <textarea rows={2} className={fieldCls + " resize-none"} value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="eg .ghi chú" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card CMND/CC */}
              <div className="bg-white rounded-2xl border border-slate-200/70 p-5">
                <h3 className="font-semibold text-slate-800 text-sm">CMND/CC</h3>
                <p className="text-xs text-slate-400 mb-4">Thông tin CMND/CC</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>CMND/CC</label>
                    <input className={fieldCls} value={f.idCard} onChange={(e) => set("idCard", e.target.value)} placeholder="eg .cmnd/cc" />
                  </div>
                  <div>
                    <label className={labelCls}>Ngày cấp</label>
                    <input type="date" className={fieldCls} value={f.idDate} onChange={(e) => set("idDate", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Nơi cấp</label>
                    <input className={fieldCls} value={f.idPlace} onChange={(e) => set("idPlace", e.target.value)} placeholder="eg .nơi cấp" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Y tế */}
              <div className="bg-white rounded-2xl border border-slate-200/70 p-5">
                <h3 className="font-semibold text-slate-800 text-sm">Thông tin y tế</h3>
                <p className="text-xs text-slate-400 mb-4">Tiền sử bệnh, dị ứng, người liên hệ</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelCls}>Tiền sử bệnh</label>
                    <textarea rows={2} className={fieldCls + " resize-none"} value={f.medicalHistory} onChange={(e) => set("medicalHistory", e.target.value)} placeholder="VD: Tim mạch, tiểu đường, huyết áp..." />
                  </div>
                  <div>
                    <label className={labelCls}>Dị ứng</label>
                    <textarea rows={2} className={fieldCls + " resize-none"} value={f.allergy} onChange={(e) => set("allergy", e.target.value)} placeholder="VD: Kháng sinh, thuốc tê..." />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Người giám hộ</label>
                    <input className={fieldCls} value={f.guardianName} onChange={(e) => set("guardianName", e.target.value)} placeholder="Họ tên" />
                  </div>
                  <div>
                    <label className={labelCls}>SĐT người giám hộ</label>
                    <input className={fieldCls} value={f.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} placeholder="Số điện thoại" />
                  </div>
                  <div>
                    <label className={labelCls}>Liên hệ khẩn cấp</label>
                    <input className={fieldCls} value={f.emergency} onChange={(e) => set("emergency", e.target.value)} placeholder="Tên / SĐT" />
                  </div>
                </div>
              </div>

              {/* Đính kèm ảnh X-quang / tài liệu */}
              <div className="bg-white rounded-2xl border border-slate-200/70 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Ảnh X-quang / Tài liệu</h3>
                    <p className="text-xs text-slate-400">{f.files.length} tệp đính kèm</p>
                  </div>
                  <input ref={docRef} type="file" accept="image/*" multiple className="hidden" onChange={pickDocs} />
                  <button type="button" onClick={() => docRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                    <Camera size={15} /> Thêm ảnh
                  </button>
                </div>
                {f.files.length === 0 ? (
                  <div className="text-center text-sm text-slate-400 py-6 border border-dashed border-slate-200 rounded-xl">
                    Chưa có ảnh. Bấm "Thêm ảnh" để tải phim X-quang, ảnh trong miệng...
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {f.files.map((doc, i) => (
                      <div key={i} className="relative group">
                        <img src={doc.url} alt={doc.name} className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                        <button type="button" onClick={() => removeDoc(i)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white grid place-items-center shadow opacity-0 group-hover:opacity-100 transition">
                          <X size={13} />
                        </button>
                        <div className="text-[10px] text-slate-400 truncate mt-1">{doc.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2.5 px-6 py-4 border-t border-slate-100 bg-white rounded-b-3xl">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-emerald-600" />
            Thỏa thuận khách hàng ...
          </label>
          <div className="flex items-center gap-2.5">
            <button onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-400 text-white text-sm font-medium hover:bg-slate-500 transition">Đóng</button>
            <button onClick={save} disabled={!valid}
              className={`px-6 py-2 rounded-xl text-white text-sm font-semibold transition-all duration-200 ${
                valid ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5" : "bg-slate-300 cursor-not-allowed"
              }`}>{ed ? "Cập nhật" : "Lưu"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
