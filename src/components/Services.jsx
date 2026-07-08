import { useState, useMemo, useEffect } from "react";
import {
  Search, Plus, Download, Pencil, Ban, CheckCircle2, Layers, X,
} from "lucide-react";
import Modal from "./ui/Modal";
import Field, { inputCls, btnPrimary, btnGhost } from "./ui/Field";
import { uid, fmtVND } from "../utils/helpers";

const UNITS = ["Răng", "Từng Hàm", "Nguyên 2 Hàm", "Đơn Vị Khác", "Lần", "Cái", "Liệu trình"];
const GROUP_KEY = "denta:serviceGroups";

function loadCustomGroups() {
  try { return JSON.parse(localStorage.getItem(GROUP_KEY) || "[]"); } catch { return []; }
}
// Viết tắt nhóm: lấy chữ cái đầu của tối đa 2 từ
function abbr(name) {
  const w = (name || "").trim().split(/\s+/);
  return ((w[0]?.[0] || "") + (w[1]?.[0] || "")).toUpperCase() || "?";
}
function codeOf(s, idx) {
  return s.code || "SV" + String(idx + 1).padStart(6, "0");
}

export default function Services({ data, setData, openAdd, registerAdd }) {
  const services = data.services || [];

  const [customGroups, setCustomGroups] = useState(loadCustomGroups);
  const [group, setGroup]   = useState(null);   // null = tất cả
  const [q, setQ]           = useState("");
  const [status, setStatus] = useState("1");    // 1 đang dùng · 2 vô hiệu · 0 tất cả
  const [showSer, setShowSer]   = useState(true);
  const [showProd, setShowProd] = useState(true);

  const [modal, setModal]   = useState(null);   // {editing} | null
  const [groupModal, setGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState("");

  useEffect(() => { localStorage.setItem(GROUP_KEY, JSON.stringify(customGroups)); }, [customGroups]);

  registerAdd(() => openModal(null));

  // Danh sách nhóm + số lượng
  const groups = useMemo(() => {
    const map = {};
    services.forEach((s) => { const g = s.group || "Khác"; map[g] = (map[g] || 0) + 1; });
    customGroups.forEach((g) => { if (!(g in map)) map[g] = 0; });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [services, customGroups]);

  const allGroupNames = groups.map((g) => g.name);

  const typeOf = (s) => s.type || "Dịch vụ";
  const isActive = (s) => s.active !== false;

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
        return true;
      });
  }, [services, group, q, status, showSer, showProd]);

  // ── Thao tác ──────────────────────────────────────────────────────────────
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
    a.download = "dich-vu.csv";
    a.click();
  };

  const totalCount = services.length;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* ── Cột trái: nhóm dịch vụ ─────────────────────────────────────────── */}
      <div className="lg:w-72 shrink-0">
        <div className="card p-3">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Nhóm dịch vụ</h3>
              <p className="text-xs text-slate-400">Tất cả nhóm dịch vụ</p>
            </div>
            <button onClick={() => setGroupModal(true)} className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition flex items-center gap-1">
              <Plus size={13} /> Nhóm
            </button>
          </div>

          <div className="flex items-center gap-4 px-1 mb-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" className="w-3.5 h-3.5 rounded accent-emerald-600" checked={showSer} onChange={(e) => setShowSer(e.target.checked)} /> Dịch vụ
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" className="w-3.5 h-3.5 rounded accent-emerald-600" checked={showProd} onChange={(e) => setShowProd(e.target.checked)} /> Sản phẩm
            </label>
          </div>

          <ul className="space-y-0.5 max-h-[64vh] overflow-y-auto scroll-soft">
            {/* Tất cả */}
            <li>
              <button onClick={() => setGroup(null)}
                className={`w-full text-left px-2.5 py-2 rounded-lg transition flex items-center gap-2 ${group === null ? "bg-emerald-50 ring-1 ring-emerald-200" : "hover:bg-slate-50"}`}>
                <Layers size={15} className="text-emerald-600 shrink-0" />
                <span className="font-bold text-emerald-600">{totalCount}</span>
                <span className="text-sm text-slate-700">Dịch vụ / Sản phẩm</span>
              </button>
            </li>
            <li><hr className="my-1 border-slate-100" /></li>
            {groups.map((g) => (
              <li key={g.name}>
                <button onClick={() => setGroup(g.name)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg transition flex items-center gap-2.5 ${group === g.name ? "bg-emerald-50 ring-1 ring-emerald-200" : "hover:bg-slate-50"}`}>
                  <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 grid place-items-center text-xs font-bold shrink-0">{abbr(g.name)}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-slate-700 truncate">{g.name}</span>
                    <span className="text-xs text-slate-400"><b className="text-emerald-600">{g.count}</b> dịch vụ</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Cột phải: bảng dịch vụ ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="card">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Dịch vụ {group && <span className="text-slate-400 font-normal">· {group}</span>}</h3>
              <p className="text-xs text-slate-400">{list.length} mục</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportCSV} className="text-sm px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition flex items-center gap-1.5">
                <Download size={15} /> Xuất file
              </button>
              <button onClick={() => openModal(null)} className={btnPrimary}>
                <Plus size={15} /> Thêm mới
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nhập dữ liệu để tìm kiếm" className={inputCls + " pl-8"} />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls + " w-auto"}>
              <option value="1">Đang sử dụng</option>
              <option value="2">Vô hiệu hóa</option>
              <option value="0">Tất cả trạng thái</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                  <th className="px-4 py-2.5 text-center w-12">#</th>
                  <th className="px-4 py-2.5 text-left">Dịch vụ</th>
                  <th className="px-4 py-2.5 text-right">Đơn giá</th>
                  <th className="px-4 py-2.5 text-left">Đơn vị</th>
                  <th className="px-4 py-2.5 text-center">Tồn kho</th>
                  <th className="px-4 py-2.5 text-center">Tình trạng</th>
                  <th className="px-4 py-2.5 text-center w-20">Xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Không có dịch vụ phù hợp.</td></tr>
                ) : list.map((s, idx) => {
                  const active = isActive(s);
                  return (
                    <tr key={s.id} className={`hover:bg-slate-50 transition ${active ? "" : "opacity-60"}`}>
                      <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-[11px] text-emerald-700/80">{s._code}{s.idenCode ? ` · ${s.idenCode}` : ""}</div>
                        <div className="font-medium text-slate-800">{s.name}</div>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className="text-xs text-slate-400">{s.group}</span>
                          {typeOf(s) === "Sản phẩm" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 border border-sky-200">SP</span>}
                          {s.vat > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">VAT {s.vat}%</span>}
                          {s.installment && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-200">Trả góp</span>}
                          {s.warranty > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">BH {s.warranty}th</span>}
                          {(s.comDoctor > 0 || s.comTech > 0 || s.comConsult > 0) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600" title="Hoa hồng BS/KTV/TV">
                              HH {s.comDoctor || 0}/{s.comTech || 0}/{s.comConsult || 0}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{s.price ? fmtVND(s.price) : "Miễn phí"}</td>
                      <td className="px-4 py-3 text-slate-600">{s.unit || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {typeOf(s) === "Sản phẩm"
                          ? <span className={`font-semibold ${s.stock <= s.minStock ? "text-rose-600" : "text-slate-700"}`}>{s.stock ?? 0}{s.stock <= s.minStock ? " ⚠" : ""}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {active
                          ? <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Hoạt động</span>
                          : <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Vô hiệu</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openModal(s)} title="Sửa" className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"><Pencil size={14} /></button>
                          <button onClick={() => toggleActive(s)} title={active ? "Vô hiệu hóa" : "Kích hoạt"}
                            className={`p-1.5 rounded-lg transition ${active ? "text-slate-400 hover:text-rose-500 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50"}`}>
                            {active ? <Ban size={14} /> : <CheckCircle2 size={14} />}
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
      </div>

      {/* Modal thêm/sửa dịch vụ */}
      {modal && (
        <Modal
          title={modal.editing ? "Sửa dịch vụ" : "Thêm dịch vụ"}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className={btnGhost} onClick={() => setModal(null)}>Hủy</button>
              <button className={btnPrimary + (modal.f.name.trim() ? "" : " opacity-50 pointer-events-none")} onClick={saveService}>Lưu</button>
            </>
          }
        >
          <Field label="Tên dịch vụ">
            <input className={inputCls} value={modal.f.name} onChange={(e) => setModal({ ...modal, f: { ...modal.f, name: e.target.value } })} placeholder="Nhập tên dịch vụ..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nhóm">
              <select className={inputCls} value={modal.f.group} onChange={(e) => setModal({ ...modal, f: { ...modal.f, group: e.target.value } })}>
                {allGroupNames.length === 0 && <option value="">Khác</option>}
                {allGroupNames.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Loại">
              <select className={inputCls} value={modal.f.type} onChange={(e) => setModal({ ...modal, f: { ...modal.f, type: e.target.value } })}>
                <option>Dịch vụ</option><option>Sản phẩm</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Đơn giá (₫)">
              <input type="number" className={inputCls} value={modal.f.price} onChange={(e) => setModal({ ...modal, f: { ...modal.f, price: e.target.value } })} />
            </Field>
            <Field label="Đơn vị">
              <select className={inputCls} value={modal.f.unit} onChange={(e) => setModal({ ...modal, f: { ...modal.f, unit: e.target.value } })}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Thời lượng (phút)">
              <input type="number" className={inputCls} value={modal.f.mins} onChange={(e) => setField("mins", e.target.value)} />
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

      {/* Modal thêm nhóm */}
      {groupModal && (
        <Modal
          title="Thêm nhóm dịch vụ"
          onClose={() => setGroupModal(false)}
          footer={
            <>
              <button className={btnGhost} onClick={() => setGroupModal(false)}>Hủy</button>
              <button className={btnPrimary + (newGroup.trim() ? "" : " opacity-50 pointer-events-none")} onClick={addGroup}>Lưu</button>
            </>
          }
        >
          <Field label="Tên nhóm">
            <input className={inputCls} value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="VD: Chỉnh nha, Phục hình..." autoFocus />
          </Field>
        </Modal>
      )}
    </div>
  );
}
