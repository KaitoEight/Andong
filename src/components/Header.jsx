import { Plus, Menu, Eye, X } from "lucide-react";
import { NAV, findNavChild } from "../utils/constants";
import { canAccess } from "../utils/perms";
import { btnPrimary } from "./ui/Field";

export default function Header({ view, setView, onAdd, user, perms, previewRole, onExitPreview }) {
  const found   = findNavChild(view);
  const group   = found?.group;
  const child   = found?.child;
  const addable = child?.addable ?? false;
  const groups  = NAV.filter((g) => canAccess(user?.role, g.key, perms));

  return (
    <>
      {previewRole && (
        <div className="bg-amber-500 text-white text-sm px-5 py-2 flex items-center justify-center gap-3">
          <Eye size={15} />
          <span>Đang <b>xem thử</b> với vai trò <b>{previewRole}</b> — menu và quyền hiển thị theo vai trò này.</span>
          <button onClick={onExitPreview} className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 transition font-medium">
            <X size={13} /> Thoát
          </button>
        </div>
      )}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/70 px-5 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-1 h-9 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
          <div>
            <div className="text-xs text-slate-400 font-medium">{group?.label}</div>
            <h1 className="font-bold text-slate-900 leading-tight text-[15px]">{child?.label ?? view}</h1>
          </div>
        </div>
        {addable && (
          <button className={btnPrimary} onClick={onAdd}>
            <Plus size={16} />Thêm
          </button>
        )}
      </header>

      {/* Mobile nav */}
      <div className="md:hidden flex gap-1 overflow-x-auto scroll-soft px-3 py-2 bg-white/80 backdrop-blur border-b border-slate-200/70">
        {groups.map((g) =>
          g.children.map((c) => (
            <button key={c.key} onClick={() => setView(c.key)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                view === c.key ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/25" : "text-slate-500 hover:bg-slate-100"
              }`}>
              {c.label}
            </button>
          ))
        )}
      </div>
    </>
  );
}
