import { NAV } from "./constants";

export const ROLES = ["Quản lý", "Bác sĩ", "Lễ tân", "Kế toán"];
export const ADMIN_ROLE = "Quản lý";

const ALWAYS = ["tong-quan"];

const BASE = {
  "Bác sĩ":  ["lich-hen", "cham-soc", "khach-hang", "dich-vu", "bao-cao"],
  "Lễ tân":  ["lich-hen", "cham-soc", "khach-hang", "dich-vu", "tich-hop"],
  "Kế toán": ["ke-toan", "khach-hang", "kho", "bao-cao"],
};

export function defaultPerms() {
  const out = { users: {} };
  for (const role of ROLES) {
    out[role] = {};
    for (const g of NAV) {
      out[role][g.key] =
        role === ADMIN_ROLE ? true : ALWAYS.includes(g.key) || (BASE[role] || []).includes(g.key);
    }
  }
  return out;
}

const KEY = "denta:perms:v2";

export function loadPerms() {
  try {
    const def = defaultPerms();
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!saved) return def;
    const result = { ...def, ...saved, users: saved.users || {} };
    for (const role of ROLES) {
      result[role] = { ...def[role], ...(saved[role] || {}) };
      if (role === ADMIN_ROLE) for (const g of NAV) result[role][g.key] = true;
    }
    return result;
  } catch {
    return defaultPerms();
  }
}

export function savePerms(perms) {
  try { localStorage.setItem(KEY, JSON.stringify(perms)); } catch { /* ignore */ }
}

export function canAccess(roleOrUser, groupKey, perms) {
  if (!roleOrUser) return true;
  
  let role = roleOrUser;
  let username = "";
  
  if (typeof roleOrUser === "object") {
    role = roleOrUser.role || ADMIN_ROLE;
    username = (roleOrUser.username || "").toLowerCase();
  }
  
  if (role === ADMIN_ROLE) return true;
  if (ALWAYS.includes(groupKey)) return true;

  // Kiểm tra quyền riêng của User (nếu có)
  if (username && perms?.users?.[username] && perms.users[username][groupKey] !== undefined) {
    return !!perms.users[username][groupKey];
  }

  // Nếu không có quyền riêng, áp dụng theo vai trò
  return !!perms?.[role]?.[groupKey];
}
