#!/usr/bin/env node
/**
 * Create user for testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config/env');

async function createUser() {
  try {
    const DATABASE_URL = process.env.DATABASE_URL || config.database?.url || 'mongodb://localhost:27017/social_scale';
    await mongoose.connect(DATABASE_URL);
    console.log('✓ Connected to MongoDB');

    const Company = require('../src/models/Company');
    const User = require('../src/models/User');

    const testEmail = 'testuser@example.com';

    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      console.log(`✓ User already exists: ${testEmail}`);
      console.log(`  ID: ${existingUser._id}`);
      console.log(`  Credits: ${existingUser.credits.balance}`);
      await mongoose.disconnect();
      return;
    }

    // Create company
    const company = await Company.create({
      name: 'Test Company',
      status: 'active'
    });

    // Create user
    const user = await User.create({
      email: testEmail,
      password: 'password123', // Plain text, will be hashed by pre-save hook
      name: 'Test User',
      role: 'COMPANY_USER',
      companyId: company.companyId,
      credits: {
        balance: 2500,
        totalPurchased: 2500
      },
      subscription: {
        plan: 'free'
      }
    });

    console.log(`✓ Created user: ${testEmail}`);
    console.log(`  ID: ${user._id}`);
    console.log(`  Credits: ${user.credits.balance}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createUser();