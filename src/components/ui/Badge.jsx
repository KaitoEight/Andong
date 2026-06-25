import { STATUS } from "../../utils/constants";

export default function Badge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm shadow-slate-100 ${s.cls}`}>
      {s.label}
    </span>
  );
}
