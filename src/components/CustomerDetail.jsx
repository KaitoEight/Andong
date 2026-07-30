import {
  ChevronLeft, Gem, Settings, Printer, Pencil,
} from "lucide-react";
import Avatar from "./ui/Avatar";
import Odontogram from "./Odontogram";
import CustomerServiceTab from "./CustomerServiceTab";
import CustomerTreatmentTab from "./CustomerTreatmentTab";
import CustomerRecordTab from "./CustomerRecordTab";
import CustomerPaymentTab from "./CustomerPaymentTab";
import { fmtDate, ageFrom } from "../utils/helpers";

const num = (n) => (n || 0).toLocaleString("vi-VN");

const TABS = [
  ["thong-tin", "Thông Tin"], ["tien-su", "Tiền Sử"], ["tu-van", "Tư vấn"],
  ["xet-nghiem", "Xét Nghiệm"], ["dich-vu", "Dịch Vụ"], ["dieu-tri", "Điều trị"],
  ["thanh-toan", "Thanh Toán"], ["hinh-anh", "Hình Ảnh"], ["lich-su", "Lịch Sử"],
  ["lich-hen", "Lịch Hẹn"], ["complaint", "Complaint"],
];

function tierOf(group) {
  if (group === "VIP") return { name: "Diamond", color: "text-sky-500" };
  if (group === "Khách quen") return { name: "Gold", color: "text-amber-400" };
  return { name: "Normal", color: "text-slate-400" };
}

const Card = ({ title, action, children, className = "" }) => (
  <div className={`bg-white p-4 rounded shadow-sm border border-slate-100 ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-center mb-4">
        {title && <h3 className="font-bold text-slate-700">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </div>
);

export default function CustomerDetail({ data, setData, customer: c, tab, onTab, onBack, onEdit }) {
  const svc = (id) => data.services.find((s) => s.id === id);
  const appts = data.appts.filter((a) => a.customerId === c.id)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const invoices = (data.invoices || []).filter((i) => i.customerId === c.id)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const done = appts.filter((a) => a.status === "done");

  const custServices  = c.services || [];
  const servicesTotal = custServices.reduce((s, r) => s + (r.total || 0), 0);
  const invoiceTotal  = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const billed  = servicesTotal || invoiceTotal;   // Phát sinh = dịch vụ đã chốt
  const paid    = invoices.reduce((s, i) => s + (i.paid || 0), 0);
  const debt    = billed - paid;
  const deposit = appts.reduce((s, a) => s + (a.deposit || 0), 0);
  const tier = tierOf(c.group);

  const svcOf = (a) => {
    const ids = a.serviceIds && a.serviceIds.length ? a.serviceIds : (a.serviceId ? [a.serviceId] : []);
    return ids.map((id) => svc(id)?.name).filter(Boolean).join(", ") || "Dịch vụ";
  };
  const priceOf = (a) => {
    const ids = a.serviceIds && a.serviceIds.length ? a.serviceIds : (a.serviceId ? [a.serviceId] : []);
    return ids.reduce((s, id) => s + (svc(id)?.price || 0), 0);
  };
  const updateTeeth = (teeth) =>
    setData?.({ ...data, customers: data.customers.map((x) => x.id === c.id ? { ...x, teeth } : x) });

  const genderSym = c.gender === "Nữ" ? "♀" : "♂";

  // Dòng thời gian tổng hợp cho tab "Lịch Sử"
  const timeline = [
    ...appts.map((a) => ({ id: "a" + a.id, date: a.date, time: a.time, kind: "Lịch hẹn", color: "text-sky-500", text: svcOf(a) })),
    ...custServices.map((r) => ({ id: "s" + r.id, date: r.date, time: r.time, kind: "Dịch vụ", color: "text-emerald-500", text: `${r.name} — ${num(r.total)}` })),
    ...(c.treatments || []).map((r) => ({ id: "t" + r.id, date: r.date, time: r.time, kind: "Điều trị", color: "text-teal-500", text: `${r.serviceName || r.content} (${r.completion || 0}%)` })),
    ...invoices.map((i) => ({ id: "i" + i.id, date: i.date, time: i.time || "", kind: "Thanh toán", color: "text-violet-500", text: `${i.code} — ${num(i.paid)}` })),
    ...(c.consultations || []).map((r) => ({ id: "c" + r.id, date: r.date, time: r.time, kind: "Tư vấn", color: "text-amber-500", text: r.content })),
    ...(c.complaints || []).map((r) => ({ id: "p" + r.id, date: r.date, time: r.time, kind: "Khiếu nại", color: "text-rose-500", text: r.content })),
  ].sort((a, b) => (b.date + (b.time || "")).localeCompare(a.date + (a.time || "")));

  return (
    <div className="-m-4">
      {/* Banner */}
      <div className="bg-emerald-50/50 border-b border-slate-200 px-6 pt-3">
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-2">
          <ChevronLeft size={14} /> Quay lại danh sách
        </button>
        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Avatar src={c.avatar} name={c.name} size={56} className="border-2 border-white shadow-sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">{c.code}</span>
                <span className={`text-xs font-bold flex items-center gap-1 ${tier.color}`}><Gem size={12} /> {tier.name.toUpperCase()}</span>
              </div>
              <h1 className="text-lg font-bold text-slate-800 uppercase">{c.name}</h1>
              <div className="text-emerald-700 font-medium">{c.phone}</div>
            </div>
          </div>
          <div className="flex gap-6 sm:gap-8 text-right">
            <div><div className="text-slate-500 text-xs mb-1">Phát sinh</div><div className="font-bold text-slate-800">{num(billed)}</div></div>
            <div><div className="text-slate-500 text-xs mb-1">Thanh toán</div><div className="font-bold text-slate-800">{num(paid)}</div></div>
            <div><div className="text-slate-500 text-xs mb-1">Công nợ</div><div className={`font-bold ${debt > 0 ? "text-rose-600" : "text-slate-800"}`}>{num(debt)}</div></div>
            <div><div className="text-slate-500 text-xs mb-1">Tiền cọc</div><div className="font-bold text-slate-800">{num(deposit)}</div></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-5 text-sm overflow-x-auto scroll-soft">
          {TABS.map(([k, label]) => (
            <button key={k} onClick={() => onTab(k)}
              className={`py-2 whitespace-nowrap border-b-2 transition ${
                tab === k ? "border-sky-600 text-sky-600 font-medium" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Nội dung theo tab */}
      <div className="p-4">
        {tab === "thong-tin" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Cột trái */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Thông tin KH */}
                <div className="md:col-span-3 bg-white p-4 rounded shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-emerald-600 font-bold uppercase">{c.name}</h2>
                    <button onClick={() => onEdit?.(c)} className="text-emerald-600 text-xs hover:underline flex items-center gap-1"><Pencil size={11} /> Hồ sơ</button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p><span className="text-slate-500 inline-block w-24">Sinh nhật:</span> {fmtDate(c.dob)} <span className="font-medium mx-1">{ageFrom(c.dob)}</span> <span className="text-sky-500 font-bold">{genderSym}</span></p>
                    <p><span className="text-slate-500 inline-block w-24">Nghề nghiệp:</span> {c.occupation || ""}</p>
                    <p><span className="text-slate-500 inline-block w-24">Email:</span> {c.email || ""}</p>
                    <p><span className="text-slate-500 inline-block w-24">Nguồn:</span> {c.source || "—"}{c.sourceDetail ? ` - ${c.sourceDetail}` : ""}</p>
                    <p><span className="text-slate-500 inline-block w-24">CMND/CC:</span> {c.idCard || ""}</p>
                    <p><span className="text-slate-500 inline-block w-24">Địa chỉ:</span> {[c.address, c.ward, c.province, c.nationality].filter(Boolean).join(", ") || "—"}</p>
                    <p><span className="text-slate-500 inline-block w-24">Ngôn ngữ:</span> {c.language || "Tiếng Việt"}</p>
                  </div>
                </div>
                {/* Phân công */}
                <div className="md:col-span-2 bg-white p-4 rounded shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                      <div><div className="text-slate-400 text-[11px]">Nhóm khách hàng</div><div className="text-emerald-600 font-medium text-xs">{c.group || "Mới"}</div></div>
                    </div>
                    <div className="border-t border-slate-100" />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                      <div><div className="text-slate-400 text-[11px]">Người giám hộ</div><div className="text-slate-800 font-medium text-xs">{c.guardianName || "-"}</div></div>
                    </div>
                    <div className="border-t border-slate-100" />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                      <div><div className="text-slate-400 text-[11px]">Liên hệ khẩn</div><div className="text-slate-800 font-medium text-xs">{c.emergency || "-"}</div></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button onClick={() => onEdit?.(c)} className="text-emerald-600 text-xs font-medium flex items-center hover:text-emerald-700"><Settings size={12} className="mr-1" /> Tương tác</button>
                  </div>
                </div>
              </div>

              {/* Ghi chú */}
              <Card>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 text-sm">Ghi chú</span>
                  <span className="text-slate-500 text-xs">{c.note || "Chưa có ghi chú"}</span>
                </div>
              </Card>

              {c.allergy || c.medicalHistory ? (
                <Card title="Triệu chứng và tiền sử bệnh">
                  {c.allergy && <div className="text-xs bg-rose-50 text-rose-700 rounded px-2 py-1 mb-1"><b>⚠ Dị ứng:</b> {c.allergy}</div>}
                  {c.medicalHistory && <div className="text-xs text-slate-600">{c.medicalHistory}</div>}
                </Card>
              ) : null}

              {/* Dịch vụ */}
              <Card title="Dịch vụ" action={<button onClick={() => onTab("dich-vu")} className="text-emerald-600 text-xs hover:underline">Xem thêm</button>}>
                {custServices.length === 0 ? <div className="text-xs text-slate-400">Chưa có dịch vụ.</div> : (
                  <div className="space-y-3">
                    {custServices.slice(-8).reverse().map((r) => (
                      <div key={r.id} className="text-xs">
                        <div className="font-medium text-slate-800"><span className="text-emerald-600">DV</span> {r.time} {fmtDate(r.date)} : {r.name}</div>
                        <div className="text-slate-500">Thành tiền: {num(r.total)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Điều trị */}
              <Card title="Điều trị" action={<button onClick={() => onTab("dieu-tri")} className="text-emerald-600 text-xs hover:underline">Xem thêm</button>}>
                {(c.treatments || []).length === 0 ? <div className="text-xs text-slate-400">Chưa có.</div> : (
                  <div className="space-y-3">
                    {[...(c.treatments || [])].reverse().slice(0, 8).map((r) => (
                      <div key={r.id} className="text-xs">
                        <div className="font-medium text-slate-800"><span className="text-emerald-600">{r.completion || 0} %</span> {r.time} {fmtDate(r.date)} : {r.serviceName || r.content}</div>
                        <div className="text-slate-500">BS/PT : {r.doctor || "-"} / {r.tech || "-"}</div>
                        {r.content && <div className="border-l-2 border-emerald-500 pl-2 text-slate-600">{r.content}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Cột phải */}
            <div className="space-y-4">
              <Card title="Lịch hẹn" action={<span className="text-emerald-600 text-xs">{appts.length} lịch</span>}>
                {appts.length === 0 ? <div className="text-xs text-slate-400">Chưa có.</div> : (
                  <div className="space-y-3">
                    {appts.slice(0, 6).map((a) => (
                      <div key={a.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                        <div className="text-xs">
                          <div className="font-medium"><span className="text-emerald-600 text-sm">{a.time} {fmtDate(a.date)}</span> <span className="text-slate-500">HeadOffice</span></div>
                          <div className="text-slate-500">{a.category || "Điều trị"} <span className="text-slate-800 ml-1">{svcOf(a)}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Thanh toán">
                {invoices.length === 0 ? <div className="text-xs text-slate-400">Chưa có.</div> : (
                  <div className="space-y-3">
                    {invoices.slice(0, 6).map((i) => (
                      <div key={i.id} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0">
                        <div><div className="text-slate-500 mb-1">{fmtDate(i.date)}</div><div className="font-bold text-slate-800">{i.code}</div></div>
                        <div className="text-right"><div className="text-slate-500 mb-1">{i.method || "Tiền mặt"}</div><div className="font-bold text-emerald-600 text-sm">{num(i.paid)}</div></div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Hạng thành viên */}
              <Card title="Hạng thành viên" action={<span className="text-emerald-600 text-xs flex items-center"><Printer size={11} className="mr-1" /> Xem thêm</span>}>
                <div className="bg-gradient-to-br from-amber-300 to-amber-500 rounded-xl p-4 text-white relative h-36 mb-4 overflow-hidden shadow-md">
                  <div className="absolute right-4 top-4 w-10 h-8 bg-white/30 rounded" />
                  <div className="absolute bottom-4 left-4"><div className="text-xs opacity-80">Điểm tích lũy</div><div className="font-bold text-xl">0</div></div>
                  <div className="absolute bottom-4 right-4 text-right"><div className="text-xs opacity-80">Hạng</div><div className="font-bold text-xl">{tier.name}</div></div>
                </div>
                <div className="flex gap-2">
                  {["Normal", "Silver", "Gold", "Diamond", "Platinum"].map((t) => (
                    <div key={t} className={`flex-1 border rounded p-2 text-center text-[10px] ${t === tier.name ? "border-amber-400 bg-white shadow-sm" : "bg-slate-50"}`}>
                      <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${t === tier.name ? "bg-amber-400" : "bg-slate-300"}`} />
                      {t}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : tab === "hinh-anh" ? (
          <Card title={`Hình ảnh / X-quang (${c.files?.length || 0})`}>
            {c.files?.length ? (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {c.files.map((f, i) => (
                  <a key={i} href={f.url} target="_blank" rel="noreferrer"><img src={f.url} alt={f.name} className="w-full h-24 object-cover rounded border border-slate-200 hover:ring-2 hover:ring-emerald-400" /></a>
                ))}
              </div>
            ) : <div className="text-xs text-slate-400">Chưa có ảnh.</div>}
            <div className="mt-4 font-medium text-slate-700 text-sm mb-2">Sơ đồ răng</div>
            <Odontogram value={c.teeth} onChange={updateTeeth} />
          </Card>
        ) : tab === "dich-vu" ? (
          <CustomerServiceTab data={data} setData={setData} customer={c} />
        ) : tab === "dieu-tri" ? (
          <CustomerTreatmentTab data={data} setData={setData} customer={c} />
        ) : tab === "thanh-toan" ? (
          <CustomerPaymentTab data={data} setData={setData} customer={c} />
        ) : tab === "lich-hen" ? (
          <Card title="Tất cả lịch hẹn">
            {appts.length === 0 ? <div className="text-xs text-slate-400">Chưa có.</div> : (
              <div className="space-y-3">{appts.map((a) => (
                <div key={a.id} className="text-xs border-b border-slate-50 pb-2"><div className="font-medium"><span className="text-emerald-600 text-sm">{a.time} {fmtDate(a.date)}</span></div><div className="text-slate-500">{a.category || "Điều trị"} · {svcOf(a)} · {a.doctor}</div></div>
              ))}</div>
            )}
          </Card>
        ) : tab === "tien-su" ? (
          <div className="space-y-4">
            {(c.allergy || c.medicalHistory) && (
              <Card title="Tổng quan y tế">
                {c.allergy && <div className="text-sm bg-rose-50 text-rose-700 rounded px-3 py-2 mb-2"><b>⚠ Dị ứng:</b> {c.allergy}</div>}
                {c.medicalHistory && <div className="text-sm text-slate-600"><span className="text-slate-400">Tiền sử: </span>{c.medicalHistory}</div>}
              </Card>
            )}
            <CustomerRecordTab data={data} setData={setData} customer={c} field="history" title="Tiền sử bệnh"
              subtitle="Bệnh nền, dị ứng, tiền sử điều trị..."
              columns={[{ key: "content", label: "Nội dung", type: "textarea" }, { key: "doctor", label: "Bác sĩ ghi nhận", type: "staff" }]} />
          </div>
        ) : tab === "tu-van" ? (
          <CustomerRecordTab data={data} setData={setData} customer={c} field="consultations" title="Tư vấn"
            subtitle="Lịch sử tư vấn khách hàng"
            columns={[{ key: "staff", label: "Người tư vấn", type: "staff" }, { key: "content", label: "Nội dung tư vấn", type: "textarea" }]} />
        ) : tab === "xet-nghiem" ? (
          <CustomerRecordTab data={data} setData={setData} customer={c} field="labtests" title="Xét nghiệm"
            subtitle="Kết quả xét nghiệm / chẩn đoán hình ảnh"
            columns={[{ key: "name", label: "Tên xét nghiệm", type: "text" }, { key: "result", label: "Kết quả", type: "text" }, { key: "note", label: "Ghi chú", type: "textarea" }]} />
        ) : tab === "complaint" ? (
          <CustomerRecordTab data={data} setData={setData} customer={c} field="complaints" title="Khiếu nại (Complaint)"
            subtitle="Ghi nhận & xử lý khiếu nại"
            columns={[{ key: "content", label: "Nội dung khiếu nại", type: "textarea" }, { key: "solution", label: "Hướng xử lý", type: "textarea" }, { key: "status", label: "Trạng thái", type: "select", options: ["Mới", "Đang xử lý", "Đã xử lý"] }]} />
        ) : tab === "lich-su" ? (
          <Card title="Lịch sử hoạt động">
            {timeline.length === 0 ? <div className="text-xs text-slate-400">Chưa có hoạt động.</div> : (
              <ul className="space-y-3">
                {timeline.map((e) => (
                  <li key={e.id} className="flex gap-3 text-sm">
                    <div className="flex flex-col items-center pt-1">
                      <span className={`w-2.5 h-2.5 rounded-full bg-current ${e.color}`} />
                      <span className="w-px flex-1 bg-slate-200 mt-1" />
                    </div>
                    <div className="pb-2">
                      <div className="text-xs text-slate-400">{e.time} {fmtDate(e.date)}</div>
                      <div className="text-slate-700"><span className={`font-medium ${e.color}`}>{e.kind}:</span> {e.text}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : (
          <Card title={TABS.find(([k]) => k === tab)?.[1]}>
            <div className="text-center text-slate-400 text-sm py-10">Mục này đang được cập nhật.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
