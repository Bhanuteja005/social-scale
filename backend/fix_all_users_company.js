const mongoose = require('mongoose');
const User = require('./src/models/User');
const Company = require('./src/models/Company');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://socialscale:SocialScale2024@ac-re52lu0-shard-00-00.z3v8zkw.mongodb.net/social-scale?retryWrites=true&w=majority';

async function fixAllUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔧 Finding all users without company IDs...\n');

    // Find all users without company ID
    const usersWithoutCompany = await User.find({
      $or: [
        { companyId: null },
        { companyId: { $exists: false } }
      ],
      role: { $ne: 'SUPER_ADMIN' } // Don't fix SUPER_ADMIN users
    });

    console.log(`Found ${usersWithoutCompany.length} users without company assignment.\n`);

    if (usersWithoutCompany.length === 0) {
      console.log('✅ All users already have company assignments!\n');
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
      console.log(`   ✅ Using existing Default Company: ${defaultCompany.companyId}\n`);
    }

    // Fix each user
    console.log('🔄 Assigning company to users...\n');
    console.log('='.repeat(80) + '\n');

    let fixedCount = 0;
    for (const user of usersWithoutCompany) {
      user.companyId = defaultCompany.companyId;
      await user.save();
      
      console.log(`✅ Fixed: ${user.name || 'Unknown'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Company ID: ${user.companyId}`);
      console.log(`   Wallet: ₹${user.wallet?.balance || 0}`);
      console.log('─'.repeat(80) + '\n');
      
      fixedCount++;
    }

    console.log('='.repeat(80));
    console.log(`🎉 Successfully fixed ${fixedCount} users!\n`);
    console.log('All users can now create orders.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixAllUsers();
