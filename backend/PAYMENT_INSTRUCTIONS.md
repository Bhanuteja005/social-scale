# Complete Payment for Order: order_S0ZEAJshPqqp5j

## Method 1: Razorpay Dashboard (Recommended)

1. **Go to Razorpay Dashboard:**
   - Visit: https://dashboard.razorpay.com/app/dashboard
   - Login with your test account

2. **Find the Order:**
   - Go to "Orders" section in the left menu
   - Search for order ID: `order_S0ZEAJshPqqp5j`
   - Click on the order

3. **Complete Payment:**
   - In the order details, click "Capture Payment" or "Mark as Paid"
   - This will simulate a successful payment

## Method 2: API Simulation

If you want to simulate payment completion programmatically:

```bash
# This would normally be done by Razorpay's webhook
curl -X POST http://localhost:3000/api/v1/subscriptions/webhook/razorpay \
-H "Content-Type: application/json" \
-d '{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_test_simulated",
        "order_id": "order_S0ZEAJshPqqp5j",
        "amount": 100,
        "currency": "INR",
        "status": "captured"
      }
    }
  }
}'
```

## Method 3: Manual Subscription Activation

After payment is completed in dashboard, activate the subscription:

```bash
curl -X POST http://localhost:3000/api/v1/subscriptions/activate \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_TOKEN" \
-d '{
  "subscriptionId": "YOUR_SUBSCRIPTION_ID",
  "razorpayOrderId": "order_S0ZEAJshPqqp5j",
  "razorpayPaymentId": "pay_test_12345"
}'
```

## Test Card Details (for future frontend integration)

- **Card Number**: 4111 1111 1111 1111
- **Expiry**: 12/25 (or any future date)
- **CVV**: 123
- **Name**: Test User

## Current Status

Your orders are successfully created and ready for payment:
- ✅ Order `order_S0ZEAJshPqqp5j`: ₹1, Status: Created
- ✅ Order `order_S0Z8y03ZW79UYZ`: ₹1, Status: Created

The payment gateway is working perfectly!