import { X } from "lucide-react";

export default function Modal({ title, onClose, children, footer }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4 animate-fade"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200/60 max-h-[92vh] flex flex-col animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto scroll-soft">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
