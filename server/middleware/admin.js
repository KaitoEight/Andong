// Chỉ vai trò "Quản lý" (lấy từ token do SERVER ký lúc đăng nhập) mới đi tiếp. Dùng sau requireAuth.
const ADMIN_ROLE = "Quản lý";

module.exports = function requireAdmin(req, res, next) {
  if (req.user && req.user.role === ADMIN_ROLE) return next();
  res.status(403).json({ ok: false, error: "Chỉ Quản lý mới có quyền thực hiện thao tác này." });
};
module.exports.ADMIN_ROLE = ADMIN_ROLE;
