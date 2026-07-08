const path      = require("path");
// Luôn nạp .env trong thư mục server, dù chạy từ thư mục nào (gốc hay server/)
require("dotenv").config({ path: path.join(__dirname, ".env") });
const fs        = require("fs");
const express   = require("express");
const cors      = require("cors");
const connectDB = require("./db");

const app = express();
app.use(cors());
// Tăng giới hạn body: dữ liệu có ảnh đại diện (base64) dễ vượt mức mặc định 100kb
app.use(express.json({ limit: "15mb" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/data", require("./routes/data"));

app.get("/api/health", (_, res) => res.json({ ok: true }));

// Phục vụ giao diện đã build (production) — chạy web + API trên cùng 1 cổng
const distPath = path.join(__dirname, "..", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) return res.status(404).json({ ok: false, error: "Not found" });
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;

connectDB()
  .then(() => app.listen(PORT, () => {
    console.log(`\n✅ Nha Khoa Victoria đang chạy: http://localhost:${PORT}\n`);
  }))
  .catch((err) => { console.error("Không thể kết nối MongoDB:", err.message); process.exit(1); });
