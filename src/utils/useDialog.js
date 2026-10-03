import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Hành vi chuẩn của hộp thoại (a11y): đưa focus vào trong khi mở, Tab quay vòng trong hộp,
// Esc để đóng, và trả focus về nút đã mở hộp khi đóng. Gắn `ref` trả về vào phần tử role="dialog".
export default function useDialog(onClose) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const previous = document.activeElement;
    const items = () => [...el.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);

    // Nếu autoFocus của React đã đặt focus trong hộp thì giữ nguyên; không thì ưu tiên ô nhập đầu tiên.
    if (!el.contains(document.activeElement)) {
      const list = items();
      const first = list.find((n) => n.tagName !== "BUTTON") || list[0] || el;
      first.focus?.();
    }

    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); closeRef.current?.(); return; }
      if (e.key !== "Tab") return;
      const list = items();
      if (!list.length) { e.preventDefault(); return; }
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    el.addEventListener("keydown", onKey);
    return () => { el.removeEventListener("keydown", onKey); previous?.focus?.(); };
  }, []);

  return ref;
}
