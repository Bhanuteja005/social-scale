#!/usr/bin/env node
/**
 * Test Script for Creating Instagram Orders
 * Creates orders for followers and reel views
 */

const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

// Test data
const TEST_USER = {
  email: 'admin@socialscale.com',
  password: 'Admin@12345',
  name: 'Test Admin',
  role: 'SUPER_ADMIN'
};

const ORDERS = [
  {
    service: '2279', // Cheapest Instagram followers (5 credits each)
    link: 'https://www.instagram.com/thequeenmaaya/',
    quantity: 100,
    description: '100 Instagram Followers'
  },
  {
    service: '3694', // Cheapest Instagram reel views (0.007 credits each)
    link: 'https://www.instagram.com/reel/DT5psX-jx6r/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
    quantity: 10000,
    description: '10k Instagram Reel Views'
  }
];

let accessToken = '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m'
};

function log(msg, color = colors.reset) { console.log(`${color}${msg}${colors.reset}`); }
function success(msg) { log(`✓ ${msg}`, colors.green); }
function error(msg) { log(`✗ ${msg}`, colors.red); }
function info(msg) { log(`ℹ ${msg}`, colors.cyan); }
function section(msg) { log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`, colors.blue); }

async function connectDB() {
  const config = require('../src/config/env');
  const DATABASE_URL = process.env.DATABASE_URL || config.database?.url || 'mongodb://localhost:27017/social_scale';
  console.log(`Connecting to: ${DATABASE_URL}`);
  await mongoose.connect(DATABASE_URL);
  success('Connected to MongoDB');
}

async function createTestUser() {
  section('Step 1: Create Test User');

  const User = require('../src/models/User');

  // Check if user exists
  let user = await User.findOne({ email: TEST_USER.email });
  if (user) {
    success(`Test user already exists: ${user.email}`);

    // Update password if needed
    if (!user.password || !(await bcrypt.compare(TEST_USER.password, user.password))) {
      info('Updating password...');
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(TEST_USER.password, saltRounds);
      user.password = hashedPassword;
      await user.save();
      success('Password updated');
    }

    // Ensure user has credits
    if (user.credits.balance < 1000) {
      user.credits.balance = 10000;
      user.credits.totalPurchased = 10000;
      await user.save();
      success('Credits updated');
    }

    return user;
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(TEST_USER.password, saltRounds);

  // Create user
  user = await User.create({
    email: TEST_USER.email,
    name: TEST_USER.name,
    password: hashedPassword,
    role: TEST_USER.role,
    companyId: null, // SUPER_ADMIN doesn't need companyId
    status: 'active',
    credits: {
      balance: 10000, // Give plenty of credits
      totalPurchased: 10000,
      totalSpent: 0
    }
  });

  success(`Test user created: ${user.email}`);
  info(`Password: ${TEST_USER.password}`);
  info(`Credits: ${user.credits.balance}`);

  return user;
}

async function login() {
  section('Step 2: Login');

  try {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    accessToken = res.data.data.accessToken;
    success(`Logged in as ${res.data.data.user.email}`);
    info(`Role: ${res.data.data.user.role}`);
    info(`Credits: ${res.data.data.user.credits.balance}`);

    return res.data.data.user;
  } catch (err) {
    error(`Login failed: ${err.response?.data?.message || err.message}`);
    throw err;
  }
}

async function getServiceInfo(serviceId) {
  try {
    const res = await axios.get(`${API_BASE_URL}/api-integrations/services`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const service = res.data.data.services.find(s => s.service === serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }

    return service;
  } catch (err) {
    error(`Failed to get service info: ${err.response?.data?.message || err.message}`);
    throw err;
  }
}

async function calculateCredits(serviceId, quantity) {
  try {
    const res = await axios.post(`${API_BASE_URL}/pricing/calculate`,
      { service: serviceId, quantity },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return res.data.data.credits;
  } catch (err) {
    error(`Failed to calculate credits: ${err.response?.data?.message || err.message}`);
    throw err;
  }
}

async function createOrder(orderData) {
  section(`Step 3: Create Order - ${orderData.description}`);

  try {
    // Get service info
    const service = await getServiceInfo(orderData.service);
    info(`Service: ${service.name}`);
    info(`Min: ${service.min}, Max: ${service.max}`);
    info(`Rate: $${service.rate} per 1000`);

    // Calculate credits
    const creditsRequired = await calculateCredits(orderData.service, orderData.quantity);
    info(`Credits required: ${creditsRequired}`);

    // Create order
    const res = await axios.post(`${API_BASE_URL}/orders`,
      {
        service: orderData.service,
        link: orderData.link,
        quantity: orderData.quantity
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    success(`Order created successfully!`);
    info(`Order ID: ${res.data.data.order._id}`);
    info(`Fampage Order ID: ${res.data.data.fampageOrderId}`);
    info(`Credits deducted: ${res.data.data.creditsDeducted}`);
    info(`Status: ${res.data.data.order.status}`);

    return res.data.data.order;
  } catch (err) {
    error(`Order creation failed: ${err.response?.data?.message || err.message}`);
    throw err;
  }
}

async function checkCredits() {
  try {
    const res = await axios.get(`${API_BASE_URL}/subscriptions/credits`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const balance = res.data.data.balance;
    info(`Remaining credits: ${balance}`);
    return balance;
  } catch (err) {
    error(`Failed to check credits: ${err.response?.data?.message || err.message}`);
    return 0;
  }
}

async function getOrders() {
  section('Step 4: Verify Orders');

  try {
    const res = await axios.get(`${API_BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    success(`Found ${res.data.data.length} orders`);
    res.data.data.forEach((order, index) => {
      info(`Order ${index + 1}: ${order._id}`);
      info(`  Service: ${order.serviceName}`);
      info(`  Quantity: ${order.quantity}`);
      info(`  Status: ${order.status}`);
      info(`  Credits: ${order.creditsUsed}`);
      info(`  Link: ${order.link}`);
    });

    return res.data.data;
  } catch (err) {
    error(`Failed to get orders: ${err.response?.data?.message || err.message}`);
    throw err;
  }
}

async function runTest() {
  try {
    // Connect to database
    await connectDB();

    // Create test user
    await createTestUser();

    // Disconnect from DB (API will handle connections)
    await mongoose.disconnect();

    // Login via API
    await login();

    // Check initial credits
    await checkCredits();

    // Create orders
    const createdOrders = [];
    for (const orderData of ORDERS) {
      const order = await createOrder(orderData);
      createdOrders.push(order);
    }

    // Check remaining credits
    await checkCredits();

    // Verify orders
    await getOrders();

    section('Test Completed Successfully!');
    success('All orders created successfully');
    info('You can now check the Fampage dashboard to monitor order progress');

  } catch (error) {
    console.error(`Test failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
runTest();