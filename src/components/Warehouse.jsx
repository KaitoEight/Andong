import { useState, useEffect } from "react";
import {
  Package, Plus, Truck, Search as SearchIcon, Lock, Beaker, Settings,
  AlertTriangle, Pencil, Trash2,
} from "lucide-react";
import Modal from "./ui/Modal";
import Field, { inputCls, btnPrimary, btnGhost } from "./ui/Field";
import { uid, fmtVND } from "../utils/helpers";

const WH_STORAGE_KEY = "denta:warehouse";

const INITIAL_INVENTORY = [
  { id: "wh1", code: "VT001", name: "Bông gòn y tế",       unit: "gói",   qty: 50,  minQty: 10, price: 25000  },
  { id: "wh2", code: "VT002", name: "Găng tay cao su (S)",  unit: "hộp",   qty: 30,  minQty: 5,  price: 120000 },
  { id: "wh3", code: "VT003", name: "Khẩu trang y tế",      unit: "hộp",   qty: 20,  minQty: 5,  price: 85000  },
  { id: "wh4", code: "VT004", name: "Xi măng nha khoa",     unit: "tuýp",  qty: 15,  minQty: 3,  price: 250000 },
  { id: "wh5", code: "VT005", name: "Chỉ khâu nha khoa",   unit: "cuộn",  qty: 8,   minQty: 2,  price: 180000 },
  { id: "wh6", code: "VT006", name: "Mũi khoan nha",        unit: "cái",   qty: 100, minQty: 20, price: 45000  },
  { id: "wh7", code: "VT007", name: "Dung dịch súc miệng",  unit: "chai",  qty: 24,  minQty: 6,  price: 95000  },
  { id: "wh8", code: "VT008", name: "Kim tiêm nha khoa",    unit: "hộp",   qty: 5,   minQty: 2,  price: 320000 },
];

function loadInventory() {
  try {
    const stored = localStorage.getItem(WH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : INITIAL_INVENTORY;
  } catch {
    return INITIAL_INVENTORY;
  }
}

function saveInventory(list) {
  localStorage.setItem(WH_STORAGE_KEY, JSON.stringify(list));
}

// ─── Quản Lý Kho ─────────────────────────────────────────────────────────────
function WhManage() {
  const [inventory, setInventory] = useState(loadInventory);
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", unit: "cái", qty: "", minQty: "", price: "" });

  useEffect(() => { saveInventory(inventory); }, [inventory]);

  const setF = (k, v) => setForm({ ...form, [k]: v });

  const filtered = inventory.filter((item) =>
    !q.trim() || item.name.toLowerCase().includes(q.toLowerCase()) || item.code.toLowerCase().includes(q.toLowerCase())
  );

  const lowStock = inventory.filter((i) => i.qty <= i.minQty);

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", unit: "cái", qty: "", minQty: "", price: "" });
    setShowAdd(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name, unit: item.unit,
      qty: String(item.qty), minQty: String(item.minQty), price: String(item.price),
    });
    setShowAdd(true);
  };

  const remove = (item) => {
    if (!window.confirm(`Xoá vật tư "${item.name}" khỏi kho?`)) return;
    setInventory(inventory.filter((i) => i.id !== item.id));
  };

  const save = () => {
    if (!form.name.trim()) return;
    const payload = {
      name:   form.name.trim(),
      unit:   form.unit,
      qty:    Number(form.qty)    || 0,
      minQty: Number(form.minQty) || 0,
      price:  Number(form.price)  || 0,
    };
    if (editingId) {
      setInventory(inventory.map((i) => i.id === editingId ? { ...i, ...payload } : i));
    } else {
      const n = inventory.length + 1;
      const code = "VT" + String(n).padStart(3, "0");
      setInventory([...inventory, { id: uid("wh"), code, ...payload }]);
    }
    setForm({ name: "", unit: "cái", qty: "", minQty: "", price: "" });
    setEditingId(null);
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700"><Package size={20} /></div>
          <div>
            <h2 className="font-semibold text-slate-800">Quản Lý Kho</h2>
            <p className="text-xs text-slate-500">{inventory.length} mặt hàng · {lowStock.length} sắp hết</p>
          </div>
        </div>
        <button onClick={openAdd} className={btnPrimary}>
          <Plus size={15} /> Thêm
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          <AlertTriangle size={16} />
          <span><strong>{lowStock.length}</strong> mặt hàng sắp hết tồn kho: {lowStock.map((i) => i.name).join(", ")}</span>
        </div>
      )}

      <div className="relative max-w-xs">
        <SearchIcon size={14} className="absolute left-3 top-2.5 text-slate-400" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm vật tư..."
          className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
              <th className="px-4 py-2.5 text-left">Mã</th>
              <th className="px-4 py-2.5 text-left">Tên Vật Tư</th>
              <th className="px-4 py-2.5 text-center">ĐVT</th>
              <th className="px-4 py-2.5 text-center">Tồn Kho</th>
              <th className="px-4 py-2.5 text-center">Tồn Tối Thiểu</th>
              <th className="px-4 py-2.5 text-right">Đơn Giá</th>
              <th className="px-4 py-2.5 text-center">Tình Trạng</th>
              <th className="px-4 py-2.5 text-center w-20">Xử Lý</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const low = item.qty <= item.minQty;
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-slate-500">{item.code}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-4 py-3 text-center text-slate-500 text-xs">{item.unit}</td>
                  <td className={`px-4 py-3 text-center font-semibold ${low ? "text-rose-600" : "text-slate-700"}`}>
                    {item.qty}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400 text-xs">{item.minQty}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{fmtVND(item.price)}</td>
                  <td className="px-4 py-3 text-center">
                    {low ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                        Sắp hết
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đủ hàng
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(item)} title="Sửa"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(item)} title="Xoá"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">Không có vật tư phù hợp.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal
          title={editingId ? "Sửa Vật Tư" : "Thêm Vật Tư"}
          onClose={() => { setShowAdd(false); setEditingId(null); }}
          footer={
            <>
              <button className={btnGhost} onClick={() => { setShowAdd(false); setEditingId(null); }}>Hủy</button>
              <button
                className={btnPrimary + (form.name.trim() ? "" : " opacity-50 pointer-events-none")}
                onClick={save}
              >Lưu</button>
            </>
          }
        >
          <Field label="Tên vật tư">
            <input className={inputCls} value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="VD: Bông gòn y tế" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Đơn vị tính">
              <input className={inputCls} value={form.unit} onChange={(e) => setF("unit", e.target.value)} placeholder="cái, hộp, cuộn..." />
            </Field>
            <Field label="Đơn giá (₫)">
              <input type="number" className={inputCls} value={form.price} onChange={(e) => setF("price", e.target.value)} min={0} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số lượng tồn kho">
              <input type="number" className={inputCls} value={form.qty} onChange={(e) => setF("qty", e.target.value)} min={0} />
            </Field>
            <Field label="Tồn tối thiểu">
              <input type="number" className={inputCls} value={form.minQty} onChange={(e) => setF("minQty", e.target.value)} min={0} />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Placeholder views ────────────────────────────────────────────────────────
