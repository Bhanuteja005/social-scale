const mongoose = require('mongoose');
const User = require('./src/models/User');
const Company = require('./src/models/Company');
const authService = require('./src/services/auth');
const walletService = require('./src/services/wallet');
const ordersService = require('./src/services/orders');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://socialscale:SocialScale2024@ac-re52lu0-shard-00-00.z3v8zkw.mongodb.net/social-scale?retryWrites=true&w=majority';

async function testNewUserOrderFlow() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Generate unique email for test user
    const testEmail = `test_${Date.now()}@example.com`;
    console.log(`📧 Test user email: ${testEmail}\n`);

    // Step 1: Register a new user
    console.log('📝 Step 1: Registering new user...');
    const registrationData = {
      name: 'Test User',
      email: testEmail,
      password: 'Test@123456',
      role: 'COMPANY_USER'
    };

    const { user, accessToken } = await authService.register(registrationData);
    console.log('✅ User registered successfully');
    console.log(`   User ID: ${user._id}`);
    console.log(`   User Role: ${user.role}`);
    console.log(`   Company ID: ${user.companyId || 'NOT ASSIGNED'}`);
    console.log(`   Wallet Balance: ₹${user.wallet?.balance || 0}\n`);

    if (!user.companyId) {
      console.log('❌ ERROR: User does not have a company ID assigned!');
      console.log('   This will cause order creation to fail.\n');
    }

    // Verify user was saved with companyId
    const savedUser = await User.findById(user._id);
    console.log('🔍 Verifying saved user data:');
    console.log(`   Saved Company ID: ${savedUser.companyId || 'NOT ASSIGNED'}`);
    
    if (savedUser.companyId) {
      const company = await Company.findOne({ companyId: savedUser.companyId });
      if (company) {
        console.log(`   Company Name: ${company.name}`);
        console.log(`   Company Status: ${company.status}\n`);
      } else {
        console.log('   ⚠️  Company not found in database!\n');
      }
    }

    // Step 2: Add ₹1 to wallet
    console.log('💰 Step 2: Adding ₹1 to wallet...');
    const walletUpdate = await walletService.addFunds(
      user._id,
      1,
      'INR',
      null,
      'Test deposit for order creation'
    );
    console.log(`✅ Funds added successfully`);
    console.log(`   New Balance: ₹${walletUpdate.user.wallet.balance}\n`);

    // Step 3: Get service info (Instagram Reels Views - Cheap S2)
    console.log('🔍 Step 3: Finding Instagram Reels Views service...');
    const services = await ordersService.getFampageServices();
    
    // Look for Instagram Reels Views services
    const reelsServices = services.filter(s => 
      s.name && s.name.toLowerCase().includes('reel') && 
      s.name.toLowerCase().includes('view')
    );
    
    console.log(`   Found ${reelsServices.length} Instagram Reels Views services\n`);
    
    if (reelsServices.length > 0) {
      console.log('   Available Instagram Reels Views services:');
      reelsServices.slice(0, 5).forEach(s => {
        console.log(`   - Service ${s.service}: ${s.name}`);
        console.log(`     Rate: ₹${s.rate}/1K, Min: ${s.min}, Max: ${s.max}`);
      });
      console.log('');
    }

    // Find the cheapest service
    const cheapService = reelsServices.sort((a, b) => 
      parseFloat(a.rate) - parseFloat(b.rate)
    )[0];

    if (!cheapService) {
      console.log('❌ No Instagram Reels Views service found!');
      await cleanup(user._id);
      return;
    }

    console.log(`📦 Selected Service: ${cheapService.service}`);
    console.log(`   Name: ${cheapService.name}`);
    console.log(`   Rate: ₹${cheapService.rate}/1K`);
    console.log(`   Min: ${cheapService.min}, Max: ${cheapService.max}`);
    
    // Calculate cost for 100 views
    const quantity = 100;
    const estimatedCost = (quantity / 1000) * parseFloat(cheapService.rate);
    console.log(`   Estimated cost for ${quantity} views: ₹${estimatedCost.toFixed(4)}\n`);

    if (estimatedCost > 1) {
      console.log(`⚠️  WARNING: Cost (₹${estimatedCost.toFixed(4)}) exceeds balance (₹1)`);
      console.log(`   Adding additional funds...\n`);
      await walletService.addFunds(
        user._id,
        Math.ceil(estimatedCost),
        'INR',
        null,
        'Additional funds for order'
      );
      const updatedUser = await User.findById(user._id);
      console.log(`   New Balance: ₹${updatedUser.wallet.balance}\n`);
    }

    // Step 4: Create order
    console.log('🛒 Step 4: Creating order...');
    const orderData = {
      service: cheapService.service.toString(),
      link: 'https://www.instagram.com/reel/test123/',
      quantity: quantity,
      notes: 'Test order from new user'
    };

    console.log(`   Order details:`);
    console.log(`   - Service: ${orderData.service}`);
    console.log(`   - Link: ${orderData.link}`);
    console.log(`   - Quantity: ${orderData.quantity}\n`);

    try {
      const orderResult = await ordersService.createOrder(orderData, user._id, true);
      
      console.log('✅ Order created successfully!');
      console.log(`   Order ID: ${orderResult.order._id}`);
      console.log(`   Fampage Order ID: ${orderResult.fampageOrderId}`);
      console.log(`   Cost: ₹${orderResult.cost.toFixed(2)}`);
      console.log(`   Status: ${orderResult.order.status}\n`);

      // Verify final wallet balance
      const finalUser = await User.findById(user._id);
      console.log(`💰 Final wallet balance: ₹${finalUser.wallet.balance.toFixed(2)}\n`);

      console.log('🎉 SUCCESS: End-to-end flow completed successfully!');
      console.log('   New user can create orders without issues.\n');

    } catch (orderError) {
      console.log('❌ ERROR: Order creation failed!');
      console.log(`   Error: ${orderError.message}\n`);
      
      if (orderError.message.includes('Company ID not found')) {
        console.log('🔍 Debugging company assignment issue:');
        const debugUser = await User.findById(user._id);
        console.log(`   User Company ID: ${debugUser.companyId || 'NULL'}`);
        console.log(`   User Role: ${debugUser.role}`);
        
        if (debugUser.companyId) {
          const debugCompany = await Company.findOne({ companyId: debugUser.companyId });
          console.log(`   Company exists: ${!!debugCompany}`);
          if (debugCompany) {
            console.log(`   Company name: ${debugCompany.name}`);
          }
        }
        console.log('\n   💡 This indicates the auto-company creation is not working properly.');
      }
    }

    // Cleanup
    await cleanup(user._id);

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

async function cleanup(userId) {
  console.log('\n🧹 Cleaning up test data...');
  try {
    // Delete test user
    await User.findByIdAndDelete(userId);
    console.log('   ✅ Test user deleted');
  } catch (error) {
    console.log(`   ⚠️  Cleanup error: ${error.message}`);
  }
}

// Run the test
console.log('🚀 Starting New User Order Creation Test\n');
console.log('='.repeat(60));
console.log('\n');

testNewUserOrderFlow();
