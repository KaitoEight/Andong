import React, { useState, useEffect, useRef, useReducer, useMemo, useCallback, memo } from "react";
import Sidebar        from "./src/components/Sidebar";
import Header         from "./src/components/Header";
import TabBar         from "./src/components/TabBar";
import Dashboard      from "./src/components/Dashboard";
import Appointments   from "./src/components/Appointments";
import CalendarView   from "./src/components/CalendarView";
import Customers      from "./src/components/Customers";
import Services       from "./src/components/Services";
import Care           from "./src/components/Care";
import Reports        from "./src/components/Reports";
import AddForm        from "./src/components/AddForm";
import AppointmentForm from "./src/components/AppointmentForm";
import CustomerForm    from "./src/components/CustomerForm";
import CustomerDetail  from "./src/components/CustomerDetail";
import ComingSoon     from "./src/components/ComingSoon";
import LoginPage      from "./src/components/auth/LoginPage";
import RegisterPage   from "./src/components/auth/RegisterPage";
import CareViews      from "./src/components/CareViews";
import DoctorSchedule from "./src/components/DoctorSchedule";
import Accounting     from "./src/components/Accounting";
import Invoices        from "./src/components/Invoices";
import Staff          from "./src/components/Staff";
import Marketing      from "./src/components/Marketing";
import Prescription   from "./src/components/Prescription";
import Warehouse      from "./src/components/Warehouse";
import Integration    from "./src/components/Integration";
import Configuration  from "./src/components/Configuration";
import Trash          from "./src/components/Trash";
import { loadData, saveData } from "./src/utils/storage";
import { stampCreatedAt } from "./src/utils/helpers";
import { getSession, clearSession } from "./src/utils/auth";
import { findNavChild, pathForView, viewForPath } from "./src/utils/constants";
import { loadPerms, savePerms, canAccess, ROLES, ADMIN_ROLE } from "./src/utils/perms";
import { tabsReducer, loadTabs, saveTabs, clearSavedTabs, viewOfTab, domId } from "./src/utils/tabs";
import { Lock } from "lucide-react";

const noop = () => {};

