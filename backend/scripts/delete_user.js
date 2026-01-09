#!/usr/bin/env node
/**
 * Delete user
 */

const mongoose = require('mongoose');
const config = require('../src/config/env');

async function deleteUser() {
  try {
    const DATABASE_URL = process.env.DATABASE_URL || config.database?.url || 'mongodb://localhost:27017/social_scale';
    await mongoose.connect(DATABASE_URL);

    const User = require('../src/models/User');

    const result = await User.deleteOne({ email: 'testuser@example.com' });
    console.log('Deleted user:', result.deletedCount);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

deleteUser();