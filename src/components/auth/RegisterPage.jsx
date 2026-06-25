import { useState } from "react";
import { UserPlus } from "lucide-react";
import { register } from "../../utils/auth";
import { ROLES } from "../../utils/perms";
import { inputCls, btnPrimary, btnGhost } from "../ui/Field";

export default function RegisterPage({ onGoLogin }) {
  const [form, setForm]   = useState({ fullName: "", username: "", password: "", confirm: "", role: "Quản lý" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm({ ...form, [k]: v });

  const validate = () => {
    if (!form.fullName.trim())     return "Vui lòng nhập họ tên.";
    if (!form.username.trim())     return "Vui lòng nhập tên đăng nhập.";
    if (form.username.includes(" ")) return "Tên đăng nhập không được chứa khoảng trắng.";
    if (form.password.length < 6)  return "Mật khẩu tối thiểu 6 ký tự.";
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mx-auto mb-4 text-2xl">✓</div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Đăng ký thành công!</h2>
          <p className="text-sm text-slate-500 mb-6">Tài khoản <strong>{form.username}</strong> đã được tạo.</p>
          <button onClick={onGoLogin} className={btnPrimary + " w-full justify-center"}>
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white grid place-items-center font-bold text-2xl mb-3">N</div>
          <h1 className="text-xl font-semibold text-slate-900">Tạo tài khoản</h1>
          <p className="text-sm text-slate-500 mt-1">Điền thông tin bên dưới để đăng ký</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 text-rose-700 text-sm px-4 py-2.5 rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Họ và tên</label>
            <input
              className={inputCls}
              placeholder="Nguyễn Văn A"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Tên đăng nhập</label>
            <input
              className={inputCls}
              placeholder="vd: admin, bsnam"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Mật khẩu</label>
            <input
              type="password"
              className={inputCls}
              placeholder="Tối thiểu 6 ký tự"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Xác nhận mật khẩu</label>
            <input
              type="password"
              className={inputCls}
              placeholder="Nhập lại mật khẩu"
              value={form.confirm}
              onChange={(e) => set("confirm", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Vai trò</label>
            <select className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button
            type="submit"
            className={btnPrimary + " w-full justify-center"}
          >
            <UserPlus size={16} />
            Đăng ký
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Đã có tài khoản?{" "}
          <button onClick={onGoLogin} className="text-emerald-600 font-medium hover:underline">
            Đăng nhập
          </button>
        </p>
      </div>
    </div>
  );
}
