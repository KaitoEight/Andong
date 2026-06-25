import { apiFetch } from "./api";

export async function loadData() {
  const result = await apiFetch("/data");
  if (result.ok) return result.data;
  throw new Error(result.error || "Không thể tải dữ liệu.");
}

export async function saveData(data) {
  const result = await apiFetch("/data", { method: "PUT", body: data });
  if (!result?.ok) console.warn("⚠️ Lưu dữ liệu thất bại:", result?.error || "lỗi không xác định");
  return result;
}
