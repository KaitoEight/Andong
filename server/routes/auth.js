const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const User     = require("../models/User");
const requireAuth  = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");

const router = express.Router();

// Chỉ tạo tài khoản quản lý đầu tiên khi DB CHƯA có tài khoản nào (lần chạy đầu tiên).
// Trước đây mỗi lần đăng nhập server đều tự tạo lại admin/admin123, bacsi/123456, letan/123456 nếu thiếu,
// nên không thể gỡ các tài khoản mật khẩu mặc định (và ai cũng biết mật khẩu đó).
async function ensureDefaultAdmin() {
  try {
    if ((await User.countDocuments({})) > 0) return;
    // Mật khẩu ban đầu: lấy từ biến môi trường INITIAL_ADMIN_PASSWORD, nếu không có thì sinh ngẫu nhiên (in 1 lần ở log)
    const initial = process.env.INITIAL_ADMIN_PASSWORD || require("crypto").randomBytes(9).toString("hex");
    await User.create({
      fullName: "Quản trị viên Hệ thống",
      username: "admin@gmail.com",
      passwordHash: await bcrypt.hash(initial, 10),
      role: "Quản lý",
    });
    console.log("✅ Đã tạo tài khoản quản lý đầu tiên: admin@gmail.com");
    if (!process.env.INITIAL_ADMIN_PASSWORD) console.log(`   Mật khẩu tạm (chỉ hiện 1 lần, hãy đổi ngay): ${initial}`);
  } catch (err) {
    console.error("Error seeding default accounts:", err.message);
  }
}

ensureDefaultAdmin();

// Quản lý tài khoản (xem / tạo / sửa / xoá): chỉ Quản lý đã đăng nhập. Chỉ /login là công khai.
// Trước đây các route này không yêu cầu đăng nhập: ai cũng đặt lại được mật khẩu admin hoặc tự tạo tài khoản Quản lý.
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, "fullName username role active createdAt").sort({ createdAt: 1 });
    res.json({ ok: true, users: users.map((u) => ({ id: u._id, fullName: u.fullName, username: u.username, role: u.role || "Quản lý", active: u.active !== false })) });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "Lỗi lấy danh sách user." });
  }
});

router.post("/register", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { fullName, username, password, role } = req.body;
    if (!fullName?.trim() || !username?.trim() || !password)
      return res.json({ ok: false, error: "Thiếu thông tin bắt buộc." });
    if (password.length < 6)
      return res.json({ ok: false, error: "Mật khẩu tối thiểu 6 ký tự." });
    if (/\s/.test(username))
      return res.json({ ok: false, error: "Tên đăng nhập / Email không được chứa khoảng trắng." });

    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists)
      return res.json({ ok: false, error: "Tên đăng nhập / Email đã tồn tại." });

    const passwordHash = await bcrypt.hash(password, 10);
    const ROLES = ["Quản lý", "Bác sĩ", "Lễ tân", "Kế toán"];
    const safeRole = ROLES.includes(role) ? role : "Quản lý";
    await User.create({ fullName: fullName.trim(), username: username.toLowerCase(), passwordHash, role: safeRole });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "Lỗi server." });
  }
});

// Cập nhật thông tin & vai trò của user (Upsert nếu chưa có)
router.post("/update-user", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, fullName, role, password, active } = req.body;
    if (!username?.trim()) return res.json({ ok: false, error: "Thiếu tên đăng nhập." });

    const normUser = username.trim().toLowerCase();
    // Tránh tự nhốt mình ngoài hệ thống
    if (normUser === req.user.username) {
      if (active === false) return res.json({ ok: false, error: "Không thể tự khoá tài khoản của chính mình." });
      if (role && role !== "Quản lý") return res.json({ ok: false, error: "Không thể tự hạ quyền của chính mình." });
    }
    let user = await User.findOne({ username: normUser });

    if (!user) {
      // Không còn tự tạo tài khoản với mật khẩu mặc định 123456: muốn tạo mới phải nhập mật khẩu hợp lệ
      if (!password || password.length < 6)
        return res.json({ ok: false, error: "Tài khoản này chưa có trên máy chủ. Hãy dùng 'Tạo tài khoản mới' (mật khẩu tối thiểu 6 ký tự)." });
      user = new User({
        fullName: fullName?.trim() || normUser,
        username: normUser,
        passwordHash: await bcrypt.hash(password, 10),
        role: ["Quản lý", "Bác sĩ", "Lễ tân", "Kế toán"].includes(role) ? role : "Bác sĩ",
      });
    } else {
      if (fullName?.trim()) user.fullName = fullName.trim();
      if (role) {
        const ROLES = ["Quản lý", "Bác sĩ", "Lễ tân", "Kế toán"];
        if (ROLES.includes(role)) user.role = role;
      }
      if (password && password.length >= 6) {
        user.passwordHash = await bcrypt.hash(password, 10);
      }
      if (typeof active === "boolean") user.active = active;
    }

    await user.save();
    res.json({ ok: true, user: { id: user._id, fullName: user.fullName, username: user.username, role: user.role } });
  } catch (err) {
    console.error("Error updating user:", err);
    res.json({ ok: false, error: "Lỗi cập nhật user." });
  }
});

// Xóa user
router.post("/delete-user", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username } = req.body;
    if (username?.toLowerCase() === req.user.username) {
      return res.json({ ok: false, error: "Không thể tự xoá tài khoản của chính mình." });
    }
    if (username?.toLowerCase().includes("admin")) {
      return res.json({ ok: false, error: "Không thể xóa tài khoản Admin gốc." });
    }
    await User.deleteOne({ username: username?.toLowerCase() });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "Lỗi xóa user." });
  }
});

router.post("/login", async (req, res) => {
  try {
    await ensureDefaultAdmin();
    const { username, password } = req.body;
    const user = await User.findOne({ username: username?.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.json({ ok: false, error: "Tên đăng nhập hoặc mật khẩu không đúng." });
    if (user.active === false)
      return res.json({ ok: false, error: "Tài khoản này đã bị khóa. Liên hệ Quản lý." });

    const role = user.role || "Quản lý";
    const token = jwt.sign(
      { id: user._id, username: user.username, fullName: user.fullName, role },
      process.env.JWT_SECRET || "victoria_secret_key",
      { expiresIn: "8h" }
    );
    res.json({ ok: true, token, user: { id: user._id, fullName: user.fullName, username: user.username, role } });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "Lỗi server." });
  }
});

module.exports = router;
