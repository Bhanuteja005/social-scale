require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function testPayment() {
  try {
    // Create order for ₹1
    const order = await razorpay.orders.create({
      amount: 100, // ₹1 in paisa
      currency: 'INR',
      receipt: 'test_1rs_' + Date.now(),
      payment_capture: 1,
    });

    console.log('\n✅ SUCCESS! Payment order created for ₹1\n');
    console.log('Order Details:');
    console.log(JSON.stringify(order, null, 2));
    console.log('\nOrder ID:', order.id);
    console.log('Amount: ₹' + (order.amount / 100));
    console.log('Status:', order.status);
    
    console.log('\n✅ Razorpay Payment Gateway is WORKING!\n');
    console.log('View this order in dashboard:');
    console.log('https://dashboard.razorpay.com/app/orders/' + order.id);
    console.log('\nTest with card: 4111 1111 1111 1111');
    
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    console.error('Details:', error.error);
  }
}

testPayment();
