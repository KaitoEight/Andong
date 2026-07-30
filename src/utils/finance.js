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
