const mongoose = require('mongoose');
const User = require('./src/models/User');
const Company = require('./src/models/Company');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://socialscale:SocialScale2024@ac-re52lu0-shard-00-00.z3v8zkw.mongodb.net/social-scale?retryWrites=true&w=majority';

async function checkUserCompany() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = 'satyatarun.951@gmail.com';
    console.log(`🔍 Checking user: ${email}\n`);

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found!\n');
      return;
    }

    console.log('✅ User found:');
    console.log(`   User ID: ${user._id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Company ID: ${user.companyId || 'NOT ASSIGNED ❌'}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Wallet Balance: ₹${user.wallet?.balance || 0}`);
    console.log(`   Created At: ${user.createdAt}`);
    console.log(`   Last Login: ${user.lastLogin || 'Never'}\n`);

    // Check if company exists
    if (user.companyId) {
      const company = await Company.findOne({ companyId: user.companyId });
      
      if (company) {
        console.log('✅ Company found:');
        console.log(`   Company ID: ${company.companyId}`);
        console.log(`   Company Name: ${company.name}`);
        console.log(`   Status: ${company.status}`);
        console.log(`   Created At: ${company.createdAt}\n`);
      } else {
        console.log('⚠️  Company ID exists in user but company not found in database!');
        console.log(`   Orphaned Company ID: ${user.companyId}\n`);
      }
    } else {
      console.log('❌ User does NOT have a company ID assigned!');
      console.log('   This user will not be able to create orders.\n');
      
      // Offer to fix
      console.log('💡 Would you like to assign this user to the Default Company?');
      console.log('   Run: node fix_user_company.js satyatarun.951@gmail.com\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkUserCompany();
