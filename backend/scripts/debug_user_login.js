require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const config = require('../src/config/env');

async function run() {
  const email = 'deekshitha@invisiedge.com';
  const password = 'Invisiedge@123';

  await mongoose.connect(config.mongodb.uri);

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    console.log('USER_NOT_FOUND');
    await mongoose.disconnect();
    return;
  }

  const passwordMatch = await user.comparePassword(password);

  console.log(JSON.stringify({
    id: String(user._id),
    email: user.email,
    status: user.status,
    role: user.role,
    companyId: user.companyId,
    hasPassword: !!user.password,
    passwordLength: user.password ? user.password.length : 0,
    googleId: user.profile?.googleId || null,
    lastLogin: user.lastLogin || null,
    passwordMatch,
  }, null, 2));

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('ERROR', error.message);
  try { await mongoose.disconnect(); } catch (e) {}
  process.exit(1);
});
