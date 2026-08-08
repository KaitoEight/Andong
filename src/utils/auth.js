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
  const localUsers = loadLocalUsers();
  const localUser = localUsers.find((u) => u.username.toLowerCase() === normUser);

  // Gọi server API trước
  const result = await apiFetch("/auth/login", { method: "POST", body: { username: normUser, password } });
  if (result.ok) {
    // Nếu localUser đã được Admin cập nhật role mới hơn, luôn áp dụng role mới nhất
    if (localUser && localUser.role && localUser.role !== result.user.role) {
      result.user.role = localUser.role;
      // Đồng bộ role mới lên server
      apiFetch("/auth/update-user", { method: "POST", body: { username: normUser, role: localUser.role } }).catch(() => {});
    }
    setToken(result.token);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
    return result;
  }

  // Fallback Local Auth cho môi trường Offline / Client Standalone
  if ((normUser === "admin@gmail.com" || normUser === "admin") && (password === "admin123" || password === "123456")) {
    const role = localUser?.role || "Quản lý";
    const adminUser = { id: "u_admin", fullName: localUser?.fullName || "Quản trị viên", username: normUser, role };
    setToken("mock_admin_token");
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
    return { ok: true, token: "mock_admin_token", user: adminUser };
  }

  if (localUser && (password === "123456" || password === "admin123" || localUser.password === password)) {
    if (localUser.active === false) {
      return { ok: false, error: "Tài khoản này đã bị khóa." };
    }
    const sessUser = { id: localUser.id, fullName: localUser.fullName, username: localUser.username, role: localUser.role };
    setToken("mock_token_" + localUser.id);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessUser));
    return { ok: true, token: "mock_token_" + localUser.id, user: sessUser };
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
        fullName: fullName !== undefined && fullName.trim() ? fullName.trim() : u.fullName,
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
