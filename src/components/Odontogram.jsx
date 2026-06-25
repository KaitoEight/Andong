import { useState } from "react";

// Răng theo hệ FDI
const UPPER = [18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28];
const LOWER = [48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38];

const STATES = {
  healthy: { label: "Bình thường",     cls: "bg-white border-slate-300 text-slate-600", dot: "bg-slate-300" },
  caries:  { label: "Sâu răng",        cls: "bg-amber-100 border-amber-400 text-amber-800", dot: "bg-amber-400" },
  filled:  { label: "Đã trám",         cls: "bg-sky-100 border-sky-400 text-sky-800", dot: "bg-sky-400" },
  crown:   { label: "Bọc sứ",          cls: "bg-violet-100 border-violet-400 text-violet-800", dot: "bg-violet-400" },
  implant: { label: "Implant",         cls: "bg-emerald-100 border-emerald-500 text-emerald-800", dot: "bg-emerald-500" },
  treating:{ label: "Đang điều trị",   cls: "bg-orange-100 border-orange-400 text-orange-800", dot: "bg-orange-400" },
  missing: { label: "Mất / đã nhổ",    cls: "bg-slate-100 border-slate-300 text-slate-300 line-through", dot: "bg-slate-400" },
};
const ORDER = ["healthy", "caries", "filled", "crown", "implant", "treating", "missing"];

function Tooth({ num, state, selected, onClick }) {
  const st = STATES[state] || STATES.healthy;
  return (
    <button onClick={onClick}
      className={`w-8 h-9 rounded-md border text-[11px] font-semibold grid place-items-center transition ${st.cls} ${
        selected ? "ring-2 ring-emerald-500 ring-offset-1" : "hover:brightness-95"
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
    <div className="flex gap-1 justify-center">
      {nums.map((n, i) => (
        <div key={n} className={i === 8 ? "ml-3" : ""}>
          <Tooth num={n} state={teeth[n]?.state} selected={sel === n} onClick={() => setSel(n)} />
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Sơ đồ */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        <Row nums={UPPER} />
        <div className="flex items-center gap-2 my-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Hàm trên / Hàm dưới</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <Row nums={LOWER} />
      </div>

      {/* Chú thích trạng thái */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {ORDER.map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`w-2.5 h-2.5 rounded-full ${STATES[k].dot}`} />{STATES[k].label}
          </span>
        ))}
      </div>

      {/* Bảng chỉnh răng đang chọn */}
      {sel ? (
        <div className="mt-4 card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center font-bold text-sm">{sel}</span>
            <div>
              <div className="text-sm font-semibold text-slate-800">Răng {sel}</div>
              <div className="text-xs text-slate-400">{STATES[selState].label}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {ORDER.map((k) => (
              <button key={k} onClick={() => setState(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  selState === k ? STATES[k].cls + " ring-2 ring-emerald-500/40" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}>
                {STATES[k].label}
              </button>
            ))}
          </div>
          <input
            value={teeth[sel]?.note || ""}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú cho răng này..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-slate-400">Chọn một răng để đánh dấu tình trạng.</p>
      )}
    </div>
  );
}