// Phân tích hash URL: trang chi tiết khách hàng hoặc view thường
function parseHash() {
  const raw = (window.location.hash || "").replace(/^#/, ""); // giữ dấu "/" đầu
  if (raw.toLowerCase().startsWith("/customer/maincustomer")) {
    const qs = new URLSearchParams(raw.slice(raw.indexOf("?") + 1));
    let id = qs.get("CustomerID") || "";
    try { id = atob(decodeURIComponent(id)); } catch { /* dùng nguyên */ }
    return { type: "detail", id, tab: qs.get("tab") || "thong-tin" };
  }
  return { type: "view", view: viewForPath(raw) };
}
function detailHash(id, tab) {
  return "/Customer/MainCustomer?CustomerID=" + encodeURIComponent(btoa(id)) + "&ver=3.0.0.0&tab=" + tab;
}

// Các tab đang mở: lấy lại từ phiên trình duyệt (F5 không mất), rồi mở thêm tab mà địa chỉ URL đang trỏ tới.
function initTabsState() {
  const base = loadTabs();
  const h = parseHash();
  if (h.type === "detail" && h.id) return tabsReducer(base, { type: "open", spec: { kind: "customer", customerId: h.id, customerTab: h.tab } });
  if (h.view && h.view !== "customer-new") return tabsReducer(base, { type: "open", spec: { kind: "view", view: h.view } });
  return base;
}

// Mỗi tab là một khung riêng luôn được giữ nguyên (chỉ ẩn khi không xem) để không mất bộ lọc, ô đang nhập,
// vị trí cuộn… Tab đang ẩn không vẽ lại khi dữ liệu đổi — sẽ cập nhật ngay khi quay lại tab đó.
const TabPane = memo(function TabPane({ id, active, children }) {
  return (
    <div id={id + "-pane"} role="tabpanel" aria-labelledby={id}
      className={`absolute inset-0 overflow-y-auto scroll-soft p-4 ${active ? "" : "invisible"}`}>
      {children}
    </div>
  );
}, (prev, next) => !prev.active && !next.active && prev.id === next.id);

export default function App() {
  const [user, setUser]     = useState(() => getSession());
  const [authPage, setAuthPage] = useState("login");
  const [data, setData]     = useState(null);
  const [tabsState, dispatch] = useReducer(tabsReducer, null, initTabsState);
  const [adding, setAdding] = useState(null);
  const [editAppt, setEditAppt] = useState(null);
  const [editCust, setEditCust] = useState(null);
  const [apptCustId, setApptCustId] = useState(null);
  const [perms, setPermsState] = useState(() => loadPerms());
  const [previewRole, setPreviewRole] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const addRef = useRef(() => {});

  const updatePerms = (p) => { setPermsState(p); savePerms(p); };

  // Chọn khách / mục menu → MỞ TAB MỚI (đã có tab đó thì chuyển sang), các tab cũ vẫn giữ nguyên.
  const openCustomer = useCallback((id, tab) => {
    setMobileOpen(false);
    dispatch({ type: "open", spec: { kind: "customer", customerId: id, customerTab: tab } });
  }, []);
  const openView = useCallback((v) => {
    setMobileOpen(false);
    if (v === "customer-new") {            // "Tạo Mới" (Khách Hàng): form thêm khách, nền là tab danh sách
      setEditCust(null);
      setAdding("customer");
      v = "customers";
    }
    dispatch({ type: "open", spec: { kind: "view", view: v } });
  }, []);
  // Ô tìm khách ở thanh trên: nhiều kết quả thì mở tab danh sách khách đã lọc sẵn theo từ khoá
  const searchCustomers = useCallback((q) => {
    setMobileOpen(false);
    dispatch({ type: "open", spec: { kind: "view", view: "customers", preset: { q, n: Date.now() } } });
  }, []);
  const activateTab = useCallback((id) => dispatch({ type: "activate", id }), []);
  const closeTab = useCallback((id) => dispatch({ type: "close", id }), []);
  // "Quay lại danh sách" trong hồ sơ khách: đóng tab khách này và về tab danh sách khách
  const backToList = useCallback((id) => {
    dispatch({ type: "close", id });
    dispatch({ type: "open", spec: { kind: "view", view: "customers" } });
  }, []);

  const activeTab = tabsState.tabs.find((t) => t.id === tabsState.activeId) || tabsState.tabs[0];
  const view = viewOfTab(activeTab);   // mục menu của tab đang xem (hồ sơ khách thuộc "Danh Sách")
  const wantHash = activeTab.kind === "customer" ? detailHash(activeTab.customerId, activeTab.customerTab) : pathForView(activeTab.view);
  const customersById = useMemo(() => new Map((data?.customers || []).map((c) => [c.id, c])), [data?.customers]);

  useEffect(() => { if (user) loadData().then((d) => setData(stampCreatedAt(d))); }, [user]);
  useEffect(() => { if (data) saveData(data); }, [data]);
  useEffect(() => { if (user) saveTabs(tabsState); }, [tabsState, user]);

  // Đồng bộ địa chỉ URL theo tab đang xem
  useEffect(() => {
    const cur = (window.location.hash || "").replace(/^#/, "");
    if (cur !== wantHash) window.location.hash = wantHash;
  }, [wantHash]);

  // Bắt nút Back/Forward, hoặc dán/đổi địa chỉ thủ công: mở (hoặc chuyển sang) tab tương ứng
  useEffect(() => {
    const onHash = () => {
      const p = parseHash();
      if (p.type === "detail") openCustomer(p.id, p.tab);
      else if (p.view) openView(p.view);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [openCustomer, openView]);

  // Mở thẳng địa chỉ "Tạo Mới khách hàng" (/customer/create/) khi vừa tải trang
  useEffect(() => { if (parseHash().view === "customer-new") openView("customer-new"); }, [openView]);

  const registerAdd = (fn) => { addRef.current = fn; };

  const handleLogin = (loggedInUser) => { setUser(loggedInUser); setData(null); dispatch({ type: "reset" }); setPreviewRole(null); };
  const handleLogout = () => { clearSession(); clearSavedTabs(); setUser(null); setData(null); setAdding(null); dispatch({ type: "reset" }); setPreviewRole(null); };

  if (!user) {
    return authPage === "login"
      ? <LoginPage onLogin={handleLogin} onGoRegister={() => setAuthPage("register")} />
      : <RegisterPage onGoLogin={() => setAuthPage("login")} />;
  }

  if (!data) {
    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center text-slate-500 text-sm" role="status">
        Đang tải dữ liệu…
      </div>
    );
  }

  // Ensure new collections always exist (graceful fallback for existing DB docs)
  const safeData = {
    ...data,
    staff:     data.staff     || [],
    discounts: data.discounts || [],
    invoices:  data.invoices  || [],
  };

  // Vai trò thực & vai trò đang xem thử (chỉ Quản lý mới được xem thử vai trò khác)
  const realRole = user?.role || ADMIN_ROLE;
  const effectiveRole = realRole === ADMIN_ROLE && previewRole ? previewRole : realRole;
  const viewUser = { ...user, role: effectiveRole };

  // Đổi vai trò xem thử: đóng các tab mà vai trò đó không được phép xem (Trang chủ luôn giữ lại)
  const changePreview = (role) => {
    const r = role && role !== ADMIN_ROLE ? role : null;
    setPreviewRole(r);
    const eff = r || realRole;
    const u = { ...user, role: eff };
    dispatch({
      type: "prune",
      keep: (t) => {
        const f = findNavChild(viewOfTab(t));
        return !f || (canAccess(u, f.group.key, perms) && !(f.child.adminOnly && eff !== ADMIN_ROLE));
      },
    });
  };

  // Nội dung của MỘT tab. `active` = tab đang xem: chỉ tab này được gán nút "Thêm Mới" của thanh trên.
  const renderTab = (tab, active) => {
    const reg = active ? registerAdd : noop;

    // Hồ sơ chi tiết khách hàng (điều hướng /Customer/MainCustomer)
    if (tab.kind === "customer") {
      if (!canAccess(viewUser, "khach-hang", perms)) {
        return (
          <div className="card p-12 flex flex-col items-center justify-center text-center min-h-[40vh]">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 grid place-items-center mb-4"><Lock size={26} /></div>
            <h2 className="text-lg font-semibold text-slate-800">Không có quyền truy cập</h2>
          </div>
        );
      }
      const cust = customersById.get(tab.customerId);
      if (!cust) {
        return (
          <div className="card p-12 text-center text-slate-500">
            Không tìm thấy khách hàng.
            <div><button onClick={() => backToList(tab.id)} className="mt-3 text-emerald-700 font-medium">← Về danh sách</button></div>
          </div>
        );
      }
      return (
        <CustomerDetail data={safeData} setData={setData} customer={cust} tab={tab.customerTab}
          onTab={(t) => dispatch({ type: "setSub", id: tab.id, customerTab: t })}
          onBack={() => backToList(tab.id)} onEdit={setEditCust}
          onAddAppt={(id) => { setApptCustId(id); }}
          onEditAppt={(appt) => { setEditAppt(appt); }} />
      );
    }

    const view = tab.view;

    // Chặn truy cập theo phân quyền
    const found = findNavChild(view);
    if (found && !canAccess(viewUser, found.group.key, perms)) {
      return (
        <div className="card p-12 flex flex-col items-center justify-center text-center min-h-[40vh]">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 grid place-items-center mb-4"><Lock size={26} /></div>
          <h2 className="text-lg font-semibold text-slate-800">Không có quyền truy cập</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Vai trò <b>{effectiveRole}</b> không được phép xem mục này. Liên hệ quản lý để được cấp quyền.
          </p>
        </div>
      );
    }

    // Mục chỉ dành cho Quản lý (vd: Dữ liệu đã xoá) — máy chủ cũng kiểm tra quyền riêng
    if (found?.child?.adminOnly && effectiveRole !== ADMIN_ROLE) {
      return (
        <div className="card p-12 flex flex-col items-center justify-center text-center min-h-[40vh]">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 grid place-items-center mb-4"><Lock size={26} /></div>
          <h2 className="text-lg font-semibold text-slate-800">Không có quyền truy cập</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">Chỉ vai trò <b>Quản lý</b> mới xem được mục này.</p>
        </div>
      );
    }

    switch (view) {
      // ── Tổng Quan ─────────────────────────────────────────────────────────
      case "dashboard":
        return <Dashboard data={safeData} go={openView} />;

      // ── Lịch Hẹn ──────────────────────────────────────────────────────────
      case "appt-today":
        return <Appointments data={safeData} setData={setData} openAdd={setAdding} registerAdd={reg} onEdit={setEditAppt} onOpenCustomer={openCustomer} />;
      case "appt-calendar":
        return <CalendarView data={safeData} setData={setData} />;
      case "appt-doctor":
        return <DoctorSchedule data={safeData} setData={setData} openAdd={setAdding} registerAdd={reg} />;

      // ── Chăm Sóc ──────────────────────────────────────────────────────────
      case "care-remind":
      case "care-noservice":
      case "care-birthday":
      case "care-noshow":
      case "care-after":
      case "care-complaint":
      case "care-cancel":
        return <CareViews data={safeData} setData={setData} openAdd={setAdding} registerAdd={reg} view={view} />;

      // ── Kế Toán ───────────────────────────────────────────────────────────
      case "acc-invoice":
        return <Invoices data={safeData} setData={setData} openAdd={setAdding} registerAdd={reg} />;
      case "acc-history":
      case "acc-fund":
      case "acc-shift":
        return <Accounting data={safeData} view={view} />;

      // ── Khách Hàng ────────────────────────────────────────────────────────
      case "customers":
        return <Customers data={safeData} setData={setData} openAdd={setAdding} registerAdd={reg} onEdit={setEditCust} onOpenCustomer={openCustomer} preset={tab.preset} />;

      // ── Dịch Vụ ───────────────────────────────────────────────────────────
      case "services":
        return <Services data={safeData} setData={setData} openAdd={setAdding} registerAdd={reg} />;
      case "prescription":
        return <Prescription />;

      // ── Kho ───────────────────────────────────────────────────────────────
      case "wh-manage":
      case "wh-material":
      case "wh-lookup":
      case "wh-lock":
      case "wh-raw":
      case "wh-setting":
        return <Warehouse view={view} />;

      // ── Marketing ─────────────────────────────────────────────────────────
      case "mk-discount":
      case "mk-filter":
        return <Marketing data={safeData} setData={setData} view={view} openAdd={setAdding} registerAdd={reg} />;

      // ── Tích Hợp ──────────────────────────────────────────────────────────
      case "int-sms":
      case "int-call":
      case "int-voip":
        return <Integration view={view} />;

      // ── Nhân Viên ─────────────────────────────────────────────────────────
      case "staff-list":
        return <Staff data={safeData} setData={setData} openAdd={setAdding} registerAdd={reg} perms={perms} onPerms={updatePerms} />;
      case "staff-users":
      case "staff-schedule":
        return <Staff data={safeData} setData={setData} view={view} openAdd={setAdding} registerAdd={reg} perms={perms} onPerms={updatePerms} />;
      case "staff-perm":
        return <Staff data={safeData} setData={setData} view={view} perms={perms} onPerms={updatePerms} />;

      // ── Cấu Hình ──────────────────────────────────────────────────────────
      case "cfg-category":
      case "cfg-print":
      case "cfg-log":
        return <Configuration view={view} data={safeData} />;
      case "cfg-trash":
        return <Trash data={safeData} setData={setData} user={viewUser} />;

      // ── Báo Cáo ───────────────────────────────────────────────────────────
      case "reports":
        return <Reports data={safeData} />;

      default:
        return <ComingSoon view={view} />;
    }
  };

  return (
    <div className="h-screen h-dvh overflow-hidden app-bg text-slate-700 text-sm flex">
      {/* Liên kết "bỏ qua menu" cho người dùng bàn phím (dùng nút, vì # đã dành cho điều hướng của app) */}
      <button type="button" onClick={() => document.getElementById("main-content")?.focus()}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-emerald-700 focus:text-white focus:text-sm focus:font-semibold">
        Bỏ qua menu, tới nội dung chính
      </button>
      <Sidebar view={view} setView={openView} user={viewUser} onLogout={handleLogout} perms={perms}
        realRole={realRole} previewRole={previewRole} onPreviewRole={changePreview}
        mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header view={view} setView={openView} onAdd={() => addRef.current()} user={viewUser} perms={perms}
          previewRole={previewRole} onExitPreview={() => changePreview(null)} onLogout={handleLogout}
          onToggleMobile={() => setMobileOpen((o) => !o)}
          customers={safeData.customers} onOpenCustomer={openCustomer} onSearchList={searchCustomers} />
        <TabBar tabs={tabsState.tabs} activeId={activeTab.id} customersById={customersById}
          onActivate={activateTab} onClose={closeTab} />
        <main id="main-content" tabIndex={-1} className="relative flex-1 min-h-0 focus:outline-none">
          {tabsState.tabs.map((t) => (
            <TabPane key={t.id} id={domId(t.id)} active={t.id === activeTab.id}>
              {renderTab(t, t.id === activeTab.id)}
            </TabPane>
          ))}
        </main>
      </div>

      {(adding === "appt" || editAppt || apptCustId) && (
        <AppointmentForm
          data={safeData}
          setData={setData}
          editing={editAppt}
          initialCustomerId={apptCustId}
          onClose={() => { setAdding(null); setEditAppt(null); setApptCustId(null); }}
        />
      )}
      {(adding === "customer" || adding === "customer-new" || editCust) && (
        <CustomerForm
          data={safeData}
          setData={setData}
          editing={editCust}
          onCreateAppt={(id) => { setApptCustId(id); }}
          onCreated={(id) => dispatch({ type: "open", spec: { kind: "view", view: "customers", preset: { q: "", n: Date.now(), focusId: id } } })}
          onClose={() => { setAdding(null); setEditCust(null); }}
        />
      )}
      {adding && adding !== "appt" && adding !== "customer" && adding !== "customer-new" && (
        <AddForm kind={adding} data={safeData} setData={setData} onClose={() => setAdding(null)} />
      )}
    </div>
  );
}
