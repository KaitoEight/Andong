import { useState, useMemo } from "react";
import {
  Search, Plus, Trash2, Receipt, Wallet, AlertCircle, X, CreditCard, Printer,
} from "lucide-react";
import Modal from "./ui/Modal";
import Avatar from "./ui/Avatar";
import Field, { inputCls, btnPrimary, btnGhost } from "./ui/Field";
import { uid, todayStr, fmtVND, fmtDate } from "../utils/helpers";
import { printInvoice } from "../utils/print";

const METHODS = ["Tiền mặt", "Chuyển khoản", "Quẹt thẻ", "Ví điện tử"];

const STATUS = {
  paid:    { label: "Đã thanh toán", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  partial: { label: "Thanh toán 1 phần", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  unpaid:  { label: "Chưa thanh toán", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

function statusOf(total, paid) {
  if (paid >= total && total > 0) return "paid";
  if (paid > 0) return "partial";
  return "unpaid";
}

export default function Invoices({ data, setData, openAdd, registerAdd }) {
  const invoices = data.invoices || [];
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [payFor, setPayFor] = useState(null);
  const [payAmt, setPayAmt] = useState("");

  const blankForm = {
    customerId: data.customers[0]?.id || "",
    items: [{ name: "", qty: 1, price: "" }],
    method: "Tiền mặt",
    paid: "",
    note: "",
  };
  const [form, setForm] = useState(blankForm);

  registerAdd(() => { setForm(blankForm); setShowAdd(true); });

  const cust = (id) => data.customers.find((c) => c.id === id);
  const svc  = (id) => data.services.find((s) => s.id === id);

  // Dịch vụ đã chốt của khách đang chọn (nguồn để lập hoá đơn thu tiền)
  const custServices = (cust(form.customerId)?.services) || [];
  const importService = (r) => {
    setForm((f) => ({
      ...f,
      items: [...f.items.filter((it) => it.name.trim()), { name: r.name || "Dịch vụ", qty: 1, price: r.total || 0 }],
    }));
  };

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return invoices
      .filter((inv) => {
        if (!ql) return true;
        const c = cust(inv.customerId);
        return (inv.code + (c?.name || "") + (c?.phone || "")).toLowerCase().includes(ql);
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.code.localeCompare(a.code));
  }, [invoices, q]);

  const totals = useMemo(() => {
    const total = invoices.reduce((s, i) => s + (i.total || 0), 0);
    const paid  = invoices.reduce((s, i) => s + (i.paid || 0), 0);
    return { total, paid, debt: total - paid };
  }, [invoices]);

  // ── Tạo hoá đơn ─────────────────────────────────────────────────────────
  const setItem = (idx, k, v) =>
    setForm((f) => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, [k]: v } : it) }));
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { name: "", qty: 1, price: "" }] }));
  const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const formTotal = form.items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
  const formValid = form.customerId && form.items.some((it) => it.name.trim() && Number(it.price) >= 0);

  const saveInvoice = () => {
    if (!formValid) return;
    const n = invoices.length + 1;
    const paid = Number(form.paid) || 0;
    const items = form.items
      .filter((it) => it.name.trim())
      .map((it) => ({ name: it.name.trim(), qty: Number(it.qty) || 1, price: Number(it.price) || 0 }));
    const inv = {
      id: uid("inv"),
      code: "HD" + String(n).padStart(6, "0"),
      customerId: form.customerId,
      date: todayStr(),
      items,
      total: formTotal,
      paid: Math.min(paid, formTotal),
      method: form.method,
      status: statusOf(formTotal, paid),
      note: form.note,
    };
    setData({ ...data, invoices: [...invoices, inv] });
    setShowAdd(false);
  };

  // ── Thu thêm (thanh toán công nợ) ─────────────────────────────────────────
  const openPay = (inv) => { setPayFor(inv); setPayAmt(String((inv.total || 0) - (inv.paid || 0))); };
  const confirmPay = () => {
    const add = Number(payAmt) || 0;
    setData({
      ...data,
      invoices: invoices.map((i) => {
        if (i.id !== payFor.id) return i;
        const paid = Math.min((i.paid || 0) + add, i.total || 0);
        return { ...i, paid, status: statusOf(i.total || 0, paid) };
      }),
    });
    setPayFor(null);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center shadow-md shadow-emerald-500/25"><Receipt size={20} /></div>
          <div>
            <div className="text-xs text-slate-500">Tổng hoá đơn</div>
            <div className="text-lg font-bold text-slate-800">{fmtVND(totals.total)}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white grid place-items-center shadow-md shadow-sky-500/25"><Wallet size={20} /></div>
          <div>
            <div className="text-xs text-slate-500">Đã thu</div>
            <div className="text-lg font-bold text-emerald-700">{fmtVND(totals.paid)}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white grid place-items-center shadow-md shadow-rose-500/25"><AlertCircle size={20} /></div>
          <div>
            <div className="text-xs text-slate-500">Công nợ</div>
            <div className="text-lg font-bold text-rose-600">{fmtVND(totals.debt)}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã HĐ, tên khách..."
            className={inputCls + " pl-8"} />
        </div>
        <button onClick={() => { setForm(blankForm); setShowAdd(true); }} className={btnPrimary}>
          <Plus size={15} /> Tạo hoá đơn
        </button>
      </div>

      {/* Table */}
      {list.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">Chưa có hoá đơn nào.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                <th className="px-4 py-2.5 text-left">Mã HĐ</th>
                <th className="px-4 py-2.5 text-left">Ngày</th>
                <th className="px-4 py-2.5 text-left">Khách Hàng</th>
                <th className="px-4 py-2.5 text-left">Dịch Vụ</th>
                <th className="px-4 py-2.5 text-right">Tổng</th>
                <th className="px-4 py-2.5 text-right">Đã Thu</th>
                <th className="px-4 py-2.5 text-right">Còn Nợ</th>
                <th className="px-4 py-2.5 text-center">Trạng Thái</th>
                <th className="px-4 py-2.5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((inv) => {
                const c = cust(inv.customerId);
                const debt = (inv.total || 0) - (inv.paid || 0);
                const st = STATUS[inv.status] || STATUS.unpaid;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-emerald-700">{inv.code}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(inv.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={c?.avatar} name={c?.name} size={32} />
                        <div>
                          <div className="font-medium text-slate-800">{c?.name || "—"}</div>
                          <div className="text-xs text-slate-400">{c?.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs max-w-[200px] truncate">
                      {inv.items?.map((it) => it.name).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmtVND(inv.total)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{fmtVND(inv.paid)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${debt > 0 ? "text-rose-600" : "text-slate-400"}`}>{fmtVND(debt)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {debt > 0 && (
                          <button onClick={() => openPay(inv)} title="Thu thêm"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition">
                            <CreditCard size={12} /> Thu
                          </button>
                        )}
                        <button onClick={() => printInvoice(inv, c)} title="In hoá đơn"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition">
                          <Printer size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal tạo hoá đơn */}
      {showAdd && (
        <Modal
          title="Tạo Hoá Đơn"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className={btnGhost} onClick={() => setShowAdd(false)}>Hủy</button>
              <button className={btnPrimary + (formValid ? "" : " opacity-50 pointer-events-none")} onClick={saveInvoice}>Lưu</button>
            </>
          }
        >
          <Field label="Khách hàng">
            <select className={inputCls} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
            </select>
          </Field>

          {/* Dịch vụ đã chốt → nhập nhanh vào hoá đơn */}
          {custServices.length > 0 && (
            <div className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
              <div className="text-xs font-semibold text-emerald-700 mb-1.5">Dịch vụ đã chốt — bấm để thêm vào hoá đơn</div>
              <div className="space-y-1.5">
                {custServices.map((r) => {
                  return (
                    <button key={r.id} onClick={() => importService(r)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-left hover:border-emerald-400 transition">
                      <span className="text-sm text-slate-700 truncate">{fmtDate(r.date)} · {r.name}</span>
                      <span className="text-xs font-medium text-emerald-700 shrink-0">+ {fmtVND(r.total)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Line items */}
          <div className="mb-3">
            <span className="text-xs font-semibold text-slate-500 mb-1.5 block">Dịch vụ / Sản phẩm</span>
            <div className="space-y-2.5">
              {form.items.map((it, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <input placeholder="Tên dịch vụ / sản phẩm" value={it.name} onChange={(e) => setItem(idx, "name", e.target.value)}
                      className={inputCls + " flex-1 bg-white"} />
                    {form.items.length > 1 && (
                      <button onClick={() => removeItem(idx)} title="Xoá dòng"
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition shrink-0">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="w-20">
                      <span className="text-[11px] text-slate-500 mb-0.5 block">Số lượng</span>
                      <input type="number" min={1} value={it.qty} onChange={(e) => setItem(idx, "qty", e.target.value)}
                        className={inputCls + " bg-white text-center px-2"} />
                    </label>
                    <label className="flex-1">
                      <span className="text-[11px] text-slate-500 mb-0.5 block">Đơn giá (₫)</span>
                      <input type="number" min={0} placeholder="0" value={it.price} onChange={(e) => setItem(idx, "price", e.target.value)}
                        className={inputCls + " bg-white text-right"} />
                    </label>
                    <div className="flex-1 text-right pb-1.5">
                      <span className="text-[11px] text-slate-500 mb-0.5 block">Thành tiền</span>
                      <span className="text-sm font-semibold text-emerald-700">{fmtVND((Number(it.price) || 0) * (Number(it.qty) || 0))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="mt-2 text-sm text-emerald-600 font-medium flex items-center gap-1 hover:text-emerald-700">
              <Plus size={14} /> Thêm dòng
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 mb-3">
            <span className="text-sm font-medium text-slate-600">Tổng cộng</span>
            <span className="text-lg font-bold text-emerald-700">{fmtVND(formTotal)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phương thức">
              <select className={inputCls} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                {METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Khách thanh toán (₫)">
              <input type="number" min={0} className={inputCls} value={form.paid}
                onChange={(e) => setForm({ ...form, paid: e.target.value })} placeholder="0" />
            </Field>
          </div>
          <Field label="Ghi chú">
            <input className={inputCls} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
        </Modal>
      )}

      {/* Modal thu thêm */}
      {payFor && (
        <Modal
          title={`Thu thêm · ${payFor.code}`}
          onClose={() => setPayFor(null)}
          footer={
            <>
              <button className={btnGhost} onClick={() => setPayFor(null)}>Hủy</button>
              <button className={btnPrimary} onClick={confirmPay}>Xác nhận</button>
            </>
          }
        >
          <div className="space-y-1 text-sm mb-3">
            <div className="flex justify-between"><span className="text-slate-500">Tổng hoá đơn</span><span className="font-medium">{fmtVND(payFor.total)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Đã thu</span><span className="font-medium text-emerald-700">{fmtVND(payFor.paid)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Còn nợ</span><span className="font-semibold text-rose-600">{fmtVND((payFor.total || 0) - (payFor.paid || 0))}</span></div>
          </div>
          <Field label="Số tiền thu thêm (₫)">
            <input type="number" min={0} className={inputCls} value={payAmt} onChange={(e) => setPayAmt(e.target.value)} autoFocus />
          </Field>
        </Modal>
      )}
    </div>
  );
}
