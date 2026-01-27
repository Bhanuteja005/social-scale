require("dotenv").config();
const mongoose = require("mongoose");
const Company = require("../src/models/Company");
const User = require("../src/models/User");
const config = require("../src/config/env");

const assignUsersToCompany = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    // Check for existing companies
    const companies = await Company.find({});
    console.log(`\n📊 Found ${companies.length} companies`);
    
    let testCompany;
    if (companies.length > 0) {
      testCompany = companies[0];
      console.log(`Using existing company: ${testCompany.name} (${testCompany.companyId})`);
    } else {
      // Create a default company
      testCompany = await Company.create({
        name: "Default Company",
        notes: "Auto-created company for COMPANY_USER accounts",
        address: {
          street: "123 Default St",
          city: "Default City",
          state: "Default State",
          zipCode: "12345",
          country: "India",
        },
        billingDetails: {
          gstin: "N/A",
          billingEmail: "billing@socialscale.com",
        },
        status: "active",
      });
      console.log(`✅ Created new company: ${testCompany.name} (${testCompany.companyId})`);
    }

    // Get all COMPANY_USER users without a companyId
    const usersWithoutCompany = await User.find({ 
      role: "COMPANY_USER", 
      companyId: null 
    });

    console.log(`\n📋 Found ${usersWithoutCompany.length} users without company assignment`);

    // Assign them to the company
    for (const user of usersWithoutCompany) {
      user.companyId = testCompany.companyId;
      await user.save();
      console.log(`✅ Assigned ${user.email} to company ${testCompany.name}`);
    }

    console.log("\n🎉 All users successfully assigned to company!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

assignUsersToCompany();
