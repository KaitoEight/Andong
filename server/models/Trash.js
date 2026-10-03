const mongoose = require("mongoose");

// Bản sao của mọi thứ bị xoá trong app ("Dữ liệu đã xoá"). Mỗi mục là một document riêng,
// KHÔNG nằm trong ClinicData nên không bị cơ chế lưu cả tài liệu của app ghi đè / làm phình tài liệu chính.
const TYPES = ["service", "customerService", "invoice", "customer", "treatment", "record"];

const trashSchema = new mongoose.Schema({
  type:       { type: String, required: true, enum: TYPES },
  label:      { type: String, default: "" },   // tên hiển thị: tên dịch vụ, mã hoá đơn, tên khách…
  summary:    { type: String, default: "" },   // mô tả ngắn: số tiền, nhóm…
  customerId: { type: String, default: "" },   // khách liên quan (nếu có)
  payload:    { type: mongoose.Schema.Types.Mixed },
  // Người xoá do SERVER ghi theo token đăng nhập, không tin dữ liệu client gửi lên
  deletedBy:  { id: String, username: String, fullName: String, role: String },
}, { timestamps: { createdAt: "deletedAt", updatedAt: false } });

trashSchema.index({ deletedAt: -1 });

module.exports = mongoose.model("Trash", trashSchema);
module.exports.TYPES = TYPES;
