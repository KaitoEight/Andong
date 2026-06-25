import { Construction } from "lucide-react";
import { findNavChild } from "../utils/constants";

export default function ComingSoon({ view }) {
  const found = findNavChild(view);
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Construction size={40} className="text-slate-300 mb-3" />
      <p className="text-slate-500 font-medium">{found?.child?.label ?? view}</p>
      <p className="text-slate-400 text-sm mt-1">Tính năng đang được phát triển.</p>
    </div>
  );
}
