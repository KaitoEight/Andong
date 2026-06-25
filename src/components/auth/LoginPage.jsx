import { useState } from "react";
import { LogIn } from "lucide-react";
import { login } from "../../utils/auth";
import { inputCls, btnPrimary } from "../ui/Field";

export default function LoginPage({ onLogin, onGoRegister }) {
  const [form, setForm]     = useState({ username: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm({ ...form, [k]: v });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) return;
    setLoading(true);
    setError("");
    const result = await login(form.username.trim(), form.password);
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    onLogin(result.user);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white grid place-items-center font-bold text-2xl mb-3">N</div>
          <h1 className="text-xl font-semibold text-slate-900">Nha Khoa An Đông</h1>
          <p className="text-sm text-slate-500 mt-1">Đăng nhập để tiếp tục</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 text-rose-700 text-sm px-4 py-2.5 rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Tên đăng nhập</label>
            <input
              className={inputCls}
              placeholder="Nhập tên đăng nhập"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Mật khẩu</label>
            <input
              type="password"
              className={inputCls}
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !form.username.trim() || !form.password}
            className={btnPrimary + " w-full justify-center disabled:opacity-50 disabled:pointer-events-none"}
          >
            <LogIn size={16} />
            {loading ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Chưa có tài khoản?{" "}
          <button onClick={onGoRegister} className="text-emerald-600 font-medium hover:underline">
            Đăng ký ngay
          </button>
        </p>
      </div>
    </div>
  );
}
