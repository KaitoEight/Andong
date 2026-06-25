import { useState, useMemo } from "react";
import {
  Search, Plus, UserCheck, UserX, Users, Calendar,
  ShieldCheck, Lock, Monitor,
} from "lucide-react";
import Modal from "./ui/Modal";
import Field, { inputCls, btnPrimary, btnGhost } from "./ui/Field";
import { uid, todayStr, toLocalISODate } from "../utils/helpers";
import { NAV } from "../utils/constants";
import { ROLES as ACCOUNT_ROLES, ADMIN_ROLE, canAccess } from "../utils/perms";

const ROLES = ["Bác Sĩ", "Lễ Tân", "Kỹ Thuật Viên", "Y Tá"];

const ROLE_COLORS = {
  "Bác Sĩ":        "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Lễ Tân":        "bg-sky-50 text-sky-700 border-sky-200",
  "Kỹ Thuật Viên": "bg-violet-50 text-violet-700 border-violet-200",
  "Y Tá":          "bg-amber-50 text-amber-700 border-amber-200",
};

// ─── Danh Sách Nhân Viên ────────────────────────────────────────────────────
function StaffList({ data, setData, openAdd, registerAdd }) {
  const [q,        setQ]       = useState("");
  const [showAdd,  setShowAdd] = useState(false);
  const [form,     setForm]    = useState({ name: "", role: "Bác Sĩ", specialty: "", phone: "" });

  registerAdd(() => setShowAdd(true));

  const set = (k, v) => setForm({ ...form, [k]: v });

  const staff = useMemo(() => {
    const list = data.staff || [];
    if (!q.trim()) return list;
    const ql = q.toLowerCase();
    return list.filter((s) =>
      s.name.toLowerCase().includes(ql) || s.code?.toLowerCase().includes(ql)
    );
  }, [data.staff, q]);

  const toggleActive = (id) => {
    setData({
      ...data,
      staff: (data.staff || []).map((s) =>
        s.id === id ? { ...s, active: !s.active } : s
      ),
    });
  };

  const save = () => {
    if (!form.name.trim()) return;
    const n = (data.staff || []).length + 1;
    const code = "NV" + String(n).padStart(3, "0");
    setData({
      ...data,
      staff: [...(data.staff || []), { id: uid("st"), code, active: true, ...form }],
    });
    setForm({ name: "", role: "Bác Sĩ", specialty: "", phone: "" });
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên, mã nhân viên..."
            className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>
        <button onClick={() => setShowAdd(true)} className={btnPrimary}>
          <Plus size={15} /> Thêm
        </button>
      </div>

      {/* table */}
      {staff.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">
          {q ? "Không tìm thấy nhân viên nào." : "Chưa có nhân viên. Nhấn \"Thêm\" để tạo mới."}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                <th className="px-4 py-2.5 text-left">Mã NV</th>
                <th className="px-4 py-2.5 text-left">Họ Tên</th>
                <th className="px-4 py-2.5 text-left">Chức Vụ</th>
                <th className="px-4 py-2.5 text-left">Chuyên Môn</th>
                <th className="px-4 py-2.5 text-left">Số ĐT</th>
                <th className="px-4 py-2.5 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-emerald-600">{s.code}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ROLE_COLORS[s.role] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{s.specialty || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{s.phone}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(s.id)}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition ${
                        s.active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {s.active ? <UserCheck size={12} /> : <UserX size={12} />}
                      {s.active ? "Đang làm" : "Nghỉ việc"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <Modal
          title="Thêm Nhân Viên"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className={btnGhost} onClick={() => setShowAdd(false)}>Hủy</button>
              <button
                className={btnPrimary + (form.name.trim() ? "" : " opacity-50 pointer-events-none")}
                onClick={save}
              >Lưu</button>
            </>
          }
        >
          <Field label="Họ tên">
            <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nhập họ tên..." />
          </Field>
          <Field label="Chức vụ">
            <select className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value)}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Chuyên môn">
            <input className={inputCls} value={form.specialty} onChange={(e) => set("specialty", e.target.value)} placeholder="VD: Chỉnh nha, Implant..." />
          </Field>
          <Field label="Số điện thoại">
            <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0900000000" />
          </Field>
        </Modal>
      )}
    </div>
  );
}

