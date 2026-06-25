import { useState } from "react";
import Modal from "./ui/Modal";
import Field, { inputCls, btnPrimary, btnGhost } from "./ui/Field";
import { uid, todayStr } from "../utils/helpers";

const TITLES = {
  appt:     "Thêm lịch hẹn",
  customer: "Thêm khách hàng",
  service:  "Thêm dịch vụ",
  care:     "Thêm chăm sóc",
  staff:    "Thêm nhân viên",
  discount: "Thêm khuyến mãi",
};

function initForm(kind, data) {
  if (kind === "appt")     return { customerId: data.customers[0]?.id || "", serviceId: data.services[0]?.id || "", doctor: "BS. Nam Hưng", date: todayStr(), time: "09:00", note: "" };
  if (kind === "customer") return { name: "", phone: "", gender: "Nam", dob: "", address: "", group: "Mới", note: "" };
  if (kind === "service")  return { name: "", group: "Tổng quát", price: "", mins: "30" };
  if (kind === "staff")    return { name: "", role: "Bác Sĩ", specialty: "", phone: "" };
  if (kind === "discount") return { code: "", name: "", type: "percent", value: "", minOrder: "0", startDate: todayStr(), endDate: "" };
  return { customerId: data.customers[0]?.id || "", type: "Sau điều trị", content: "", callback: todayStr() };
}

