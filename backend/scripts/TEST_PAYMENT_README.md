# Payment Flow Test Script

## Usage

### 1. Start the backend server
```bash
cd backend
npm run dev
```

### 2. Run the test script
```bash
cd backend
node scripts/test_payment_flow.js
```

### 3. Test with custom credentials
```bash
API_BASE_URL=http://localhost:3000/api/v1 node scripts/test_payment_flow.js
```

## What the script tests

1. **Login** - Authenticates test user and gets access token
2. **GET /auth/me** - Fetches current user data
3. **GET /subscriptions/plans** - Lists available subscription plans
4. **POST /subscriptions** - Creates a subscription with test plan (₹1)
5. **GET /subscriptions/credits** - Checks credit balance

## Expected Output

```
============================================================
  PAYMENT FLOW END-TO-END TEST
============================================================

============================================================
Step 1: Testing Login
============================================================
✓ Login successful
ℹ User ID: 6787...
ℹ Token: eyJhbGciOiJIUzI1N...

============================================================
Step 2: Testing GET /auth/me
============================================================
✓ Successfully fetched current user
ℹ User: test@example.com
ℹ Credits: 0

============================================================
Step 3: Testing GET /subscriptions/plans
============================================================
✓ Successfully fetched subscription plans
ℹ   - Free: 0 credits for INR 0
ℹ   - Test Plan (Dev Only): 2500 credits for INR 1
ℹ   - Growth: 2500 credits for USD 29
ℹ   - Enterprise: 10000 credits for USD 79

============================================================
Step 4: Testing POST /subscriptions (Test Plan - ₹1)
============================================================
ℹ Creating subscription with plan: test
✓ Successfully created subscription
ℹ Subscription ID: 6787...
ℹ Status: pending
ℹ Credits: 2500
ℹ Razorpay Order ID: order_...
ℹ Amount: INR 1

============================================================
Step 5: Testing GET /subscriptions/credits
============================================================
✓ Successfully fetched credits balance
ℹ Balance: 0 INR

============================================================
Test Summary
============================================================
✓ Login
✓ Get Subscription Plans
✓ Create Subscription
✓ Get Credits Balance

============================================================
  ALL TESTS PASSED!
============================================================
```

## Troubleshooting

### 404 on /auth/me
- Check that backend server is running
- Verify JWT token is valid
- Check authenticate middleware is working

### 400 on POST /subscriptions
- Verify plan name is correct (must be lowercase: 'test', 'growth', or 'enterprise')
- Check Razorpay credentials are configured
- Review backend console logs for detailed error

### User not found
- Script will auto-create a test user if needed
- You can also manually create a user via registration

## Test User Credentials

Default credentials used by script:
- Email: `test@example.com`
- Password: `password123`

You can modify these in the script or use environment variables.
