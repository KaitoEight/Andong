const TOKEN_KEY = "denta:token:v1";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  let res;
  try {
    res = await fetch("/api" + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
        ...(options.headers || {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    return { ok: false, error: "Không kết nối được máy chủ. Kiểm tra server có đang chạy không." };
  }
  try {
    return await res.json();
  } catch {
    return { ok: false, error: `Máy chủ trả về lỗi (HTTP ${res.status}).` };
  }
}
