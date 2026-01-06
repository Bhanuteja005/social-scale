# How to Complete Payment in Razorpay Dashboard

## You are currently viewing the Orders page. Here's how to complete payment:

### Step 1: Click on an Order
- Click on the **Order ID** (e.g., `order_S0ZEAJshPqqp5j`) in the table
- This will open the order details page

### Step 2: Look for Payment Actions
On the order details page, you should see:

**Option A: "Capture Payment" Button**
- If the order has a payment attempt, you'll see a "Capture Payment" button
- Click it to capture the ₹1 payment

**Option B: "Mark as Paid" Option**
- Look for a dropdown menu or "More Actions" button
- Select "Mark as Paid" to simulate successful payment

**Option C: Manual Payment Simulation**
- In test mode, you can manually trigger payment success
- Look for "Simulate Payment" or similar options

### Step 3: Alternative - Use Payment Links
If the above options don't work:

1. Go to **"Payment Links"** in the left menu
2. Create a new payment link for ₹1
3. Use the generated link to complete payment
4. This will create a real payment record

### Step 4: Check Payment Status
After completing payment:
- The order status should change from "Created" to "Paid"
- A payment record will be created
- Your backend webhook will be triggered automatically

### Current Orders to Complete:
- `order_S0ZEAJshPqqp5j` - ₹1.00 (test order)
- `order_S0Z8y03ZW79UYZ` - ₹1.00 (test order)

### If You Can't Find the Option:
1. Make sure you're in **Test Mode** (not Live Mode)
2. Try refreshing the page
3. Contact Razorpay support for test mode assistance

### Test Card Details (for future use):
- **Card Number**: 4111 1111 1111 1111
- **Expiry**: 12/25
- **CVV**: 123
- **Name**: Test User

Once payment is completed, your backend will automatically:
- ✅ Activate the subscription
- ✅ Add credits to user account
- ✅ Create transaction record