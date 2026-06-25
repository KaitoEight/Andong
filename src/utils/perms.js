import { NAV } from "./constants";

export const ROLES = ["Quản lý", "Bác sĩ", "Lễ tân", "Kế toán"];
export const ADMIN_ROLE = "Quản lý";

// Nhóm menu luôn cho phép mọi vai trò
const ALWAYS = ["tong-quan"];

// Quyền mặc định theo vai trò (Quản lý = tất cả)
const BASE = {
  "Bác sĩ":  ["lich-hen", "cham-soc", "khach-hang", "dich-vu", "bao-cao"],
  "Lễ tân":  ["lich-hen", "cham-soc", "khach-hang", "dich-vu", "tich-hop"],
  "Kế toán": ["ke-toan", "khach-hang", "kho", "bao-cao"],
};

export function defaultPerms() {
  const out = {};
  for (const role of ROLES) {
    out[role] = {};
    for (const g of NAV) {
      out[role][g.key] =
        role === ADMIN_ROLE ? true : ALWAYS.includes(g.key) || (BASE[role] || []).includes(g.key);
    }
  }
  return out;
}

const KEY = "denta:perms:v1";

export function loadPerms() {
  try {
    const def = defaultPerms();
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!saved) return def;
    for (const role of ROLES) {
      saved[role] = { ...def[role], ...(saved[role] || {}) };
      if (role === ADMIN_ROLE) for (const g of NAV) saved[role][g.key] = true;
    }
    return saved;
  } catch {
    return defaultPerms();
  }
}

export function savePerms(perms) {
  try { localStorage.setItem(KEY, JSON.stringify(perms)); } catch { /* ignore */ }
}

export function canAccess(role, groupKey, perms) {
  const r = role || ADMIN_ROLE;
  if (r === ADMIN_ROLE) return true;
  if (ALWAYS.includes(groupKey)) return true;
  return !!perms?.[r]?.[groupKey];
}
