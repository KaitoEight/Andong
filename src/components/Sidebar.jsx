import { useState, useEffect } from "react";
import { ChevronDown, LogOut, Eye, ShieldAlert, Sparkles } from "lucide-react";
import { NAV } from "../utils/constants";
import { canAccess, ROLES, ADMIN_ROLE } from "../utils/perms";

function getInitialGroup(viewKey) {
  const group = NAV.find((g) => g.children.some((c) => c.key === viewKey));
  return group?.key ?? NAV[0].key;
}

export default function Sidebar({ view, setView, user, onLogout, perms, realRole, previewRole, onPreviewRole }) {
  const [openGroup, setOpenGroup] = useState(() => getInitialGroup(view));
  const groups = NAV.filter((g) => canAccess(user?.role, g.key, perms));

  // Mở đúng nhóm chứa view hiện tại khi đổi trang qua URL/Back/F5
  useEffect(() => { setOpenGroup(getInitialGroup(view)); }, [view]);

  const toggleGroup = (key) => setOpenGroup((prev) => (prev === key ? null : key));

  const handleChild = (childKey, groupKey) => {
    setOpenGroup(groupKey);
    setView(childKey);
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-white border-r border-slate-200/80 shadow-sm h-full select-none">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white grid place-items-center font-extrabold text-xl shadow-md shadow-emerald-500/20 font-heading">
            V
          </div>
          <div>
            <div className="font-bold text-slate-900 text-base leading-snug tracking-tight font-heading flex items-center gap-1.5">
              Nha Khoa Victoria
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Hệ Thống Quản Lý Nha Khoa</div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto scroll-soft py-4 px-3 space-y-1">
        {groups.map((group) => {
          const isOpen    = openGroup === group.key;
          const hasActive = group.children.some((c) => c.key === view);

          return (
            <div key={group.key} className="space-y-0.5">
              {/* Parent item */}
              <button
                onClick={() => toggleGroup(group.key)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  hasActive
                    ? "text-emerald-700 bg-emerald-50/80 font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className={`shrink-0 transition-colors ${hasActive ? "text-emerald-600" : "text-slate-400"}`}>
                  <group.icon size={19} />
                </div>
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown
                  size={15}
                  className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Children */}
              {isOpen && (
                <ul className="mt-1 ml-4 pl-3.5 border-l-2 border-slate-100 space-y-1 animate-fade">
                  {group.children.map((child) => {
                    const isActive = child.key === view;
                    return (
                      <li key={child.key}>
                        <button
                          onClick={() => handleChild(child.key, group.key)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-2.5 ${
                            isActive
                              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-sm shadow-emerald-600/20"
                              : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-900"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isActive ? "bg-white" : "bg-slate-300"}`} />
                          <span className="truncate">{child.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Xem thử vai trò (chỉ Quản lý) */}
      {realRole === ADMIN_ROLE && (
        <div className="px-3 py-2 mx-3 mb-2 rounded-xl bg-slate-50 border border-slate-200/60">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1 mb-1.5">
            <Eye size={12} className="text-amber-500" /> Xem thử vai trò
          </label>
          <select
            value={previewRole || ADMIN_ROLE}
            onChange={(e) => onPreviewRole?.(e.target.value)}
            className={`w-full text-xs font-medium rounded-lg border px-2.5 py-1.5 focus:outline-none transition ${
              previewRole ? "border-amber-400 bg-amber-50 text-amber-900 font-semibold" : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {ROLES.map((r) => <option key={r} value={r}>{r === ADMIN_ROLE ? "Quản lý (gốc)" : r}</option>)}
          </select>
          {previewRole && (
            <button onClick={() => onPreviewRole?.(ADMIN_ROLE)}
              className="mt-1.5 w-full text-[11px] text-amber-700 font-semibold hover:underline flex items-center justify-center gap-1">
              ← Thoát xem thử
            </button>
          )}
        </div>
      )}

      {/* User Info & Logout Card */}
      <div className="border-t border-slate-100 p-3 shrink-0 bg-slate-50/50">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200/60 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white grid place-items-center text-sm font-bold shrink-0 shadow-xs">
            {user?.fullName?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-800 truncate">{user?.fullName}</div>
            <div className="text-[11px] text-emerald-600 font-semibold truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {realRole || "Quản lý"}
            </div>
          </div>
          <button onClick={onLogout} title="Đăng xuất"
            className="w-8 h-8 rounded-lg grid place-items-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
