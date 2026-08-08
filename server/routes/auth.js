const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const User     = require("../models/User");

const router = express.Router();

// Tự động seed tài khoản admin mặc định admin@gmail.com / admin123
async function ensureDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ username: "admin@gmail.com" });
    if (!adminExists) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      await User.create({
        fullName: "Quản trị viên Hệ thống",
        username: "admin@gmail.com",
        passwordHash,
        role: "Quản lý",
      });
      console.log("✅ Seeded default admin account: admin@gmail.com / admin123");
    }

    const legacyAdminExists = await User.findOne({ username: "admin" });
    if (!legacyAdminExists) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      await User.create({
        fullName: "Quản trị viên",
        username: "admin",
        passwordHash,
        role: "Quản lý",
      });
    }
  } catch (err) {
    console.error("Error seeding default admin:", err.message);
  }
}

// Chạy seed admin ngay khi module được load
ensureDefaultAdmin();

router.post("/register", async (req, res) => {
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

router.post("/login", async (req, res) => {
  try {
    await ensureDefaultAdmin();
    const { username, password } = req.body;
    const user = await User.findOne({ username: username?.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.json({ ok: false, error: "Tên đăng nhập hoặc mật khẩu không đúng." });

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
