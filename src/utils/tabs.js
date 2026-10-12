// Quản lý các tab làm việc trong app (kiểu tab trình duyệt): "Trang chủ" luôn được ghim ở đầu,
// mở khách hàng / mục menu khác thì mở thêm tab mới và GIỮ NGUYÊN các tab cũ (kèm trạng thái của chúng).
// Mọi tab dùng chung một bản dữ liệu duy nhất nên sửa ở tab nào cũng không ghi đè lẫn nhau.
import { findNavChild } from "./constants";

const STORAGE_KEY = "nk:tabs:v1";

export const HOME_VIEW = "dashboard";
export const HOME_ID = "v:" + HOME_VIEW;

export const viewTabId = (view) => "v:" + view;
export const customerTabId = (customerId) => "c:" + customerId;
export const domId = (id) => "tab-" + String(id).replace(/[^a-zA-Z0-9_-]/g, "_");

const homeTab = () => ({ id: HOME_ID, kind: "view", view: HOME_VIEW, pinned: true });

export const initialTabs = () => ({ tabs: [homeTab()], activeId: HOME_ID, mru: [HOME_ID] });

// Tên hiển thị trên thanh tab
const AMBIGUOUS = new Set(["Danh Sách", "Cài Đặt", "Lịch Sử"]);
export function viewTitle(view) {
  if (view === HOME_VIEW) return "Trang chủ";
  const f = findNavChild(view);
  if (!f) return view;
  return AMBIGUOUS.has(f.child.label) ? `${f.child.label} ${f.group.label}` : f.child.label;
}
export function tabTitle(tab, customer) {
  if (tab.kind === "customer") return customer?.name || "Khách hàng (đã xoá)";
  return viewTitle(tab.view);
}

// Mục menu mà tab này thuộc về (để tô sáng menu, kiểm tra quyền, hiện tiêu đề trang)
export const viewOfTab = (tab) => (tab.kind === "customer" ? "customers" : tab.view);

function specToTab(spec) {
  if (spec.kind === "customer") {
    return { id: customerTabId(spec.customerId), kind: "customer", customerId: spec.customerId, customerTab: spec.customerTab || "thong-tin" };
  }
  const t = { id: viewTabId(spec.view), kind: "view", view: spec.view };
  if (spec.view === HOME_VIEW) t.pinned = true;
  if (spec.preset) t.preset = spec.preset;
  return t;
}

function activate(state, id) {
  if (state.activeId === id) return state;
  return { ...state, activeId: id, mru: [id, ...state.mru.filter((x) => x !== id)] };
}

// Bỏ các tab `drop`; nếu tab đang xem bị bỏ thì quay về tab dùng gần nhất còn lại (không có thì về Trang chủ).
function without(state, shouldDrop) {
  const tabs = state.tabs.filter((t) => t.pinned || !shouldDrop(t));
  if (tabs.length === state.tabs.length) return state;
  const alive = new Set(tabs.map((t) => t.id));
  let mru = state.mru.filter((id) => alive.has(id));
  let activeId = state.activeId;
  if (!alive.has(activeId)) activeId = mru[0] || HOME_ID;
  if (mru[0] !== activeId) mru = [activeId, ...mru.filter((x) => x !== activeId)];
  return { tabs, activeId, mru };
}

export function tabsReducer(state, action) {
  switch (action.type) {
    case "open": {
      const next = specToTab(action.spec);
      const cur = state.tabs.find((t) => t.id === next.id);
      if (!cur) {
        return activate({ ...state, tabs: [...state.tabs, next] }, next.id);
      }
      // Tab đã mở: chỉ chuyển sang nó; cập nhật tab con / từ khoá tìm khi có chỉ định rõ.
      let changed = null;
      if (action.spec.kind === "customer" && action.spec.customerTab && action.spec.customerTab !== cur.customerTab) {
        changed = { ...cur, customerTab: action.spec.customerTab };
      } else if (action.spec.kind === "view" && action.spec.preset) {
        changed = { ...cur, preset: action.spec.preset };
      }
      const base = changed ? { ...state, tabs: state.tabs.map((t) => (t === cur ? changed : t)) } : state;
      return activate(base, cur.id);
    }
    case "activate":
      return state.tabs.some((t) => t.id === action.id) ? activate(state, action.id) : state;
    case "close":
      return without(state, (t) => t.id === action.id);
    case "prune":
      return without(state, (t) => !action.keep(t));
    case "setSub": {
      const cur = state.tabs.find((t) => t.id === action.id);
      if (!cur || cur.kind !== "customer" || cur.customerTab === action.customerTab) return state;
      return { ...state, tabs: state.tabs.map((t) => (t === cur ? { ...t, customerTab: action.customerTab } : t)) };
    }
    case "reset":
      return initialTabs();
    default:
      return state;
  }
}

// ── Lưu tạm trong phiên trình duyệt (F5 không mất các tab đang mở) ───────────────────────────
export function saveTabs(state) {
  try {
    const tabs = state.tabs.map(({ id, kind, view, customerId, customerTab, pinned }) => ({ id, kind, view, customerId, customerTab, pinned }));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs, activeId: state.activeId }));
  } catch { /* trình duyệt chặn lưu: bỏ qua */ }
}
export function clearSavedTabs() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* bỏ qua */ }
}

export function loadTabs() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    if (!raw || !Array.isArray(raw.tabs)) return initialTabs();
    const seen = new Set([HOME_ID]);
    const tabs = [homeTab()];
    for (const t of raw.tabs) {
      let tab = null;
      if (t?.kind === "customer" && typeof t.customerId === "string" && t.customerId) {
        tab = specToTab({ kind: "customer", customerId: t.customerId, customerTab: typeof t.customerTab === "string" ? t.customerTab : "" });
      } else if (t?.kind === "view" && typeof t.view === "string" && t.view !== HOME_VIEW && findNavChild(t.view)) {
        tab = specToTab({ kind: "view", view: t.view });
      }
      if (tab && !seen.has(tab.id)) { seen.add(tab.id); tabs.push(tab); }
    }
    const activeId = seen.has(raw.activeId) ? raw.activeId : HOME_ID;
    return { tabs, activeId, mru: [activeId, ...tabs.map((t) => t.id).filter((id) => id !== activeId)] };
  } catch {
    return initialTabs();
  }
}
