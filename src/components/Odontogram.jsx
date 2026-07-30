import { useState } from "react";

const UPPER = [18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28];
const LOWER = [48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38];

const STATES = {
  healthy: { label: "Bình thường",     cls: "bg-white border-slate-200 text-slate-700 shadow-xs", dot: "bg-slate-300" },
  caries:  { label: "Sâu răng",        cls: "bg-amber-50 border-amber-300 text-amber-800 font-bold", dot: "bg-amber-500" },
  filled:  { label: "Đã trám",         cls: "bg-sky-50 border-sky-300 text-sky-800 font-bold", dot: "bg-sky-500" },
  crown:   { label: "Bọc sứ",          cls: "bg-violet-50 border-violet-300 text-violet-800 font-bold", dot: "bg-violet-500" },
  implant: { label: "Implant",         cls: "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold", dot: "bg-emerald-600" },
  treating:{ label: "Đang điều trị",   cls: "bg-orange-50 border-orange-300 text-orange-800 font-bold", dot: "bg-orange-500" },
  missing: { label: "Mất / đã nhổ",    cls: "bg-slate-100 border-slate-200 text-slate-300 line-through", dot: "bg-slate-400" },
};
const ORDER = ["healthy", "caries", "filled", "crown", "implant", "treating", "missing"];

function Tooth({ num, state, selected, onClick }) {
  const st = STATES[state] || STATES.healthy;
  return (
    <button onClick={onClick}
      className={`w-9 h-10 rounded-xl border text-xs font-extrabold grid place-items-center transition-all duration-150 ${st.cls} ${
        selected ? "ring-2 ring-emerald-500 ring-offset-2 scale-105 shadow-md" : "hover:scale-105 hover:shadow-xs"
      }`}
      title={`Răng ${num} · ${st.label}`}>
      {num}
    </button>
  );
}

export default function Odontogram({ value = {}, onChange }) {
  const [sel, setSel] = useState(null);
  const teeth = value || {};

  const setState = (state) => {
    if (!sel) return;
    const next = { ...teeth };
    if (state === "healthy" && !next[sel]?.note) delete next[sel];
    else next[sel] = { ...next[sel], state };
    onChange(next);
  };

  const setNote = (note) => {
    if (!sel) return;
    const next = { ...teeth };
    const state = next[sel]?.state || "healthy";
    if (!note && state === "healthy") delete next[sel];
    else next[sel] = { state, note };
    onChange(next);
  };

  const selState = sel ? (teeth[sel]?.state || "healthy") : null;

  const Row = ({ nums }) => (
    <div className="flex gap-1.5 justify-center flex-wrap">
      {nums.map((n, i) => (
        <div key={n} className={i === 8 ? "ml-3 sm:ml-4" : ""}>
          <Tooth num={n} state={teeth[n]?.state} selected={sel === n} onClick={() => setSel(n)} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Sơ đồ 32 răng */}
      <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-5 space-y-3">
        <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cung Răng Hàm Trên</div>
        <Row nums={UPPER} />
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200/60 uppercase tracking-wider">Hệ Răng FDI 32 Răng</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <Row nums={LOWER} />
        <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Cung Răng Hàm Dưới</div>
      </div>

      {/* Legend Status Bar */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 py-2 px-3 bg-white rounded-xl border border-slate-200/60">
        {ORDER.map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span className={`w-2.5 h-2.5 rounded-full ${STATES[k].dot}`} />{STATES[k].label}
          </span>
        ))}
      </div>

      {/* Selected Tooth Drawer */}
      {sel ? (
        <div className="card p-5 animate-pop border-emerald-200">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center font-extrabold text-base shadow-sm">{sel}</span>
            <div>
              <div className="text-sm font-bold text-slate-900 font-heading">Chi Tiết Răng Số {sel}</div>
              <div className="text-xs font-semibold text-emerald-600">{STATES[selState].label}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {ORDER.map((k) => (
              <button key={k} onClick={() => setState(k)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  selState === k ? STATES[k].cls + " ring-2 ring-emerald-500/40" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}>
                {STATES[k].label}
              </button>
            ))}
          </div>

          <input
            value={teeth[sel]?.note || ""}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú lâm sàng cho răng này (ví dụ: sâu mặt nhai, đã điều trị tủy...)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      ) : (
        <p className="text-center text-xs text-slate-400 font-medium">Nhấp vào bất kỳ vị trí răng nào trên sơ đồ để đánh dấu tình trạng hoặc thêm ghi chú.</p>
      )}
    </div>
  );
}
