require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const config = require("../src/config/env");

const resetAdminPassword = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    const admin = await User.findOne({ email: "admin@socialscale.com" });
    if (admin) {
      admin.password = "Admin@12345"; // This will be hashed by the pre-save hook
      await admin.save();
      console.log("✅ Admin password reset to: Admin@12345");
    } else {
      console.log("Admin user not found");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

resetAdminPassword();