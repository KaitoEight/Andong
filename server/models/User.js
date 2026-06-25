const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName:     { type: String, required: true },
  username:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, default: "Quản lý" },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
