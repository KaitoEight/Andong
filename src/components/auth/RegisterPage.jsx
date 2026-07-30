import { useState } from "react";
import { UserPlus, User, Lock, CheckCircle2, ShieldAlert } from "lucide-react";
import { register } from "../../utils/auth";
import { ROLES } from "../../utils/perms";

export default function RegisterPage({ onGoLogin }) {
  const [form, setForm]   = useState({ fullName: "", username: "", password: "", confirm: "", role: "Quản lý" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm({ ...form, [k]: v });

  const validate = () => {
    if (!form.fullName.trim())       return "Vui lòng nhập họ tên.";
    if (!form.username.trim())       return "Vui lòng nhập tên đăng nhập.";
    if (form.username.includes(" ")) return "Tên đăng nhập không được chứa khoảng trắng.";
    if (form.password.length < 6)    return "Mật khẩu tối thiểu 6 ký tự.";
    if (form.password !== form.confirm) return "Mật khẩu xác nhận không khớp.";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    const result = await register({ fullName: form.fullName.trim(), username: form.username.trim(), password: form.password, role: form.role });
    if (!result.ok) { setError(result.error); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-8 text-center shadow-2xl animate-pop">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 grid place-items-center mx-auto mb-4 text-3xl">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-extrabold text-white font-heading mb-2">Đăng Ký Thành Công!</h2>
          <p className="text-xs text-slate-300 mb-6">Tài khoản <strong>{form.username}</strong> đã được khởi tạo thành công.</p>
          <button onClick={onGoLogin} className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition">
            Đăng Nhập Ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl p-8 animate-pop">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 grid place-items-center font-extrabold text-2xl font-heading shadow-lg shadow-emerald-500/30 mx-auto mb-3">
            V
          </div>
          <h1 className="text-xl font-bold text-white font-heading">Đăng Ký Tài Khoản</h1>
          <p className="text-xs text-slate-400 mt-1">Khởi tạo tài khoản truy cập hệ thống Nha Khoa</p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-500/10 text-rose-300 text-xs p-3 rounded-xl border border-rose-500/30 flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Họ và tên</label>
            <input
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
              placeholder="Nguyễn Văn A"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Tên đăng nhập</label>
            <input
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
              placeholder="vd: bacsinam, nhanvien"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Mật khẩu</label>
              <input
                type="password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                placeholder="≥ 6 ký tự"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Xác nhận</label>
              <input
                type="password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                placeholder="Nhập lại"
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Vai trò</label>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button
            type="submit"
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition"
          >
            <UserPlus size={16} />
            Đăng Ký Tài Khoản
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-5">
          Đã có tài khoản?{" "}
          <button onClick={onGoLogin} className="text-emerald-400 font-semibold hover:underline">
            Quay lại Đăng nhập
          </button>
        </p>
      </div>
    </div>
  );
}
