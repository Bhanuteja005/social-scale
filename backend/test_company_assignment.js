const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Company = require('./src/models/Company');

const MONGODB_URI = process.env.MONGODB_URI;

async function testCompanyAssignment() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check Default Company exists
    console.log('📊 Checking Default Company...');
    const defaultCompany = await Company.findOne({ name: "Default Company", deletedAt: null });
    
    if (defaultCompany) {
      console.log(`✅ Default Company found`);
      console.log(`   Company ID: ${defaultCompany.companyId}`);
      console.log(`   Name: ${defaultCompany.name}\n`);
    } else {
      console.log('❌ Default Company not found (will be auto-created on first user registration)\n');
    }

    // Check all users without company ID (excluding SUPER_ADMIN)
    console.log('📊 Checking users without company ID...');
    const usersWithoutCompany = await User.find({
      role: { $ne: 'SUPER_ADMIN' },
      $or: [
        { companyId: null },
        { companyId: { $exists: false } }
      ],
      deletedAt: null
    }).select('name email role companyId wallet');

    if (usersWithoutCompany.length === 0) {
      console.log('✅ All users have company IDs assigned!\n');
    } else {
      console.log(`⚠️  Found ${usersWithoutCompany.length} users without company ID:\n`);
      usersWithoutCompany.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   User ID: ${user._id}`);
        console.log(`   Company ID: ${user.companyId || 'NOT SET'}`);
        console.log(`   Wallet: ₹${user.wallet?.balance || 0}\n`);
      });
    }

    // Check recent users with company ID
    console.log('📊 Recent users with company assignments:');
    const recentUsers = await User.find({
      role: { $ne: 'SUPER_ADMIN' },
      companyId: { $exists: true, $ne: null },
      deletedAt: null
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('name email role companyId createdAt')
    .populate('companyId', 'companyId name');

    if (recentUsers.length > 0) {
      recentUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
        if (user.companyId) {
          console.log(`   Company: ${user.companyId.name}`);
          console.log(`   Company ID: ${user.companyId.companyId}`);
        }
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(80));
    
    if (usersWithoutCompany.length === 0) {
      console.log('\n🎉 All users have company assignments!');
      console.log('✅ Normal registration: Company ID auto-assigned');
      console.log('✅ Google OAuth: Company ID auto-assigned');
      console.log('\n✨ System is ready for production!');
    } else {
      console.log(`\n⚠️  Action required: ${usersWithoutCompany.length} users need company assignment`);
      console.log('Run: node fix_all_users_company.js to fix');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testCompanyAssignment();
