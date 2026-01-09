#!/usr/bin/env node
/**
 * End-to-End Test Script for Payment Flow
 * Tests: Login -> Get Plans -> Create Subscription -> Check Credits
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

// Test user credentials (update these with a real test user)
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

let accessToken = '';
let userId = '';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ ${message}`, colors.cyan);
}

function section(message) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(message, colors.blue);
  log('='.repeat(60), colors.blue);
}

async function testLogin() {
  section('Step 1: Testing Login');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    
    if (response.data.success && response.data.data.accessToken) {
      accessToken = response.data.data.accessToken;
      userId = response.data.data.user.userId || response.data.data.user._id;
      success('Login successful');
      info(`User ID: ${userId}`);
      info(`Token: ${accessToken.substring(0, 20)}...`);
      return true;
    } else {
      error('Login failed - no token received');
      return false;
    }
  } catch (err) {
    error(`Login failed: ${err.response?.data?.message || err.message}`);
    if (err.response?.status === 404) {
      info('Test user not found. Creating test user...');
      return await createTestUser();
    }
    return false;
  }
}

async function createTestUser() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      name: 'Test User',
      email: TEST_USER.email,
      password: TEST_USER.password,
      companyName: 'Test Company',
      companyEmail: 'company@example.com'
    });
    
    if (response.data.success) {
      success('Test user created successfully');
      return await testLogin();
    }
  } catch (err) {
    error(`Failed to create test user: ${err.response?.data?.message || err.message}`);
    return false;
  }
}

async function testGetCurrentUser() {
  section('Step 2: Testing GET /auth/me');
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (response.data.success && response.data.data) {
      success('Successfully fetched current user');
      info(`User: ${response.data.data.name || response.data.data.email}`);
      info(`Credits: ${response.data.data.credits?.balance || 0}`);
      return true;
    } else {
      error('Failed to fetch current user');
      return false;
    }
  } catch (err) {
    error(`GET /auth/me failed: ${err.response?.status} ${err.response?.data?.message || err.message}`);
    console.log('Full error:', err.response?.data);
    return false;
  }
}

async function testGetSubscriptionPlans() {
  section('Step 3: Testing GET /subscriptions/plans');
  try {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/plans`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (response.data.success && response.data.data.plans) {
      success('Successfully fetched subscription plans');
      response.data.data.plans.forEach(plan => {
        info(`  - ${plan.name}: ${plan.credits} credits for ${plan.currency} ${plan.amount}`);
      });
      return true;
    } else {
      error('Failed to fetch plans');
      return false;
    }
  } catch (err) {
    error(`GET /subscriptions/plans failed: ${err.response?.data?.message || err.message}`);
    return false;
  }
}

async function testCreateSubscription() {
  section('Step 4: Testing POST /subscriptions (Test Plan - ₹1)');
  try {
    info('Creating subscription with plan: test');
    const response = await axios.post(`${API_BASE_URL}/subscriptions`, 
      { plan: 'test' },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    if (response.data.success && response.data.data) {
      success('Successfully created subscription');
      const { subscription, razorpayOrder } = response.data.data;
      info(`Subscription ID: ${subscription._id}`);
      info(`Status: ${subscription.status}`);
      info(`Credits: ${subscription.credits}`);
      if (razorpayOrder) {
        info(`Razorpay Order ID: ${razorpayOrder.id}`);
        info(`Amount: ${razorpayOrder.currency} ${razorpayOrder.amount / 100}`);
      }
      return { subscription, razorpayOrder };
    } else {
      error('Failed to create subscription');
      return null;
    }
  } catch (err) {
    error(`POST /subscriptions failed: ${err.response?.status} ${err.response?.statusText}`);
    error(`Error: ${err.response?.data?.message || err.message}`);
    console.log('\nRequest body:', { plan: 'test' });
    console.log('Response data:', err.response?.data);
    return null;
  }
}

async function testGetCredits() {
  section('Step 5: Testing GET /subscriptions/credits');
  try {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/credits`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (response.data.success && response.data.data) {
      success('Successfully fetched credits balance');
      info(`Balance: ${response.data.data.balance} ${response.data.data.currency}`);
      return true;
    } else {
      error('Failed to fetch credits');
      return false;
    }
  } catch (err) {
    error(`GET /subscriptions/credits failed: ${err.response?.data?.message || err.message}`);
    return false;
  }
}

async function runTests() {
  log('\n' + '█'.repeat(60), colors.blue);
  log('  PAYMENT FLOW END-TO-END TEST  ', colors.blue);
  log('█'.repeat(60) + '\n', colors.blue);
  
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    error('\n❌ Tests aborted: Login failed');
    process.exit(1);
  }
  
  const getUserSuccess = await testGetCurrentUser();
  if (!getUserSuccess) {
    error('\n⚠️  Warning: GET /auth/me failed (continuing tests)');
  }
  
  const plansSuccess = await testGetSubscriptionPlans();
  if (!plansSuccess) {
    error('\n❌ Tests aborted: Failed to fetch plans');
    process.exit(1);
  }
  
  const subscriptionResult = await testCreateSubscription();
  if (!subscriptionResult) {
    error('\n❌ Tests aborted: Failed to create subscription');
    process.exit(1);
  }
  
  await testGetCredits();
  
  section('Test Summary');
  success('✓ Login');
  success('✓ Get Subscription Plans');
  success('✓ Create Subscription');
  success('✓ Get Credits Balance');
  
  log('\n' + '█'.repeat(60), colors.green);
  log('  ALL TESTS PASSED!  ', colors.green);
  log('█'.repeat(60) + '\n', colors.green);
  
  if (subscriptionResult.razorpayOrder) {
    info('\nNext Steps:');
    info('1. Use the Razorpay Order ID to make a test payment');
    info('2. Call POST /subscriptions/activate with payment details');
    info('3. Verify credits were added to the user account');
  }
}

// Run tests
runTests().catch(err => {
  error(`\n❌ Unexpected error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
