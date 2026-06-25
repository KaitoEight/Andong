const mongoose = require("mongoose");

const clinicDataSchema = new mongoose.Schema({
  services:  { type: Array, default: [] },
  customers: { type: Array, default: [] },
  appts:     { type: Array, default: [] },
  care:      { type: Array, default: [] },
  staff:     { type: Array, default: [] },
  discounts: { type: Array, default: [] },
  invoices:  { type: Array, default: [] },
}, { timestamps: true });

module.exports = mongoose.model("ClinicData", clinicDataSchema);
