import { useState, useMemo } from "react";
import {
  Search, Phone, MapPin, Cake, Pencil, Trash2, HeartPulse, ImageIcon,
  FileText, CalendarCheck, Wallet, Receipt, X, Plus, ChevronLeft, ArrowUpDown,
  CalendarDays, Stethoscope, Activity, CreditCard, ChevronRight, UserPlus
} from "lucide-react";
import Badge from "./ui/Badge";
import Avatar from "./ui/Avatar";
import Odontogram from "./Odontogram";
import { inputCls, btnPrimary } from "./ui/Field";
import { fmtDate, ageFrom, fmtVND, toLocalISODate } from "../utils/helpers";

const tr = (n) => (n / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 2 }) + " Tr";
const trieu = (n) => (n >= 1e6 ? (n / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 2 }) + " triệu" : (n || 0).toLocaleString("vi-VN") + " đ");

const TABS = [
  { key: "profile", label: "Tất cả hồ sơ", icon: FileText },
  { key: "appt",    label: "Có Lịch hẹn",   icon: CalendarDays },
  { key: "service", label: "Sử dụng Dịch vụ", icon: Stethoscope },
  { key: "treat",   label: "Đang Điều trị", icon: Activity },
  { key: "pay",     label: "Có Thanh toán", icon: CreditCard },
];
const RANGES = [
  { key: "all", label: "Tất cả thời gian", days: 0 },
  { key: "m1",  label: "1 Tháng gần nhất", days: 30 },
  { key: "m3",  label: "3 Tháng gần nhất", days: 90 },
  { key: "y1",  label: "1 Năm gần nhất",  days: 365 },
];

