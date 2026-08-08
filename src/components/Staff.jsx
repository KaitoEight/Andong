import { useState, useMemo } from "react";
import {
  Search, Plus, UserCheck, UserX, Users, Calendar,
  ShieldCheck, Lock, Monitor, Pencil, Trash2, Key, UserPlus, Check, X, Shield, Sparkles
} from "lucide-react";
import Modal from "./ui/Modal";
import Field, { inputCls, btnPrimary, btnGhost } from "./ui/Field";
import Avatar from "./ui/Avatar";
import { uid, todayStr, toLocalISODate } from "../utils/helpers";
import { NAV } from "../utils/constants";
import { ROLES as ACCOUNT_ROLES, ADMIN_ROLE, canAccess } from "../utils/perms";
import { loadLocalUsers, saveLocalUsers, register, updateUser, deleteUser } from "../utils/auth";

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
    <div className="space-y-4 animate-fade">
      {/* toolbar */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900 text-base font-heading">Danh Sách Nhân Viên Phòng Khám</h2>
          <p className="text-xs text-slate-500">Quản lý hồ sơ bác sĩ, phụ tá, y tá và chuyên môn</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm tên, mã nhân viên..."
              className={inputCls + " pl-8 text-xs py-2"}
            />
          </div>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition">
            <Plus size={15} /> Thêm Nhân Viên
          </button>
        </div>
      </div>

      {/* table */}
      {staff.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 text-xs">
          {q ? "Không tìm thấy nhân viên nào phù hợp." : "Chưa có nhân viên. Nhấn \"Thêm Nhân Viên\" để tạo mới."}
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 font-bold text-slate-500 uppercase">
                <th className="p-3">Mã NV</th>
                <th className="p-3">Họ Tên</th>
                <th className="p-3">Chức Vụ</th>
                <th className="p-3">Chuyên Môn</th>
                <th className="p-3">Số Điện Thoại</th>
                <th className="p-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((s) => (
                <tr key={s.id} className="table-row">
                  <td className="p-3">
                    <span className="font-mono font-bold text-emerald-700">{s.code}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={s.name} size={30} />
                      <span className="font-bold text-slate-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${ROLE_COLORS[s.role] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {s.role}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 font-medium">{s.specialty || "—"}</td>
                  <td className="p-3 text-slate-700 font-semibold">{s.phone || "—"}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleActive(s.id)}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition ${
                        s.active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
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
          title="Thêm Nhân Viên Mới"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className={btnGhost} onClick={() => setShowAdd(false)}>Hủy</button>
              <button
                className={btnPrimary + (form.name.trim() ? "" : " opacity-50 pointer-events-none")}
                onClick={save}
              >Lưu Hồ Sơ</button>
            </>
          }
        >
          <Field label="Họ tên nhân viên">
            <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nhập họ tên..." autoFocus />
          </Field>
          <Field label="Chức vụ">
            <select className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value)}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Chuyên môn">
            <input className={inputCls} value={form.specialty} onChange={(e) => set("specialty", e.target.value)} placeholder="VD: Chỉnh nha, Phục hình sứ, Implant..." />
          </Field>
          <Field label="Số điện thoại">
            <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0900000000" />
          </Field>
        </Modal>
      )}
    </div>
  );
}

