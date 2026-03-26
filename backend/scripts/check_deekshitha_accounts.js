require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const config = require('../src/config/env');

async function run() {
  await mongoose.connect(config.mongodb.uri);
  const users = await User.find({ email: /deekshitha@invisiedge\.com/i }).select('email status role').lean();
  console.log('MATCH_COUNT', users.length);
  for (const u of users) {
    console.log(`${u.email} | ${u.status} | ${u.role}`);
  }
  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error('ERROR', e.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
