const mongoose = require('mongoose');
const User = require('./src/models/User');
const Company = require('./src/models/Company');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://socialscale:SocialScale2024@ac-re52lu0-shard-00-00.z3v8zkw.mongodb.net/social-scale?retryWrites=true&w=majority';

const emails = [
  'satyatarun.951@gmail.com',
  'jaikushalbysani@gmail.com',
  'shivacharankosari099@gmail.com',
  'brinto.agogi@gmail.com'
];

async function checkMultipleUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Checking company assignments for multiple users...\n');
    console.log('='.repeat(80) + '\n');

    let usersWithoutCompany = [];
    let usersWithCompany = [];

    for (const email of emails) {
      const user = await User.findOne({ email });

      if (!user) {
        console.log(`❌ ${email} - USER NOT FOUND`);
        console.log('─'.repeat(80) + '\n');
        continue;
      }

      const hasCompany = !!user.companyId;

      console.log(`${hasCompany ? '✅' : '❌'} ${user.name || 'Unknown'}`);
      console.log(`   Email: ${email}`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Company ID: ${user.companyId || 'NOT ASSIGNED ❌'}`);
      console.log(`   Wallet: ₹${user.wallet?.balance || 0}`);

      if (hasCompany) {
        const company = await Company.findOne({ companyId: user.companyId });
        if (company) {
          console.log(`   Company Name: ${company.name}`);
          usersWithCompany.push({ email, user, company });
        } else {
          console.log(`   ⚠️  Company ID exists but company not found!`);
          usersWithoutCompany.push({ email, user });
        }
      } else {
        usersWithoutCompany.push({ email, user });
      }

      console.log('─'.repeat(80) + '\n');
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80) + '\n');
    console.log(`✅ Users with company: ${usersWithCompany.length}`);
    console.log(`❌ Users without company: ${usersWithoutCompany.length}\n`);

    if (usersWithoutCompany.length > 0) {
      console.log('❌ Users needing company assignment:');
      usersWithoutCompany.forEach(({ email, user }) => {
        console.log(`   - ${user.name || 'Unknown'} (${email})`);
      });
      console.log('\n💡 Run the following command to fix all users:');
      console.log('   node fix_all_users_company.js\n');
    } else {
      console.log('🎉 All users have company assignments!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkMultipleUsers();
