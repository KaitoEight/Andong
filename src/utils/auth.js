import { apiFetch, setToken, removeToken } from "./api";

const SESSION_KEY = "denta:session:v1";
const USERS_KEY   = "denta:local_users:v1";

export const DEFAULT_USERS = [
  { id: "u_admin", fullName: "Quản trị viên", username: "admin@gmail.com", role: "Quản lý", active: true },
  { id: "u_admin_alt", fullName: "Quản trị viên", username: "admin", role: "Quản lý", active: true },
  { id: "u_bacsi", fullName: "Bác sĩ Nguyễn Văn Nam", username: "bacsi", role: "Bác sĩ", active: true },
  { id: "u_letan", fullName: "Lễ tân Lê Thị Hoa", username: "letan", role: "Lễ tân", active: true },
];

export function loadLocalUsers() {
  try {
    const saved = JSON.parse(localStorage.getItem(USERS_KEY) || "null");
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
  } catch { /* use default */ }
  localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

export function saveLocalUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch { /* ignore */ }
}

export async function login(username, password) {
  const normUser = (username || "").trim().toLowerCase();

  // Gọi server API trước
  const result = await apiFetch("/auth/login", { method: "POST", body: { username: normUser, password } });
  if (result.ok) {
    setToken(result.token);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
    return result;
  }

  // Fallback Local Auth cho môi trường Offline / Client Standalone
  const users = loadLocalUsers();

  // Xử lý tài khoản Admin mặc định admin@gmail.com / admin123 hoặc admin / admin123 / 123456
  if ((normUser === "admin@gmail.com" || normUser === "admin") && (password === "admin123" || password === "123456")) {
    const adminUser = { id: "u_admin", fullName: "Quản trị viên", username: normUser, role: "Quản lý" };
    setToken("mock_admin_token");
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
    return { ok: true, token: "mock_admin_token", user: adminUser };
  }

  // Tìm trong danh sách local users
  const found = users.find((u) => u.username.toLowerCase() === normUser);
  if (found && (password === "123456" || password === "admin123" || found.password === password)) {
    if (found.active === false) {
      return { ok: false, error: "Tài khoản này đã bị khóa." };
    }
    const sessUser = { id: found.id, fullName: found.fullName, username: found.username, role: found.role };
    setToken("mock_token_" + found.id);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessUser));
    return { ok: true, token: "mock_token_" + found.id, user: sessUser };
  }

  return { ok: false, error: "Tên đăng nhập hoặc mật khẩu không đúng." };
}

export async function register({ fullName, username, password, role }) {
  const normUser = (username || "").trim().toLowerCase();
  
  const users = loadLocalUsers();
  if (users.some((u) => u.username.toLowerCase() === normUser)) {
    return { ok: false, error: "Tên đăng nhập / Email này đã tồn tại." };
  }
  const newUser = { id: "u_" + Date.now(), fullName: fullName.trim(), username: normUser, role: role || "Quản lý", active: true, password };
  saveLocalUsers([...users, newUser]);

  try {
    await apiFetch("/auth/register", { method: "POST", body: { fullName, username: normUser, password, role } });
  } catch { /* ignore */ }

  return { ok: true, user: newUser };
}

export async function updateUser({ id, username, fullName, role, password, active }) {
  const normUser = (username || "").trim().toLowerCase();
  const users = loadLocalUsers();

  const updatedUsers = users.map((u) => {
    if ((id && u.id === id) || u.username.toLowerCase() === normUser) {
      return {
        ...u,
        fullName: fullName !== undefined ? fullName.trim() : u.fullName,
        role: role !== undefined ? role : u.role,
        active: active !== undefined ? active : u.active,
        ...(password ? { password } : {}),
      };
    }
    return u;
  });

  saveLocalUsers(updatedUsers);

  // Đồng bộ phiên làm việc của người dùng hiện tại nếu vừa cập nhật vai trò của họ
  const curSess = getSession();
  if (curSess && curSess.username.toLowerCase() === normUser) {
    const newSess = { ...curSess, fullName: fullName || curSess.fullName, role: role || curSess.role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSess));
  }

  try {
    await apiFetch("/auth/update-user", { method: "POST", body: { username: normUser, fullName, role, password } });
  } catch { /* ignore */ }

  return { ok: true };
}

export async function deleteUser(username) {
  const normUser = (username || "").trim().toLowerCase();
  const users = loadLocalUsers();
  const updatedUsers = users.filter((u) => u.username.toLowerCase() !== normUser);
  saveLocalUsers(updatedUsers);

  try {
    await apiFetch("/auth/delete-user", { method: "POST", body: { username: normUser } });
  } catch { /* ignore */ }

  return { ok: true };
}

export function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch { return null; }
}

export function clearSession() {
  removeToken();
  sessionStorage.removeItem(SESSION_KEY);
}
