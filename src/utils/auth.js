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

  // Máy chủ là nơi DUY NHẤT xác thực và quyết định vai trò. Không còn "đăng nhập giả" ngoại tuyến:
  // phiên giả không có token hợp lệ nên app không tải được dữ liệu (kẹt ở màn hình tải), và nó cho phép
  // vào bằng mật khẩu mặc định (123456 / admin123) dù mật khẩu thật đã đổi.
  const result = await apiFetch("/auth/login", { method: "POST", body: { username: normUser, password } });
  if (result.ok) {
    setToken(result.token);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
    return result;
  }
  return { ok: false, error: result.error || "Tên đăng nhập hoặc mật khẩu không đúng." };
}

export async function register({ fullName, username, password, role }) {
  const normUser = (username || "").trim().toLowerCase();
  
  const users = loadLocalUsers();
  if (users.some((u) => u.username.toLowerCase() === normUser)) {
    return { ok: false, error: "Tên đăng nhập / Email này đã tồn tại." };
  }
  // Chỉ Quản lý mới tạo được tài khoản (máy chủ kiểm tra). Chỉ lưu vào danh sách khi máy chủ đã tạo thật.
  const res = await apiFetch("/auth/register", { method: "POST", body: { fullName, username: normUser, password, role } });
  if (!res?.ok) return { ok: false, error: res?.error || "Máy chủ không tạo được tài khoản (chỉ Quản lý mới được tạo tài khoản)." };

  const newUser = { id: "u_" + Date.now(), fullName: fullName.trim(), username: normUser, role: role || "Quản lý", active: true };
  saveLocalUsers([...users, newUser]);   // không lưu mật khẩu ở trình duyệt

  return { ok: true, user: newUser };
}

export async function updateUser({ id, username, fullName, role, password, active }) {
  const normUser = (username || "").trim().toLowerCase();

  // Máy chủ trước: chỉ khi máy chủ chấp nhận mới cập nhật danh sách hiển thị trên máy này
  const res = await apiFetch("/auth/update-user", { method: "POST", body: { username: normUser, fullName, role, password, active } });
  if (!res?.ok) return { ok: false, error: res?.error || "Máy chủ chưa cập nhật được tài khoản." };

  const users = loadLocalUsers();
  const updatedUsers = users.map((u) => {
    if ((id && u.id === id) || u.username.toLowerCase() === normUser) {
      return {
        ...u,
        fullName: fullName !== undefined && fullName.trim() ? fullName.trim() : u.fullName,
        role: role !== undefined ? role : u.role,
        active: active !== undefined ? active : u.active,
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
  return { ok: true };
}

export async function deleteUser(username) {
  const normUser = (username || "").trim().toLowerCase();
  const res = await apiFetch("/auth/delete-user", { method: "POST", body: { username: normUser } });
  if (!res?.ok) return { ok: false, error: res?.error || "Máy chủ chưa xoá được tài khoản." };
  saveLocalUsers(loadLocalUsers().filter((u) => u.username.toLowerCase() !== normUser));
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
