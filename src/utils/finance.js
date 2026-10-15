// Nguồn tài chính thống nhất cho toàn app.
// - Doanh số / Phát sinh (billed) = tổng dịch vụ đã chốt (customer.services)
// - Đã thu (collected)            = tổng invoices.paid (phiếu thanh toán)
// - Công nợ (debt)                = billed - collected

// Gộp toàn bộ dịch vụ đã chốt của mọi khách thành danh sách giao dịch doanh số
export function allServices(data) {
  return (data?.customers || []).flatMap((c) =>
    (c.services || []).map((r) => ({
      ...r,
      customerId: c.id,
      customerName: c.name,
      customerCode: c.code,
    }))
  );
}

export function financeSummary(data) {
  const services  = allServices(data);
  const billed    = services.reduce((s, r) => s + (r.total || 0), 0);
  const collected = (data?.invoices || []).reduce((s, i) => s + (i.paid || 0), 0);
  return { services, billed, collected, debt: billed - collected };
}

// Số tiền đã thu cho 1 khách (từ các hoá đơn của khách đó)
export function paidOfCustomer(data, customerId) {
  return (data?.invoices || [])
    .filter((i) => i.customerId === customerId)
    .reduce((s, i) => s + (i.paid || 0), 0);
}

// Trạng thái thanh toán của một hoá đơn / phiếu thu, tính từ số tiền (không tin vào trường `status` đã lưu:
// phiếu thu lập từ tab Thanh toán của khách trước đây không có `status`, hoặc bị cũ sau khi sửa số tiền).
export function invoiceStatus(total, paid) {
  total = Number(total) || 0; paid = Number(paid) || 0;
  if (paid >= total && total > 0) return "paid";
  if (paid > 0) return "partial";
  return "unpaid";
}
