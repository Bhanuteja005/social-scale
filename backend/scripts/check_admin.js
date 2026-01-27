require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const config = require("../src/config/env");

const checkAdmin = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    const admin = await User.findOne({ email: "admin@socialscale.com" }).select("+password");
    if (admin) {
      console.log("Admin user found:");
      console.log("Email:", admin.email);
      console.log("Role:", admin.role);
      console.log("Status:", admin.status);
      console.log("Company ID:", admin.companyId || "null");
      console.log("Credits balance:", admin.credits?.balance || 0);
      console.log("Password hash exists:", !!admin.password);
    } else {
      console.log("Admin user not found");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkAdmin();