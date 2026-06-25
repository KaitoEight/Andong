import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { STATUS, STATUS_CYCLE } from "../utils/constants";
import { fmtVND } from "../utils/helpers";

const COLORS = ["#059669", "#0ea5e9", "#f59e0b", "#f43f5e", "#64748b", "#10b981"];

export default function Reports({ data }) {
  const svc = (id) => data.services.find((s) => s.id === id);

  const byStatus = useMemo(() => {
    const m = {};
    data.appts.forEach((a) => { m[a.status] = (m[a.status] || 0) + 1; });
    return STATUS_CYCLE.filter((s) => m[s]).map((s) => ({ name: STATUS[s].label, value: m[s] }));
  }, [data.appts]);

  const byService = useMemo(() => {
    const m = {};
    data.appts
      .filter((a) => a.status === "done")
      .forEach((a) => {
        const s = svc(a.serviceId);
        if (!s) return;
        m[s.name] = (m[s.name] || 0) + s.price;
      });
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data.appts]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-4 text-sm">Lịch hẹn theo trạng thái</h3>
        {byStatus.length === 0 ? (
          <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>
        ) : (
          <ul className="space-y-2">
            {byStatus.map((r, i) => (
              <li key={r.name} className="flex items-center gap-3 text-sm">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="flex-1 text-slate-600">{r.name}</span>
                <span className="font-semibold text-slate-800">{r.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-2 text-sm">Doanh thu theo dịch vụ (hoàn thành)</h3>
        {byService.length === 0 ? (
          <p className="text-sm text-slate-400">Chưa có dịch vụ nào hoàn thành.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byService} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip formatter={(v) => fmtVND(v)} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {byService.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
