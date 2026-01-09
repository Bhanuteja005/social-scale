#!/usr/bin/env node
/**
 * Check providers
 */

const mongoose = require('mongoose');
const config = require('../src/config/env');

async function checkProviders() {
  try {
    await mongoose.connect(config.mongodb.uri);

    const { ApiProvider } = require('../src/models/ApiProvider');

    const providers = await ApiProvider.find({});
    console.log('Providers:', providers.length);
    providers.forEach(p => console.log(p.name));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkProviders();