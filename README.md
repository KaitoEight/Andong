# Nha Khoa Victoria — Phần mềm quản lý phòng khám

Ứng dụng gồm 2 phần chạy chung trên **một cổng** ở chế độ production:
- Giao diện React (Vite) đã build → `dist/`
- Máy chủ Express + MongoDB (Atlas) → thư mục `server/`

---

## Yêu cầu máy đích
- **KHÔNG cần cài Node.js** — gói đã kèm sẵn **Node 14 portable** trong thư mục `node/`. `run.bat` tự dùng nó.
- **Trình duyệt** còn cập nhật được: trên Win 7 dùng **Chrome 109** hoặc **Firefox ESR 115** (IE không chạy được).
- **Kết nối Internet** (vì CSDL dùng MongoDB Atlas trên cloud).

> Gói đã kèm: `node/` (Node 14), `dist/` (giao diện build sẵn), `server/node_modules`, `server/.env`.
> Máy đích **không cần cài Node, không build, không `npm install`** — chỉ giải nén rồi bấm `run.bat`.

### Nếu máy quá cũ báo thiếu DLL khi chạy
Win 7 chưa cập nhật có thể thiếu **Universal C Runtime**. Cài bản vá **KB2999226**
(Windows6.1) rồi chạy lại. Máy đã chạy được Node nào đó thì thường đã có sẵn.

---

## Cách chạy trên máy khác (Windows 7/8.1/10/11)
1. Giải nén `nhakhoa-win7.zip`.
2. (Tuỳ chọn) bấm đúp **`setup.bat`** để kiểm tra gói đủ thành phần.
3. Bấm đúp **`run.bat`** — mở trình duyệt tại `http://localhost:3001`.

> Không cần cài Node. Lần sau chỉ cần bấm `run.bat`.

---

## Cách chạy bằng dòng lệnh (mọi hệ điều hành)
```bash
# 1. Cài thư viện + build (chạy 1 lần)
npm run setup

# 2. Khởi động (web + API cùng cổng 3001)
npm start
```
Mở trình duyệt: http://localhost:3001

Đổi cổng: sửa `PORT` trong `server/.env`.

---

## Cấu hình CSDL (`server/.env`)
File `server/.env` chứa thông tin kết nối. Mẫu xem ở `server/.env.example`.
```
MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/nhakhoa?appName=Cluster0
JWT_SECRET=chuoi_bi_mat_cua_ban
PORT=3001
```
> Nếu dùng MongoDB Atlas, vào **Atlas → Network Access** thêm IP máy mới (hoặc `0.0.0.0/0` để cho phép mọi nơi).

---

## Đóng gói để mang đi (trên máy nguồn)
Tạo file zip **không kèm** `node_modules`/`dist` (cài lại ở máy đích), **có kèm** `server/.env`.

PowerShell:
```powershell
# Tạo thư mục tạm chứa bản sạch rồi nén
robocopy . .\_pkg /E /XD node_modules dist .git _pkg
Compress-Archive -Path .\_pkg\* -DestinationPath nhakhoa.zip -Force
Remove-Item -Recurse -Force .\_pkg
```
Chép `nhakhoa.zip` sang máy mới, giải nén, rồi làm theo phần *Cách chạy*.

> Nếu muốn gói "chạy ngay không cần build", cứ kèm luôn thư mục `dist/` (bỏ `dist` khỏi danh sách `/XD`). Máy đích vẫn cần `npm install` cho server.

---

## Chế độ phát triển (dev, có hot-reload)
Cần 2 cửa sổ lệnh:
```bash
# Cửa sổ 1 — API
npm run server      # hoặc: cd server && npm run dev

# Cửa sổ 2 — giao diện (cổng 5173, proxy /api sang 3001)
npm run dev
```

---

## Tài khoản
Đăng ký tài khoản đầu tiên ở màn hình đăng nhập. Vai trò **Quản lý** có toàn quyền;
phân quyền các vai trò khác chỉnh tại **Nhân Viên → Phân Quyền**.
