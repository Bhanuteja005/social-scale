#!/usr/bin/env node
/**
 * Simple User Creation Script
 * Creates a test user for payment testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config/env');

async function createTestUser() {
  try {
    // Connect to MongoDB
    const DATABASE_URL = process.env.DATABASE_URL || config.database?.url || 'mongodb://localhost:27017/social_scale';
    console.log(`Connecting to: ${DATABASE_URL}`);
    await mongoose.connect(DATABASE_URL);
    console.log('✓ Connected to MongoDB');

    const Company = require('../src/models/Company');
    const User = require('../src/models/User');
    
    const testEmail = 'test@example.com';
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      console.log(`✓ Test user already exists: ${testEmail}`);
      console.log(`  ID: ${existingUser._id}`);
      console.log(`  Role: ${existingUser.role}`);
      console.log(`  Credits: ${existingUser.credits.balance}`);
      
      // Check if user has companyId, if not, create company and assign
      if (!existingUser.companyId) {
        console.log('  User missing companyId, creating company...');
        const company = await Company.create({
          name: 'Test Company',
          status: 'active'
        });
        existingUser.companyId = company.companyId;
        existingUser.credits.balance = 2500; // Give credits for testing
        existingUser.credits.totalPurchased = 2500;
        await existingUser.save();
        console.log('✓ Assigned company and credits to existing user');
      }
      
      await mongoose.disconnect();
      return;
    }
    
    // Create test company first
    const company = await Company.create({
      name: 'Test Company',
      status: 'active'
    });
    
    console.log('✓ Test company created:', company.companyId);

    // Create test user
    const user = await User.create({
      email: testEmail,
      name: 'Test User',
      password: 'password123',
      role: 'COMPANY_USER',
      companyId: company.companyId,
      status: 'active',
      credits: {
        balance: 2500, // Give some credits for testing
        totalPurchased: 2500,
        totalSpent: 0
      }
    });

    console.log('\n✓ Test user created successfully!');
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: password123`);
    console.log(`  ID: ${user._id}`);
    console.log(`  Role: ${user.role}`);
    
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
