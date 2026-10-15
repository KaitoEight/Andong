export const uid = (p) => p + "_" + Math.random().toString(36).slice(2, 8);
export const fmtVND = (n) => (n || 0).toLocaleString("vi-VN") + " ₫";
// Formats using local date parts (not toISOString, which converts to UTC and
// shifts the date by a day in timezones ahead of UTC, e.g. Vietnam UTC+7).
export const toLocalISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayStr = () => toLocalISODate(new Date());
export const fmtDate = (s) => {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}-${m}-${y}`;
};
export const ageFrom = (s) => {
  if (!s) return "";
  const a = Math.floor((Date.now() - new Date(s)) / 31557600000);
  return a > 0 && a < 120 ? a + " tuổi" : "";
};

// Chuẩn hoá để tìm kiếm: bỏ dấu tiếng Việt, đ → d, chữ thường ("Hồng Tú" khớp "hong tu").
export const foldText = (s) =>
  String(s ?? "").normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gi, "d").toLowerCase();

// Số điện thoại chỉ giữ chữ số; "+84 906…" / "84906…" quy về "0906…".
export const phoneDigits = (s) => {
  const d = String(s ?? "").replace(/\D/g, "");
  return d.length >= 10 && d.startsWith("84") ? "0" + d.slice(2) : d;
};

// Khách khớp ô tìm kiếm khi MỌI từ trong ô đều khớp tên, mã khách hoặc số điện thoại.
export function customerMatches(c, query) {
  const tokens = foldText(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const text = foldText(c.name) + " " + foldText(c.code) + " " + foldText(c.oldCode);
  const digits = phoneDigits(c.phone);
  return tokens.every((t) => {
    if (text.includes(t)) return true;
    if (!/^[+\d.()-]+$/.test(t)) return false;   // chỉ token toàn số / dấu câu SĐT mới so với SĐT
    const d = phoneDigits(t);
    return d.length > 0 && digits.includes(d);
  });
}

// Sắp khách theo ngày tạo. Khách chưa có ngày tạo (tạo trong app trước khi có trường này) được thêm vào
// CUỐI mảng nên coi là mới nhất; cùng ngày thì theo thứ tự trong mảng (mảng luôn thêm theo thứ tự tạo).
export function sortCustomersByCreated(list, newestFirst = true) {
  const sorted = list
    .map((c, i) => ({ c, d: c.createdAt || "9999-12-31", i }))
    .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.i - b.i));
  if (newestFirst) sorted.reverse();
  return sorted.map((x) => x.c);
}

// Đọc số tiền thành chữ cho dòng "(Viết bằng chữ)" trên phiếu: 2200000 → "Hai triệu hai trăm nghìn đồng".
const VI_DIGIT = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
function viTriple(n, full) {          // n: 0–999; full = có nhóm lớn hơn đứng trước nên phải đọc đủ "không trăm", "lẻ"
  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), u = n % 10;
  const out = [];
  if (h > 0 || full) out.push(VI_DIGIT[h] + " trăm");
  if (t > 1) {
    out.push(VI_DIGIT[t] + " mươi");
    if (u === 1) out.push("mốt"); else if (u === 5) out.push("lăm"); else if (u > 0) out.push(VI_DIGIT[u]);
  } else if (t === 1) {
    out.push("mười");
    if (u === 5) out.push("lăm"); else if (u > 0) out.push(VI_DIGIT[u]);
  } else if (u > 0) {
    if (h > 0 || full) out.push("lẻ");
    out.push(VI_DIGIT[u]);
  }
  return out.join(" ");
}
export function moneyToWordsVi(value) {
  let n = Math.round(Math.abs(Number(value) || 0));
  if (n === 0) return "Không đồng";
  const UNITS = ["", " nghìn", " triệu", " tỷ"];
  const groups = [];
  while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000); }
  // nhóm vượt quá "tỷ" (≥ 1000 tỷ) đọc tiếp là "nghìn tỷ", "triệu tỷ"…
  const words = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    const full = words.length > 0;
    const unit = i < UNITS.length ? UNITS[i] : UNITS[3] + UNITS[i - 3];
    words.push(viTriple(groups[i], full) + unit);
  }
  const s = words.join(" ") + " đồng";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
