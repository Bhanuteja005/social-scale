const mongoose = require('mongoose');
const User = require('./src/models/User');
const Company = require('./src/models/Company');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://socialscale:SocialScale2024@ac-re52lu0-shard-00-00.z3v8zkw.mongodb.net/social-scale?retryWrites=true&w=majority';

async function fixUserCompany() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = process.argv[2] || 'satyatarun.951@gmail.com';
    console.log(`🔧 Fixing company assignment for: ${email}\n`);

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found!\n');
      return;
    }

    console.log('📋 Current user status:');
    console.log(`   User ID: ${user._id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Company ID: ${user.companyId || 'NOT ASSIGNED'}\n`);

    if (user.companyId) {
      console.log('✅ User already has a company ID assigned.');
      console.log(`   Company ID: ${user.companyId}\n`);
      return;
    }

    // Find or create default company
    console.log('🏢 Looking for Default Company...');
    let defaultCompany = await Company.findOne({ name: "Default Company", deletedAt: null });
    
    if (!defaultCompany) {
      console.log('   Creating Default Company...');
      defaultCompany = await Company.create({
        name: "Default Company",
        notes: "Auto-created company for user registrations",
        address: {
          street: "N/A",
          city: "N/A",
          state: "N/A",
          zipCode: "000000",
          country: "India",
        },
        billingDetails: {
          gstin: "N/A",
          billingEmail: "billing@socialscale.com",
        },
        status: "active",
      });
      console.log(`   ✅ Default Company created: ${defaultCompany.companyId}\n`);
    } else {
      console.log(`   ✅ Found existing Default Company: ${defaultCompany.companyId}\n`);
    }

    // Assign company to user
    console.log('🔄 Assigning company to user...');
    user.companyId = defaultCompany.companyId;
    await user.save();

    console.log('✅ Company assigned successfully!\n');
    console.log('📋 Updated user status:');
    console.log(`   User ID: ${user._id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Company ID: ${user.companyId}`);
    console.log(`   Company Name: ${defaultCompany.name}\n`);

    console.log('🎉 User can now create orders!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixUserCompany();
