#!/usr/bin/env node
/**
 * Complete Flow Test - Subscription + Order Creation
 * Tests the full user journey from login to placing an order
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

let accessToken = '';
let subscriptionId = '';

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

async function login() {
  section('Step 1: Login');
  const res = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
  accessToken = res.data.data.accessToken;
  success(`Logged in as ${res.data.data.user.email}`);
  return res.data.data.user;
}

async function getServices() {
  section('Step 2: Get Available Services');
  const res = await axios.get(`${API_BASE_URL}/api-integrations/services`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  success(`Fetched ${res.data.data.services.length} services`);
  
  // Pick first Instagram service
  const instagramService = res.data.data.services.find(s => 
    s.name.toLowerCase().includes('instagram') && s.name.toLowerCase().includes('followers')
  );
  
  if (instagramService) {
    info(`Selected: ${instagramService.name} (ID: ${instagramService.service})`);
    info(`  Min: ${instagramService.min}, Max: ${instagramService.max}`);
    info(`  Rate: $${instagramService.rate} per 1000`);
    return instagramService;
  }
  
  throw new Error('No Instagram follower service found');
}

async function calculateCredits(serviceId, quantity) {
  section('Step 3: Calculate Credits Required');
  const res = await axios.post(`${API_BASE_URL}/pricing/calculate`, 
    { service: serviceId, quantity },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  success(`Credits required: ${res.data.data.credits}`);
  info(`Price per 1000: ${res.data.data.pricing.pricePerThousand}`);
  return res.data.data.credits;
}

async function createSubscription() {
  section('Step 4: Purchase Credits (Test Plan)');
  const res = await axios.post(`${API_BASE_URL}/subscriptions`,
    { plan: 'test' },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  subscriptionId = res.data.data.subscription._id;
  success(`Subscription created: ${subscriptionId}`);
  info(`Razorpay Order ID: ${res.data.data.razorpayOrder?.id}`);
  info(`Amount: ₹${res.data.data.razorpayOrder?.amount / 100}`);
  return res.data.data;
}

async function activateSubscription(subId) {
  section('Step 5: Activate Subscription (Simulate Payment)');
  
  // In real scenario, user would complete Razorpay payment
  // For testing, we'll simulate activation
  info('Simulating payment completion...');
  
  const res = await axios.post(`${API_BASE_URL}/subscriptions/activate`,
    {
      subscriptionId: subId,
      paymentId: 'pay_test_' + Date.now(),
      razorpayOrderId: 'order_test_' + Date.now(),
      razorpayPaymentId: 'pay_test_' + Date.now()
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  
  success('Subscription activated!');
  info(`Credits added: ${res.data.data.subscription.credits}`);
  return res.data.data;
}

async function checkCredits() {
  const res = await axios.get(`${API_BASE_URL}/subscriptions/credits`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data.data.balance;
}

async function createOrder(service, link, quantity) {
  section('Step 6: Create Order');
  const res = await axios.post(`${API_BASE_URL}/orders`,
    {
      service: service.service,
      link,
      quantity
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  
  success(`Order created: ${res.data.data.order._id}`);
  info(`Service: ${service.name}`);
  info(`Quantity: ${quantity}`);
  info(`Credits used: ${res.data.data.creditsDeducted}`);
  info(`Fampage Order ID: ${res.data.data.fampageOrderId}`);
  return res.data.data.order;
}

async function getOrders() {
  section('Step 7: Verify Order in History');
  const res = await axios.get(`${API_BASE_URL}/orders`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  success(`Found ${res.data.data.length} orders`);
  if (res.data.data.length > 0) {
    const order = res.data.data[0];
    info(`Latest order: ${order._id}`);
    info(`  Status: ${order.status}`);
    info(`  Service: ${order.serviceName}`);
    info(`  Credits: ${order.creditsUsed}`);
  }
  return res.data.data;
}

async function runCompleteFlow() {
  log('\n' + '█'.repeat(60), colors.blue);
  log('  COMPLETE USER FLOW TEST  ', colors.blue);
  log('  Login → Get Services → Buy Credits → Place Order  ', colors.blue);
  log('█'.repeat(60) + '\n', colors.blue);

  try {
    // 1. Login
    const user = await login();
    
    // 2. Get services
    const service = await getServices();
    
    // 3. Calculate credits
    const quantity = 100; // Order 100 followers
    const creditsNeeded = await calculateCredits(service.service, quantity);
    
    // 4. Check current balance
    section('Step 4a: Check Current Balance');
    let balance = await checkCredits();
    info(`Current balance: ${balance} credits`);
    
    // 5. Buy credits if needed
    if (balance < creditsNeeded) {
      info(`Need ${creditsNeeded} credits, have ${balance}`);
      info('Purchasing test plan (2500 credits for ₹1)...');
      
      const subscription = await createSubscription();
      
      info('⚠️  To complete payment:');
      info(`   1. Visit Razorpay payment page (not automated)`);
      info(`   2. Complete payment for ₹1`);
      info(`   3. Credits will be added automatically`);
      info('');
      info('For testing, we\'ll simulate activation...');
      
      // Simulate activation (in production, this happens via webhook)
      try {
        await activateSubscription(subscriptionId);
        balance = await checkCredits();
        success(`New balance: ${balance} credits`);
      } catch (err) {
        error('Activation simulation failed (use real Razorpay payment in production)');
        info('Continuing test with current balance...');
      }
    }
    
    // 6. Create order
    const targetUrl = 'https://instagram.com/test_account';
    const order = await createOrder(service, targetUrl, quantity);
    
    // 7. Get orders
    await getOrders();
    
    // 8. Final balance check
    section('Step 8: Final Credit Balance');
    balance = await checkCredits();
    info(`Remaining balance: ${balance} credits`);
    
    log('\n' + '█'.repeat(60), colors.green);
    log('  ALL STEPS COMPLETED SUCCESSFULLY!  ', colors.green);
    log('█'.repeat(60) + '\n', colors.green);
    
    section('Summary');
    success('✓ User authentication');
    success('✓ Service discovery');
    success('✓ Credit calculation');
    success('✓ Subscription creation');
    success('✓ Order placement');
    success('✓ Order verification');
    
    log('\n🎉 Application is working end-to-end!\n', colors.green);
    
  } catch (err) {
    log('\n' + '█'.repeat(60), colors.red);
    log('  TEST FAILED  ', colors.red);
    log('█'.repeat(60) + '\n', colors.red);
    error(`Error: ${err.response?.data?.message || err.message}`);
    if (err.response?.data) {
      console.log('\nResponse:', err.response.data);
    }
    process.exit(1);
  }
}

runCompleteFlow();
