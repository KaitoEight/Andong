import { useMemo } from "react";
import {
  Bell, AlertCircle, Cake, UserX, CheckCircle2, MessageSquareWarning,
  CalendarX, CalendarClock, Phone, RefreshCw,
} from "lucide-react";
import Badge from "./ui/Badge";
import Avatar from "./ui/Avatar";
import { todayStr, fmtDate, fmtVND, ageFrom } from "../utils/helpers";

// ─── helpers ────────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, count, color = "emerald" }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber:   "bg-amber-50 text-amber-700",
    rose:    "bg-rose-50 text-rose-700",
    sky:     "bg-sky-50 text-sky-700",
    violet:  "bg-violet-50 text-violet-700",
    slate:   "bg-slate-100 text-slate-600",
  };
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 rounded-xl ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <h2 className="font-semibold text-slate-800 text-base">{title}</h2>
        <p className="text-xs text-slate-500">{count} bản ghi</p>
      </div>
    </div>
  );
}

function Empty({ msg = "Không có dữ liệu." }) {
  return (
    <div className="card p-10 text-center text-slate-400 text-sm">
      {msg}
    </div>
  );
}

function TableWrapper({ children }) {
  return (
    <div className="card overflow-hidden">
      {children}
    </div>
  );
}

// ─── sub-views ───────────────────────────────────────────────────────────────

