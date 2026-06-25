import { MessageSquare, Phone, Radio, CheckCircle2, XCircle, PhoneCall } from "lucide-react";
import { fmtDate } from "../utils/helpers";

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_SMS = [
  { id: 1, customer: "Trương Trung Vĩ",  type: "ZNS",  message: "Nhắc lịch hẹn ngày 14/06/2026 lúc 09:00 - Trám răng thẩm mỹ tại Nha Khoa An Đông.", date: "2026-06-13", status: "sent"  },
  { id: 2, customer: "Nguyễn Thị Mai",   type: "SMS",  message: "Chúc mừng sinh nhật! Nha Khoa An Đông tặng bạn voucher giảm 10% cho lần khám tiếp theo.", date: "2026-06-10", status: "sent"  },
  { id: 3, customer: "Lê Hoàng Phúc",    type: "ZNS",  message: "Xác nhận lịch hẹn ngày 13/06/2026. Vui lòng đến trước 15 phút.", date: "2026-06-13", status: "sent"  },
  { id: 4, customer: "Trương Trung Vĩ",  type: "SMS",  message: "Cảm ơn bạn đã sử dụng dịch vụ. Phản hồi chất lượng tại: nhakoaandong.vn/feedback", date: "2026-06-05", status: "error" },
  { id: 5, customer: "Nguyễn Thị Mai",   type: "ZNS",  message: "Nhắc lịch tái khám sau điều trị cạo vôi. Vui lòng liên hệ để đặt lịch.", date: "2026-06-01", status: "sent"  },
];

const MOCK_CALLS = [
  { id: 1, customer: "Trương Trung Vĩ",  direction: "Gọi ra",  duration: "2:35", phone: "0933896323", date: "2026-06-13", status: "answered"  },
  { id: 2, customer: "Nguyễn Thị Mai",   direction: "Gọi vào", duration: "1:10", phone: "0901234567", date: "2026-06-13", status: "answered"  },
  { id: 3, customer: "Lê Hoàng Phúc",    direction: "Gọi ra",  duration: "0:00", phone: "0977555888", date: "2026-06-12", status: "missed"    },
  { id: 4, customer: "Khách lạ",          direction: "Gọi vào", duration: "3:45", phone: "0912345678", date: "2026-06-11", status: "answered"  },
  { id: 5, customer: "Trương Trung Vĩ",  direction: "Gọi ra",  duration: "4:20", phone: "0933896323", date: "2026-06-10", status: "answered"  },
];

// ─── SMS & ZNS ───────────────────────────────────────────────────────────────
function IntSms() {
  const sentCount  = MOCK_SMS.filter((m) => m.status === "sent").length;
  const errorCount = MOCK_SMS.filter((m) => m.status === "error").length;

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-sky-50 text-sky-700"><MessageSquare size={20} /></div>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-800">Lịch Sử SMS & ZNS</h2>
          <p className="text-xs text-slate-500">{MOCK_SMS.length} tin nhắn · {sentCount} thành công · {errorCount} lỗi</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
              <th className="px-4 py-2.5 text-left">Khách Hàng</th>
              <th className="px-4 py-2.5 text-center">Loại</th>
              <th className="px-4 py-2.5 text-left">Nội Dung</th>
              <th className="px-4 py-2.5 text-left">Ngày Gửi</th>
              <th className="px-4 py-2.5 text-center">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_SMS.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-medium text-slate-800">{m.customer}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                    m.type === "ZNS"
                      ? "bg-violet-50 text-violet-700 border-violet-200"
                      : "bg-sky-50 text-sky-700 border-sky-200"
                  }`}>
                    {m.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate">{m.message}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(m.date)}</td>
                <td className="px-4 py-3 text-center">
                  {m.status === "sent" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <CheckCircle2 size={13} /> Đã gửi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-medium">
                      <XCircle size={13} /> Lỗi
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Call history ─────────────────────────────────────────────────────────────
function IntCall() {
  const answeredCount = MOCK_CALLS.filter((c) => c.status === "answered").length;
  const missedCount   = MOCK_CALLS.filter((c) => c.status === "missed").length;

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700"><Phone size={20} /></div>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-800">Lịch Sử Cuộc Gọi</h2>
          <p className="text-xs text-slate-500">{MOCK_CALLS.length} cuộc gọi · {answeredCount} trả lời · {missedCount} nhỡ</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
              <th className="px-4 py-2.5 text-left">Khách Hàng</th>
              <th className="px-4 py-2.5 text-left">Số ĐT</th>
              <th className="px-4 py-2.5 text-center">Chiều</th>
              <th className="px-4 py-2.5 text-center">Thời Lượng</th>
              <th className="px-4 py-2.5 text-left">Ngày</th>
              <th className="px-4 py-2.5 text-center">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_CALLS.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-medium text-slate-800">{c.customer}</td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{c.phone}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                    c.direction === "Gọi ra"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-sky-50 text-sky-700 border-sky-200"
                  }`}>
                    {c.direction}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-slate-600 font-mono text-xs">{c.duration}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(c.date)}</td>
                <td className="px-4 py-3 text-center">
                  {c.status === "answered" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <PhoneCall size={12} /> Trả lời
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-medium">
                      <XCircle size={12} /> Nhỡ
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── VOIP ─────────────────────────────────────────────────────────────────────
function IntVoip() {
  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-50 text-violet-700"><Radio size={20} /></div>
        <div>
          <h2 className="font-semibold text-slate-800">Gọi Hội Thoại (VOIP)</h2>
          <p className="text-xs text-slate-500">Tích hợp tổng đài IP cho phòng khám</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            step: "1",
            title: "Đăng ký dịch vụ VOIP",
            desc: "Liên hệ nhà cung cấp VOIP như Stringee, CloudPBX, hoặc VinaTel để đăng ký số hotline cho phòng khám.",
          },
          {
            step: "2",
            title: "Cấu hình đầu số",
            desc: "Nhập thông tin SIP Server, SIP Username, SIP Password vào phần Cài Đặt Tích Hợp của hệ thống.",
          },
          {
            step: "3",
            title: "Cài đặt softphone",
            desc: "Cài đặt ứng dụng điện thoại mềm trên máy tính lễ tân (Zoiper, MicroSIP) hoặc dùng webRTC tích hợp sẵn.",
          },
          {
            step: "4",
            title: "Kết nối với dữ liệu KH",
            desc: "Khi có cuộc gọi đến, hệ thống tự động tra cứu khách hàng theo số điện thoại và hiển thị thông tin lịch hẹn.",
          },
        ].map((item) => (
          <div key={item.step} className="card p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {item.step}
              </div>
              <div>
                <div className="font-semibold text-slate-800 mb-1">{item.title}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-700">
        <strong>Trạng thái:</strong> Chưa kết nối. Tính năng VOIP đang trong giai đoạn tích hợp. Liên hệ support để được hỗ trợ cấu hình.
      </div>
    </div>
  );
}

// ─── main export ────────────────────────────────────────────────────────────
export default function Integration({ view }) {
  switch (view) {
    case "int-sms":  return <IntSms  />;
    case "int-call": return <IntCall />;
    case "int-voip": return <IntVoip />;
    default:         return <IntSms  />;
  }
}
