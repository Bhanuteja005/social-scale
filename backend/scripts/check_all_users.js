require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const config = require("../src/config/env");

const checkCompanyUsers = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    const users = await User.find({}).select("+password");
    
    console.log("\n📊 All Users:");
    users.forEach(user => {
      console.log("\n--------------------");
      console.log("Email:", user.email);
      console.log("Name:", user.name || "N/A");
      console.log("Role:", user.role);
      console.log("Company ID:", user.companyId || "null");
      console.log("Credits:", user.credits?.balance || 0);
      console.log("Status:", user.status);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkCompanyUsers();
