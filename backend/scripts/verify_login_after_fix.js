require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../src/config/env');
const authService = require('../src/services/auth');

async function run() {
  await mongoose.connect(config.mongodb.uri);

  const password = 'Invisiedge@123';
  const cases = [
    'deekshitha@invisiedge.com',
    ' deekshitha@invisiedge.com ',
    'DEEKSHITHA@INVISIEDGE.COM',
  ];

  for (const email of cases) {
    try {
      const result = await authService.login(email, password);
      console.log(email, '=> OK', !!result?.accessToken);
    } catch (e) {
      console.log(email, '=> FAIL', e.message);
    }
  }

  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error('ERROR', e.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
