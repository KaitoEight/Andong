import React, { useState, useEffect, useRef } from "react";
import Sidebar        from "./src/components/Sidebar";
import Header         from "./src/components/Header";
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
import { loadData, saveData } from "./src/utils/storage";
import { getSession, clearSession } from "./src/utils/auth";
import { findNavChild, pathForView, viewForPath } from "./src/utils/constants";
import { loadPerms, savePerms, canAccess, ROLES, ADMIN_ROLE } from "./src/utils/perms";
import { Lock } from "lucide-react";

const DEFAULT_VIEW = "dashboard";

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

export default function App() {
  const initHash = parseHash();
  const [user, setUser]     = useState(() => getSession());
  const [authPage, setAuthPage] = useState("login");
  const [data, setData]     = useState(null);
  const [view, setView]     = useState(() => initHash.type === "detail" ? "customers" : (initHash.view || DEFAULT_VIEW));
  const [detail, setDetail] = useState(() => initHash.type === "detail" ? { id: initHash.id, tab: initHash.tab } : null);
  const [adding, setAdding] = useState(null);
  const [editAppt, setEditAppt] = useState(null);
  const [editCust, setEditCust] = useState(null);
  const [apptCustId, setApptCustId] = useState(null);
  const [perms, setPermsState] = useState(() => loadPerms());
  const [previewRole, setPreviewRole] = useState(null);
  const addRef = useRef(() => {});

  const updatePerms = (p) => { setPermsState(p); savePerms(p); };
  const openCustomer = (id, tab = "thong-tin") => { setView("customers"); setDetail({ id, tab }); };
  // Điều hướng menu: luôn thoát trang chi tiết khách
  const navigate = (v) => { setDetail(null); setView(v); };

  useEffect(() => { if (user) loadData().then(setData); }, [user]);
  useEffect(() => { if (data) saveData(data); }, [data]);

  // Đồng bộ địa chỉ URL theo trạng thái hiện tại
  useEffect(() => {
    const cur = (window.location.hash || "").replace(/^#/, "");
    const want = detail ? detailHash(detail.id, detail.tab) : pathForView(view);
    if (cur !== want) window.location.hash = want;
  }, [view, detail]);

  // Bắt nút Back/Forward của trình duyệt
  useEffect(() => {
    const onHash = () => {
      const p = parseHash();
      if (p.type === "detail") {
        setDetail((d) => (d && d.id === p.id && d.tab === p.tab) ? d : { id: p.id, tab: p.tab });
      } else {
        setDetail(null);
        if (p.view && p.view !== view) setView(p.view);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [view]);

  // "Tạo Mới" (Khách Hàng) mở thẳng form thêm khách, nền là danh sách
  useEffect(() => {
    if (view === "customer-new") {
      setEditCust(null);
      setAdding("customer");
      setView("customers");
    }
  }, [view]);

  const registerAdd = (fn) => { addRef.current = fn; };

  const handleLogin = (loggedInUser) => { setUser(loggedInUser); setData(null); setView(DEFAULT_VIEW); setPreviewRole(null); setDetail(null); };
  const handleLogout = () => { clearSession(); setUser(null); setData(null); setAdding(null); setView(DEFAULT_VIEW); setPreviewRole(null); setDetail(null); };

  if (!user) {
    return authPage === "login"
      ? <LoginPage onLogin={handleLogin} onGoRegister={() => setAuthPage("register")} />
      : <RegisterPage onGoLogin={() => setAuthPage("login")} />;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
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

  const changePreview = (role) => {
    const r = role && role !== ADMIN_ROLE ? role : null;
    setPreviewRole(r);
    const eff = r || realRole;
    const f = findNavChild(view);
    if (f && !canAccess(eff, f.group.key, perms)) setView(DEFAULT_VIEW);
  };

  const renderView = () => {
    // Trang chi tiết khách hàng (điều hướng /Customer/MainCustomer)
    if (detail) {
      if (!canAccess(effectiveRole, "khach-hang", perms)) {
        return (
          <div className="card p-12 flex flex-col items-center justify-center text-center min-h-[40vh]">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 grid place-items-center mb-4"><Lock size={26} /></div>
            <h2 className="text-lg font-semibold text-slate-800">Không có quyền truy cập</h2>
          </div>
        );
      }
      const cust = safeData.customers.find((c) => c.id === detail.id);
      if (!cust) {
        return (
          <div className="card p-12 text-center text-slate-400">
            Không tìm thấy khách hàng.
            <div><button onClick={() => setDetail(null)} className="mt-3 text-emerald-600 font-medium">← Về danh sách</button></div>
          </div>
        );
      }
      return (
        <CustomerDetail data={safeData} setData={setData} customer={cust} tab={detail.tab}
          onTab={(t) => setDetail((d) => ({ ...d, tab: t }))}
          onBack={() => setDetail(null)} onEdit={setEditCust} />
      );
    }

    // Chặn truy cập theo phân quyền
    const found = findNavChild(view);
    if (found && !canAccess(effectiveRole, found.group.key, perms)) {
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

    switch (view) {
      // ── Tổng Quan ─────────────────────────────────────────────────────────
      case "dashboard":
        return <Dashboard data={safeData} go={navigate} />;

      // ── Lịch Hẹn ──────────────────────────────────────────────────────────
      case "appt-today":
        return <Appointments data={safeData} setData={setData} openAdd={setAdding} registerAdd={registerAdd} onEdit={setEditAppt} onOpenCustomer={openCustomer} />;
      case "appt-calendar":
        return <CalendarView data={safeData} setData={setData} />;
      case "appt-doctor":
        return <DoctorSchedule data={safeData} setData={setData} openAdd={setAdding} registerAdd={registerAdd} />;

      // ── Chăm Sóc ──────────────────────────────────────────────────────────
      case "care-remind":
      case "care-noservice":
      case "care-birthday":
      case "care-noshow":
      case "care-after":
      case "care-complaint":
      case "care-cancel":
        return <CareViews data={safeData} setData={setData} openAdd={setAdding} registerAdd={registerAdd} view={view} />;

      // ── Kế Toán ───────────────────────────────────────────────────────────
      case "acc-invoice":
        return <Invoices data={safeData} setData={setData} openAdd={setAdding} registerAdd={registerAdd} />;
      case "acc-history":
      case "acc-fund":
      case "acc-shift":
        return <Accounting data={safeData} view={view} />;

      // ── Khách Hàng ────────────────────────────────────────────────────────
      case "customers":
      case "customer-new":
        return <Customers data={safeData} setData={setData} openAdd={setAdding} registerAdd={registerAdd} onEdit={setEditCust} onOpenCustomer={openCustomer} />;

      // ── Dịch Vụ ───────────────────────────────────────────────────────────
      case "services":
        return <Services data={safeData} setData={setData} openAdd={setAdding} registerAdd={registerAdd} />;
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
        return <Marketing data={safeData} setData={setData} view={view} openAdd={setAdding} registerAdd={registerAdd} />;

      // ── Tích Hợp ──────────────────────────────────────────────────────────
      case "int-sms":
      case "int-call":
      case "int-voip":
        return <Integration view={view} />;

      // ── Nhân Viên ─────────────────────────────────────────────────────────
      case "staff-list":
        return <Staff data={safeData} setData={setData} openAdd={setAdding} registerAdd={registerAdd} />;
      case "staff-users":
      case "staff-schedule":
        return <Staff data={safeData} setData={setData} view={view} />;
      case "staff-perm":
        return <Staff data={safeData} setData={setData} view={view} perms={perms} onPerms={updatePerms} />;

      // ── Cấu Hình ──────────────────────────────────────────────────────────
      case "cfg-category":
      case "cfg-print":
      case "cfg-log":
        return <Configuration view={view} data={safeData} />;

      // ── Báo Cáo ───────────────────────────────────────────────────────────
      case "reports":
        return <Reports data={safeData} />;

      default:
        return <ComingSoon view={view} />;
    }
  };

  return (
    <div className="h-screen overflow-hidden app-bg text-slate-700 text-sm flex">
      <Sidebar view={view} setView={navigate} user={viewUser} onLogout={handleLogout} perms={perms}
        realRole={realRole} previewRole={previewRole} onPreviewRole={changePreview} />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header view={view} setView={navigate} onAdd={() => addRef.current()} user={viewUser} perms={perms}
          previewRole={previewRole} onExitPreview={() => changePreview(null)} onLogout={handleLogout} />
        <main className="p-4 flex-1 overflow-y-auto scroll-soft" key={view}>{renderView()}</main>
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
          onClose={() => { setAdding(null); setEditCust(null); }}
        />
      )}
      {adding && adding !== "appt" && adding !== "customer" && adding !== "customer-new" && (
        <AddForm kind={adding} data={safeData} setData={setData} onClose={() => setAdding(null)} />
      )}
    </div>
  );
}
