const mongoose = require('mongoose');
const User = require('./src/models/User');
const Transaction = require('./src/models/Transaction');
require('dotenv').config();

async function testWalletFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test user
    const user = await User.findOne({ role: 'COMPANY_USER' });
    if (!user) {
      console.log('❌ No COMPANY_USER found');
      return;
    }

    console.log('\n📊 User Wallet Info:');
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Current Balance: ₹${user.wallet?.balance || 0}`);
    console.log(`Total Added: ₹${user.wallet?.totalAdded || 0}`);
    console.log(`Total Spent: ₹${user.wallet?.totalSpent || 0}`);

    // Check recent transactions
    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`\n💳 Recent Transactions (${transactions.length}):`);
    transactions.forEach((txn, i) => {
      console.log(`\n${i + 1}. Transaction ${txn._id}`);
      console.log(`   Type: ${txn.type}`);
      console.log(`   Amount: ₹${txn.amount}`);
      console.log(`   Status: ${txn.status}`);
      console.log(`   Balance: ₹${txn.balanceBefore} → ₹${txn.balanceAfter}`);
      console.log(`   Method: ${txn.paymentMethod}`);
      if (txn.paymentId) console.log(`   Payment ID: ${txn.paymentId}`);
      if (txn.orderId) console.log(`   Order ID: ${txn.orderId}`);
      console.log(`   Created: ${txn.createdAt}`);
    });

    // Test creating a wallet credit transaction
    console.log('\n🧪 Testing Transaction Creation...');
    
    const testTransaction = {
      userId: user._id,
      type: 'wallet_credit',
      amount: 100,
      currency: 'INR',
      balanceBefore: user.wallet.balance,
      balanceAfter: user.wallet.balance + 100,
      status: 'completed',
      paymentMethod: 'razorpay',
      paymentId: 'test_payment_123',
      orderId: 'order_test_123',
      notes: 'Test wallet recharge',
    };

    console.log('Transaction data:', JSON.stringify(testTransaction, null, 2));

    // Validate (but don't save)
    const txn = new Transaction(testTransaction);
    await txn.validate();
    console.log('✅ Transaction validation passed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

testWalletFlow();
