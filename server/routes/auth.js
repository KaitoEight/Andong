const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const User     = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { fullName, username, password, role } = req.body;
    if (!fullName?.trim() || !username?.trim() || !password)
      return res.json({ ok: false, error: "Thiếu thông tin bắt buộc." });
    if (password.length < 6)
      return res.json({ ok: false, error: "Mật khẩu tối thiểu 6 ký tự." });
    if (/\s/.test(username))
      return res.json({ ok: false, error: "Tên đăng nhập không được chứa khoảng trắng." });

    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists)
      return res.json({ ok: false, error: "Tên đăng nhập đã tồn tại." });

    const passwordHash = await bcrypt.hash(password, 10);
    const ROLES = ["Quản lý", "Bác sĩ", "Lễ tân", "Kế toán"];
    const safeRole = ROLES.includes(role) ? role : "Quản lý";
    await User.create({ fullName: fullName.trim(), username, passwordHash, role: safeRole });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "Lỗi server." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username?.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.json({ ok: false, error: "Tên đăng nhập hoặc mật khẩu không đúng." });

    const role = user.role || "Quản lý";
    const token = jwt.sign(
      { id: user._id, username: user.username, fullName: user.fullName, role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.json({ ok: true, token, user: { id: user._id, fullName: user.fullName, username: user.username, role } });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "Lỗi server." });
  }
});

module.exports = router;
