import { useEffect, useRef } from "react";
import { X, Home, Pin, UserRound } from "lucide-react";
import { findNavChild } from "../utils/constants";
import { tabTitle, domId, viewOfTab } from "../utils/tabs";

// Thanh tab: "Trang chủ" được ghim ở đầu (không đóng được); khách hàng / mục menu mở ra tab riêng.
export default function TabBar({ tabs, activeId, customersById, onActivate, onClose }) {
  const listRef = useRef(null);

  // Tab vừa chọn / vừa mở luôn nằm trọn (cả nút đóng) trong vùng nhìn thấy khi thanh tab bị tràn
  useEffect(() => {
    listRef.current?.querySelector('[role="tab"][aria-selected="true"]')?.parentElement?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [activeId, tabs.length]);

  const onKeyDown = (e) => {
    const el = e.target.closest?.('[role="tab"]');
    if (!el) return;
    const items = [...listRef.current.querySelectorAll('[role="tab"]')];
    const i = items.indexOf(el);
    const go = (n) => { e.preventDefault(); const t = items[(n + items.length) % items.length]; t.focus(); t.click(); };
    if (e.key === "ArrowRight") go(i + 1);
    else if (e.key === "ArrowLeft") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(items.length - 1);
    else if (e.key === "Delete" && el.dataset.closable === "1") { e.preventDefault(); onClose(el.dataset.tabId); }
  };

  return (
    <div ref={listRef} role="tablist" aria-label="Các tab đang mở" onKeyDown={onKeyDown}
      className="shrink-0 flex items-end gap-1 px-3 pt-1.5 bg-slate-100/80 border-b border-slate-200 overflow-x-auto scroll-soft">
      {tabs.map((t) => {
        const active = t.id === activeId;
        const customer = t.kind === "customer" ? customersById.get(t.customerId) : null;
        const title = tabTitle(t, customer);
        const closable = !t.pinned;
        const group = t.kind === "view" ? findNavChild(viewOfTab(t))?.group : null;
        const Icon = t.pinned ? Home : t.kind === "customer" ? UserRound : (group?.icon || Home);
        const tip = customer ? [customer.name, customer.code, customer.phone].filter(Boolean).join(" · ") : title;
        return (
          <div key={t.id}
            className={`group shrink-0 flex items-center max-w-[15rem] rounded-t-lg border border-b-0 transition-colors ${
              active ? "bg-white border-slate-200 -mb-px pb-px shadow-[inset_0_2px_0_0_#059669]" : "bg-transparent border-transparent hover:bg-white/60"
            }`}>
            <button type="button" role="tab" id={domId(t.id)} aria-selected={active} aria-controls={domId(t.id) + "-pane"}
              tabIndex={active ? 0 : -1} title={tip} data-tab-id={t.id} data-closable={closable ? "1" : "0"}
              onClick={() => onActivate(t.id)}
              onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }}   // chặn con trỏ cuộn khi bấm chuột giữa
              onAuxClick={(e) => { if (e.button === 1 && closable) { e.preventDefault(); onClose(t.id); } }}
              className={`min-w-0 flex items-center gap-1.5 h-9 pl-3 ${closable ? "pr-1" : "pr-3"} text-xs font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-t-lg ${
                active ? "text-emerald-800" : "text-slate-600 group-hover:text-slate-900"
              }`}>
              <Icon size={14} className={`shrink-0 ${active ? "text-emerald-700" : "text-slate-500"}`} aria-hidden="true" />
              <span className="truncate">{title}</span>
              {t.pinned && <Pin size={11} className="shrink-0 text-slate-400" aria-label="Đã ghim" />}
            </button>
            {closable && (
              <button type="button" tabIndex={-1} aria-label={`Đóng tab ${title}`} title="Đóng tab"
                onClick={() => onClose(t.id)}
                className="mr-1.5 ml-0.5 w-5 h-5 shrink-0 grid place-items-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition">
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
