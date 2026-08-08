const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const User     = require("../models/User");

const router = express.Router();

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

    // Seed sẵn các tài khoản mẫu
    const defaultAccounts = [
      { username: "bacsi", fullName: "Bác sĩ Nguyễn Văn Nam", role: "Bác sĩ", pass: "123456" },
      { username: "letan", fullName: "Lễ tân Lê Thị Hoa", role: "Lễ tân", pass: "123456" },
    ];
    for (const acc of defaultAccounts) {
      const exists = await User.findOne({ username: acc.username });
      if (!exists) {
        const hash = await bcrypt.hash(acc.pass, 10);
        await User.create({ fullName: acc.fullName, username: acc.username, passwordHash: hash, role: acc.role });
      }
    }
  } catch (err) {
    console.error("Error seeding default accounts:", err.message);
  }
}

ensureDefaultAdmin();

// Danh sách tất cả tài khoản
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "fullName username role createdAt").sort({ createdAt: 1 });
    res.json({ ok: true, users: users.map((u) => ({ id: u._id, fullName: u.fullName, username: u.username, role: u.role })) });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "Lỗi lấy danh sách user." });
  }
});

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

// Cập nhật thông tin & vai trò của user (Upsert nếu chưa có)
router.post("/update-user", async (req, res) => {
  try {
    const { username, fullName, role, password } = req.body;
    if (!username?.trim()) return res.json({ ok: false, error: "Thiếu tên đăng nhập." });

    const normUser = username.trim().toLowerCase();
    let user = await User.findOne({ username: normUser });

    if (!user) {
      const defaultHash = password && password.length >= 6
        ? await bcrypt.hash(password, 10)
        : await bcrypt.hash("123456", 10);
      user = new User({
        fullName: fullName?.trim() || normUser,
        username: normUser,
        passwordHash: defaultHash,
        role: role || "Bác sĩ",
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
    }

    await user.save();
    res.json({ ok: true, user: { id: user._id, fullName: user.fullName, username: user.username, role: user.role } });
  } catch (err) {
    console.error("Error updating user:", err);
    res.json({ ok: false, error: "Lỗi cập nhật user." });
  }
});

// Xóa user
router.post("/delete-user", async (req, res) => {
  try {
    const { username } = req.body;
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
