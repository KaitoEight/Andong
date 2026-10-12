import { useState, useMemo, useRef, useEffect, useId } from "react";
import { Search, UserRound, List } from "lucide-react";
import { customerMatches, foldText, phoneDigits, sortCustomersByCreated } from "../utils/helpers";

const MAX_SHOWN = 8;

// Gợi ý khớp nhất lên đầu: trùng đúng mã / SĐT → tên bắt đầu bằng từ khoá → còn lại; cùng mức thì khách mới hơn trước.
function rank(list, query) {
  const f = foldText(query).trim();
  const d = phoneDigits(query);
  const score = (c) => {
    if (f && foldText(c.code) === f) return 0;
    if (d.length >= 6 && phoneDigits(c.phone) === d) return 0;
    if (f && foldText(c.name).startsWith(f)) return 1;
    return 2;
  };
  return sortCustomersByCreated(list, true)
    .map((c, i) => ({ c, s: score(c), i }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .map((x) => x.c);
}

// Ô tìm khách ở thanh trên: gõ tên / SĐT / mã khách → chọn → mở hồ sơ trong TAB MỚI.
// Enter: 1 kết quả thì mở luôn; nhiều kết quả thì mở danh sách khách (tab riêng) đã lọc sẵn theo từ khoá.
export default function CustomerSearch({ customers, onOpenCustomer, onSearchList }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const boxRef = useRef(null);
  const listId = useId();

  const term = q.trim();
  const results = useMemo(() => (term ? rank(customers.filter((c) => customerMatches(c, term)), term) : []), [customers, term]);
  const items = useMemo(() => {
    const list = results.slice(0, MAX_SHOWN).map((c) => ({ type: "customer", c }));
    if (results.length > 1) list.push({ type: "all" });
    return list;
  }, [results]);
  const expanded = open && !!term;

  useEffect(() => { setHi(-1); }, [term]);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const reset = () => { setQ(""); setOpen(false); setHi(-1); };
  const pick = (item) => {
    if (!item) return;
    if (item.type === "customer") onOpenCustomer(item.c.id);
    else onSearchList(term);
    reset();
  };

  const onKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;   // đang gõ dấu tiếng Việt: đừng bắt Enter
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi((h) => (items.length ? (h + 1) % items.length : -1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setOpen(true); setHi((h) => (items.length ? (h <= 0 ? items.length - 1 : h - 1) : -1)); }
    else if (e.key === "Enter") {
      if (!term) return;
      e.preventDefault();
      if (hi >= 0) pick(items[hi]);
      else if (results.length === 1) pick(items[0]);
      else if (results.length > 1) pick({ type: "all" });
    } else if (e.key === "Escape") {
      if (open) { e.preventDefault(); setOpen(false); } else if (q) setQ("");
    }
  };

  return (
    <div ref={boxRef} className="hidden md:block relative">
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox" aria-expanded={expanded} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={expanded && hi >= 0 ? `${listId}-${hi}` : undefined}
        aria-label="Tìm khách hàng theo tên, số điện thoại hoặc mã khách" placeholder="Tìm tên, SĐT, mã khách..."
        className="w-64 pl-3.5 pr-9 py-2 rounded-xl border border-slate-200/80 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-xs"
      />
      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />

      {expanded && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200/80 shadow-xl z-40 animate-pop overflow-hidden">
          {items.length === 0 ? (
            <div className="px-4 py-5 text-center text-xs text-slate-500">
              Không tìm thấy khách nào khớp “{term}”.<br />Thử gõ tên, số điện thoại hoặc mã khách.
            </div>
          ) : (
            <ul id={listId} role="listbox" aria-label="Kết quả tìm khách hàng" className="py-1.5 max-h-80 overflow-y-auto scroll-soft">
              {items.map((it, i) => (
                <li key={it.type === "all" ? "all" : it.c.id} id={`${listId}-${i}`} role="option" aria-selected={hi === i}
                  onMouseDown={(e) => e.preventDefault()}   // giữ focus ở ô nhập
                  onMouseEnter={() => setHi(i)}
                  onClick={() => pick(it)}
                  className={`px-3 py-2 mx-1.5 rounded-xl cursor-pointer flex items-center gap-2.5 text-xs ${hi === i ? "bg-emerald-50" : ""} ${it.type === "all" ? "sticky bottom-0 bg-white border-t border-slate-100 mt-1 rounded-t-none pt-2.5 text-emerald-700 font-semibold" : ""} ${it.type === "all" && hi === i ? "!bg-emerald-50" : ""}`}>
                  {it.type === "all" ? (
                    <><List size={15} className="shrink-0" /> Xem cả {results.length} kết quả trong danh sách</>
                  ) : (
                    <>
                      <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 grid place-items-center shrink-0"><UserRound size={15} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-slate-800 truncate">{it.c.name}</span>
                        <span className="block text-[11px] text-slate-500 font-mono truncate">{it.c.code} · {(it.c.phone || "").trim() || "Chưa có SĐT"}</span>
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