function CareRemind({ data, setData }) {
  const today = todayStr();
  const cust = (id) => data.customers.find((c) => c.id === id);
  const svc  = (id) => data.services.find((s) => s.id === id);

  const items = useMemo(() =>
    data.appts.filter(
      (a) => a.date > today && a.status !== "cancelled" && a.status !== "done"
    ).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [data.appts, today]
  );

  const markReminded = (id) => {
    setData({
      ...data,
      appts: data.appts.map((a) => a.id === id ? { ...a, reminded: true } : a),
    });
  };

  return (
    <div>
      <SectionHeader icon={Bell} title="Nhắc Lịch Hẹn" count={items.length} color="emerald" />
      {items.length === 0 ? (
        <Empty msg="Không có lịch hẹn sắp tới cần nhắc." />
      ) : (
        <TableWrapper>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                <th className="px-4 py-2.5 text-left">Ngày / Giờ</th>
                <th className="px-4 py-2.5 text-left">Khách Hàng</th>
                <th className="px-4 py-2.5 text-left">Số ĐT</th>
                <th className="px-4 py-2.5 text-left">Dịch Vụ</th>
                <th className="px-4 py-2.5 text-left">Trạng Thái</th>
                <th className="px-4 py-2.5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((a) => {
                const c = cust(a.customerId);
                const s = svc(a.serviceId);
                return (
                  <tr key={a.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{fmtDate(a.date)}</div>
                      <div className="text-xs text-slate-400">{a.time}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={c?.avatar} name={c?.name} size={32} />
                        <div>
                          <div className="font-medium text-slate-800">{c?.name}</div>
                          <div className="text-xs text-slate-400">{c?.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c?.phone}</td>
                    <td className="px-4 py-3 text-slate-700">{s?.name}</td>
                    <td className="px-4 py-3"><Badge status={a.status} /></td>
                    <td className="px-4 py-3 text-center">
                      {a.reminded ? (
                        <span className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1">
                          <CheckCircle2 size={13} /> Đã nhắc
                        </span>
                      ) : (
                        <button
                          onClick={() => markReminded(a.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition"
                        >
                          <Bell size={12} /> Đã nhắc
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrapper>
      )}
    </div>
  );
}

function CareNoService({ data }) {
  const today = todayStr();
  const cust = (id) => data.customers.find((c) => c.id === id);
  const svc  = (id) => data.services.find((s) => s.id === id);

  const items = useMemo(() =>
    data.appts.filter(
      (a) => a.status === "arrived" && a.date < today
    ).sort((a, b) => b.date.localeCompare(a.date)),
    [data.appts, today]
  );

  return (
    <div>
      <SectionHeader icon={AlertCircle} title="Không Làm Dịch Vụ" count={items.length} color="amber" />
      {items.length === 0 ? (
        <Empty msg="Không có bệnh nhân nào đã đến nhưng chưa hoàn thành dịch vụ." />
      ) : (
        <TableWrapper>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                <th className="px-4 py-2.5 text-left">Ngày Hẹn</th>
                <th className="px-4 py-2.5 text-left">Khách Hàng</th>
                <th className="px-4 py-2.5 text-left">Số ĐT</th>
                <th className="px-4 py-2.5 text-left">Dịch Vụ</th>
                <th className="px-4 py-2.5 text-left">Bác Sĩ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((a) => {
                const c = cust(a.customerId);
                const s = svc(a.serviceId);
                return (
                  <tr key={a.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-amber-700">{fmtDate(a.date)}</div>
                      <div className="text-xs text-slate-400">{a.time}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={c?.avatar} name={c?.name} size={32} />
                        <div>
                          <div className="font-medium text-slate-800">{c?.name}</div>
                          <div className="text-xs text-slate-400">{c?.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c?.phone}</td>
                    <td className="px-4 py-3 text-slate-700">{s?.name}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{a.doctor}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrapper>
      )}
    </div>
  );
}

function CareBirthday({ data }) {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const todayDay = now.getDate();
  const todayMonStr = `${String(month).padStart(2, "0")}-${String(todayDay).padStart(2, "0")}`;

  const items = useMemo(() =>
    data.customers
      .filter((c) => {
        if (!c.dob) return false;
        const [, m] = c.dob.split("-");
        return parseInt(m, 10) === month;
      })
      .map((c) => {
        const [, m, d] = c.dob.split("-");
        const isToday = m === String(month).padStart(2, "0") && d === String(todayDay).padStart(2, "0");
        return { ...c, isToday };
      })
      .sort((a, b) => a.dob.slice(5).localeCompare(b.dob.slice(5))),
    [data.customers, month, todayDay]
  );

  return (
    <div>
      <SectionHeader icon={Cake} title={`Sinh Nhật Tháng ${month}`} count={items.length} color="violet" />
      {items.length === 0 ? (
        <Empty msg={`Không có khách hàng nào sinh nhật tháng ${month}.`} />
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${c.isToday ? "border-violet-300 bg-violet-50" : "border-slate-100"}`}>
              <Avatar src={c.avatar} name={c.name} size={40} className={c.isToday ? "ring-2 ring-violet-400 ring-offset-2" : ""} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{c.name}</span>
                  {c.isToday && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-600 text-white font-medium flex items-center gap-1">
                      <Cake size={10} /> Hôm nay!
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Phone size={11} />{c.phone}</span>
                  <span>Sinh: {fmtDate(c.dob)}</span>
                  <span>{ageFrom(c.dob)}</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-lg font-medium ${c.group === "VIP" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                {c.group}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CareNoShow({ data, setData }) {
  const cust = (id) => data.customers.find((c) => c.id === id);
  const svc  = (id) => data.services.find((s) => s.id === id);

  const items = useMemo(() =>
    data.appts.filter((a) => a.status === "noshow")
      .sort((a, b) => b.date.localeCompare(a.date)),
    [data.appts]
  );

  const reschedule = (id) => {
    setData({
      ...data,
      appts: data.appts.map((a) => a.id === id ? { ...a, status: "pending" } : a),
    });
  };

  return (
    <div>
      <SectionHeader icon={UserX} title="Hẹn Không Đến" count={items.length} color="slate" />
      {items.length === 0 ? (
        <Empty msg="Không có lịch hẹn nào bị không đến." />
      ) : (
        <TableWrapper>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                <th className="px-4 py-2.5 text-left">Ngày / Giờ</th>
                <th className="px-4 py-2.5 text-left">Khách Hàng</th>
                <th className="px-4 py-2.5 text-left">Số ĐT</th>
                <th className="px-4 py-2.5 text-left">Dịch Vụ</th>
                <th className="px-4 py-2.5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((a) => {
                const c = cust(a.customerId);
                const s = svc(a.serviceId);
                return (
                  <tr key={a.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{fmtDate(a.date)}</div>
                      <div className="text-xs text-slate-400">{a.time}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={c?.avatar} name={c?.name} size={32} />
                        <div>
                          <div className="font-medium text-slate-800">{c?.name}</div>
                          <div className="text-xs text-slate-400">{c?.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c?.phone}</td>
                    <td className="px-4 py-3 text-slate-700">{s?.name}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => reschedule(a.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-medium hover:bg-sky-100 transition"
                      >
                        <RefreshCw size={12} /> Đặt lại
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrapper>
      )}
    </div>
  );
}

function CareAfter({ data, setData, openAdd, registerAdd }) {
  registerAdd(() => openAdd("care"));

  const cust = (id) => data.customers.find((c) => c.id === id);

  const items = useMemo(() =>
    data.care.filter((c) => !c.type?.toLowerCase().includes("khiếu nại")),
    [data.care]
  );

  const toggle = (c) =>
    setData({
      ...data,
      care: data.care.map((x) =>
        x.id === c.id ? { ...x, status: x.status === "Đã xử lý" ? "Chưa xử lý" : "Đã xử lý" } : x
      ),
    });

  return (
    <div>
      <SectionHeader icon={CheckCircle2} title="Sau Điều Trị" count={items.length} color="emerald" />
      {items.length === 0 ? (
        <Empty msg="Chưa có nội dung chăm sóc sau điều trị." />
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="card p-4 flex items-start gap-3">
              <button
                onClick={() => toggle(c)}
                className={`mt-0.5 transition ${c.status === "Đã xử lý" ? "text-emerald-600" : "text-slate-300 hover:text-emerald-400"}`}
              >
                <CheckCircle2 size={20} />
              </button>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">{cust(c.customerId)?.name} · {c.type}</div>
                <div className="text-sm text-slate-600">{c.content}</div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <CalendarClock size={12} /> Gọi lại: {fmtDate(c.callback)}
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                c.status === "Đã xử lý"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CareComplaint({ data, setData }) {
  const cust = (id) => data.customers.find((c) => c.id === id);

  const items = useMemo(() =>
    data.care.filter((c) =>
      c.type?.toLowerCase().includes("khiếu nại") ||
      c.type?.toLowerCase().includes("giải quyết")
    ),
    [data.care]
  );

  const toggle = (c) =>
    setData({
      ...data,
      care: data.care.map((x) =>
        x.id === c.id ? { ...x, status: x.status === "Đã xử lý" ? "Chưa xử lý" : "Đã xử lý" } : x
      ),
    });

  return (
    <div>
      <SectionHeader icon={MessageSquareWarning} title="Giải Quyết Khiếu Nại" count={items.length} color="rose" />
      {items.length === 0 ? (
        <Empty msg="Không có khiếu nại nào cần xử lý." />
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className={`bg-white rounded-xl border p-4 flex items-start gap-3 ${c.status !== "Đã xử lý" ? "border-rose-200" : "border-slate-100"}`}>
              <button
                onClick={() => toggle(c)}
                className={`mt-0.5 transition ${c.status === "Đã xử lý" ? "text-emerald-600" : "text-rose-400 hover:text-emerald-400"}`}
              >
                <CheckCircle2 size={20} />
              </button>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">{cust(c.customerId)?.name} · {c.type}</div>
                <div className="text-sm text-slate-600">{c.content}</div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <CalendarClock size={12} /> Gọi lại: {fmtDate(c.callback)}
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                c.status === "Đã xử lý"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CareCancel({ data, setData }) {
  const cust = (id) => data.customers.find((c) => c.id === id);
  const svc  = (id) => data.services.find((s) => s.id === id);

  const items = useMemo(() =>
    data.appts.filter((a) => a.status === "cancelled")
      .sort((a, b) => b.date.localeCompare(a.date)),
    [data.appts]
  );

  const reschedule = (id) => {
    setData({
      ...data,
      appts: data.appts.map((a) => a.id === id ? { ...a, status: "pending" } : a),
    });
  };

  return (
    <div>
      <SectionHeader icon={CalendarX} title="Lịch Hẹn Hủy" count={items.length} color="rose" />
      {items.length === 0 ? (
        <Empty msg="Không có lịch hẹn nào bị hủy." />
      ) : (
        <TableWrapper>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                <th className="px-4 py-2.5 text-left">Ngày / Giờ</th>
                <th className="px-4 py-2.5 text-left">Khách Hàng</th>
                <th className="px-4 py-2.5 text-left">Số ĐT</th>
                <th className="px-4 py-2.5 text-left">Dịch Vụ</th>
                <th className="px-4 py-2.5 text-left">Lý Do Hủy</th>
                <th className="px-4 py-2.5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((a) => {
                const c = cust(a.customerId);
                const s = svc(a.serviceId);
                return (
                  <tr key={a.id} className="hover:bg-slate-50 transition opacity-80">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-700">{fmtDate(a.date)}</div>
                      <div className="text-xs text-slate-400">{a.time}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={c?.avatar} name={c?.name} size={32} />
                        <div>
                          <div className="font-medium text-slate-800">{c?.name}</div>
                          <div className="text-xs text-slate-400">{c?.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c?.phone}</td>
                    <td className="px-4 py-3 text-slate-700">{s?.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{a.cancelReason || a.note || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => reschedule(a.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition"
                      >
                        <RefreshCw size={12} /> Đặt lại
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrapper>
      )}
    </div>
  );
}

// ─── main export ────────────────────────────────────────────────────────────
export default function CareViews({ data, setData, openAdd, registerAdd, view }) {
  // default registerAdd to no-op so sub-views that don't use it won't break
  const noop = () => {};

  switch (view) {
    case "care-remind":
      return <CareRemind data={data} setData={setData} />;
    case "care-noservice":
      return <CareNoService data={data} />;
    case "care-birthday":
      return <CareBirthday data={data} />;
    case "care-noshow":
      return <CareNoShow data={data} setData={setData} />;
    case "care-after":
      return <CareAfter data={data} setData={setData} openAdd={openAdd} registerAdd={registerAdd} />;
    case "care-complaint":
      return <CareComplaint data={data} setData={setData} />;
    case "care-cancel":
      return <CareCancel data={data} setData={setData} />;
    default:
      return null;
  }
}
