const express    = require("express");
const ClinicData = require("../models/ClinicData");
const requireAuth = require("../middleware/auth");
const { seedData } = require("../seed");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    let doc = await ClinicData.findOne();
    if (!doc) doc = await ClinicData.create(seedData());
    res.json({ ok: true, data: { services: doc.services, customers: doc.customers, appts: doc.appts, care: doc.care, staff: doc.staff, discounts: doc.discounts, invoices: doc.invoices } });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "Lỗi khi tải dữ liệu." });
  }
});

router.put("/", async (req, res) => {
  try {
    const { services, customers, appts, care, staff, discounts, invoices } = req.body;
    await ClinicData.findOneAndUpdate({}, { services, customers, appts, care, staff, discounts, invoices }, { upsert: true, new: true });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "Lỗi khi lưu dữ liệu." });
  }
});

module.exports = router;
