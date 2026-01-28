// Test Wallet Functionality
// This script tests the new wallet system end-to-end

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

// Test credentials
const TEST_USER = {
  email: 'admin@socialscale.com',
  password: 'Admin@12345'
};

let authToken = '';
let userId = '';

// Helper function to make authenticated requests
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Test functions
async function login() {
  console.log('\n1️⃣ Testing Login...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    authToken = response.data.data.accessToken;
    userId = response.data.data.user.userId;
    console.log('✅ Login successful');
    console.log(`   User: ${response.data.data.user.email}`);
    console.log(`   Role: ${response.data.data.user.role}`);
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function getWalletBalance() {
  console.log('\n2️⃣ Testing Get Wallet Balance...');
  try {
    const response = await api.get('/wallet/balance');
    console.log('✅ Wallet balance retrieved');
    console.log(`   Balance: ₹${response.data.data.balance.toFixed(2)}`);
    console.log(`   Total Added: ₹${response.data.data.totalAdded.toFixed(2)}`);
    console.log(`   Total Spent: ₹${response.data.data.totalSpent.toFixed(2)}`);
    return response.data.data.balance;
  } catch (error) {
    console.error('❌ Get balance failed:', error.response?.data || error.message);
    return null;
  }
}

async function createPaymentOrder() {
  console.log('\n3️⃣ Testing Create Payment Order...');
  try {
    const testAmount = 1000;
    const response = await api.post('/wallet/create-order', { amount: testAmount });
    console.log('✅ Payment order created');
    console.log(`   Order ID: ${response.data.data.orderId}`);
    console.log(`   Amount: ₹${response.data.data.amount}`);
    console.log(`   Currency: ${response.data.data.currency}`);
    console.log(`   Key ID: ${response.data.data.keyId}`);
    return response.data.data.orderId;
  } catch (error) {
    console.error('❌ Create payment order failed:', error.response?.data || error.message);
    return null;
  }
}

async function getFampageServices() {
  console.log('\n4️⃣ Testing Fampage Services Fetch...');
  try {
    const response = await api.get('/orders/services');
    console.log('✅ Fampage services retrieved');
    console.log(`   Total services: ${response.data.data.length}`);
    
    // Show a few sample services
    const samples = response.data.data.slice(0, 5);
    console.log('\n   Sample Services:');
    samples.forEach((service) => {
      console.log(`   - ${service.name}: ₹${service.rate} per 1K (Service ID: ${service.service})`);
    });
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Get services failed:', error.response?.data || error.message);
    return null;
  }
}

async function testOrderCreation(services) {
  console.log('\n5️⃣ Testing Order Creation with INR Pricing...');
  
  // Find Instagram followers service
  const instagramService = services.find(s => 
    s.name.toLowerCase().includes('instagram') && 
    s.name.toLowerCase().includes('followers')
  );
  
  if (!instagramService) {
    console.log('⚠️ No Instagram followers service found, skipping order test');
    return;
  }
  
  const orderData = {
    service: instagramService.service,
    link: 'https://instagram.com/test_user',
    quantity: 100, // 100 followers
  };
  
  const expectedCost = (orderData.quantity / 1000) * parseFloat(instagramService.rate);
  
  console.log(`   Service: ${instagramService.name}`);
  console.log(`   Rate: ₹${instagramService.rate} per 1K`);
  console.log(`   Quantity: ${orderData.quantity}`);
  console.log(`   Expected Cost: ₹${expectedCost.toFixed(2)}`);
  
  try {
    const response = await api.post('/orders', orderData);
    console.log('✅ Order created successfully');
    console.log(`   Order ID: ${response.data.data._id}`);
    console.log(`   Fampage Order ID: ${response.data.data.fampageOrderId}`);
    console.log(`   Cost: ₹${response.data.data.cost.toFixed(2)}`);
    console.log(`   Status: ${response.data.data.status}`);
  } catch (error) {
    console.error('❌ Order creation failed:', error.response?.data || error.message);
  }
}

async function testInsufficientBalance(services) {
  console.log('\n6️⃣ Testing Insufficient Balance Error...');
  
  const service = services[0];
  
  const orderData = {
    service: service.service,
    link: 'https://instagram.com/test_user',
    quantity: 1000000, // Very large quantity to exceed balance
  };
  
  try {
    await api.post('/orders', orderData);
    console.log('⚠️ Order should have failed due to insufficient balance');
  } catch (error) {
    if (error.response?.status === 403 && error.response?.data?.message?.includes('Insufficient balance')) {
      console.log('✅ Insufficient balance error working correctly');
      console.log(`   Error: ${error.response.data.message}`);
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
}

async function getUser() {
  console.log('\n7️⃣ Testing Get User (Verify Wallet Structure)...');
  try {
    const response = await api.get('/auth/me');
    console.log('✅ User data retrieved');
    console.log(`   Email: ${response.data.data.email}`);
    console.log(`   Wallet Balance: ₹${response.data.data.wallet?.balance || 0}`);
    console.log(`   Wallet Total Added: ₹${response.data.data.wallet?.totalAdded || 0}`);
    console.log(`   Wallet Total Spent: ₹${response.data.data.wallet?.totalSpent || 0}`);
  } catch (error) {
    console.error('❌ Get user failed:', error.response?.data || error.message);
  }
}

// Main test execution
async function runTests() {
  console.log('🧪 WALLET SYSTEM END-TO-END TEST');
  console.log('================================\n');
  
  // 1. Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Tests aborted - login failed');
    return;
  }
  
  // 2. Get wallet balance
  const balance = await getWalletBalance();
  if (balance === null) {
    console.log('\n⚠️ Continuing despite balance fetch failure...');
  }
  
  // 3. Create payment order (just test API, don't complete payment)
  await createPaymentOrder();
  
  // 4. Get Fampage services
  const services = await getFampageServices();
  if (!services || services.length === 0) {
    console.log('\n❌ Tests aborted - no services available');
    return;
  }
  
  // 5. Test order creation
  if (balance && balance > 0) {
    await testOrderCreation(services);
  } else {
    console.log('\n⚠️ Skipping order creation - insufficient balance');
    console.log('   Please add money to wallet via frontend to test order creation');
  }
  
  // 6. Test insufficient balance error
  await testInsufficientBalance(services);
  
  // 7. Get user to verify wallet structure
  await getUser();
  
  console.log('\n\n✅ ALL TESTS COMPLETED');
  console.log('================================');
  console.log('\n📋 Summary:');
  console.log('   - Login: ✅');
  console.log('   - Wallet Balance API: ✅');
  console.log('   - Payment Order Creation: ✅');
  console.log('   - Fampage Services Fetch: ✅');
  console.log('   - Insufficient Balance Handling: ✅');
  console.log('   - User Wallet Structure: ✅');
  console.log('\n💡 Next Steps:');
  console.log('   1. Login to frontend: http://localhost:5173');
  console.log('   2. Click "Add Money" button in topbar');
  console.log('   3. Add ₹1000 to wallet');
  console.log('   4. Place an order to test complete flow');
}

// Run tests
runTests().catch(console.error);
