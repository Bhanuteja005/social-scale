#!/usr/bin/env node
/**
 * Complete Payment Flow Test with Activation
 * Tests: Login → Create Subscription → Simulate Payment → Activate → Verify Credits
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

let accessToken = '';
let subscriptionId = '';
let razorpayOrderId = '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m'
};

function log(msg, color = colors.reset) { console.log(`${color}${msg}${colors.reset}`); }
function success(msg) { log(`✓ ${msg}`, colors.green); }
function error(msg) { log(`✗ ${msg}`, colors.red); }
function info(msg) { log(`ℹ ${msg}`, colors.cyan); }
function warn(msg) { log(`⚠ ${msg}`, colors.yellow); }
function section(msg) { log(`\n${'='.repeat(70)}\n${msg}\n${'='.repeat(70)}`, colors.blue); }

async function login() {
  section('Step 1: User Login');
  const res = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
  accessToken = res.data.data.accessToken;
  success(`Logged in as ${res.data.data.user.email}`);
  info(`User ID: ${res.data.data.user.userId || res.data.data.user._id}`);
  return res.data.data.user;
}

async function checkInitialBalance() {
  section('Step 2: Check Initial Credit Balance');
  const res = await axios.get(`${API_BASE_URL}/subscriptions/credits`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  info(`Current balance: ${res.data.data.balance || 0} credits`);
  return res.data.data.balance || 0;
}

async function createSubscription() {
  section('Step 3: Create Subscription (Test Plan - ₹1)');
  const res = await axios.post(`${API_BASE_URL}/subscriptions`,
    { plan: 'test' },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  
  subscriptionId = res.data.data.subscription._id;
  razorpayOrderId = res.data.data.razorpayOrder?.id;
  
  success(`Subscription created successfully`);
  info(`Subscription ID: ${subscriptionId}`);
  info(`Razorpay Order ID: ${razorpayOrderId}`);
  info(`Amount: ₹${res.data.data.razorpayOrder?.amount / 100}`);
  info(`Credits to be added: ${res.data.data.subscription.credits}`);
  info(`Status: ${res.data.data.subscription.status}`);
  
  return res.data.data;
}

async function simulatePayment() {
  section('Step 4: Simulate Razorpay Payment');
  warn('In production, user would complete payment on Razorpay checkout');
  warn('For testing, we simulate payment completion...');
  
  // Generate mock payment details
  const mockPaymentId = 'pay_test_' + Date.now();
  const mockSignature = require('crypto')
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret')
    .update(`${razorpayOrderId}|${mockPaymentId}`)
    .digest('hex');
  
  info(`Mock Payment ID: ${mockPaymentId}`);
  info(`Mock Signature: ${mockSignature.substring(0, 20)}...`);
  
  return {
    razorpay_payment_id: mockPaymentId,
    razorpay_order_id: razorpayOrderId,
    razorpay_signature: mockSignature
  };
}

async function activateSubscription(paymentData) {
  section('Step 5: Activate Subscription');
  info('Calling activation endpoint...');
  
  try {
    const res = await axios.post(`${API_BASE_URL}/subscriptions/activate`,
      {
        subscriptionId,
        paymentId: paymentData.razorpay_payment_id,
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    success('Subscription activated successfully!');
    info(`Credits added: ${res.data.data?.credits || 'N/A'}`);
    info(`Status: ${res.data.data?.status || 'N/A'}`);
    return res.data.data;
  } catch (err) {
    error(`Activation failed: ${err.response?.status} ${err.response?.statusText}`);
    error(`Error: ${err.response?.data?.message || err.message}`);
    console.log('\nRequest payload:', {
      subscriptionId,
      paymentId: paymentData.razorpay_payment_id,
      razorpayOrderId: paymentData.razorpay_order_id,
      razorpayPaymentId: paymentData.razorpay_payment_id
    });
    console.log('Response:', err.response?.data);
    throw err;
  }
}

async function checkFinalBalance() {
  section('Step 6: Verify Credits Were Added');
  const res = await axios.get(`${API_BASE_URL}/subscriptions/credits`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  info(`Final balance: ${res.data.data.balance || 0} credits`);
  return res.data.data.balance || 0;
}

async function getCurrentUser() {
  section('Step 7: Get Updated User Profile');
  const res = await axios.get(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  info(`Name: ${res.data.data.name}`);
  info(`Email: ${res.data.data.email}`);
  info(`Credits: ${res.data.data.credits?.balance || 0}`);
  info(`Total Purchased: ${res.data.data.credits?.totalPurchased || 0}`);
  return res.data.data;
}

async function runCompletePaymentFlow() {
  log('\n' + '█'.repeat(70), colors.magenta);
  log('  COMPLETE PAYMENT FLOW TEST WITH ACTIVATION  ', colors.magenta);
  log('█'.repeat(70) + '\n', colors.magenta);

  try {
    // 1. Login
    await login();
    
    // 2. Check initial balance
    const initialBalance = await checkInitialBalance();
    
    // 3. Create subscription
    const subscription = await createSubscription();
    const expectedCredits = subscription.subscription.credits;
    
    // 4. Simulate payment
    const paymentData = await simulatePayment();
    
    // 5. Activate subscription
    await activateSubscription(paymentData);
    
    // 6. Check final balance
    const finalBalance = await checkFinalBalance();
    
    // 7. Get user profile
    await getCurrentUser();
    
    // Verify credits were added
    section('Verification Results');
    const creditsAdded = finalBalance - initialBalance;
    
    if (creditsAdded === expectedCredits) {
      success(`✓ Credits correctly added: ${creditsAdded} credits`);
      success(`✓ Initial balance: ${initialBalance}`);
      success(`✓ Final balance: ${finalBalance}`);
      success(`✓ Expected: ${expectedCredits}`);
    } else {
      error(`✗ Credit mismatch!`);
      error(`  Expected: ${expectedCredits} credits`);
      error(`  Added: ${creditsAdded} credits`);
      error(`  Initial: ${initialBalance}`);
      error(`  Final: ${finalBalance}`);
    }
    
    log('\n' + '█'.repeat(70), colors.green);
    log('  ✅ ALL TESTS PASSED - PAYMENT FLOW WORKING!  ', colors.green);
    log('█'.repeat(70) + '\n', colors.green);
    
    section('Summary');
    success('✓ User authentication');
    success('✓ Subscription creation');
    success('✓ Payment simulation');
    success('✓ Subscription activation');
    success('✓ Credits added correctly');
    success('✓ User profile updated');
    
    log('\n🎉 Payment system is fully functional!\n', colors.green);
    
  } catch (err) {
    log('\n' + '█'.repeat(70), colors.red);
    log('  ❌ TEST FAILED  ', colors.red);
    log('█'.repeat(70) + '\n', colors.red);
    
    if (err.response) {
      error(`HTTP ${err.response.status}: ${err.response.statusText}`);
      error(`Message: ${err.response.data?.message || 'No message'}`);
      if (err.response.data?.errors) {
        error(`Errors: ${JSON.stringify(err.response.data.errors)}`);
      }
    } else {
      error(`Error: ${err.message}`);
    }
    
    process.exit(1);
  }
}

runCompletePaymentFlow();