function PlaceholderView({ icon: Icon, title, description, color = "slate" }) {
  const colorMap = {
    slate:   "bg-slate-100 text-slate-500",
    sky:     "bg-sky-50 text-sky-600",
    violet:  "bg-violet-50 text-violet-600",
    amber:   "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colorMap[color]}`}>
        <Icon size={32} />
      </div>
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <p className="text-sm text-slate-500 max-w-md leading-relaxed">{description}</p>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">
        Đang phát triển
      </span>
    </div>
  );
}

// ─── main export ────────────────────────────────────────────────────────────
export default function Warehouse({ view }) {
  switch (view) {
    case "wh-manage":
      return <WhManage />;
    case "wh-material":
      return (
        <PlaceholderView
          icon={Truck} color="sky" title="Vật Tư & Lô Vật Tư"
          description="Quản lý nhập xuất vật tư theo lô hàng. Theo dõi nguồn gốc, hạn sử dụng và nhà cung cấp cho từng lô hàng nhập kho."
        />
      );
    case "wh-lookup":
      return (
        <PlaceholderView
          icon={SearchIcon} color="violet" title="Tra Cứu Biến Động"
          description="Lịch sử biến động tồn kho theo ngày, nhân viên thực hiện và lý do. Hỗ trợ lọc theo loại vật tư và khoảng thời gian."
        />
      );
    case "wh-lock":
      return (
        <PlaceholderView
          icon={Lock} color="amber" title="Chốt Kho"
          description="Kiểm kê và chốt kho định kỳ. So sánh số liệu thực tế với hệ thống, lập biên bản kiểm kê và xử lý chênh lệch."
        />
      );
    case "wh-raw":
      return (
        <PlaceholderView
          icon={Beaker} color="emerald" title="Nguyên Vật Liệu"
          description="Quản lý nguyên vật liệu sử dụng trong các quy trình điều trị nha khoa. Theo dõi tiêu hao theo dịch vụ và bác sĩ."
        />
      );
    case "wh-setting":
      return (
        <PlaceholderView
          icon={Settings} color="slate" title="Cài Đặt Kho"
          description="Cấu hình danh mục vật tư, đơn vị tính, nhà cung cấp, ngưỡng cảnh báo tồn kho và quy trình nhập xuất kho."
        />
      );
    default:
      return <WhManage />;
  }
}
