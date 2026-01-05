require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Company = require("../src/models/Company");
const config = require("../src/config/env");
const roles = require("../src/config/roles");

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seed...");

    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    // Create SUPER_ADMIN if doesn't exist
    let superAdmin = await User.findOne({ role: roles.SUPER_ADMIN });
    
    if (!superAdmin) {
      superAdmin = await User.create({
        email: "admin@socialscale.com",
        password: "Admin@12345",
        role: roles.SUPER_ADMIN,
        status: "active",
      });
      console.log("✅ SUPER_ADMIN created:");
      console.log("   Email: admin@socialscale.com");
      console.log("   Password: Admin@12345");
    } else {
      console.log("✅ SUPER_ADMIN already exists");
    }

    // Create test company if doesn't exist
    let testCompany = await Company.findOne({ name: "Test Company" });
    
    if (!testCompany) {
      testCompany = await Company.create({
        name: "Test Company",
        notes: "Test company for development",
        address: {
          street: "123 Test St",
          city: "Test City",
          state: "Test State",
          zipCode: "12345",
          country: "Test Country",
        },
        billingDetails: {
          contactName: "Test Contact",
          contactEmail: "billing@testcompany.com",
          contactPhone: "+1234567890",
        },
        status: "active",
        settings: {
          timezone: "UTC",
          currency: "USD",
          invoiceMultiplier: 8,
        },
      });
      console.log("✅ Test Company created:");
      console.log(`   Company ID: ${testCompany.companyId}`);
      console.log(`   Name: ${testCompany.name}`);
    } else {
      console.log("✅ Test Company already exists");
      console.log(`   Company ID: ${testCompany.companyId}`);
    }

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Start the server: npm run dev");
    console.log("2. Login with admin credentials to get JWT token");
    console.log("3. Use the token to make API requests");
    console.log(`4. Use Company ID: ${testCompany.companyId} for testing orders`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seedDatabase();
