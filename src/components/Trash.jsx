import { useState, useEffect, useMemo } from "react";
import { Trash2, RotateCcw, Download, Search, Lock, ShieldCheck, RefreshCw } from "lucide-react";
import { apiFetch } from "../utils/api";
import { TRASH_TYPES, applyRestore } from "../utils/trash";
import { ADMIN_ROLE } from "../utils/perms";
import { todayStr } from "../utils/helpers";
import { inputCls } from "./ui/Field";

const TYPE_STYLE = {
  service: "bg-sky-50 text-sky-700 border-sky-200",
  customerService: "bg-teal-50 text-teal-700 border-teal-200",
  invoice: "bg-amber-50 text-amber-700 border-amber-200",
  customer: "bg-violet-50 text-violet-700 border-violet-200",
  treatment: "bg-emerald-50 text-emerald-700 border-emerald-200",
  record: "bg-slate-100 text-slate-700 border-slate-200",
};

const fmtTime = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// Dữ liệu đã xoá: chỉ Quản lý. Máy chủ cũng kiểm tra quyền (mọi lời gọi /api/trash của vai trò khác đều bị từ chối).
export default function Trash({ data, setData, user }) {
  const isAdmin = user?.role === ADMIN_ROLE;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null); // { kind: "ok" | "err", text }

  const load = async () => {
    setLoading(true); setLoadErr("");
    const r = await apiFetch("/trash");
    if (r?.ok) setItems(r.items || []);
    else setLoadErr(r?.error || "Không tải được danh sách. Hãy đăng nhập lại bằng tài khoản Quản lý.");
    setLoading(false);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items.filter((it) => {
      if (type !== "all" && it.type !== type) return false;
      if (!ql) return true;
      return `${it.label} ${it.summary} ${it.deletedBy?.fullName || ""} ${it.deletedBy?.username || ""}`.toLowerCase().includes(ql);
    });
  }, [items, q, type]);

  if (!isAdmin) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center text-center min-h-[40vh]">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 grid place-items-center mb-4"><Lock size={26} aria-hidden="true" /></div>
        <h2 className="text-lg font-semibold text-slate-800">Không có quyền truy cập</h2>
        <p className="text-sm text-slate-600 mt-1 max-w-sm">Chỉ vai trò <b>Quản lý</b> mới xem được dữ liệu đã xoá.</p>
      </div>
    );
  }

  const restore = async (it) => {
    if (!window.confirm(`Khôi phục "${it.label}" về hệ thống?`)) return;
    setBusy(it._id); setMsg(null);
    try {
      const r = await apiFetch("/trash/" + it._id);
      if (!r?.ok) { setMsg({ kind: "err", text: r?.error || "Không đọc được bản sao." }); return; }
      const res = applyRestore(data, r.item);
      if (res.error) { setMsg({ kind: "err", text: res.error }); return; }
      setData(res.data);                                    // app tự lưu lên máy chủ như mọi thay đổi khác
      const d = await apiFetch("/trash/" + it._id, { method: "DELETE" });
      setMsg({ kind: "ok", text: `Đã khôi phục "${it.label}".${res.note ? " " + res.note : ""}${d?.ok ? "" : " (Chưa gỡ được khỏi danh sách này, hãy xoá thủ công.)"}` });
      await load();
    } finally { setBusy(""); }
  };

  const purge = async (it) => {
    if (!window.confirm(`XOÁ VĨNH VIỄN "${it.label}"?\nSau bước này không còn bản sao nào và không thể khôi phục.`)) return;
    setBusy(it._id); setMsg(null);
    try {
      const r = await apiFetch("/trash/" + it._id, { method: "DELETE" });
      if (!r?.ok) { setMsg({ kind: "err", text: r?.error || "Không xoá được." }); return; }
      setMsg({ kind: "ok", text: `Đã xoá vĩnh viễn "${it.label}".` });
      await load();
    } finally { setBusy(""); }
  };

  // Tải toàn bộ (kèm dữ liệu gốc) thành 1 file JSON để lưu trữ ngoài hệ thống
  const exportBackup = async () => {
    setBusy("export"); setMsg(null);
    try {
      const r = await apiFetch("/trash?full=1");
      if (!r?.ok) { setMsg({ kind: "err", text: r?.error || "Không tải được bản backup." }); return; }
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), count: r.items.length, items: r.items }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `nhakhoa-du-lieu-da-xoa-${todayStr()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setMsg({ kind: "ok", text: `Đã tải bản backup (${r.items.length} mục). File chứa dữ liệu khách hàng, hãy cất giữ cẩn thận.` });
    } finally { setBusy(""); }
  };

  return (
    <div className="space-y-4 animate-fade">
      <div className="card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-700 shrink-0"><ShieldCheck size={22} aria-hidden="true" /></div>
          <div>
            <h2 className="font-bold text-slate-900 text-base font-heading">Dữ liệu đã xoá</h2>
            <p className="text-xs text-slate-600">
              Mọi thứ bị xoá (dịch vụ, hoá đơn / phiếu thu, khách hàng, điều trị…) được lưu bản sao tại đây. Chỉ Quản lý thấy, có thể khôi phục hoặc tải về làm backup.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-50">
            <RefreshCw size={14} aria-hidden="true" /> Tải lại
          </button>
          <button onClick={exportBackup} disabled={busy === "export" || !items.length} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
            <Download size={14} aria-hidden="true" /> Tải bản backup (.json)
          </button>
        </div>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tìm trong dữ liệu đã xoá" placeholder="Tìm tên, mã, người xoá..." className={inputCls + " pl-8 text-xs py-2"} />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Lọc theo loại dữ liệu" className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700">
          <option value="all">Tất cả loại ({items.length})</option>
          {Object.entries(TRASH_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {msg && (
        <div role={msg.kind === "err" ? "alert" : "status"}
          className={`px-4 py-3 rounded-xl border text-sm font-medium ${msg.kind === "err" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"}`}>
          {msg.text}
        </div>
      )}

      <div className="table-container">
        <table className="w-full min-w-[760px] text-left border-collapse text-xs">
          <caption className="sr-only">Danh sách dữ liệu đã xoá</caption>
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider">
              <th scope="col" className="p-3">Thời gian xoá</th>
              <th scope="col" className="p-3">Loại</th>
              <th scope="col" className="p-3">Nội dung</th>
              <th scope="col" className="p-3">Người xoá</th>
              <th scope="col" className="p-3 text-center w-56">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center text-slate-600">Đang tải…</td></tr>
            ) : loadErr ? (
              <tr><td colSpan={5} className="p-10 text-center text-rose-700" role="alert">{loadErr}</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-slate-600">{items.length ? "Không có mục nào khớp bộ lọc." : "Chưa có dữ liệu nào bị xoá."}</td></tr>
            ) : list.map((it) => (
              <tr key={it._id} className="table-row">
                <td className="p-3 text-slate-700 whitespace-nowrap">{fmtTime(it.deletedAt)}</td>
                <td className="p-3">
                  <span className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-bold ${TYPE_STYLE[it.type] || TYPE_STYLE.record}`}>{TRASH_TYPES[it.type] || it.type}</span>
                </td>
                <td className="p-3">
                  <div className="font-bold text-slate-900">{it.label || "—"}</div>
                  {it.summary && <div className="text-slate-600 mt-0.5">{it.summary}</div>}
                </td>
                <td className="p-3 text-slate-700">
                  <div className="font-semibold">{it.deletedBy?.fullName || it.deletedBy?.username || "—"}</div>
                  <div className="text-slate-600">{it.deletedBy?.role || ""}</div>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => restore(it)} disabled={busy === it._id} aria-label={`Khôi phục ${it.label}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100 transition disabled:opacity-50">
                      <RotateCcw size={14} aria-hidden="true" /> Khôi phục
                    </button>
                    <button onClick={() => purge(it)} disabled={busy === it._id} aria-label={`Xoá vĩnh viễn ${it.label}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-700 font-semibold hover:bg-rose-50 transition disabled:opacity-50">
                      <Trash2 size={14} aria-hidden="true" /> Xoá hẳn
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
