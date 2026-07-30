import { STATUS } from "../../utils/constants";

export default function Badge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm ${s.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      {s.label}
    </span>
  );
}
