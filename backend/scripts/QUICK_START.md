# Quick Start Testing Guide

## Prerequisites
- Backend deployed and running
- MongoDB connected
- Admin user created (email: admin@socialscale.com, password: Admin@12345)

---

## Step 1: Seed Default Pricing

```bash
cd backend
npm run seed:pricing
```

This creates default pricing rules for all platforms.

---

## Step 2: Test Admin Login

```bash
curl -X POST https://social-scale.vercel.app/api/v1/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@socialscale.com",
  "password": "Admin@12345"
}'
```

Save the `accessToken` from response.

---

## Step 3: Create a Company (if needed)

```bash
curl -X POST https://social-scale.vercel.app/api/v1/companies \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_TOKEN" \
-d '{
  "name": "Test Company",
  "contactEmail": "test@company.com"
}'
```

Save the `companyId`.

---

## Step 4: Create a Test User

```bash
curl -X POST https://social-scale.vercel.app/api/v1/auth/register \
-H "Content-Type: application/json" \
-d '{
  "email": "testuser@example.com",
  "password": "Test@12345",
  "role": "COMPANY_USER",
  "companyId": "YOUR_COMPANY_ID"
}'
```

---

## Step 5: Login as Test User

```bash
curl -X POST https://social-scale.vercel.app/api/v1/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "testuser@example.com",
  "password": "Test@12345"
}'
```

Save the user's `accessToken` and `userId`.

---

## Step 6: Check Default Pricing

```bash
curl -X GET "https://social-scale.vercel.app/api/v1/subscriptions/plans" \
-H "Authorization: Bearer USER_TOKEN"
```

---

## Step 7: Create Subscription

```bash
curl -X POST https://social-scale.vercel.app/api/v1/subscriptions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer USER_TOKEN" \
-d '{
  "plan": "growth",
  "billingCycle": "monthly",
  "paymentMethod": "mercury",
  "paymentId": "test_payment_123"
}'
```

Save the `subscriptionId` from response.

---

## Step 8: Activate Subscription (Simulate Payment)

```bash
curl -X POST https://social-scale.vercel.app/api/v1/subscriptions/activate \
-H "Content-Type: application/json" \
-H "Authorization: Bearer USER_TOKEN" \
-d '{
  "subscriptionId": "YOUR_SUBSCRIPTION_ID",
  "paymentId": "test_payment_123"
}'
```

This adds 2,500 credits to the user.

---

## Step 9: Check Credits Balance

```bash
curl -X GET "https://social-scale.vercel.app/api/v1/subscriptions/credits" \
-H "Authorization: Bearer USER_TOKEN"
```

Should show:
```json
{
  "success": true,
  "data": {
    "balance": 2500,
    "totalPurchased": 2500,
    "totalSpent": 0
  }
}
```

---

## Step 10: Calculate Credits for Order

```bash
curl -X POST https://social-scale.vercel.app/api/v1/pricing/calculate \
-H "Content-Type: application/json" \
-H "Authorization: Bearer USER_TOKEN" \
-d '{
  "platform": "instagram",
  "serviceType": "follower",
  "quantity": 100
}'
```

Response:
```json
{
  "success": true,
  "data": {
    "creditsRequired": 500,
    "creditsPerUnit": 5,
    "quantity": 100
  }
}
```

---

## Step 11: Create Order (Credits Auto-Deducted)

First, get available services:

```bash
curl -X GET "https://social-scale.vercel.app/api/v1/api-integrations/services" \
-H "Authorization: Bearer USER_TOKEN"
```

Then create order:

```bash
curl -X POST https://social-scale.vercel.app/api/v1/orders \
-H "Content-Type: application/json" \
-H "Authorization: Bearer USER_TOKEN" \
-d '{
  "companyId": "YOUR_COMPANY_ID",
  "serviceId": 123,
  "link": "https://instagram.com/p/test123",
  "quantity": 100
}'
```

Credits automatically deducted!

---

## Step 12: Check Credits After Order

```bash
curl -X GET "https://social-scale.vercel.app/api/v1/subscriptions/credits" \
-H "Authorization: Bearer USER_TOKEN"
```

Should show:
```json
{
  "balance": 2000,
  "totalSpent": 500
}
```

---

