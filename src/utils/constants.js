import {
  CalendarDays, HeartPulse, Wallet, Users, ClipboardList,
  Package, Megaphone, Plug, UserCog, Settings, BarChart3, LayoutDashboard,
} from "lucide-react";

export const STATUS = {
  pending:   { label: "Chờ xác nhận", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Đã xác nhận",  cls: "bg-sky-50 text-sky-700 border-sky-200" },
  arrived:   { label: "Đã đến",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  done:      { label: "Hoàn thành",   cls: "bg-emerald-600 text-white border-emerald-600" },
  cancelled: { label: "Đã hủy",       cls: "bg-rose-50 text-rose-700 border-rose-200" },
  noshow:    { label: "Không đến",    cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

export const STATUS_CYCLE = ["pending", "confirmed", "arrived", "done", "noshow", "cancelled"];

export const NAV = [
  {
    key: "tong-quan", label: "Tổng Quan", icon: LayoutDashboard,
    children: [
      { key: "dashboard", label: "Dashboard", addable: false },
    ],
  },
  {
    key: "lich-hen", label: "Lịch Hẹn", icon: CalendarDays,
    children: [
      { key: "appt-today",    label: "Trong Ngày",       addable: true  },
      { key: "appt-calendar", label: "Calendar",          addable: true  },
      { key: "appt-doctor",   label: "Lịch Hẹn Bác Sĩ", addable: false },
    ],
  },
  {
    key: "cham-soc", label: "Chăm Sóc", icon: HeartPulse,
    children: [
      { key: "care-remind",    label: "Nhắc Lịch Hẹn",       addable: false },
      { key: "care-noservice", label: "Không Làm Dịch Vụ",   addable: false },
      { key: "care-birthday",  label: "Ngày Sinh Nhật",       addable: false },
      { key: "care-noshow",    label: "Hẹn Không Đến",        addable: false },
      { key: "care-after",     label: "Sau Điều Trị",         addable: true  },
      { key: "care-complaint", label: "Giải Quyết Complaint", addable: false },
      { key: "care-cancel",    label: "Lịch Hẹn Hủy",        addable: false },
    ],
  },
  {
    key: "ke-toan", label: "Kế Toán", icon: Wallet,
    children: [
      { key: "acc-invoice", label: "Hoá Đơn",            addable: true  },
      { key: "acc-history", label: "Lịch Sử Thu Chi",   addable: false },
      { key: "acc-fund",    label: "Sổ Quỹ & Chốt Sổ", addable: false },
      { key: "acc-shift",   label: "Chốt Ca",            addable: false },
    ],
  },
  {
    key: "khach-hang", label: "Khách Hàng", icon: Users,
    children: [
      { key: "customer-new",  label: "Tạo Mới",   addable: true  },
      { key: "customers",     label: "Danh Sách", addable: true  },
    ],
  },
  {
    key: "dich-vu", label: "Dịch Vụ", icon: ClipboardList,
    children: [
      { key: "services",      label: "Dịch Vụ",   addable: true  },
      { key: "prescription",  label: "Đơn Thuốc", addable: false },
    ],
  },
  {
    key: "kho", label: "Kho", icon: Package,
    children: [
      { key: "wh-manage",   label: "Quản Lý Kho",        addable: false },
      { key: "wh-material", label: "Vật Tư & Lô Vật Tư", addable: false },
      { key: "wh-lookup",   label: "Tra Cứu Biến Động",  addable: false },
      { key: "wh-lock",     label: "Chốt Kho",           addable: false },
      { key: "wh-raw",      label: "Nguyên Vật Liệu",    addable: false },
      { key: "wh-setting",  label: "Cài Đặt",            addable: false },
    ],
  },
  {
    key: "marketing", label: "Marketing", icon: Megaphone,
    children: [
      { key: "mk-discount", label: "Khuyến Mãi",    addable: false },
      { key: "mk-filter",   label: "Lọc Khách Hàng", addable: false },
    ],
  },
  {
    key: "tich-hop", label: "Tích Hợp", icon: Plug,
    children: [
      { key: "int-sms",  label: "Lịch Sử SMS & ZNS", addable: false },
      { key: "int-call", label: "Lịch Sử Gọi",       addable: false },
      { key: "int-voip", label: "Gọi Hội Thoại",     addable: false },
    ],
  },
  {
    key: "nhan-vien", label: "Nhân Viên & User", icon: UserCog,
    children: [
      { key: "staff-list",     label: "Nhân Viên",      addable: false },
      { key: "staff-users",    label: "Danh Sách User", addable: false },
      { key: "staff-schedule", label: "Lịch Làm Việc",  addable: false },
      { key: "staff-perm",     label: "Phân Quyền",     addable: false },
    ],
  },
  {
    key: "cau-hinh", label: "Cấu Hình", icon: Settings,
    children: [
      { key: "cfg-category", label: "Danh Mục",        addable: false },
      { key: "cfg-print",    label: "Cấu Hình Mẫu In", addable: false },
      { key: "cfg-log",      label: "Lịch Sử",         addable: false },
    ],
  },
  {
    key: "bao-cao", label: "Báo Cáo", icon: BarChart3,
    children: [
      { key: "reports", label: "Danh Sách Báo Cáo", addable: false },
    ],
  },
];

// Tìm child item theo view key
export function findNavChild(viewKey) {
  for (const group of NAV) {
    const child = group.children.find((c) => c.key === viewKey);
    if (child) return { group, child };
  }
  return null;
}

export const STORAGE_KEY = "denta:data:v1";
