import { useState, useMemo } from "react";
import {
  Tag, Filter, Plus, ToggleLeft, ToggleRight, Download,
  Users, CalendarDays, Cake,
} from "lucide-react";
import Modal from "./ui/Modal";
import Field, { inputCls, btnPrimary, btnGhost } from "./ui/Field";
import { uid, todayStr, fmtDate, fmtVND, toLocalISODate } from "../utils/helpers";

// ─── Khuyến Mãi ──────────────────────────────────────────────────────────────
function MkDiscount({ data, setData, openAdd, registerAdd }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    code: "", name: "", value: "", minOrder: "0",
    startDate: todayStr(), endDate: "", type: "percent",
  });

  registerAdd(() => setShowAdd(true));

  const set = (k, v) => setForm({ ...form, [k]: v });

  const discounts = data.discounts || [];

  const toggleActive = (id) => {
    setData({
      ...data,
      discounts: discounts.map((d) =>
        d.id === id ? { ...d, active: !d.active } : d
      ),
    });
  };

  const save = () => {
    if (!form.code.trim() || !form.name.trim()) return;
    setData({
      ...data,
      discounts: [
        ...discounts,
        {
          id: uid("dc"),
          ...form,
          value:    Number(form.value) || 0,
          minOrder: Number(form.minOrder) || 0,
          active:   true,
        },
      ],
    });
    setForm({ code: "", name: "", value: "", minOrder: "0", startDate: todayStr(), endDate: "", type: "percent" });
    setShowAdd(false);
  };

  const valid = form.code.trim() && form.name.trim();

  const today = todayStr();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700"><Tag size={20} /></div>
          <div>
            <h2 className="font-semibold text-slate-800">Khuyến Mãi</h2>
            <p className="text-xs text-slate-500">{discounts.filter((d) => d.active).length} đang hoạt động</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} className={btnPrimary}>
          <Plus size={15} /> Thêm
        </button>
      </div>

      {discounts.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">
          Chưa có khuyến mãi nào. Nhấn "Thêm" để tạo mới.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                <th className="px-4 py-2.5 text-left">Mã</th>
                <th className="px-4 py-2.5 text-left">Tên</th>
                <th className="px-4 py-2.5 text-center">Loại</th>
                <th className="px-4 py-2.5 text-center">Giá Trị</th>
                <th className="px-4 py-2.5 text-right">Đơn Tối Thiểu</th>
                <th className="px-4 py-2.5 text-left">Thời Gian</th>
                <th className="px-4 py-2.5 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {discounts.map((d) => {
                const expired = d.endDate && d.endDate < today;
                return (
                  <tr key={d.id} className={`hover:bg-slate-50 transition ${expired ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{d.code}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                        {d.type === "percent" ? "%" : "₫"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-amber-700">
                      {d.type === "percent" ? `${d.value}%` : fmtVND(d.value)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 text-xs">
                      {d.minOrder > 0 ? fmtVND(d.minOrder) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {fmtDate(d.startDate)} → {fmtDate(d.endDate) || "∞"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(d.id)}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition ${
                          d.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {d.active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                        {d.active ? "Đang dùng" : "Tắt"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal
          title="Thêm Khuyến Mãi"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className={btnGhost} onClick={() => setShowAdd(false)}>Hủy</button>
              <button
                className={btnPrimary + (valid ? "" : " opacity-50 pointer-events-none")}
                onClick={save}
              >Lưu</button>
            </>
          }
        >
          <Field label="Mã khuyến mãi">
            <input className={inputCls} value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="VD: KHAI_TRUONG" />
          </Field>
          <Field label="Tên chương trình">
            <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="VD: Khai Trương" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Giá trị (%)">
              <input type="number" className={inputCls} value={form.value} onChange={(e) => set("value", e.target.value)} min={0} max={100} placeholder="10" />
            </Field>
            <Field label="Đơn tối thiểu (₫)">
              <input type="number" className={inputCls} value={form.minOrder} onChange={(e) => set("minOrder", e.target.value)} min={0} placeholder="0" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày bắt đầu">
              <input type="date" className={inputCls} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </Field>
            <Field label="Ngày kết thúc">
              <input type="date" className={inputCls} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Lọc Khách Hàng ──────────────────────────────────────────────────────────
function MkFilter({ data }) {
  const [group,    setGroup]    = useState("all");
  const [days,     setDays]     = useState("all");
  const [birthday, setBirthday] = useState(false);

  const today = todayStr();
  const nowDate = new Date();
  const thisMonth = nowDate.getMonth() + 1;

  const filtered = useMemo(() => {
    let list = data.customers || [];

    if (group !== "all") {
      list = list.filter((c) => c.group === group);
    }

    if (days !== "all") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - Number(days));
      const cutoffStr = toLocalISODate(cutoff);
      const activeIds = new Set(
        data.appts
          .filter((a) => a.date >= cutoffStr)
          .map((a) => a.customerId)
      );
      list = list.filter((c) => activeIds.has(c.id));
    }

    if (birthday) {
      list = list.filter((c) => {
        if (!c.dob) return false;
        const m = parseInt(c.dob.split("-")[1], 10);
        return m === thisMonth;
      });
    }

    return list;
  }, [data.customers, data.appts, group, days, birthday, thisMonth]);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-violet-50 text-violet-700"><Filter size={20} /></div>
          <div>
            <h2 className="font-semibold text-slate-800">Lọc Khách Hàng</h2>
            <p className="text-xs text-slate-500">Tìm khách hàng theo tiêu chí</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1.5">Nhóm Khách Hàng</div>
            <div className="flex gap-1.5">
              {["all", "Mới", "Khách quen", "VIP"].map((g) => (
                <button key={g}
                  onClick={() => setGroup(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    group === g
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {g === "all" ? "Tất cả" : g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-slate-500 mb-1.5">Lịch Hẹn Gần Đây</div>
            <div className="flex gap-1.5">
              {[["all", "Tất cả"], ["30", "30 ngày"], ["60", "60 ngày"], ["90", "90 ngày"]].map(([v, l]) => (
                <button key={v}
                  onClick={() => setDays(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    days === v
                      ? "bg-sky-600 text-white border-sky-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => setBirthday(!birthday)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                birthday
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Cake size={13} /> Sinh nhật tháng {thisMonth}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users size={15} />
          <span>Kết quả: <strong className="text-slate-800">{filtered.length}</strong> khách hàng</span>
        </div>
        <button
          onClick={() => alert("Tính năng xuất file đang phát triển.")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
        >
          <Download size={13} /> Xuất danh sách
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">
          Không có khách hàng nào phù hợp.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                <th className="px-4 py-2.5 text-left">Mã KH</th>
                <th className="px-4 py-2.5 text-left">Họ Tên</th>
                <th className="px-4 py-2.5 text-left">Số ĐT</th>
                <th className="px-4 py-2.5 text-left">Nhóm</th>
                <th className="px-4 py-2.5 text-left">Ngày Sinh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <span className="text-xs text-emerald-600 font-mono">{c.code}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      c.group === "VIP" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      c.group === "Khách quen" ? "bg-sky-50 text-sky-700 border-sky-200" :
                      "bg-slate-50 text-slate-600 border-slate-200"
                    }`}>
                      {c.group}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(c.dob) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── main export ────────────────────────────────────────────────────────────
export default function Marketing({ data, setData, view, openAdd, registerAdd }) {
  switch (view) {
    case "mk-discount": return <MkDiscount data={data} setData={setData} openAdd={openAdd} registerAdd={registerAdd} />;
    case "mk-filter":   return <MkFilter   data={data} />;
    default:            return null;
  }
}
