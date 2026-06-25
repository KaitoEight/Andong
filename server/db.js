const mongoose = require("mongoose");

module.exports = async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI, {
    tls: true,
    tlsAllowInvalidCertificates: true,
  });
  console.log("MongoDB connected:", process.env.MONGODB_URI.split("@")[1]);
};