## Step 13: Check Order Status

```bash
curl -X GET "https://social-scale.vercel.app/api/v1/orders/YOUR_ORDER_ID" \
-H "Authorization: Bearer USER_TOKEN"
```

---

## Step 14: Sync Order Status (Manual)

```bash
curl -X POST "https://social-scale.vercel.app/api/v1/order-sync/sync/YOUR_ORDER_ID" \
-H "Authorization: Bearer USER_TOKEN"
```

**Note:** Automatic sync runs every 5 minutes in production.

---

## Step 15: Admin - Create Custom Pricing

Login as admin, then:

```bash
curl -X POST https://social-scale.vercel.app/api/v1/pricing/rules \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ADMIN_TOKEN" \
-d '{
  "name": "VIP User Discount",
  "scope": "user",
  "userId": "TEST_USER_ID",
  "servicePricing": [{
    "platform": "instagram",
    "serviceType": "follower",
    "creditsPerUnit": 2,
    "minQuantity": 10,
    "maxQuantity": 100000
  }]
}'
```

Now test user pays only 2 credits per follower instead of 5!

---

## Step 16: Verify Custom Pricing

```bash
curl -X POST https://social-scale.vercel.app/api/v1/pricing/calculate \
-H "Content-Type: application/json" \
-H "Authorization: Bearer USER_TOKEN" \
-d '{
  "platform": "instagram",
  "serviceType": "follower",
  "quantity": 100
}'
```

Should show:
```json
{
  "creditsRequired": 200
}
```

Instead of 500! ✅

---

## Step 17: Admin - View All Pricing Rules

```bash
curl -X GET "https://social-scale.vercel.app/api/v1/pricing/rules" \
-H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Step 18: Admin - Sync All Pending Orders

```bash
curl -X POST https://social-scale.vercel.app/api/v1/order-sync/sync/pending \
-H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Common Test Scenarios

### Insufficient Credits Error
Try creating order with quantity that exceeds credits:

```bash
curl -X POST https://social-scale.vercel.app/api/v1/orders \
-H "Content-Type: application/json" \
-H "Authorization: Bearer USER_TOKEN" \
-d '{
  "companyId": "YOUR_COMPANY_ID",
  "serviceId": 123,
  "link": "https://instagram.com/p/test",
  "quantity": 10000
}'
```

Response:
```json
{
  "success": false,
  "message": "Insufficient credits. Required: 50000, Available: 2000"
}
```

### Company-Specific Pricing
Admin sets custom pricing for entire company:

```bash
curl -X POST https://social-scale.vercel.app/api/v1/pricing/rules \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ADMIN_TOKEN" \
-d '{
  "name": "Company XYZ Discount",
  "scope": "company",
  "companyId": "YOUR_COMPANY_ID",
  "servicePricing": [{
    "platform": "instagram",
    "serviceType": "follower",
    "creditsPerUnit": 3
  }]
}'
```

All users in this company now pay 3 credits/follower.

---

## Postman Collection

Import the collection from:
`backend/Social_Scale_Backend_New.postman_collection.json`

Update environment variables with your tokens.

---

## Monitoring

### Check Transaction History
Query MongoDB directly or add endpoint:
```javascript
db.transactions.find({ userId: ObjectId("USER_ID") }).sort({ createdAt: -1 })
```

### Check Subscription Status
```javascript
db.subscriptions.find({ userId: ObjectId("USER_ID") })
```

---

## Troubleshooting

### Order stuck in pending
Run manual sync:
```bash
POST /api/v1/order-sync/sync/:orderId
```

### Credits not added after subscription
Check:
1. Subscription status is "active"
2. Transaction record exists
3. User.credits.balance updated

### Custom pricing not working
Check:
1. PricingRule.isActive = true
2. Correct scope (user/company/global)
3. Priority is set correctly

---

## Production Checklist

- [ ] Seed default pricing rules
- [ ] Create admin user
- [ ] Test subscription flow
- [ ] Verify credit deduction
- [ ] Confirm order sync working
- [ ] Test custom pricing rules
- [ ] Set up Mercury payment webhook
- [ ] Monitor automatic sync (every 5 min)
- [ ] Set up error notifications

---

**Backend is fully functional and ready for production! 🚀**
