const express = require("express");
const mongoose = require("mongoose");
const Trash = require("../models/Trash");
const requireAuth = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");

const router = express.Router();
router.use(requireAuth);

const MAX_PAYLOAD_BYTES = 8 * 1024 * 1024;

// Mọi người dùng đã đăng nhập đều lưu được bản sao khi xoá (app gọi trước khi xoá thật).
router.post("/", async (req, res) => {
  try {
    const { type, label, summary, customerId, payload } = req.body || {};
    if (!Trash.TYPES.includes(type)) return res.json({ ok: false, error: "Loại dữ liệu không hợp lệ." });
    if (payload === undefined || payload === null) return res.json({ ok: false, error: "Thiếu dữ liệu cần lưu." });
    if (Buffer.byteLength(JSON.stringify(payload)) > MAX_PAYLOAD_BYTES) return res.json({ ok: false, error: "Dữ liệu quá lớn để lưu bản sao." });
    const u = req.user || {};
    const doc = await Trash.create({
      type,
      label: String(label || "").slice(0, 200),
      summary: String(summary || "").slice(0, 400),
      customerId: String(customerId || "").slice(0, 100),
      payload,
      deletedBy: { id: String(u.id || ""), username: u.username || "", fullName: u.fullName || "", role: u.role || "" },
    });
    res.json({ ok: true, id: doc._id });
  } catch (err) {
    console.error("trash create:", err.message);
    res.json({ ok: false, error: "Không lưu được bản sao dữ liệu đã xoá." });
  }
});

// Từ đây trở xuống: CHỈ Quản lý.
router.use(requireAdmin);

// Danh sách (mặc định không kèm payload để nhẹ; ?full=1 kèm payload để tải file backup)
router.get("/", async (req, res) => {
  try {
    const full = req.query.full === "1";
    const q = Trash.find({}).sort({ deletedAt: -1 }).limit(2000);
    if (!full) q.select("-payload");
    const items = await q.lean();
    res.json({ ok: true, items });
  } catch (err) {
    console.error("trash list:", err.message);
    res.json({ ok: false, error: "Không tải được danh sách dữ liệu đã xoá." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.json({ ok: false, error: "Mã không hợp lệ." });
    const item = await Trash.findById(req.params.id).lean();
    if (!item) return res.json({ ok: false, error: "Không tìm thấy mục này." });
    res.json({ ok: true, item });
  } catch (err) {
    console.error("trash get:", err.message);
    res.json({ ok: false, error: "Lỗi đọc dữ liệu." });
  }
});

// Xoá vĩnh viễn một mục khỏi "Dữ liệu đã xoá" (cũng dùng sau khi khôi phục xong)
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.json({ ok: false, error: "Mã không hợp lệ." });
    const r = await Trash.deleteOne({ _id: req.params.id });
    res.json({ ok: true, deleted: r.deletedCount });
  } catch (err) {
    console.error("trash delete:", err.message);
    res.json({ ok: false, error: "Không xoá được." });
  }
});

module.exports = router;
