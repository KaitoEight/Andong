import { useState } from "react";
import { Plus, Search, MapPin, Bell, LogOut, ChevronDown, Eye, X, Menu, ClipboardList, Sparkles, Building2, Globe } from "lucide-react";
import { NAV, findNavChild } from "../utils/constants";
import { canAccess } from "../utils/perms";

export default function Header({ view, setView, onAdd, user, perms, previewRole, onExitPreview, onLogout, onToggleMobile, onOpenPublicWebsite }) {
  const [userOpen, setUserOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const found   = findNavChild(view);
  const group   = found?.group;
  const child   = found?.child;
  const addable = child?.addable ?? false;
  const groups  = NAV.filter((g) => canAccess(user, g.key, perms));

  return (
    <>
      {previewRole && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-5 py-2 flex items-center justify-center gap-3 shadow-sm animate-fade">
          <Eye size={16} />
          <span>Đang <b>xem thử giao diện</b> với vai trò <b>{previewRole}</b> — Menu và quyền được hiển thị theo vai trò này.</span>
          <button onClick={onExitPreview} className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition font-semibold">
            <X size={13} /> Thoát xem thử
          </button>
        </div>
      )}

      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-5 flex items-center justify-between gap-4 sticky top-0 z-30">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onToggleMobile} className="text-slate-600 md:hidden p-1.5 rounded-xl hover:bg-slate-100 active:scale-95 transition" title="Mở menu">
            <Menu size={22} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base leading-tight truncate font-heading">{group?.label || "Tổng Quan"}</span>
              {child?.label && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 truncate">
                    {child.label}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls Right Group */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onOpenPublicWebsite}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold hover:bg-emerald-100 transition shadow-xs"
            title="Xem trang web công khai dành cho Khách hàng"
          >
            <Globe size={14} /> Website Khách Hàng
          </button>
          {/* Active Facility Tag */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 text-xs font-semibold text-slate-600 border border-slate-200/60">
            <Building2 size={14} className="text-emerald-600" />
            <span>Victoria HeadOffice</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1" />
          </div>

          {/* Quick Search */}
          <div className="hidden md:block relative">
            <input
              onKeyDown={(e) => { if (e.key === "Enter") setView("customers"); }}
              placeholder="Tìm khách hàng, số ĐT (Ctrl+K)..."
              className="w-64 pl-3.5 pr-9 py-2 rounded-xl border border-slate-200/80 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-xs"
            />
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Add Button */}
          {addable && (
            <button onClick={onAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.97] transition-all">
              <Plus size={15} /> Thêm Mới
            </button>
          )}

          {/* Task / Worklist Icon */}
          <button title="Công việc cần làm" className="w-9 h-9 rounded-xl border border-slate-200/70 grid place-items-center text-amber-500 hover:bg-amber-50 transition">
            <ClipboardList size={18} />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button onClick={() => { setBellOpen((o) => !o); setUserOpen(false); }}
              className="w-9 h-9 rounded-xl border border-slate-200/70 grid place-items-center text-slate-600 hover:bg-slate-100 transition relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            {bellOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200/80 shadow-xl p-4 text-center text-xs text-slate-500 z-40 animate-pop">
                <div className="flex items-center justify-between font-bold text-slate-800 text-sm mb-3 pb-2 border-b border-slate-100">
                  <span>Thông báo hệ thống</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">0 mới</span>
                </div>
                <div className="py-6 text-slate-400">Không có thông báo mới nào.</div>
              </div>
            )}
          </div>

          {/* User Profile Drawer */}
          <div className="relative">
            <button onClick={() => { setUserOpen((o) => !o); setBellOpen(false); }}
              className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200/80">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white grid place-items-center text-sm font-bold shrink-0 shadow-xs">
                {user?.fullName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 max-w-[110px] truncate">{user?.fullName}</div>
                <div className="text-[10px] font-semibold text-emerald-600 truncate">{user?.role || "Quản lý"}</div>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden sm:block ml-0.5" />
            </button>

            {userOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200/80 shadow-xl py-2 z-40 animate-pop">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-800 truncate">{user?.fullName}</div>
                  <div className="text-[11px] text-emerald-600 font-semibold">{user?.role || "Quản lý"}</div>
                </div>
                <button onClick={() => { setUserOpen(false); onLogout?.(); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition">
                  <LogOut size={15} /> Đăng xuất tài khoản
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav horizontal scroll */}
      <div className="md:hidden flex gap-1.5 overflow-x-auto scroll-soft px-3 py-2 bg-white border-b border-slate-200/80">
        {groups.map((g) =>
          g.children.map((c) => (
            <button key={c.key} onClick={() => setView(c.key)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                view === c.key ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}>
              {c.label}
            </button>
          ))
        )}
      </div>
    </>
  );
}
