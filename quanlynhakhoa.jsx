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
import { findNavChild } from "./src/utils/constants";
import { loadPerms, savePerms, canAccess, ROLES, ADMIN_ROLE } from "./src/utils/perms";
import { Lock } from "lucide-react";

const DEFAULT_VIEW = "dashboard";

// Lấy view từ hash URL (vd #appt-today) — chỉ nhận nếu là view hợp lệ
function viewFromHash() {
  const h = decodeURIComponent((window.location.hash || "").replace(/^#\/?/, "").trim());
  return h && findNavChild(h) ? h : "";
}

export default function App() {
  const [user, setUser]     = useState(() => getSession());
  const [authPage, setAuthPage] = useState("login");
  const [data, setData]     = useState(null);
  const [view, setView]     = useState(() => viewFromHash() || DEFAULT_VIEW);
  const [adding, setAdding] = useState(null);
  const [editAppt, setEditAppt] = useState(null);
  const [editCust, setEditCust] = useState(null);
  const [apptCustId, setApptCustId] = useState(null);
  const [perms, setPermsState] = useState(() => loadPerms());
  const [previewRole, setPreviewRole] = useState(null);
  const addRef = useRef(() => {});

  const updatePerms = (p) => { setPermsState(p); savePerms(p); };

  useEffect(() => { if (user) loadData().then(setData); }, [user]);
  useEffect(() => { if (data) saveData(data); }, [data]);

  // Đồng bộ địa chỉ URL theo view hiện tại
  useEffect(() => {
    if (viewFromHash() !== view) window.location.hash = view;
  }, [view]);

  // Bắt nút Back/Forward của trình duyệt
  useEffect(() => {
    const onHash = () => { const v = viewFromHash(); if (v && v !== view) setView(v); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [view]);

  const registerAdd = (fn) => { addRef.current = fn; };

  const handleLogin = (loggedInUser) => { setUser(loggedInUser); setData(null); setView(DEFAULT_VIEW); setPreviewRole(null); };
  const handleLogout = () => { clearSession(); setUser(null); setData(null); setAdding(null); setView(DEFAULT_VIEW); setPreviewRole(null); };

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
        return <Dashboard data={safeData} go={setView} />;

      // ── Lịch Hẹn ──────────────────────────────────────────────────────────
      case "appt-today":
        return <Appointments data={safeData} setData={setData} openAdd={setAdding} registerAdd={registerAdd} onEdit={setEditAppt} />;
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
        return <Customers data={safeData} setData={setData} openAdd={setAdding} registerAdd={registerAdd} onEdit={setEditCust} />;

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
    <div
      className="min-h-screen app-bg text-slate-800 flex"
      style={{ fontFamily: "'Be Vietnam Pro', system-ui, sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');`}</style>

      <Sidebar view={view} setView={setView} user={viewUser} onLogout={handleLogout} perms={perms}
        realRole={realRole} previewRole={previewRole} onPreviewRole={changePreview} />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header view={view} setView={setView} onAdd={() => addRef.current()} user={viewUser} perms={perms}
          previewRole={previewRole} onExitPreview={() => changePreview(null)} />
        <main className="p-4 sm:p-6 flex-1 overflow-y-auto scroll-soft animate-fade" key={view}>{renderView()}</main>
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
