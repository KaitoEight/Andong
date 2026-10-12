import { useState, useMemo, useEffect } from "react";
import {
  Search, Plus, Download, Pencil, Trash2, Ban, CheckCircle2, Layers, X, FolderPlus
} from "lucide-react";
import Modal from "./ui/Modal";
import Field, { inputCls, btnPrimary, btnGhost } from "./ui/Field";
import { uid, fmtVND } from "../utils/helpers";
import { confirmAndArchive } from "../utils/trash";

const UNITS = ["Răng", "Từng Hàm", "Nguyên 2 Hàm", "Đơn Vị Khác", "Lần", "Cái", "Liệu trình"];
const GROUP_KEY = "denta:serviceGroups";

function loadCustomGroups() {
  try { return JSON.parse(localStorage.getItem(GROUP_KEY) || "[]"); } catch { return []; }
}

function abbr(name) {
  const w = (name || "").trim().split(/\s+/);
  return ((w[0]?.[0] || "") + (w[1]?.[0] || "")).toUpperCase() || "?";
}

function codeOf(s, idx) {
  return s.code || "SV" + String(idx + 1).padStart(6, "0");
}

// Ô nhập số tiền: chỉ nhận chữ số, hiển thị có dấu chấm ngăn cách hàng nghìn (35.000.000). `value` là chuỗi chữ số.
function MoneyInput({ value, onChange, label, placeholder }) {
  return (
    <input inputMode="numeric" aria-label={label} placeholder={placeholder} autoComplete="off"
      value={value === "" ? "" : Number(value).toLocaleString("vi-VN")}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 12))}
      className={inputCls + " text-xs py-2 w-32 text-right"} />
  );
}