export default function AddForm({ kind, data, setData, onClose }) {
  const [f, setF] = useState(() => initForm(kind, data));
  const set = (k, v) => setF({ ...f, [k]: v });

  const valid =
    kind === "appt"     ? f.customerId && f.serviceId :
    kind === "customer" ? f.name.trim() && f.phone.trim() :
    kind === "service"  ? f.name.trim() :
    kind === "staff"    ? f.name.trim() :
    kind === "discount" ? f.code.trim() && f.name.trim() :
    f.customerId && f.content.trim();

  const submit = () => {
    if (!valid) return;
    if (kind === "appt")
      setData({ ...data, appts: [...data.appts, { id: uid("ap"), status: "pending", ...f }] });
    if (kind === "customer") {
      const n = data.customers.length + 1;
      setData({ ...data, customers: [...data.customers, { id: uid("kh"), code: "NK" + String(n).padStart(6, "0"), ...f }] });
    }
    if (kind === "service")
      setData({ ...data, services: [...data.services, { id: uid("sv"), ...f, price: Number(f.price) || 0, mins: Number(f.mins) || 0 }] });
    if (kind === "care")
      setData({ ...data, care: [...data.care, { id: uid("cr"), status: "Chưa xử lý", ...f }] });
    if (kind === "staff") {
      const n = (data.staff || []).length + 1;
      const code = "NV" + String(n).padStart(3, "0");
      setData({ ...data, staff: [...(data.staff || []), { id: uid("st"), code, active: true, ...f }] });
    }
    if (kind === "discount")
      setData({ ...data, discounts: [...(data.discounts || []), { id: uid("dc"), active: true, ...f, value: Number(f.value) || 0, minOrder: Number(f.minOrder) || 0 }] });
    onClose();
  };

  return (
    <Modal
      title={TITLES[kind]}
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onClose}>Hủy</button>
          <button className={btnPrimary + (valid ? "" : " opacity-50 pointer-events-none")} onClick={submit}>Lưu</button>
        </>
      }
    >
      {kind === "appt" && (
        <>
          <Field label="Khách hàng">
            <select className={inputCls} value={f.customerId} onChange={(e) => set("customerId", e.target.value)}>
              {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Dịch vụ">
            <select className={inputCls} value={f.serviceId} onChange={(e) => set("serviceId", e.target.value)}>
              {data.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày"><input type="date" className={inputCls} value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
            <Field label="Giờ"><input type="time" className={inputCls} value={f.time} onChange={(e) => set("time", e.target.value)} /></Field>
          </div>
          <Field label="Bác sĩ"><input className={inputCls} value={f.doctor} onChange={(e) => set("doctor", e.target.value)} /></Field>
          <Field label="Ghi chú"><input className={inputCls} value={f.note} onChange={(e) => set("note", e.target.value)} /></Field>
        </>
      )}

      {kind === "customer" && (
        <>
          <Field label="Họ tên"><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số điện thoại"><input className={inputCls} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="Giới tính">
              <select className={inputCls} value={f.gender} onChange={(e) => set("gender", e.target.value)}>
                <option>Nam</option><option>Nữ</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày sinh"><input type="date" className={inputCls} value={f.dob} onChange={(e) => set("dob", e.target.value)} /></Field>
            <Field label="Nhóm KH">
              <select className={inputCls} value={f.group} onChange={(e) => set("group", e.target.value)}>
                <option>Mới</option><option>Khách quen</option><option>VIP</option>
              </select>
            </Field>
          </div>
          <Field label="Địa chỉ"><input className={inputCls} value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="Ghi chú"><input className={inputCls} value={f.note} onChange={(e) => set("note", e.target.value)} /></Field>
        </>
      )}

      {kind === "service" && (
        <>
          <Field label="Tên dịch vụ"><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Nhóm"><input className={inputCls} value={f.group} onChange={(e) => set("group", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Giá (₫)"><input type="number" className={inputCls} value={f.price} onChange={(e) => set("price", e.target.value)} /></Field>
            <Field label="Thời lượng (phút)"><input type="number" className={inputCls} value={f.mins} onChange={(e) => set("mins", e.target.value)} /></Field>
          </div>
        </>
      )}

      {kind === "care" && (
        <>
          <Field label="Khách hàng">
            <select className={inputCls} value={f.customerId} onChange={(e) => set("customerId", e.target.value)}>
              {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Loại chăm sóc">
            <select className={inputCls} value={f.type} onChange={(e) => set("type", e.target.value)}>
              <option>Sau điều trị</option>
              <option>Nhắc lịch hẹn</option>
              <option>Sinh nhật</option>
              <option>Hẹn không đến</option>
              <option>Giải quyết khiếu nại</option>
            </select>
          </Field>
          <Field label="Nội dung"><textarea rows={3} className={inputCls} value={f.content} onChange={(e) => set("content", e.target.value)} /></Field>
          <Field label="Ngày gọi lại"><input type="date" className={inputCls} value={f.callback} onChange={(e) => set("callback", e.target.value)} /></Field>
        </>
      )}

      {kind === "staff" && (
        <>
          <Field label="Họ tên"><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Nhập họ tên..." /></Field>
          <Field label="Chức vụ">
            <select className={inputCls} value={f.role} onChange={(e) => set("role", e.target.value)}>
              <option>Bác Sĩ</option>
              <option>Lễ Tân</option>
              <option>Kỹ Thuật Viên</option>
              <option>Y Tá</option>
            </select>
          </Field>
          <Field label="Chuyên môn"><input className={inputCls} value={f.specialty} onChange={(e) => set("specialty", e.target.value)} placeholder="VD: Chỉnh nha, Implant..." /></Field>
          <Field label="Số điện thoại"><input className={inputCls} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0900000000" /></Field>
        </>
      )}

      {kind === "discount" && (
        <>
          <Field label="Mã khuyến mãi"><input className={inputCls} value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="VD: KHAI_TRUONG" /></Field>
          <Field label="Tên chương trình"><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="VD: Khai Trương" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Giá trị (%)"><input type="number" className={inputCls} value={f.value} onChange={(e) => set("value", e.target.value)} min={0} max={100} placeholder="10" /></Field>
            <Field label="Đơn tối thiểu (₫)"><input type="number" className={inputCls} value={f.minOrder} onChange={(e) => set("minOrder", e.target.value)} min={0} placeholder="0" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày bắt đầu"><input type="date" className={inputCls} value={f.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
            <Field label="Ngày kết thúc"><input type="date" className={inputCls} value={f.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
          </div>
        </>
      )}
    </Modal>
  );
}
