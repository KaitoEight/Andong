import { useState, useEffect } from "react";
import { ChevronDown, LogOut, Eye } from "lucide-react";
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
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-gradient-to-b from-white to-slate-50 border-r border-slate-200/70 h-screen sticky top-0 shadow-sm shadow-slate-200/40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-200/70">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center font-bold text-lg shrink-0 shadow-lg shadow-emerald-500/30">N</div>
        <div>
          <div className="font-bold text-slate-800 leading-tight text-sm">Nha Khoa Victoria</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">Quản lý phòng khám</div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto scroll-soft py-3 px-2.5">
        {groups.map((group) => {
          const isOpen   = openGroup === group.key;
          const hasActive = group.children.some((c) => c.key === view);

          return (
            <div key={group.key} className="mb-0.5">
              {/* Parent item */}
              <button
                onClick={() => toggleGroup(group.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  hasActive
                    ? "text-emerald-700 bg-white shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/10"
                    : "text-slate-600 hover:bg-white hover:text-slate-800 hover:shadow-sm"
                }`}
              >
                <div className={`shrink-0 grid place-items-center w-7 h-7 rounded-lg transition-colors ${
                  hasActive ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow shadow-emerald-500/30" : "text-slate-400"
                }`}>
                  <group.icon size={16} />
                </div>
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Children */}
              {isOpen && (
                <ul className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-0.5 animate-fade">
                  {group.children.map((child) => {
                    const isActive = child.key === view;
                    return (
                      <li key={child.key}>
                        <button
                          onClick={() => handleChild(child.key, group.key)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2.5 ${
                            isActive
                              ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-medium shadow-md shadow-emerald-500/25"
                              : "text-slate-500 hover:bg-white hover:text-slate-800"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isActive ? "bg-white" : "bg-slate-300"}`} />
                          {child.label}
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
        <div className="px-3 pt-2">
          <label className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold flex items-center gap-1 mb-1">
            <Eye size={11} /> Xem thử vai trò
          </label>
          <select
            value={previewRole || ADMIN_ROLE}
            onChange={(e) => onPreviewRole?.(e.target.value)}
            className={`w-full text-sm rounded-lg border px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
              previewRole ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {ROLES.map((r) => <option key={r} value={r}>{r === ADMIN_ROLE ? "Quản lý (của tôi)" : r}</option>)}
          </select>
          {previewRole && (
            <button onClick={() => onPreviewRole?.(ADMIN_ROLE)}
              className="mt-1 text-[11px] text-emerald-600 font-medium hover:underline">
              ← Thoát xem thử
            </button>
          )}
        </div>
      )}

      {/* User info + logout */}
      <div className="border-t border-slate-200/70 p-3 mt-2">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white transition">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center text-sm font-bold shrink-0 shadow-md shadow-emerald-500/25">
            {user?.fullName?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">{user?.fullName}</div>
            <div className="text-[11px] text-emerald-600 font-medium truncate">{realRole || "Quản lý"}</div>
          </div>
          <button onClick={onLogout} title="Đăng xuất"
            className="text-slate-400 hover:text-rose-500 transition shrink-0">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