export default function Services({ data, setData, openAdd, registerAdd }) {
  const services = data.services || [];

  const [customGroups, setCustomGroups] = useState(loadCustomGroups);
  const [group, setGroup]   = useState(null);
  const [q, setQ]           = useState("");
  const [status, setStatus] = useState("1");
  const [showSer, setShowSer]   = useState(true);
  const [showProd, setShowProd] = useState(true);
  const [minPrice, setMinPrice] = useState("");   // lọc đơn giá từ … đến … (chuỗi chữ số, "" = không giới hạn)
  const [maxPrice, setMaxPrice] = useState("");

  const [modal, setModal]   = useState(null);
  const [groupModal, setGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState("");

  useEffect(() => { localStorage.setItem(GROUP_KEY, JSON.stringify(customGroups)); }, [customGroups]);

  registerAdd(() => openModal(null));

  const groups = useMemo(() => {
    const map = {};
    services.forEach((s) => { const g = s.group || "Khác"; map[g] = (map[g] || 0) + 1; });
    customGroups.forEach((g) => { if (!(g in map)) map[g] = 0; });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [services, customGroups]);

  const allGroupNames = groups.map((g) => g.name);

  const typeOf = (s) => s.type || "Dịch vụ";
  const isActive = (s) => s.active !== false;

  // Khoảng giá: nhập ngược (từ > đến) thì tự đảo lại cho đúng
  const { lo, hi, swapped } = useMemo(() => {
    const a = minPrice === "" ? null : Number(minPrice);
    const b = maxPrice === "" ? null : Number(maxPrice);
    const sw = a !== null && b !== null && a > b;
    return { lo: sw ? b : a, hi: sw ? a : b, swapped: sw };
  }, [minPrice, maxPrice]);
  const priceFiltered = lo !== null || hi !== null;

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return services
      .map((s, idx) => ({ ...s, _code: codeOf(s, idx) }))
      .filter((s) => {
        if (group && (s.group || "Khác") !== group) return false;
        if (typeOf(s) === "Dịch vụ" && !showSer) return false;
        if (typeOf(s) === "Sản phẩm" && !showProd) return false;
        if (status === "1" && !isActive(s)) return false;
        if (status === "2" && isActive(s)) return false;
        if (ql && !(s.name + s._code + (s.group || "")).toLowerCase().includes(ql)) return false;
        if (priceFiltered) {   // dịch vụ chưa có giá ("Tư vấn báo giá") không thuộc khoảng giá nào
          const p = s.price || 0;
          if (p <= 0 || (lo !== null && p < lo) || (hi !== null && p > hi)) return false;
        }
        return true;
      });
  }, [services, group, q, status, showSer, showProd, priceFiltered, lo, hi]);

  const openModal = (editing) => {
    const b = editing || {};
    setModal({
      editing,
      f: {
        name: b.name || "", group: b.group || group || allGroupNames[0] || "",
        type: b.type || "Dịch vụ", price: String(b.price ?? ""), unit: b.unit || "Răng",
        mins: String(b.mins ?? 30),
        comDoctor: String(b.comDoctor ?? ""), comTech: String(b.comTech ?? ""), comConsult: String(b.comConsult ?? ""),
        vat: String(b.vat ?? ""), installment: !!b.installment, treatCount: String(b.treatCount ?? "1"),
        warranty: String(b.warranty ?? ""), idenCode: b.idenCode || "", idenName: b.idenName || "",
        stock: String(b.stock ?? ""), minStock: String(b.minStock ?? ""),
      },
    });
  };
  const setField = (k, v) => setModal((m) => ({ ...m, f: { ...m.f, [k]: v } }));

  const saveService = () => {
    const { editing, f } = modal;
    if (!f.name.trim()) return;
    const payload = {
      name: f.name.trim(), group: f.group || "Khác", type: f.type,
      price: Number(f.price) || 0, unit: f.unit, mins: Number(f.mins) || 0,
      comDoctor: Number(f.comDoctor) || 0, comTech: Number(f.comTech) || 0, comConsult: Number(f.comConsult) || 0,
      vat: Number(f.vat) || 0, installment: !!f.installment, treatCount: Number(f.treatCount) || 0,
      warranty: Number(f.warranty) || 0, idenCode: f.idenCode.trim(), idenName: f.idenName.trim(),
      stock: Number(f.stock) || 0, minStock: Number(f.minStock) || 0,
    };
    if (editing) {
      setData({ ...data, services: services.map((s) => s.id === editing.id ? { ...s, ...payload } : s) });
    } else {
      const code = "SV" + String(services.length + 1).padStart(6, "0");
      setData({ ...data, services: [...services, { id: uid("sv"), code, active: true, ...payload }] });
    }
    setModal(null);
  };

  // Xoá dịch vụ khỏi bảng giá. Lịch sử (dịch vụ đã chốt của khách, lịch hẹn mới) vẫn giữ tên/giá đã ghi.
  const removeService = async (s) => {
    const apptUse = (data.appts || []).filter((a) => a.serviceId === s.id || (a.serviceIds || []).includes(s.id)).length;
    const custUse = (data.customers || []).reduce((n, c) => n + (c.services || []).filter((r) => r.serviceId === s.id).length, 0);
    const used = [apptUse && `${apptUse} lịch hẹn`, custUse && `${custUse} dịch vụ đã chốt của khách`].filter(Boolean).join(", ");
    const msg = `Xoá dịch vụ "${s.name}" khỏi bảng giá?`
      + (used ? `\nĐang được dùng trong ${used}. Lịch sử vẫn giữ tên và giá đã ghi.\nNếu chỉ muốn ngừng bán, hãy bấm nút "Đang dùng" để vô hiệu hoá thay vì xoá.` : "")
      + "\nDịch vụ sẽ biến mất khỏi bảng giá.";
    const saved = await confirmAndArchive(msg, {
      type: "service", label: s.name,
      summary: `${s.group || "Khác"} · ${fmtVND(s.price || 0)}`,
      payload: { service: s },
    });
    if (!saved) return;
    setData({ ...data, services: services.filter((x) => x.id !== s.id) });
  };

  const toggleActive = (s) =>
    setData({ ...data, services: services.map((x) => x.id === s.id ? { ...x, active: !isActive(x) } : x) });

  const addGroup = () => {
    const name = newGroup.trim();
    if (name && !allGroupNames.includes(name)) setCustomGroups([...customGroups, name]);
    setNewGroup(""); setGroupModal(false);
  };

  const exportCSV = () => {
    const header = ["Mã", "Dịch vụ", "Nhóm", "Loại", "Đơn giá", "Đơn vị", "Tình trạng"];
    const rows = list.map((s) => [s._code, s.name, s.group || "", typeOf(s), s.price || 0, s.unit || "", isActive(s) ? "Hoạt động" : "Vô hiệu"]);
    const csv = "﻿" + [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "dich-vu-nha-khoa.csv";
    a.click();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 animate-fade">
      {/* Sidebar Nhóm Dịch Vụ */}
      <div className="lg:w-72 shrink-0">
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm font-heading">Nhóm Dịch Vụ</h2>
            <button onClick={() => setGroupModal(true)} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition flex items-center gap-1 border border-emerald-200/60">
              <Plus size={13} /> Thêm Nhóm
            </button>
          </div>

          <div className="flex items-center gap-4 px-1 py-1 text-xs font-medium text-slate-600 border-y border-slate-100">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" className="w-3.5 h-3.5 rounded accent-emerald-600" checked={showSer} onChange={(e) => setShowSer(e.target.checked)} /> Dịch vụ
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" className="w-3.5 h-3.5 rounded accent-emerald-600" checked={showProd} onChange={(e) => setShowProd(e.target.checked)} /> Sản phẩm
            </label>
          </div>

          <ul className="space-y-1 max-h-[65vh] overflow-y-auto scroll-soft">
            <li>
              <button onClick={() => setGroup(null)}
                className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center gap-2.5 text-xs font-semibold ${group === null ? "bg-emerald-700 text-white shadow-xs" : "hover:bg-slate-100 text-slate-700"}`}>
                <Layers size={16} />
                <span className="flex-1">Tất cả danh mục</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-current font-extrabold">{services.length}</span>
              </button>
            </li>
            {groups.map((g) => (
              <li key={g.name}>
                <button onClick={() => setGroup(g.name)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center gap-2.5 text-xs ${group === g.name ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80" : "hover:bg-slate-50 text-slate-700"}`}>
                  <span className="w-7 h-7 rounded-lg bg-slate-100 font-bold text-slate-600 grid place-items-center text-[10px] shrink-0">{abbr(g.name)}</span>
                  <span className="flex-1 truncate">{g.name}</span>
                  <span className="text-[11px] font-bold text-emerald-700">{g.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Services Table */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="card p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base font-heading">
                {group ? `Danh mục: ${group}` : "Tất Cả Dịch Vụ & Sản Phẩm"}
              </h2>
              <p className="text-xs text-slate-500">Quản lý danh sách dịch vụ nha khoa và bảng giá niêm yết</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportCSV} className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5">
                <Download size={14} /> Xuất CSV
              </button>
              <button onClick={() => openModal(null)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:from-emerald-800 hover:to-teal-800 transition">
                <Plus size={15} /> Thêm Dịch Vụ
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên dịch vụ, mã..." className={inputCls + " pl-8 text-xs py-2"} />
            </div>
            <select aria-label="Lọc theo trạng thái dịch vụ" value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none">
              <option value="1">Đang kinh doanh</option>
              <option value="2">Vô hiệu hóa</option>
              <option value="0">Tất cả</option>
            </select>
            <div role="group" aria-label="Lọc theo khoảng đơn giá" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 whitespace-nowrap">
              <span>Đơn giá</span>
              <MoneyInput value={minPrice} onChange={setMinPrice} label="Đơn giá từ (₫)" placeholder="Nhỏ nhất" />
              <span aria-hidden="true">–</span>
              <MoneyInput value={maxPrice} onChange={setMaxPrice} label="Đơn giá đến (₫)" placeholder="Lớn nhất" />
              <span>₫</span>
              {priceFiltered && (
                <button type="button" onClick={() => { setMinPrice(""); setMaxPrice(""); }} aria-label="Xoá lọc đơn giá" title="Xoá lọc đơn giá"
                  className="w-7 h-7 grid place-items-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="text-xs text-slate-500" aria-live="polite">
            Hiển thị <b className="text-slate-700">{list.length}</b> / {services.length} dịch vụ
            {priceFiltered && <> · đơn giá {lo !== null ? <>từ <b className="text-slate-700">{fmtVND(lo)}</b></> : null}{lo !== null && hi !== null ? " " : null}{hi !== null ? <>đến <b className="text-slate-700">{fmtVND(hi)}</b></> : null}</>}
            {swapped && <span className="text-amber-600 font-semibold"> · đã tự đảo thứ tự “từ – đến”</span>}
          </div>
        </div>

        <div className="table-container">
          <table className="w-full min-w-[650px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80">
                <th className="p-3 text-center w-12 font-bold text-slate-500">STT</th>
                <th className="p-3 font-bold text-slate-500">Tên Dịch Vụ / Phân Loại</th>
                <th className="p-3 text-right font-bold text-slate-500">Đơn Giá</th>
                <th className="p-3 font-bold text-slate-500">Đơn Vị</th>
                <th className="p-3 text-center font-bold text-slate-500">Trạng Thái</th>
                <th className="p-3 text-center w-24 font-bold text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500">Không tìm thấy dịch vụ nào.</td></tr>
              ) : list.map((s, idx) => {
                const active = isActive(s);
                return (
                  <tr key={s.id} className={`table-row ${active ? "" : "opacity-50"}`}>
                    <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-mono text-[10px] text-emerald-700 font-semibold">{s._code}</div>
                      <div className="font-bold text-slate-900 text-xs">{s.name}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold">{s.group}</span>
                        {s.warranty > 0 && <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200/60">BH {s.warranty} Tháng</span>}
                      </div>
                    </td>
                    <td className="p-3 text-right font-extrabold text-slate-900 text-xs">
                      {s.price ? fmtVND(s.price) : "Tư vấn báo giá"}
                    </td>
                    <td className="p-3 font-medium text-slate-600">{s.unit || "Răng"}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => toggleActive(s)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition ${active ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-slate-100 text-slate-500 border-slate-300"}`}>
                        {active ? "Đang dùng" : "Vô hiệu"}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openModal(s)} title="Sửa dịch vụ" aria-label={`Sửa dịch vụ ${s.name}`}
                          className="w-8 h-8 rounded-lg text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 transition grid place-items-center">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => removeService(s)} title="Xoá dịch vụ" aria-label={`Xoá dịch vụ ${s.name}`}
                          className="w-8 h-8 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition grid place-items-center">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal thêm/sửa dịch vụ */}
      {modal && (
        <Modal
          title={modal.editing ? "Sửa dịch vụ" : "Thêm dịch vụ"}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className={btnGhost} onClick={() => setModal(null)}>Hủy</button>
              <button disabled={!(modal.f.name.trim())} className={btnPrimary + (modal.f.name.trim() ? "" : " opacity-50 cursor-not-allowed")} onClick={saveService}>Lưu</button>
            </>
          }
        >
          <Field label="Tên dịch vụ">
            <input className={inputCls} value={modal.f.name} onChange={(e) => setField("name", e.target.value)} placeholder="Nhập tên dịch vụ..." autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nhóm">
              <select className={inputCls} value={modal.f.group} onChange={(e) => setField("group", e.target.value)}>
                {allGroupNames.length === 0 && <option value="">Khác</option>}
                {allGroupNames.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Loại">
              <select className={inputCls} value={modal.f.type} onChange={(e) => setField("type", e.target.value)}>
                <option>Dịch vụ</option><option>Sản phẩm</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Đơn giá (₫)">
              <input type="number" min={0} className={inputCls} value={modal.f.price} onChange={(e) => setField("price", e.target.value)} />
            </Field>
            <Field label="Đơn vị">
              <select className={inputCls} value={modal.f.unit} onChange={(e) => setField("unit", e.target.value)}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Thời lượng (phút)">
              <input type="number" min={0} className={inputCls} value={modal.f.mins} onChange={(e) => setField("mins", e.target.value)} />
            </Field>
          </div>

          {/* Định danh & bảo hành */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Mã định danh">
              <input className={inputCls} value={modal.f.idenCode} onChange={(e) => setField("idenCode", e.target.value)} placeholder="VD: I01" />
            </Field>
            <Field label="Tên định danh">
              <input className={inputCls} value={modal.f.idenName} onChange={(e) => setField("idenName", e.target.value)} />
            </Field>
            <Field label="Lần điều trị">
              <input type="number" min={0} className={inputCls} value={modal.f.treatCount} onChange={(e) => setField("treatCount", e.target.value)} />
            </Field>
            <Field label="Bảo hành (tháng)">
              <input type="number" min={0} className={inputCls} value={modal.f.warranty} onChange={(e) => setField("warranty", e.target.value)} />
            </Field>
          </div>

          {/* Hoa hồng & VAT */}
          <div className="rounded-xl bg-slate-50 p-3 mb-3">
            <div className="text-xs font-semibold text-slate-500 mb-2">Hoa hồng (%) & VAT & Trả góp</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="HH Bác sĩ">
                <input type="number" min={0} className={inputCls} value={modal.f.comDoctor} onChange={(e) => setField("comDoctor", e.target.value)} placeholder="%" />
              </Field>
              <Field label="HH KTV/phụ tá">
                <input type="number" min={0} className={inputCls} value={modal.f.comTech} onChange={(e) => setField("comTech", e.target.value)} placeholder="%" />
              </Field>
              <Field label="HH Tư vấn">
                <input type="number" min={0} className={inputCls} value={modal.f.comConsult} onChange={(e) => setField("comConsult", e.target.value)} placeholder="%" />
              </Field>
              <Field label="VAT (%)">
                <input type="number" min={0} className={inputCls} value={modal.f.vat} onChange={(e) => setField("vat", e.target.value)} placeholder="%" />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer mt-1">
              <input type="checkbox" className="w-4 h-4 rounded accent-emerald-600" checked={modal.f.installment} onChange={(e) => setField("installment", e.target.checked)} />
              Cho phép trả góp
            </label>
          </div>

          {/* Tồn kho — chỉ hiện khi là Sản phẩm */}
          {modal.f.type === "Sản phẩm" && (
            <div className="rounded-xl bg-amber-50 p-3 border border-amber-100">
              <div className="text-xs font-semibold text-amber-700 mb-2">Tồn kho sản phẩm</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tồn kho">
                  <input type="number" min={0} className={inputCls} value={modal.f.stock} onChange={(e) => setField("stock", e.target.value)} />
                </Field>
                <Field label="Tồn tối thiểu">
                  <input type="number" min={0} className={inputCls} value={modal.f.minStock} onChange={(e) => setField("minStock", e.target.value)} />
                </Field>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Group Modal */}
      {groupModal && (
        <Modal title="Thêm Nhóm Dịch Vụ Mới" onClose={() => setGroupModal(false)}>
          <div className="space-y-4">
            <Field label="Tên nhóm mới">
              <input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="Nhập tên nhóm (ví dụ: Chỉnh Nha, Implant...)" className={inputCls} autoFocus />
            </Field>
            <button onClick={addGroup} className={btnPrimary + " w-full justify-center"}>
              <FolderPlus size={16} /> Lưu Nhóm Mới
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
