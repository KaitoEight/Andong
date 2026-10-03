const mongoose = require("mongoose");

module.exports = async function connectDB() {
  const uri = process.env.MONGODB_URI;
  // Giữ nguyên cấu hình cho MongoDB Atlas (mongodb+srv); MongoDB cài trên máy (mongodb://) không dùng TLS.
  const opts = /^mongodb\+srv:/.test(uri || "") ? { tls: true, tlsAllowInvalidCertificates: true } : {};
  await mongoose.connect(uri, opts);
  console.log("MongoDB connected:", (uri || "").includes("@") ? uri.split("@")[1] : uri.replace(/^mongodb:\/\//, ""));
};