// ─── Danh Sách User ──────────────────────────────────────────────────────────
function StaffUsers() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
        <Monitor size={32} />
      </div>
      <h2 className="text-lg font-semibold text-slate-800">Quản Lý Tài Khoản Đăng Nhập</h2>
      <p className="text-sm text-slate-500 max-w-md">
        Tính năng phân quyền tài khoản đang phát triển. Quản trị viên có thể cấp quyền truy cập hệ thống cho từng nhân viên theo vai trò của họ.
      </p>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium border border-amber-200">
        <Lock size={13} /> Đang phát triển
      </span>
    </div>
  );
}

// ─── Lịch Làm Việc ───────────────────────────────────────────────────────────
function StaffSchedule({ data }) {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Generate this week's dates (Mon–Sun)
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      const diff = i - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
      d.setDate(d.getDate() + diff);
      dates.push(toLocalISODate(d));
    }
    return dates;
  }, []);

  const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const doctors = useMemo(() =>
    [...new Set(data.appts.map((a) => a.doctor).filter(Boolean))],
    [data.appts]
  );

  const hasAppt = (doctor, date) =>
    data.appts.some((a) => a.doctor === doctor && a.date === date);

  const today = todayStr();

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700"><Calendar size={20} /></div>
        <div>
          <h2 className="font-semibold text-slate-800">Lịch Làm Việc</h2>
          <p className="text-xs text-slate-500">Tuần này (dựa theo lịch hẹn thực tế)</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
              <th className="px-4 py-2.5 text-left">Bác Sĩ / Nhân Viên</th>
              {weekDates.map((d, i) => (
                <th key={d} className={`px-2 py-2.5 text-center ${d === today ? "text-emerald-600" : ""}`}>
                  <div>{DAY_LABELS[i]}</div>
                  <div className="text-[10px] font-normal">{d.slice(8)}/{d.slice(5, 7)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctors.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  Chưa có dữ liệu lịch làm việc tuần này.
                </td>
              </tr>
            ) : (
              doctors.map((doc) => (
                <tr key={doc} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-800">{doc}</td>
                  {weekDates.map((d) => (
                    <td key={d} className="px-2 py-3 text-center">
                      {hasAppt(doc, d) ? (
                        <span className="inline-block w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold leading-6 text-center">
                          ✓
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Phân Quyền ──────────────────────────────────────────────────────────────
function StaffPerm({ perms, onPerms }) {
  const toggle = (role, groupKey) => {
    if (role === ADMIN_ROLE) return; // Quản lý luôn full quyền
    if (groupKey === "tong-quan") return; // Tổng Quan luôn mở
    const next = {
      ...perms,
      [role]: { ...perms[role], [groupKey]: !perms[role]?.[groupKey] },
    };
    onPerms(next);
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-50 text-violet-700"><ShieldCheck size={20} /></div>
        <div>
          <h2 className="font-semibold text-slate-800">Phân Quyền Hệ Thống</h2>
          <p className="text-xs text-slate-500">Bấm vào ô để bật/tắt quyền xem menu theo vai trò. Thay đổi áp dụng ngay.</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
              <th className="px-4 py-2.5 text-left">Menu / Tính Năng</th>
              {ACCOUNT_ROLES.map((r) => (
                <th key={r} className="px-3 py-2.5 text-center whitespace-nowrap">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {NAV.map((g) => (
              <tr key={g.key} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-medium text-slate-700">{g.label}</td>
                {ACCOUNT_ROLES.map((r) => {
                  const on = canAccess(r, g.key, perms);
                  const locked = r === ADMIN_ROLE || g.key === "tong-quan";
                  return (
                    <td key={r} className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => toggle(r, g.key)}
                        disabled={locked}
                        title={locked ? "Luôn bật" : on ? "Bấm để tắt" : "Bấm để bật"}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold transition ${
                          on
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                            : "bg-slate-100 text-slate-300 hover:bg-slate-200"
                        } ${locked ? "opacity-70 cursor-default" : "hover:scale-105"}`}
                      >
                        {on ? "✓" : "✗"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 text-center">
        "Quản lý" luôn có toàn quyền · "Tổng Quan" luôn mở cho mọi vai trò.
      </p>
    </div>
  );
}

// ─── main export ────────────────────────────────────────────────────────────
export default function Staff({ data, setData, openAdd, registerAdd, view, perms, onPerms }) {
  switch (view) {
    case "staff-users":    return <StaffUsers />;
    case "staff-schedule": return <StaffSchedule data={data} />;
    case "staff-perm":     return <StaffPerm perms={perms} onPerms={onPerms} />;
    default:
      return <StaffList data={data} setData={setData} openAdd={openAdd} registerAdd={registerAdd} />;
  }
}
