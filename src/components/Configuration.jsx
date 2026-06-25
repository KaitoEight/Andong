import { Tag, FileText, History, Eye, CheckCircle2 } from "lucide-react";
import { todayStr, fmtDate } from "../utils/helpers";

// ─── Danh Mục ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    title: "Trạng Thái Lịch Hẹn",
    items: [
      { label: "Chờ xác nhận", color: "bg-amber-50 text-amber-700 border-amber-200" },
      { label: "Đã xác nhận",  color: "bg-sky-50 text-sky-700 border-sky-200" },
      { label: "Đã đến",       color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { label: "Hoàn thành",   color: "bg-emerald-600 text-white border-emerald-600" },
      { label: "Đã hủy",       color: "bg-rose-50 text-rose-700 border-rose-200" },
      { label: "Không đến",    color: "bg-slate-100 text-slate-500 border-slate-200" },
    ],
  },
  {
    title: "Loại Chăm Sóc",
    items: [
      { label: "Sau điều trị",        color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { label: "Nhắc lịch hẹn",       color: "bg-sky-50 text-sky-700 border-sky-200" },
      { label: "Sinh nhật",            color: "bg-violet-50 text-violet-700 border-violet-200" },
      { label: "Hẹn không đến",        color: "bg-slate-100 text-slate-500 border-slate-200" },
      { label: "Giải quyết khiếu nại", color: "bg-rose-50 text-rose-700 border-rose-200" },
    ],
  },
  {
    title: "Nhóm Khách Hàng",
    items: [
      { label: "Mới",        color: "bg-slate-100 text-slate-600 border-slate-200" },
      { label: "Khách quen", color: "bg-sky-50 text-sky-700 border-sky-200" },
      { label: "VIP",        color: "bg-amber-50 text-amber-700 border-amber-200" },
    ],
  },
  {
    title: "Nhóm Dịch Vụ",
    items: [
      { label: "Tổng quát", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { label: "Điều trị",  color: "bg-sky-50 text-sky-700 border-sky-200" },
      { label: "Tiểu phẫu", color: "bg-rose-50 text-rose-700 border-rose-200" },
      { label: "Chỉnh nha", color: "bg-violet-50 text-violet-700 border-violet-200" },
      { label: "Phục hình", color: "bg-amber-50 text-amber-700 border-amber-200" },
    ],
  },
];

function CfgCategory() {
  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-sky-50 text-sky-700"><Tag size={20} /></div>
        <div>
          <h2 className="font-semibold text-slate-800">Danh Mục Cấu Hình</h2>
          <p className="text-xs text-slate-500">Các danh mục dùng trong hệ thống (chỉ xem)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => (
          <div key={cat.title} className="card p-4">
            <h3 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              {cat.title}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {cat.items.map((item) => (
                <span key={item.label} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${item.color}`}>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Để thêm / sửa danh mục, vui lòng liên hệ quản trị viên hệ thống.
      </p>
    </div>
  );
}

// ─── Cấu Hình Mẫu In ─────────────────────────────────────────────────────────
const PRINT_TEMPLATES = [
  { id: "pt1", name: "Phiếu Hẹn",          desc: "In phiếu xác nhận lịch hẹn cho bệnh nhân.",        icon: "📅" },
  { id: "pt2", name: "Đơn Thuốc",           desc: "Mẫu đơn thuốc theo chuẩn Bộ Y Tế.",                icon: "💊" },
  { id: "pt3", name: "Hóa Đơn Dịch Vụ",   desc: "Hóa đơn thanh toán dịch vụ khám chữa bệnh.",       icon: "🧾" },
  { id: "pt4", name: "Phiếu Điều Trị",      desc: "Tóm tắt quá trình điều trị và kế hoạch tiếp theo.", icon: "🦷" },
  { id: "pt5", name: "Báo Cáo Doanh Thu",  desc: "Báo cáo doanh thu theo ngày / tháng.",              icon: "📊" },
];

function CfgPrint() {
  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-50 text-amber-700"><FileText size={20} /></div>
        <div>
          <h2 className="font-semibold text-slate-800">Cấu Hình Mẫu In</h2>
          <p className="text-xs text-slate-500">Quản lý các mẫu in của phòng khám</p>
        </div>
      </div>

      <div className="space-y-2">
        {PRINT_TEMPLATES.map((tpl) => (
          <div key={tpl.id} className="card p-4 flex items-center gap-4">
            <div className="text-2xl w-10 text-center">{tpl.icon}</div>
            <div className="flex-1">
              <div className="font-semibold text-slate-800">{tpl.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{tpl.desc}</div>
            </div>
            <button
              onClick={() => alert(`Xem trước mẫu "${tpl.name}" — tính năng đang phát triển.`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition"
            >
              <Eye size={13} /> Xem trước
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Lịch Sử ─────────────────────────────────────────────────────────────────
function buildMockLog(data) {
  const today = todayStr();
  const log = [];

  // Add entries based on recent appointments
  const recentAppts = (data?.appts || [])
    .filter((a) => a.date === today)
    .slice(0, 3);

  recentAppts.forEach((a) => {
    const c = (data?.customers || []).find((c) => c.id === a.customerId);
    if (a.status === "done") {
      log.push({ time: a.time, user: a.doctor || "Hệ thống", action: "Hoàn thành lịch hẹn", detail: `Khách: ${c?.name || "—"}` });
    } else if (a.status === "arrived") {
      log.push({ time: a.time, user: "Lễ tân", action: "Check-in khách", detail: `Khách: ${c?.name || "—"}` });
    }
  });

  // Static mock entries
  log.push(
    { time: "08:15", user: "Admin",    action: "Đăng nhập hệ thống",   detail: "IP: 192.168.1.10" },
    { time: "08:30", user: "Thu Nga",  action: "Thêm lịch hẹn mới",    detail: "Khách: Lê Hoàng Phúc · 14:00" },
    { time: "09:05", user: "BS. Nam Hưng", action: "Cập nhật trạng thái", detail: "Lịch hẹn → Hoàn thành" },
    { time: "10:00", user: "Admin",    action: "Thêm nhân viên",        detail: "BS. Thu Hà (Chỉnh Nha)" },
    { time: "11:30", user: "Thu Nga",  action: "Tìm kiếm khách hàng",  detail: "Từ khóa: Nguyễn" },
  );

  return log.sort((a, b) => b.time.localeCompare(a.time));
}

function CfgLog({ data }) {
  const logs = buildMockLog(data);

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-100 text-slate-600"><History size={20} /></div>
        <div>
          <h2 className="font-semibold text-slate-800">Lịch Sử Hoạt Động</h2>
          <p className="text-xs text-slate-500">Nhật ký thao tác hệ thống hôm nay · {fmtDate(todayStr())}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
              <th className="px-4 py-2.5 text-left">Thời Gian</th>
              <th className="px-4 py-2.5 text-left">Người Dùng</th>
              <th className="px-4 py-2.5 text-left">Hành Động</th>
              <th className="px-4 py-2.5 text-left">Chi Tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log, i) => (
              <tr key={i} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.time}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {log.user}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{log.action}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{log.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── main export ────────────────────────────────────────────────────────────
export default function Configuration({ view, data }) {
  switch (view) {
    case "cfg-category": return <CfgCategory />;
    case "cfg-print":    return <CfgPrint    />;
    case "cfg-log":      return <CfgLog data={data} />;
    default:             return <CfgCategory />;
  }
}