export default function Customers({ data, setData, openAdd, registerAdd, onEdit, onOpenCustomer }) {
  const [q, setQ]           = useState("");
  const [tab, setTab]       = useState("profile");
  const [range, setRange]   = useState("all");
  const [source, setSource] = useState("all");
  const [limit, setLimit]   = useState(20);
  const [sel, setSel]       = useState(null);
  const [full, setFull]     = useState(false);

  registerAdd(() => openAdd("customer"));

  const svc = (id) => data.services.find((s) => s.id === id);
  const invoices = data.invoices || [];
  const apptsOf   = (id) => data.appts.filter((a) => a.customerId === id);
  const invOf     = (id) => invoices.filter((i) => i.customerId === id);

  const stats = useMemo(() => ({
    total:     data.customers.length,
    checkedIn: data.appts.filter((a) => a.status === "arrived" || a.status === "done").length,
    apptTotal: data.appts.length,
    billed:    invoices.reduce((s, i) => s + (i.total || 0), 0),
    collected: invoices.reduce((s, i) => s + (i.paid || 0), 0),
  }), [data.customers, data.appts, invoices]);

  const sources = useMemo(
    () => [...new Set(data.customers.map((c) => c.source).filter(Boolean))],
    [data.customers]
  );

  const fromStr = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days || 0;
    if (!days) return null;
    const d = new Date(); d.setDate(d.getDate() - days);
    return toLocalISODate(d);
  }, [range]);

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const inRange = (dateStr) => !fromStr || (dateStr && dateStr >= fromStr);
    return data.customers.filter((c) => {
      if (ql && !(c.name + c.phone + c.code).toLowerCase().includes(ql)) return false;
      if (source !== "all" && (c.source || "") !== source) return false;
      const appts = apptsOf(c.id);
      switch (tab) {
        case "appt":    if (!appts.some((a) => inRange(a.date))) return false; break;
        case "service": if (!appts.some((a) => inRange(a.date) && ((a.serviceIds && a.serviceIds.length) || a.serviceId))) return false; break;
        case "treat":   if (!(appts.some((a) => a.status === "done" && inRange(a.date)) || (c.teeth && Object.keys(c.teeth).length))) return false; break;
        case "pay":     if (!invOf(c.id).some((i) => inRange(i.date))) return false; break;
        default: break;
      }
      return true;
    });
  }, [data.customers, q, source, tab, fromStr, data.appts, invoices]);

  const shown = limit ? list.slice(0, limit) : list;

  const selCust   = data.customers.find((c) => c.id === sel);
  const histAppts = selCust ? apptsOf(sel).slice().sort((a, b) => b.date.localeCompare(a.date)) : [];
  const histCare  = selCust ? data.care.filter((c) => c.customerId === sel) : [];

  const svcNames = (a) => {
    const ids = a.serviceIds && a.serviceIds.length ? a.serviceIds : (a.serviceId ? [a.serviceId] : []);
    return { names: ids.map((id) => svc(id)?.name).filter(Boolean).join(", ") || "Dịch vụ", total: ids.reduce((s, id) => s + (svc(id)?.price || 0), 0) };
  };
  const selInv    = selCust ? invOf(sel) : [];
  const selBilled = selInv.reduce((s, i) => s + (i.total || 0), 0);
  const selPaid   = selInv.reduce((s, i) => s + (i.paid || 0), 0);

  const recent = selCust ? [
    ...selInv.map((i) => ({ type: "inv", date: i.date, label: i.code, amount: i.total })),
    ...apptsOf(sel).filter((a) => a.status === "done").map((a) => { const s = svcNames(a); return { type: "appt", date: a.date, label: s.names, amount: s.total }; }),
  ].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 8) : [];

  const updateTeeth = (teeth) =>
    setData?.({ ...data, customers: data.customers.map((c) => c.id === sel ? { ...c, teeth } : c) });

  const removeCustomer = (c) => {
    if (!window.confirm(`Xoá khách hàng "${c.name}"? Hành động này không thể hoàn tác.`)) return;
    setData?.({ ...data, customers: data.customers.filter((x) => x.id !== c.id) });
    setSel(null);
    setFull(false);
  };

  const StatCard = ({ icon: Icon, label, value, sub, grad = "from-emerald-500 to-teal-600" }) => (
    <div className="card p-4 hover:-translate-y-0.5 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} text-white grid place-items-center shadow-md`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900 font-heading">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 font-medium mt-1">{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-5 animate-fade">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText}      label="Tổng Hồ Sơ Khách Hàng" value={stats.total} grad="from-violet-500 to-purple-600" />
        <StatCard icon={CalendarCheck} label="Checked-In Thực Tế"   value={stats.checkedIn} sub={`${stats.apptTotal} tổng lượt hẹn`} grad="from-sky-500 to-blue-600" />
        <StatCard icon={Receipt}       label="Tổng Doanh Số Phát Sinh" value={tr(stats.billed)} sub={`${invoices.length} hoá đơn xuất`} grad="from-emerald-500 to-teal-600" />
        <StatCard icon={Wallet}        label="Doanh Thu Đã Thu Thực Tế" value={tr(stats.collected)} sub="Tiền mặt & chuyển khoản" grad="from-amber-500 to-orange-600" />
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 min-w-0 w-full space-y-4">

          {/* Card Lọc & Tìm kiếm */}
          <div className="card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900 text-base font-heading">Danh Sách Hồ Sơ Khách Hàng</h2>
                <p className="text-xs text-slate-500">Tra cứu nhanh theo họ tên, số điện thoại, mã hồ sơ hoặc nguồn kênh</p>
              </div>
              <button onClick={() => openAdd("customer")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition">
                <UserPlus size={15} /> Thêm Khách Hàng
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex gap-1.5 overflow-x-auto scroll-soft py-0.5">
                {TABS.map((t) => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      tab === t.key ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                    }`}>
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nhập tên, SĐT, mã KH..." className={inputCls + " pl-8 text-xs py-2"} />
                </div>
                <select value={source} onChange={(e) => setSource(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none">
                  <option value="all">Tất cả nguồn</option>
                  {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Table list */}
          <div className="table-container">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/80 bg-slate-50/50 text-xs font-semibold text-slate-500">
              <span>Hiển thị {shown.length} / {list.length} kết quả</span>
              <div className="flex items-center gap-2">
                <span>Trang:</span>
                <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="rounded-lg border border-slate-200 px-2 py-1 bg-white focus:outline-none">
                  <option value={20}>20 khách/trang</option>
                  <option value={50}>50 khách/trang</option>
                  <option value={0}>Tất cả</option>
                </select>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Khách Hàng</th>
                  <th className="p-3">Số Điện Thoại</th>
                  <th className="p-3">Địa Chỉ / Nguồn</th>
                  <th className="p-3 text-center w-20">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Không tìm thấy khách hàng phù hợp.</td></tr>
                ) : shown.map((c, idx) => (
                  <tr key={c.id} onClick={() => setSel(c.id)}
                    className={`table-row cursor-pointer ${sel === c.id ? "bg-emerald-50/70 font-medium" : ""}`}>
                    <td className="p-3 text-center text-slate-400 font-semibold">{idx + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={c.avatar} name={c.name} size={34} />
                        <div>
                          <button onClick={(e) => { e.stopPropagation(); onOpenCustomer?.(c.id); }} className="font-bold text-emerald-700 hover:underline block text-left">
                            {c.name}
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono">{c.code} · {c.gender || "Khách"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{c.phone}</td>
                    <td className="p-3 text-slate-500">{c.address || "Chưa cập nhật"} {c.source && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 ml-1">{c.source}</span>}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); onEdit?.(c); }} title="Sửa"
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition grid place-items-center">
                          <Pencil size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removeCustomer(c); }} title="Xoá"
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition grid place-items-center">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Chi Tiết Bên Phải */}
        {selCust && (
          <aside className="w-full lg:w-80 shrink-0 card p-5 space-y-4 lg:sticky lg:top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scroll-soft animate-fade text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button onClick={() => setSel(null)} className="flex items-center gap-1 font-bold text-slate-500 hover:text-slate-800">
                <ChevronLeft size={16} /> Đóng
              </button>
              <div className="flex items-center gap-1">
                <button onClick={() => onEdit?.(selCust)} title="Chỉnh sửa hồ sơ" className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                  <Pencil size={15} />
                </button>
                <button onClick={() => removeCustomer(selCust)} title="Xóa" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Main Info */}
            <div className="flex flex-col items-center text-center">
              <Avatar src={selCust.avatar} name={selCust.name} size={72} className="ring-4 ring-emerald-500/20 mb-2" />
              <h3 className="font-bold text-slate-900 text-base font-heading">{selCust.name}</h3>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1 border border-emerald-200/60">
                {selCust.code}
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-slate-600">
              <div className="flex justify-between"><span className="text-slate-400">Điện thoại:</span> <span className="font-semibold text-slate-800">{selCust.phone}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Giới tính / Tuổi:</span> <span className="font-semibold text-slate-800">{selCust.gender} · {ageFrom(selCust.dob)} tuổi</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Doanh số:</span> <span className="font-extrabold text-emerald-700">{fmtVND(selBilled)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Đã thu:</span> <span className="font-extrabold text-sky-700">{fmtVND(selPaid)}</span></div>
            </div>

            <button onClick={() => onOpenCustomer?.(selCust.id)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition">
              Xem Hồ Sơ Chi Tiết & Răng →
            </button>
          </aside>
        )}
      </div>

    </div>
  );
}