// ─── Danh Sách User & Phân Quyền Tài Khoản Đăng Nhập ──────────────────────────
function StaffUsers({ openAdd, registerAdd }) {
  const [users, setUsers] = useState(loadLocalUsers);
  const [q, setQ]         = useState("");
  const [modal, setModal] = useState(null); // { isEdit: boolean, user: {...} }
  const [error, setError] = useState("");

  registerAdd?.(() => openUserModal(null));

  const filteredUsers = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return users;
    return users.filter((u) => (u.fullName + u.username + (u.role || "")).toLowerCase().includes(ql));
  }, [users, q]);

  const openUserModal = (userToEdit) => {
    setError("");
    const isEdit = !!userToEdit;
    setModal({
      isEdit,
      user: {
        id: userToEdit?.id || "",
        fullName: userToEdit?.fullName || "",
        username: userToEdit?.username || "",
        password: "",
        role: userToEdit?.role || "Bác sĩ",
        active: userToEdit?.active !== false,
      },
    });
  };

  const handleSaveUser = () => {
    if (!modal) return;
    const { isEdit, user } = modal;
    
    if (!user.fullName.trim()) { setError("Vui lòng nhập họ tên."); return; }
    if (!user.username.trim()) { setError("Vui lòng nhập tên đăng nhập / Email."); return; }
    if (!isEdit && !user.password) { setError("Vui lòng nhập mật khẩu."); return; }
    if (user.password && user.password.length < 6) { setError("Mật khẩu phải có tối thiểu 6 ký tự."); return; }

    const normUser = user.username.trim().toLowerCase();

    let updatedUsers = [...users];
    if (isEdit) {
      updatedUsers = updatedUsers.map((u) =>
        (u.id && u.id === user.id) || u.username.toLowerCase() === normUser
          ? { ...u, fullName: user.fullName.trim(), username: normUser, role: user.role, active: user.active }
          : u
      );
      updateUser({ id: user.id, username: normUser, fullName: user.fullName.trim(), role: user.role, active: user.active, password: user.password });
    } else {
      if (users.some((u) => u.username.toLowerCase() === normUser)) {
        setError("Tên đăng nhập / Email này đã tồn tại.");
        return;
      }
      const newUser = {
        id: "u_" + Date.now(),
        fullName: user.fullName.trim(),
        username: normUser,
        role: user.role,
        active: user.active,
        password: user.password,
      };
      updatedUsers.push(newUser);
      register({ fullName: user.fullName.trim(), username: normUser, password: user.password, role: user.role }).catch(() => {});
    }

    setUsers(updatedUsers);
    saveLocalUsers(updatedUsers);
    setModal(null);
  };

  const toggleUserActive = (user) => {
    const updated = users.map((u) => (u.id === user.id || u.username === user.username ? { ...u, active: !u.active } : u));
    setUsers(updated);
    saveLocalUsers(updated);
    updateUser({ username: user.username, active: !user.active });
  };

  const handleDeleteUser = (user) => {
    if (user.username.toLowerCase().includes("admin")) {
      alert("Không thể xóa tài khoản Quản trị viên gốc.");
      return;
    }
    if (!window.confirm(`Xoá tài khoản đăng nhập "${user.username}"?`)) return;
    const updated = users.filter((u) => u.id !== user.id && u.username !== user.username);
    setUsers(updated);
    saveLocalUsers(updated);
    deleteUser(user.username);
  };

  return (
    <div className="space-y-4 animate-fade">
      {/* Header & Quick Action Toolbar */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900 text-base font-heading flex items-center gap-2">
            <Monitor className="text-emerald-600" size={18} /> Quản Lý Tài Khoản Đăng Nhập
          </h2>
          <p className="text-xs text-slate-500">Admin tạo tài khoản cho nhân viên và phân công Vai trò hệ thống</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, email, vai trò..."
              className={inputCls + " pl-8 text-xs py-2"}
            />
          </div>
          <button onClick={() => openUserModal(null)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition">
            <UserPlus size={15} /> Tạo Tài Khoản Mới
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80 font-bold text-slate-500 uppercase">
              <th className="p-3 w-12 text-center">STT</th>
              <th className="p-3">Tài Khoản / Email</th>
              <th className="p-3">Họ Và Tên</th>
              <th className="p-3">Vai Trò Hệ Thống</th>
              <th className="p-3 text-center">Trạng Thái</th>
              <th className="p-3 text-center w-24">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center text-slate-400">Không có tài khoản người dùng nào.</td></tr>
            ) : filteredUsers.map((u, idx) => {
              const isAdmin = u.role === ADMIN_ROLE || u.username.toLowerCase().includes("admin");
              return (
                <tr key={u.id || idx} className="table-row">
                  <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="p-3">
                    <div className="font-bold text-emerald-700 font-mono text-xs">{u.username}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.fullName} size={28} />
                      <span className="font-bold text-slate-800">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${isAdmin ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-sky-50 text-sky-700 border-sky-200"}`}>
                      {u.role || "Nhân viên"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleUserActive(u)}
                      disabled={isAdmin}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition ${
                        u.active !== false
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                      } ${isAdmin ? "opacity-70 cursor-default" : ""}`}
                    >
                      {u.active !== false ? <UserCheck size={12} /> : <UserX size={12} />}
                      {u.active !== false ? "Hoạt động" : "Đã khóa"}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openUserModal(u)} title="Sửa thông tin & vai trò"
                        className="w-7 h-7 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition grid place-items-center">
                        <Pencil size={14} />
                      </button>
                      {!isAdmin && (
                        <button onClick={() => handleDeleteUser(u)} title="Xóa tài khoản"
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition grid place-items-center">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Tạo / Chỉnh Sửa Tài Khoản */}
      {modal && (
        <Modal
          title={modal.isEdit ? `Cấu Hình Tài Khoản: ${modal.user.username}` : "Tạo Tài Khoản Người Dùng Mới"}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                {error}
              </div>
            )}

            <Field label="Họ và tên người dùng">
              <input
                className={inputCls}
                value={modal.user.fullName}
                onChange={(e) => setModal({ ...modal, user: { ...modal.user, fullName: e.target.value } })}
                placeholder="VD: Bác sĩ Nguyễn Văn A"
                autoFocus
              />
            </Field>

            <Field label="Tên đăng nhập / Email">
              <input
                className={inputCls}
                disabled={modal.isEdit}
                value={modal.user.username}
                onChange={(e) => setModal({ ...modal, user: { ...modal.user, username: e.target.value } })}
                placeholder="VD: admin@gmail.com hoặc bacsinam"
              />
            </Field>

            <Field label={modal.isEdit ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu đăng nhập"}>
              <input
                type="password"
                className={inputCls}
                value={modal.user.password}
                onChange={(e) => setModal({ ...modal, user: { ...modal.user, password: e.target.value } })}
                placeholder={modal.isEdit ? "Bỏ trống nếu giữ nguyên" : "Tối thiểu 6 ký tự"}
              />
            </Field>

            <Field label="Vai trò hệ thống">
              <select
                className={inputCls}
                value={modal.user.role}
                onChange={(e) => setModal({ ...modal, user: { ...modal.user, role: e.target.value } })}
              >
                {ACCOUNT_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>

            <button onClick={handleSaveUser} className={btnPrimary + " w-full justify-center py-3 text-xs font-bold"}>
              <Check size={16} /> {modal.isEdit ? "Cập Nhật Tài Khoản" : "Tạo Tài Khoản Ngay"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Lịch Làm Việc ───────────────────────────────────────────────────────────
function StaffSchedule({ data }) {
  const now = new Date();
  const dayOfWeek = now.getDay();

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
    <div className="space-y-4 animate-fade">
      <div className="card p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700"><Calendar size={20} /></div>
        <div>
          <h2 className="font-bold text-slate-800 text-base font-heading">Lịch Làm Việc Tuần</h2>
          <p className="text-xs text-slate-500">Lịch trực ca khám bệnh thực tế của đội ngũ Bác sĩ</p>
        </div>
      </div>

      <div className="table-container">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80 font-bold text-slate-500 uppercase">
              <th className="p-3">Bác Sĩ / Nhân Viên</th>
              {weekDates.map((d, i) => (
                <th key={d} className={`p-3 text-center ${d === today ? "text-emerald-600 font-extrabold" : ""}`}>
                  <div>{DAY_LABELS[i]}</div>
                  <div className="text-[10px] font-normal">{d.slice(8)}/{d.slice(5, 7)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctors.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-slate-400">
                  Chưa có lịch khám được lên lịch tuần này.
                </td>
              </tr>
            ) : (
              doctors.map((doc) => (
                <tr key={doc} className="table-row">
                  <td className="p-3 font-bold text-slate-800">{doc}</td>
                  {weekDates.map((d) => (
                    <td key={d} className="p-3 text-center">
                      {hasAppt(doc, d) ? (
                        <span className="inline-block w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-extrabold leading-6 text-center shadow-xs">
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

// ─── Phân Quyền Theo Vai Trò ──────────────────────────────────────────────────
function StaffPerm({ perms, onPerms }) {
  const toggle = (role, groupKey) => {
    if (role === ADMIN_ROLE) return;
    if (groupKey === "tong-quan") return;
    const next = {
      ...perms,
      [role]: { ...perms[role], [groupKey]: !perms[role]?.[groupKey] },
    };
    onPerms(next);
  };

  return (
    <div className="space-y-4 animate-fade">
      <div className="card p-4 flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-violet-50 text-violet-700"><ShieldCheck size={22} /></div>
        <div>
          <h2 className="font-bold text-slate-900 text-base font-heading">Ma Trận Phân Quyền Theo Vai Trò</h2>
          <p className="text-xs text-slate-500">Bấm ô checkbox để bật/tắt quyền xem menu hệ thống theo từng nhóm vai trò chung.</p>
        </div>
      </div>

      <div className="table-container">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80 font-bold text-slate-500 uppercase">
              <th className="p-3">Menu / Phân Hệ Chức Năng</th>
              {ACCOUNT_ROLES.map((r) => (
                <th key={r} className="p-3 text-center whitespace-nowrap">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {NAV.map((g) => (
              <tr key={g.key} className="table-row">
                <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                  <g.icon size={16} className="text-emerald-600" /> {g.label}
                </td>
                {ACCOUNT_ROLES.map((r) => {
                  const on = canAccess(r, g.key, perms);
                  const locked = r === ADMIN_ROLE || g.key === "tong-quan";
                  return (
                    <td key={r} className="p-3 text-center">
                      <button
                        onClick={() => toggle(r, g.key)}
                        disabled={locked}
                        title={locked ? "Luôn bật" : on ? "Bấm để tắt" : "Bấm để bật"}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs font-extrabold transition ${
                          on
                            ? "bg-emerald-600 text-white shadow-xs"
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
    </div>
  );
}

// ─── Main Component Export ────────────────────────────────────────────────────
export default function Staff({ data, setData, openAdd, registerAdd, view, perms, onPerms }) {
  switch (view) {
    case "staff-users":    return <StaffUsers perms={perms} onPerms={onPerms} openAdd={openAdd} registerAdd={registerAdd} />;
    case "staff-schedule": return <StaffSchedule data={data} />;
    case "staff-perm":     return <StaffPerm perms={perms} onPerms={onPerms} />;
    default:
      return <StaffList data={data} setData={setData} openAdd={openAdd} registerAdd={registerAdd} />;
  }
}
