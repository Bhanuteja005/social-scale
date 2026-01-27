require("dotenv").config();
const mongoose = require("mongoose");
const config = require("../src/config/env");
const orderService = require("../src/services/orders");
const User = require("../src/models/User");

const testAdminOrder = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    // Get admin user
    const admin = await User.findOne({ email: "admin@socialscale.com" });
    if (!admin) {
      console.log("❌ Admin user not found");
      process.exit(1);
    }

    console.log("\n📊 Admin Info:");
    console.log("  Email:", admin.email);
    console.log("  Role:", admin.role);
    console.log("  Company ID:", admin.companyId || "null");
    console.log("  Credits:", admin.credits?.balance || 0);

    // Test order data (IG Reel Views - Cheap S2, service 3694)
    const orderData = {
      service: "3694",
      link: "https://www.instagram.com/reel/DKHg-jNPK7B/",
      quantity: 100
    };

    console.log("\n🚀 Creating test order...");
    console.log("  Service:", orderData.service);
    console.log("  Link:", orderData.link);
    console.log("  Quantity:", orderData.quantity);

    const result = await orderService.createOrder(orderData, admin._id, false);

    console.log("\n✅ Order created successfully!");
    console.log("  Order ID:", result.order._id);
    console.log("  Fampage Order ID:", result.fampageOrderId);
    console.log("  Credits Deducted:", result.creditsDeducted);
    console.log("  Status:", result.order.status);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testAdminOrder();
