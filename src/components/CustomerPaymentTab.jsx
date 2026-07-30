import { useState, useMemo } from "react";
import {
  Plus, Printer, Wallet, CreditCard, QrCode, CheckCircle2, ArrowUpRight,
  Receipt, FileText, Calendar, DollarSign, Sparkles, X, ChevronRight
} from "lucide-react";
import Modal from "./ui/Modal";
import Field, { inputCls, btnPrimary } from "./ui/Field";
import { uid, todayStr, fmtDate, fmtVND } from "../utils/helpers";

const BANK_CONFIG = {
  bankId: "MB",           // MB Bank / Vietinbank / Vietcombank
  accountNo: "0336699387", // STK mẫu phòng khám
  accountName: "Lê Nam Hưng",
};

export default function CustomerPaymentTab({ data, setData, customer }) {
  const [modal, setModal] = useState(false);
  const [qrModal, setQrModal] = useState(null); // { amount, content, qrUrl }
  const [printModal, setPrintModal] = useState(null); // { invoice }

  const invoices = useMemo(() =>
    (data.invoices || []).filter((i) => i.customerId === customer.id)
      .sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [data.invoices, customer.id]
  );

  const custServices = customer.services || [];
  const servicesTotal = custServices.reduce((s, r) => s + (r.total || 0), 0);
  const invoiceTotal = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalBilled = servicesTotal || invoiceTotal;
  const totalPaid = invoices.reduce((s, i) => s + (i.paid || 0), 0);
  const totalDebt = Math.max(0, totalBilled - totalPaid);

  // Form Lập Phiếu Thu
  const [form, setForm] = useState({
    amount: "",
    method: "Chuyển khoản VietQR",
    staff: data.staff?.[0]?.name || "Lễ tân",
    note: "Thanh toán chi phí dịch vụ nha khoa",
  });

  const generateVietQRUrl = (amount, info) => {
    const amt = Number(amount) || 0;
    const addInfo = encodeURIComponent(info || `THANH TOAN KH ${customer.code}`);
    return `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-compact2.png?amount=${amt}&addInfo=${addInfo}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;
  };

  const handleSavePayment = () => {
    const paidAmt = Number(form.amount) || 0;
    if (paidAmt <= 0) return;

    const code = "HD" + todayStr().replace(/-/g, "") + "." + String(invoices.length + 1).padStart(3, "0");
    const newInvoice = {
      id: uid("inv"),
      code,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      date: todayStr(),
      time: new Date().toTimeString().slice(0, 5),
      total: paidAmt > totalDebt && totalDebt > 0 ? paidAmt : (totalDebt || paidAmt),
      paid: paidAmt,
      method: form.method,
      staff: form.staff,
      note: form.note,
      services: custServices.map((s) => ({ name: s.name, price: s.total })),
    };

    setData({
      ...data,
      invoices: [...(data.invoices || []), newInvoice],
    });

    setModal(false);
    setForm({ ...form, amount: "" });
  };

  const openQrForInvoice = (inv) => {
    const qrUrl = generateVietQRUrl(inv.paid, `THANH TOAN HOADON ${inv.code}`);
    setQrModal({
      amount: inv.paid,
      code: inv.code,
      qrUrl,
    });
  };

  return (
    <div className="space-y-6 animate-fade">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">Tổng Chi Phí Dịch Vụ</span>
            <Receipt size={20} className="text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-heading text-white">{fmtVND(totalBilled)}</div>
          <div className="text-[11px] text-slate-400 mt-1">{custServices.length} hạng mục dịch vụ</div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-100 font-medium">Đã Thanh Toán</span>
            <CheckCircle2 size={20} className="text-emerald-200" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-heading text-white">{fmtVND(totalPaid)}</div>
          <div className="text-[11px] text-emerald-100 mt-1">{invoices.length} đợt phiếu thu</div>
        </div>

        <div className={`card p-5 border-0 shadow-md ${totalDebt > 0 ? "bg-gradient-to-br from-rose-600 to-red-700 text-white" : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700"}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${totalDebt > 0 ? "text-rose-100" : "text-slate-500"}`}>Còn Nợ Phải Thu</span>
            <Wallet size={20} className={totalDebt > 0 ? "text-rose-200" : "text-slate-400"} />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-heading">{fmtVND(totalDebt)}</div>
          <div className={`text-[11px] mt-1 ${totalDebt > 0 ? "text-rose-100" : "text-slate-500"}`}>
            {totalDebt > 0 ? "Cần thu thêm đợt tới" : "Đã hoàn thành nghĩa vụ"}
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base font-heading">Lịch Sử & Phiếu Thu Thanh Toán</h3>
          <p className="text-xs text-slate-500">Quản lý các đợt thu tiền, tạo mã VietQR thanh toán và in phiếu thu</p>
        </div>

        <div className="flex items-center gap-2">
          {totalDebt > 0 && (
            <button onClick={() => { setForm((f) => ({ ...f, amount: String(totalDebt) })); setModal(true); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-sm">
              <QrCode size={15} /> Thu Nợ ({fmtVND(totalDebt)})
            </button>
          )}

          <button onClick={() => setModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition">
            <Plus size={15} /> Tạo Phiếu Thu Mới
          </button>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="table-container">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80">
              <th className="p-3 w-12 text-center font-bold text-slate-500">STT</th>
              <th className="p-3 font-bold text-slate-500">Mã Phiếu</th>
              <th className="p-3 font-bold text-slate-500">Ngày / Giờ</th>
              <th className="p-3 font-bold text-slate-500">Hình Thức Thanh Toán</th>
              <th className="p-3 text-right font-bold text-slate-500">Số Tiền Thu</th>
              <th className="p-3 font-bold text-slate-500">Người Thu</th>
              <th className="p-3 text-center w-28 font-bold text-slate-500">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400">
                  Khách hàng chưa có đợt thanh toán nào. Nhấn "Tạo Phiếu Thu Mới" để ghi nhận thu tiền.
                </td>
              </tr>
            ) : (
              invoices.map((inv, idx) => (
                <tr key={inv.id} className="table-row">
                  <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="p-3">
                    <span className="font-mono text-emerald-700 font-bold text-xs">{inv.code}</span>
                    {inv.note && <div className="text-[10px] text-slate-400 truncate">{inv.note}</div>}
                  </td>
                  <td className="p-3 font-semibold text-slate-700">{fmtDate(inv.date)} {inv.time || ""}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {inv.method?.includes("QR") ? <QrCode size={13} className="text-emerald-600" /> : <CreditCard size={13} className="text-sky-600" />}
                      {inv.method || "Tiền mặt"}
                    </span>
                  </td>
                  <td className="p-3 text-right font-extrabold text-emerald-600 text-sm">
                    {fmtVND(inv.paid)}
                  </td>
                  <td className="p-3 font-medium text-slate-600">{inv.staff || "Lễ tân"}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openQrForInvoice(inv)} title="Mở mã VietQR"
                        className="w-7 h-7 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition grid place-items-center">
                        <QrCode size={15} />
                      </button>
                      <button onClick={() => setPrintModal({ invoice: inv })} title="In phiếu thu"
                        className="w-7 h-7 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition grid place-items-center">
                        <Printer size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Lập Phiếu Thu Mới */}
      {modal && (
        <Modal title="Tạo Phiếu Thu / Ghi Nhận Thanh Toán" onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs space-y-1">
              <div className="flex justify-between text-slate-600"><span>Khách hàng:</span> <b className="text-slate-900">{customer.name} ({customer.code})</b></div>
              <div className="flex justify-between text-slate-600"><span>Số nợ hiện tại:</span> <b className="text-rose-600 font-bold">{fmtVND(totalDebt)}</b></div>
            </div>

            <Field label="Số tiền thu (VNĐ)">
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Nhập số tiền thu (ví dụ: 2000000)"
                className={inputCls + " font-bold text-emerald-700 text-base"}
                autoFocus
              />
            </Field>

            <Field label="Hình thức thanh toán">
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={inputCls}>
                <option value="Chuyển khoản VietQR">Chuyển khoản VietQR (Ngân hàng)</option>
                <option value="Tiền mặt">Tiền mặt tại quầy</option>
                <option value="Quẹt thẻ POS">Quẹt thẻ ngân hàng (POS)</option>
              </select>
            </Field>

            {form.method === "Chuyển khoản VietQR" && Number(form.amount) > 0 && (
              <div className="p-4 rounded-2xl bg-slate-900 text-white text-center space-y-2">
                <div className="text-xs font-bold text-emerald-400">Mã VietQR Quét Nhanh Chuyển Khoản</div>
                <img
                  src={generateVietQRUrl(form.amount, `THANH TOAN KH ${customer.code}`)}
                  alt="VietQR Code"
                  className="w-44 h-44 object-contain mx-auto rounded-xl border-2 border-white shadow-md"
                />
                <div className="text-[11px] text-slate-300">
                  Chủ tài khoản: <b>{BANK_CONFIG.accountName}</b> <br />
                  STK: <b className="font-mono text-emerald-400">{BANK_CONFIG.accountNo}</b> ({BANK_CONFIG.bankId})
                </div>
              </div>
            )}

            <Field label="Người thu tiền">
              <select value={form.staff} onChange={(e) => setForm({ ...form, staff: e.target.value })} className={inputCls}>
                {(data.staff || []).map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </Field>

            <Field label="Ghi chú đợt thu">
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Nội dung ghi chú..." className={inputCls} />
            </Field>

            <button onClick={handleSavePayment} className={btnPrimary + " w-full justify-center py-3 text-sm font-bold"}>
              <CheckCircle2 size={18} /> Lưu Phiếu Thu Thanh Toán
            </button>
          </div>
        </Modal>
      )}

      {/* Modal VietQR Xem Nhanh */}
      {qrModal && (
        <Modal title={`Mã VietQR Thanh Toán - Hóa Đơn ${qrModal.code}`} onClose={() => setQrModal(null)}>
          <div className="text-center space-y-4 py-2">
            <div className="text-sm font-bold text-slate-800">Số tiền: <span className="text-emerald-600 text-lg">{fmtVND(qrModal.amount)}</span></div>
            <img src={qrModal.qrUrl} alt="VietQR" className="w-56 h-56 object-contain mx-auto rounded-2xl border-2 border-slate-200 shadow-lg" />
            <p className="text-xs text-slate-500">Bệnh nhân sử dụng ứng dụng Ngân hàng (MB, Vietcombank, Techcombank, Agribank, ZaloPay...) quét mã để thanh toán.</p>
          </div>
        </Modal>
      )}

      {/* Modal In Phiếu Thu */}
      {printModal && (
        <Modal title="In Phiếu Thu Thanh Toán" onClose={() => setPrintModal(null)}>
          <div className="space-y-4 p-4 border border-slate-200 rounded-2xl bg-white text-xs">
            <div className="flex justify-between border-b pb-3">
              <div>
                <h2 className="font-bold text-slate-900 text-sm font-heading">NHA KHOA VICTORIA</h2>
                <p className="text-[11px] text-slate-500">ĐC: Trụ sở Victoria HeadOffice</p>
                <p className="text-[11px] text-slate-500">Hotline: 1900 1234 - 0988 999 888</p>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-emerald-700 text-sm">PHIẾU THU TIỀN</h3>
                <p className="font-mono text-slate-600">{printModal.invoice.code}</p>
                <p className="text-slate-400">{fmtDate(printModal.invoice.date)}</p>
              </div>
            </div>

            <div className="space-y-1 text-slate-700">
              <div>Khách hàng: <b>{customer.name}</b> ({customer.code})</div>
              <div>Số điện thoại: <b>{customer.phone}</b></div>
              <div>Hình thức: <b>{printModal.invoice.method}</b></div>
              <div>Ghi chú: {printModal.invoice.note}</div>
            </div>

            <div className="border-t pt-3 flex justify-between font-bold text-sm text-slate-900">
              <span>SỐ TIỀN THỰC THU:</span>
              <span className="text-emerald-600">{fmtVND(printModal.invoice.paid)}</span>
            </div>

            <div className="grid grid-cols-2 text-center pt-6 text-[11px] text-slate-500">
              <div>Người nộp tiền<br /><br /><b className="text-slate-800">{customer.name}</b></div>
              <div>Người lập phiếu<br /><br /><b className="text-slate-800">{printModal.invoice.staff}</b></div>
            </div>

            <button onClick={() => window.print()} className={btnPrimary + " w-full justify-center mt-4"}>
              <Printer size={16} /> In Phiếu Thu (Print)
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
