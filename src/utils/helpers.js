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
