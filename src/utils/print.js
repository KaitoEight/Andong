import { fmtVND, fmtDate } from "./helpers";

// Thông tin phòng khám in trên mọi mẫu (một chỗ duy nhất để sửa).
// LƯU Ý: địa chỉ & số điện thoại dưới đây vẫn là số liệu mẫu — hãy thay bằng thông tin thật của Nha Khoa An Đông.
export const CLINIC = {
  name: "Nha Khoa An Đông",
  address: "81, Đường Nguyễn Duy Dương, Quận 5, TP. Hồ Chí Minh",
  phone: "0336699387",
  email: "nhakhoaandong@gmail.com",
};

const STYLE = `
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; padding: 28px 32px; }
  .head { display:flex; align-items:center; gap:14px; border-bottom:2px solid #10b981; padding-bottom:14px; margin-bottom:18px; }
  .logo { width:48px; height:48px; border-radius:12px; background:#10b981; color:#fff; display:grid; place-items:center; font-weight:700; font-size:24px; }
  .clinic-name { font-size:18px; font-weight:700; color:#0f766e; text-transform:uppercase; }
  .clinic-sub { font-size:12px; color:#64748b; margin-top:2px; }
  h1 { font-size:20px; text-align:center; margin:8px 0 4px; letter-spacing:1px; }
  .meta { text-align:center; font-size:12px; color:#64748b; margin-bottom:18px; }
  .row { display:flex; justify-content:space-between; gap:24px; margin-bottom:14px; font-size:13px; }
  .row .label { color:#64748b; }
  table { width:100%; border-collapse:collapse; margin:14px 0; font-size:13px; }
  th, td { border:1px solid #e2e8f0; padding:8px 10px; text-align:left; }
  th { background:#f8fafc; font-weight:600; }
  td.num, th.num { text-align:right; }
  td.ctr, th.ctr { text-align:center; }
  .total { text-align:right; font-size:15px; font-weight:700; margin-top:8px; }
  .total span { color:#0f766e; }
  .sign { display:flex; justify-content:space-between; margin-top:40px; text-align:center; font-size:13px; }
  .sign div { width:45%; }
  .sign .ttl { font-weight:600; }
  .sign .hint { color:#94a3b8; font-size:11px; font-style:italic; }
  .note { font-size:12px; color:#475569; margin-top:10px; }
  @media print { body { padding:0; } }
`;

// Thoát ký tự HTML: dữ liệu khách / dịch vụ do người dùng nhập được chèn vào cửa sổ in, không được để chạy như mã.
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Mở cửa sổ in. css: định dạng riêng của mẫu (khổ giấy @page…). base=false: không dùng kiểu mặc định ở trên.
// preview=true: chỉ xem (không tự bật hộp thoại in) và có nút "In" nổi ở góc.
export function openPrintWindow(title, body, { css = "", base = true, preview = false } = {}) {
  const w = window.open("", "_blank", "width=900,height=960");
  if (!w) { alert("Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup rồi thử lại."); return; }
  const tail = preview
    ? `<button class="no-print" onclick="window.print()" style="position:fixed;right:16px;top:16px;padding:8px 18px;border:0;border-radius:8px;background:#047857;color:#fff;font:600 13px sans-serif;cursor:pointer">In</button>`
    : `<script>window.onload=function(){window.focus();window.print();}</script>`;
  w.document.write(
    `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${base ? STYLE : ""}${css}@media print{.no-print{display:none!important}}</style></head>` +
    `<body>${body}${tail}</body></html>`
  );
  w.document.close();
}
const open = (title, body) => openPrintWindow(title, body);

function header() {
  return `<div class="head">
    <div class="logo">N</div>
    <div>
      <div class="clinic-name">${CLINIC.name}</div>
      <div class="clinic-sub">${CLINIC.address}<br/>ĐT: ${CLINIC.phone} · ${CLINIC.email}</div>
    </div>
  </div>`;
}

function sign(left, right) {
  return `<div class="sign">
    <div><div class="ttl">${left}</div><div class="hint">(Ký, ghi rõ họ tên)</div></div>
    <div><div class="ttl">${right}</div><div class="hint">(Ký, ghi rõ họ tên)</div></div>
  </div>`;
}

// ── Đơn thuốc ────────────────────────────────────────────────────────────────
export function printPrescription(presc, customer) {
  const rows = (presc.meds || []).map((m, i) => `
    <tr>
      <td class="ctr">${i + 1}</td>
      <td>${m.name}</td>
      <td class="ctr">${m.qty || ""} ${m.unit || ""}</td>
      <td>${m.usage || ""}</td>
    </tr>`).join("");
  open(`Đơn thuốc ${presc.code || ""}`,
    header() +
    `<h1>ĐƠN THUỐC</h1>
     <div class="meta">${presc.code ? "Số: " + presc.code + " · " : ""}Ngày: ${fmtDate(presc.date)}</div>
     <div class="row">
       <div><span class="label">Bệnh nhân:</span> <b>${customer?.name || presc.customerName || "—"}</b></div>
       <div><span class="label">SĐT:</span> ${customer?.phone || "—"}</div>
     </div>
     ${presc.diagnosis ? `<div class="row"><div><span class="label">Chẩn đoán:</span> ${presc.diagnosis}</div></div>` : ""}
     <table>
       <thead><tr><th class="ctr">STT</th><th>Tên thuốc</th><th class="ctr">Số lượng</th><th>Cách dùng</th></tr></thead>
       <tbody>${rows || `<tr><td colspan="4" class="ctr">Chưa có thuốc</td></tr>`}</tbody>
     </table>
     ${presc.note ? `<div class="note">Lời dặn: ${presc.note}</div>` : ""}
     ${sign("Bệnh nhân", "Bác sĩ")}`
  );
}

// ── Phiếu hẹn ────────────────────────────────────────────────────────────────
export function printAppointment(appt, customer, serviceName) {
  open(`Phiếu hẹn`,
    header() +
    `<h1>PHIẾU HẸN KHÁM</h1>
     <div class="meta">Ngày in: ${fmtDate(new Date().toISOString().slice(0,10))}</div>
     <div class="row"><div><span class="label">Khách hàng:</span> <b>${customer?.name || "—"}</b></div>
       <div><span class="label">SĐT:</span> ${customer?.phone || "—"}</div></div>
     <table>
       <tbody>
         <tr><th style="width:35%">Ngày hẹn</th><td>${fmtDate(appt.date)}</td></tr>
         <tr><th>Giờ hẹn</th><td>${appt.time}</td></tr>
         <tr><th>Dịch vụ</th><td>${serviceName || "—"}</td></tr>
         <tr><th>Bác sĩ</th><td>${appt.doctor || "—"}</td></tr>
         ${appt.note ? `<tr><th>Ghi chú</th><td>${appt.note}</td></tr>` : ""}
       </tbody>
     </table>
     <div class="note">Quý khách vui lòng đến trước giờ hẹn 10 phút. Xin cảm ơn!</div>
     ${sign("Khách hàng", "Lễ tân")}`
  );
}
