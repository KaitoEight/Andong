import { apiFetch, setToken, removeToken } from "./api";

const SESSION_KEY = "denta:session:v1";

export async function register({ fullName, username, password, role }) {
  return apiFetch("/auth/register", { method: "POST", body: { fullName, username, password, role } });
}

export async function login(username, password) {
  const result = await apiFetch("/auth/login", { method: "POST", body: { username, password } });
  if (result.ok) {
    setToken(result.token);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
  }
  return result;
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
