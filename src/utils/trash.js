import { apiFetch } from "./api";

// "Dữ liệu đã xoá": mọi thứ bị xoá đều được lưu bản sao lên máy chủ TRƯỚC khi xoá thật.
// Chỉ vai trò Quản lý xem / khôi phục / xoá vĩnh viễn được (máy chủ kiểm tra quyền, không chỉ ẩn trên giao diện).

export const TRASH_TYPES = {
  service: "Dịch vụ (bảng giá)",
  customerService: "Dịch vụ đã chốt của khách",
  invoice: "Hoá đơn / phiếu thu",
  customer: "Khách hàng",
  treatment: "Phiên điều trị",
  record: "Hồ sơ khách (tiền sử, tư vấn, xét nghiệm, complaint)",
};

export const BACKUP_NOTE = 'Bản sao được lưu ở Cấu hình → "Dữ liệu đã xoá" (chỉ Quản lý xem và khôi phục được).';
export const ARCHIVE_FAIL_MSG = 'Không lưu được bản sao vào mục "Dữ liệu đã xoá" (kiểm tra kết nối hoặc đăng nhập lại).\nChưa xoá gì cả.';

// Lưu bản sao. Trả về { ok, error }; ok = true khi máy chủ đã lưu an toàn.
export async function archiveDeleted({ type, label, summary = "", customerId = "", payload }) {
  const r = await apiFetch("/trash", { method: "POST", body: { type, label, summary, customerId, payload } });
  return r?.ok ? { ok: true } : { ok: false, error: r?.error || "" };
}

// Quy trình chung cho mọi nút xoá: hỏi xác nhận → lưu bản sao → (trả true) cho phép xoá thật.
// Nếu không lưu được bản sao thì KHÔNG xoá (trả false) để không bao giờ mất dữ liệu không có bản sao.
export async function confirmAndArchive(message, entry) {
  if (!window.confirm(`${message}\n${BACKUP_NOTE}`)) return false;
  const res = await archiveDeleted(entry);
  if (!res.ok) {
    // Hay gặp nhất: vừa cập nhật phần mềm nhưng máy chủ chưa được khởi động lại (chưa có chức năng lưu bản sao)
    const hint = /HTTP 404|HTTP 5\d\d|kết nối/.test(res.error) || !res.error
      ? "\n\nNếu vừa cập nhật phần mềm: hãy TẮT máy chủ (cửa sổ run.bat) rồi chạy lại, sau đó F5 trang."
      : "";
    window.alert(`${ARCHIVE_FAIL_MSG}${res.error ? `\nChi tiết: ${res.error}` : ""}${hint}`);
    return false;
  }
  return true;
}

const RECORD_FIELDS = ["history", "consultations", "labtests", "complaints"];
const has = (arr, id) => (arr || []).some((x) => x && x.id === id);
const missingCustomer = "Khách hàng của mục này không còn trong hệ thống. Hãy khôi phục khách hàng trước (nếu có trong danh sách).";

// Đưa một mục đã xoá trở lại dữ liệu. Trả { data, note? } hoặc { error }.
export function applyRestore(data, entry) {
  const p = entry.payload || {};
  switch (entry.type) {
    case "service": {
      const s = p.service;
      if (!s) return { error: "Bản sao thiếu dữ liệu." };
      if (has(data.services, s.id)) return { error: "Dịch vụ này đã có trong bảng giá." };
      return { data: { ...data, services: [...(data.services || []), s] } };
    }
    case "invoice": {
      const inv = p.invoice;
      if (!inv) return { error: "Bản sao thiếu dữ liệu." };
      if (has(data.invoices, inv.id)) return { error: "Hoá đơn / phiếu thu này đã có trong hệ thống." };
      const hasCust = (data.customers || []).some((c) => c.id === inv.customerId);
      return {
        data: { ...data, invoices: [...(data.invoices || []), inv] },
        note: hasCust ? "" : "Lưu ý: khách hàng của hoá đơn này hiện không còn trong hệ thống.",
      };
    }
    case "customerService":
    case "treatment":
    case "record": {
      const rec = p.record;
      const prop = entry.type === "customerService" ? "services" : entry.type === "treatment" ? "treatments" : p.field;
      if (!rec) return { error: "Bản sao thiếu dữ liệu." };
      if (entry.type === "record" && !RECORD_FIELDS.includes(prop)) return { error: "Loại hồ sơ không hợp lệ." };
      const cust = (data.customers || []).find((c) => c.id === p.customerId);
      if (!cust) return { error: missingCustomer };
      if (has(cust[prop], rec.id)) return { error: "Mục này đã có trong hồ sơ khách." };
      return { data: { ...data, customers: data.customers.map((c) => (c.id === cust.id ? { ...c, [prop]: [...(c[prop] || []), rec] } : c)) } };
    }
    case "customer": {
      const c = p.customer;
      if (!c) return { error: "Bản sao thiếu dữ liệu." };
      if (has(data.customers, c.id)) return { error: "Khách hàng này đã có trong hệ thống." };
      const add = (cur, extra) => [...(cur || []), ...(extra || []).filter((x) => !has(cur, x.id))];
      return {
        data: {
          ...data,
          customers: [...(data.customers || []), c],
          appts: add(data.appts, p.appts),
          invoices: add(data.invoices, p.invoices),
          care: add(data.care, p.care),
        },
      };
    }
    default:
      return { error: "Loại dữ liệu chưa hỗ trợ khôi phục." };
  }
}
