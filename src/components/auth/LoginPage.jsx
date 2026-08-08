import { useState } from "react";
import { LogIn, Lock, User, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
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

  const setQuickUser = (u, p) => {
    setForm({ username: u, password: p });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Blurs & Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-slate-800/80 backdrop-blur-xl border border-slate-700/70 rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-pop">
        
        {/* Left Side: Branding Hero */}
        <div className="p-8 lg:p-10 bg-gradient-to-br from-emerald-900/60 via-slate-900/80 to-slate-900 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700/60">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 grid place-items-center font-extrabold text-2xl font-heading shadow-lg shadow-emerald-500/30">
                V
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white font-heading tracking-tight">Nha Khoa Victoria</h2>
                <p className="text-xs text-emerald-400 font-semibold tracking-wide uppercase">Phần Mềm Quản Lý Nha Khoa</p>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white font-heading leading-tight">
                Giải pháp quản lý <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Nha Khoa Toàn Diện</span>
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tối ưu hóa quy trình đặt lịch, sơ đồ 32 răng chuẩn y khoa, quản lý doanh thu và chăm sóc khách hàng chuyên nghiệp.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-6 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>Sơ đồ răng Odontogram 3D tương tác</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>Quản lý công nợ & doanh thu minh bạch</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>Phân quyền chi tiết theo vai trò bác sĩ / nhân viên</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 lg:p-10 flex flex-col justify-center bg-slate-900/60">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white font-heading">Đăng Nhập Hệ Thống</h2>
            <p className="text-xs text-slate-400 mt-1">Nhập tài khoản để truy cập bảng điều khiển</p>
          </div>

          {error && (
            <div className="mb-4 bg-rose-500/10 text-rose-300 text-xs p-3 rounded-xl border border-rose-500/30 flex items-center gap-2">
              <ShieldCheck size={16} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Tên đăng nhập</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/90 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                  placeholder="Nhập tên đăng nhập"
                  value={form.username}
                  onChange={(e) => set("username", e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/90 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                  placeholder="Nhập mật khẩu"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !form.username.trim() || !form.password}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition disabled:opacity-50"
            >
              <LogIn size={16} />
              {loading ? "Đang xử lý..." : "Đăng Nhập Vui Lòng"}
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 mb-2 font-medium">Tài khoản thử nghiệm nhanh:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => setQuickUser("admin@gmail.com", "admin123")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-emerald-400 font-medium border border-slate-700 transition">
                Admin (admin@gmail.com)
              </button>
              <button onClick={() => setQuickUser("bacsi", "123456")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-sky-400 font-medium border border-slate-700 transition">
                Bác sĩ (bacsi)
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Chưa có tài khoản?{" "}
            <button onClick={onGoRegister} className="text-emerald-400 font-semibold hover:underline">
              Đăng ký tài khoản mới
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
