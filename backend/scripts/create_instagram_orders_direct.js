#!/usr/bin/env node
/**
 * Test Script for Creating Instagram Orders (Direct Database)
 * Creates orders directly without API authentication
 */

const mongoose = require('mongoose');
const orderService = require('../src/services/orders');

const ORDERS = [
  {
    service: '2279', // Cheapest Instagram followers (5 credits each)
    link: 'https://www.instagram.com/thequeenmaaya/',
    quantity: 100,
    description: '100 Instagram Followers'
  }
];

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

async function getOrCreateTestUser() {
  section('Step 1: Get/Create Test User');

  const User = require('../src/models/User');
  const bcrypt = require('bcryptjs');

  const testEmail = 'admin@socialscale.com';
  const testPassword = 'Admin@12345';

  // Check if user exists
  let user = await User.findOne({ email: testEmail });
  if (user) {
    success(`Test user already exists: ${user.email}`);
    info(`Role: ${user.role}`);
    info(`Credits: ${user.credits.balance}`);
    return user;
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(testPassword, saltRounds);

  // Create user
  user = await User.create({
    email: testEmail,
    name: 'Admin User',
    password: hashedPassword,
    role: 'SUPER_ADMIN',
    companyId: null, // SUPER_ADMIN doesn't need companyId
    status: 'active',
    credits: {
      balance: 10000, // Give plenty of credits
      totalPurchased: 10000,
      totalSpent: 0
    }
  });

  success(`Test user created: ${user.email}`);
  info(`Password: ${testPassword}`);
  info(`Credits: ${user.credits.balance}`);

  return user;
}

async function createOrder(user, orderData) {
  section(`Creating Order: ${orderData.description}`);

  try {
    info(`Service: ${orderData.service}`);
    info(`Link: ${orderData.link}`);
    info(`Quantity: ${orderData.quantity}`);

    const result = await orderService.createOrder({
      service: orderData.service,
      link: orderData.link,
      quantity: orderData.quantity
    }, user._id);

    success(`Order created successfully!`);
    info(`Order ID: ${result.order._id}`);
    info(`Fampage Order ID: ${result.fampageOrderId}`);
    info(`Credits deducted: ${result.creditsDeducted}`);
    info(`Status: ${result.order.status}`);

    return result.order;
  } catch (err) {
    error(`Order creation failed: ${err.message}`);
    throw err;
  }
}

async function checkUserCredits(user) {
  const updatedUser = await require('../src/models/User').findById(user._id);
  info(`Remaining credits: ${updatedUser.credits.balance}`);
  return updatedUser.credits.balance;
}

async function getUserOrders(user) {
  section('Step 3: Verify Orders');

  const Order = require('../src/models/Order');
  const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 });

  success(`Found ${orders.length} orders`);
  orders.forEach((order, index) => {
    info(`Order ${index + 1}: ${order._id}`);
    info(`  Service: ${order.serviceName}`);
    info(`  Quantity: ${order.quantity}`);
    info(`  Status: ${order.status}`);
    info(`  Credits: ${order.creditsUsed}`);
    info(`  Link: ${order.link}`);
  });

  return orders;
}

async function runTest() {
  try {
    // Connect to database
    await connectDB();

    // Get or create test user
    const user = await getOrCreateTestUser();

    // Check initial credits
    await checkUserCredits(user);

    // Create orders
    const createdOrders = [];
    for (const orderData of ORDERS) {
      const order = await createOrder(user, orderData);
      createdOrders.push(order);
    }

    // Check remaining credits
    await checkUserCredits(user);

    // Verify orders
    await getUserOrders(user);

    section('Test Completed Successfully!');
    success('All orders created successfully');
    info('You can now check the Fampage dashboard to monitor order progress');

    await mongoose.disconnect();

  } catch (err) {
    console.error(`Test failed: ${err.message}`);
    process.exit(1);
  }
}

// Run the test
runTest();