const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/v1';
let authToken = '';

// Test data
const testOrder = {
    service: '3532', // Instagram Reel Views - Cheap S2
    link: 'https://www.instagram.com/reel/DKHg-jNPK7B/',
    quantity: 100
};

// Helper function for API calls
async function apiCall(method, endpoint, data = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` })
            },
            ...(data && { data })
        };

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`❌ API Error on ${endpoint}:`, error.response?.data || error.message);
        throw error;
    }
}

// Test functions
async function testLogin() {
    console.log('\n📝 Step 1: Login...');
    
    // You need to provide valid credentials
    const credentials = {
        email: process.env.TEST_EMAIL || 'admin@example.com',
        password: process.env.TEST_PASSWORD || 'Admin@123'
    };

    try {
        const response = await apiCall('POST', '/auth/login', credentials);
        authToken = response.data.accessToken;
        console.log('✅ Login successful');
        console.log(`   User: ${response.data.user.name} (${response.data.user.email})`);
        console.log(`   Role: ${response.data.user.role}`);
        console.log(`   Wallet Balance: ₹${response.data.user.wallet?.balance || 0}`);
        return response.data.user;
    } catch (error) {
        console.error('❌ Login failed - please check credentials');
        throw error;
    }
}

async function testGetServices() {
    console.log('\n📝 Step 2: Fetching Fampage Services...');
    
    try {
        const response = await apiCall('GET', '/orders/services');
        const service = response.data.find(s => s.service === parseInt(testOrder.service));
        
        if (service) {
            console.log('✅ Service found:');
            console.log(`   ID: ${service.service}`);
            console.log(`   Name: ${service.name}`);
            console.log(`   Rate: ₹${service.rate} per 1000`);
            console.log(`   Min: ${service.min}, Max: ${service.max}`);
            return service;
        } else {
            console.log('⚠️  Service not found, but continuing...');
            return null;
        }
    } catch (error) {
        console.error('❌ Failed to fetch services');
        throw error;
    }
}

async function testCreateOrder(user, service) {
    console.log('\n📝 Step 3: Creating Order...');
    console.log(`   Service: ${testOrder.service}`);
    console.log(`   Link: ${testOrder.link}`);
    console.log(`   Quantity: ${testOrder.quantity}`);
    
    // Calculate expected cost
    if (service) {
        const expectedCost = (testOrder.quantity / 1000) * parseFloat(service.rate);
        console.log(`   Expected Cost: ₹${expectedCost.toFixed(2)}`);
        console.log(`   Current Balance: ₹${user.wallet?.balance || 0}`);
        
        if (user.wallet?.balance < expectedCost) {
            console.log('⚠️  WARNING: Insufficient balance!');
            console.log(`   Need: ₹${(expectedCost - user.wallet.balance).toFixed(2)} more`);
        }
    }
    
    try {
        const response = await apiCall('POST', '/orders', testOrder);
        console.log('✅ Order created successfully!');
        console.log(`   Order ID: ${response.data.order._id}`);
        console.log(`   Service Name: ${response.data.order.serviceName}`);
        console.log(`   Quantity: ${response.data.order.quantity}`);
        console.log(`   Cost: ₹${response.data.order.cost}`);
        console.log(`   Status: ${response.data.order.status}`);
        console.log(`   Fampage Order ID: ${response.data.fampageOrderId}`);
        return response.data.order;
    } catch (error) {
        console.error('❌ Order creation failed');
        if (error.response?.data) {
            console.error('   Error:', error.response.data.message || error.response.data.error);
        }
        throw error;
    }
}

async function testGetWallet() {
    console.log('\n📝 Step 4: Checking Wallet Balance...');
    
    try {
        const response = await apiCall('GET', '/auth/me');
        const wallet = response.data.wallet;
        console.log('✅ Wallet Status:');
        console.log(`   Balance: ₹${wallet.balance.toFixed(2)}`);
        console.log(`   Total Added: ₹${wallet.totalAdded.toFixed(2)}`);
        console.log(`   Total Spent: ₹${wallet.totalSpent.toFixed(2)}`);
        return wallet;
    } catch (error) {
        console.error('❌ Failed to get wallet info');
        throw error;
    }
}

// Main test function
async function runTests() {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   🧪 Order Creation End-to-End Test          ║');
    console.log('╚════════════════════════════════════════════════╝');
    
    try {
        const user = await testLogin();
        const service = await testGetServices();
        const order = await testCreateOrder(user, service);
        const wallet = await testGetWallet();
        
        console.log('\n╔════════════════════════════════════════════════╗');
        console.log('║   ✅ ALL TESTS PASSED                        ║');
        console.log('╚════════════════════════════════════════════════╝');
        
    } catch (error) {
        console.log('\n╔════════════════════════════════════════════════╗');
        console.log('║   ❌ TESTS FAILED                            ║');
        console.log('╚════════════════════════════════════════════════╝');
        console.error('\nError details:', error.message);
        process.exit(1);
    }
}

// Run the tests
runTests();
