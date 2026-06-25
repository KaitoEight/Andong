function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function seedData() {
  const t = todayStr();
  return {
    services: [
      { id: "sv1", name: "Khám & tư vấn",      group: "Tổng quát", price: 0,        mins: 20 },
      { id: "sv2", name: "Cạo vôi răng",        group: "Tổng quát", price: 350000,   mins: 30 },
      { id: "sv3", name: "Trám răng thẩm mỹ",  group: "Điều trị",  price: 500000,   mins: 45 },
      { id: "sv4", name: "Nhổ răng khôn",       group: "Tiểu phẫu", price: 1500000,  mins: 60 },
      { id: "sv5", name: "Niềng răng mắc cài", group: "Chỉnh nha", price: 35000000, mins: 60 },
      { id: "sv6", name: "Cấy ghép Implant",    group: "Phục hình", price: 18000000, mins: 90 },
    ],
    customers: [
      { id: "kh1", code: "NK000001", name: "Trương Trung Vĩ", gender: "Nam", phone: "0933896323", dob: "1995-04-12", address: "Q.5, TP.HCM",   group: "Khách quen", note: "" },
      { id: "kh2", code: "NK000002", name: "Nguyễn Thị Mai",  gender: "Nữ",  phone: "0901234567", dob: "1988-09-30", address: "Q.10, TP.HCM",  group: "Mới",        note: "Dị ứng kháng sinh." },
      { id: "kh3", code: "NK000003", name: "Lê Hoàng Phúc",   gender: "Nam", phone: "0977555888", dob: "2001-01-20", address: "Q.Bình Thạnh",  group: "Mới",        note: "" },
    ],
    appts: [
      { id: "ap1", customerId: "kh1", serviceId: "sv3", doctor: "BS. Nam Hưng", date: t, time: "09:00", status: "confirmed", note: "" },
      { id: "ap2", customerId: "kh2", serviceId: "sv2", doctor: "BS. Nam Hưng", date: t, time: "10:30", status: "arrived",   note: "" },
      { id: "ap3", customerId: "kh3", serviceId: "sv1", doctor: "BS. Thu Hà",   date: t, time: "14:00", status: "pending",   note: "Khách hẹn qua điện thoại." },
    ],
    care: [
      { id: "cr1", customerId: "kh2", type: "Sau điều trị", content: "Gọi hỏi thăm sau cạo vôi.", status: "Chưa xử lý", callback: t },
    ],
    staff: [
      { id: "st1", code: "NV001", name: "BS. Nam Hưng", role: "Bác Sĩ",      specialty: "Nha Khoa Tổng Quát", phone: "0901111111", active: true },
      { id: "st2", code: "NV002", name: "BS. Thu Hà",   role: "Bác Sĩ",      specialty: "Chỉnh Nha",          phone: "0902222222", active: true },
      { id: "st3", code: "NV003", name: "Thu Nga",       role: "Lễ Tân",      specialty: "",                   phone: "0903333333", active: true },
    ],
    discounts: [
      { id: "dc1", code: "KHAI_TRUONG", name: "Khai Trương",    type: "percent", value: 10, minOrder: 0,      startDate: "2026-01-01", endDate: "2026-12-31", active: true  },
      { id: "dc2", code: "VIP20",       name: "VIP Khách Quen", type: "percent", value: 20, minOrder: 500000, startDate: "2026-01-01", endDate: "2026-12-31", active: true  },
    ],
    invoices: [
      {
        id: "inv1", code: "HD000001", customerId: "kh1", date: t,
        items: [{ name: "Trám răng thẩm mỹ", qty: 1, price: 500000 }],
        total: 500000, paid: 500000, method: "Tiền mặt", status: "paid", note: "",
      },
      {
        id: "inv2", code: "HD000002", customerId: "kh2", date: t,
        items: [{ name: "Cạo vôi răng", qty: 1, price: 350000 }, { name: "Khám & tư vấn", qty: 1, price: 0 }],
        total: 350000, paid: 200000, method: "Chuyển khoản", status: "partial", note: "Còn nợ 150.000đ",
      },
    ],
  };
}

module.exports = { seedData };
