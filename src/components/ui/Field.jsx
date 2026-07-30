export const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 " +
  "shadow-sm shadow-slate-100 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500";

export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white " +
  "bg-emerald-600 shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[.98] transition-all duration-150";

export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 text-sm font-medium " +
  "hover:bg-slate-100 transition";

export default function Field({ label, children }) {
  return (
    <label className="block mb-3.5">
      <span className="text-xs font-semibold text-slate-500 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
