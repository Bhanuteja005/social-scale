const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Test credentials - UPDATE THESE WITH YOUR ACTUAL CREDENTIALS
const TEST_EMAIL = 'pashikantibhanuteja@gmail.com';
const TEST_PASSWORD = 'your_password_here'; // You need to provide this

let authToken = '';

async function login() {
    console.log('\n========================================');
    console.log('Step 1: Login');
    console.log('========================================');
    
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        
        authToken = response.data.data.accessToken;
        const user = response.data.data.user;
        
        console.log('✅ Login successful');
        console.log(`User: ${user.name} (${user.email})`);
        console.log(`Role: ${user.role}`);
        console.log(`Wallet Balance: ₹${user.wallet?.balance?.toFixed(2) || 0}`);
        
        return user;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data?.message || error.message);
        console.log('\n⚠️  Please update TEST_PASSWORD in the script with your actual password');
        process.exit(1);
    }
}

async function getServices() {
    console.log('\n========================================');
    console.log('Step 2: Fetch Fampage Services');
    console.log('========================================');
    
    try {
        const response = await axios.get(`${BASE_URL}/orders/services`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const services = response.data.data;
        console.log(`✅ Fetched ${services.length} services from Fampage`);
        
        // Find the Instagram Reel Views service
        const reelService = services.find(s => s.service === 3694 || s.name.toLowerCase().includes('reel'));
        
        if (reelService) {
            console.log('\nTarget Service:');
            console.log(`  ID: ${reelService.service}`);
            console.log(`  Name: ${reelService.name}`);
            console.log(`  Rate: ₹${reelService.rate} per 1000`);
            console.log(`  Min: ${reelService.min}, Max: ${reelService.max}`);
        }
        
        return services;
    } catch (error) {
        console.error('❌ Failed to fetch services:', error.response?.data?.message || error.message);
        throw error;
    }
}

async function createOrder(user) {
    console.log('\n========================================');
    console.log('Step 3: Create Order');
    console.log('========================================');
    
    const orderData = {
        service: '3694',  // Instagram Reel Views
        link: 'https://www.instagram.com/reel/DKHg-jNPK7B/',
        quantity: 100
    };
    
    console.log('Order Details:');
    console.log(`  Service ID: ${orderData.service}`);
    console.log(`  URL: ${orderData.link}`);
    console.log(`  Quantity: ${orderData.quantity}`);
    console.log(`  Current Balance: ₹${user.wallet?.balance?.toFixed(2) || 0}`);
    
    try {
        const response = await axios.post(`${BASE_URL}/orders`, orderData, {
            headers: { 
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const order = response.data.data.order;
        
        console.log('\n✅ ORDER CREATED SUCCESSFULLY!');
        console.log('='.repeat(50));
        console.log(`Order ID: ${order._id}`);
        console.log(`Service: ${order.serviceName}`);
        console.log(`Quantity: ${order.quantity}`);
        console.log(`Cost: ₹${order.cost.toFixed(2)}`);
        console.log(`Status: ${order.status}`);
        console.log(`Fampage Order ID: ${response.data.data.fampageOrderId}`);
        console.log('='.repeat(50));
        
        return order;
    } catch (error) {
        console.error('\n❌ ORDER CREATION FAILED!');
        console.error('='.repeat(50));
        
        if (error.response?.data) {
            console.error('Error:', error.response.data.message || error.response.data.error);
            console.error('Details:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
        
        console.error('='.repeat(50));
        throw error;
    }
}

async function checkBalance() {
    console.log('\n========================================');
    console.log('Step 4: Check Final Balance');
    console.log('========================================');
    
    try {
        const response = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const wallet = response.data.data.wallet;
        console.log('Final Wallet Status:');
        console.log(`  Balance: ₹${wallet.balance.toFixed(2)}`);
        console.log(`  Total Added: ₹${wallet.totalAdded.toFixed(2)}`);
        console.log(`  Total Spent: ₹${wallet.totalSpent.toFixed(2)}`);
    } catch (error) {
        console.error('❌ Failed to check balance:', error.message);
    }
}

async function runTest() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   🧪 ORDER CREATION END-TO-END TEST           ║');
    console.log('╚════════════════════════════════════════════════╝');
    
    try {
        const user = await login();
        await getServices();
        await createOrder(user);
        await checkBalance();
        
        console.log('\n╔════════════════════════════════════════════════╗');
        console.log('║   ✅ ALL TESTS PASSED - ORDER CREATED!       ║');
        console.log('╚════════════════════════════════════════════════╝\n');
        
    } catch (error) {
        console.log('\n╔════════════════════════════════════════════════╗');
        console.log('║   ❌ TEST FAILED                              ║');
        console.log('╚════════════════════════════════════════════════╝\n');
        process.exit(1);
    }
}

// Run the test
runTest();
