# Social Scale Backend - Complete Feature Guide

## Overview
This backend now includes a complete credit-based subscription system with admin-controlled pricing, payment integration, and automatic order status synchronization.

## New Features Implemented

### 1. Credit System
- Users have credit balances (credits.balance)
- Credits are purchased through subscriptions
- Credits are automatically deducted when creating orders
- Transaction history tracks all credit movements

### 2. Subscription Plans
- **Free Plan**: 0 credits, $0/month
- **Growth Plan**: 2,500 credits, $29/month (customizable)
- **Enterprise Plan**: 10,000 credits, $99/month (customizable)

### 3. Dynamic Pricing System (Admin Control)
Admins can set pricing at three levels:
- **Global**: Default pricing for all users
- **Company**: Company-specific pricing overrides global
- **User**: User-specific pricing overrides company and global

### 4. Order Status Synchronization
- Automatic sync with Fampay API every 5 minutes
- Manual sync endpoints for individual or bulk orders
- Updates order status: pending → in_progress → completed

### 5. Payment Gateway Integration (Mercury Ready)
- Subscription payment workflow
- Webhook support for payment activation
- Transaction tracking

---

## API Endpoints

### Authentication
All endpoints require authentication via JWT token in header:
```
Authorization: Bearer <token>
```

### Subscriptions

#### Get Pricing Plans
```http
GET /api/v1/subscriptions/plans
GET /api/v1/subscriptions/plans?plan=growth
```
Returns available subscription plans with pricing.

#### Get User Credits Balance
```http
GET /api/v1/subscriptions/credits
```
Returns:
```json
{
  "success": true,
  "data": {
    "balance": 2500,
    "totalPurchased": 5000,
    "totalSpent": 2500,
    "subscription": {
      "plan": "growth",
      "status": "active",
      "startDate": "2026-01-01",
      "endDate": "2026-02-01"
    }
  }
}
```

#### Create Subscription
```http
POST /api/v1/subscriptions
Content-Type: application/json

{
  "plan": "growth",
  "billingCycle": "monthly",
  "paymentMethod": "mercury",
  "paymentId": "pay_xyz123"
}
```

#### Activate Subscription (Webhook)
```http
POST /api/v1/subscriptions/activate
Content-Type: application/json

{
  "subscriptionId": "65abc123...",
  "paymentId": "pay_xyz123"
}
```
This adds credits to the user's account.

#### Get User Subscriptions
```http
GET /api/v1/subscriptions?page=1&limit=10&status=active
```

#### Cancel Subscription
```http
DELETE /api/v1/subscriptions/:id
```

---

### Pricing Management (Admin Only)

#### Create Pricing Rule
```http
POST /api/v1/pricing/rules
Content-Type: application/json

{
  "name": "VIP User Pricing",
  "description": "Special pricing for VIP users",
  "scope": "user",
  "userId": "65abc123...",
  "servicePricing": [
    {
      "platform": "instagram",
      "serviceType": "follower",
      "creditsPerUnit": 3,
      "minQuantity": 10,
      "maxQuantity": 100000
    }
  ],
  "subscriptionPlans": [
    {
      "plan": "growth",
      "credits": 5000,
      "price": 29,
      "currency": "USD",
      "billingCycle": "monthly"
    }
  ]
}
```

**Scope Options:**
- `global`: Applies to all users (default)
- `company`: Applies to specific company (requires `companyId`)
- `user`: Applies to specific user (requires `userId`)

#### Update Pricing Rule
```http
PUT /api/v1/pricing/rules/:id
Content-Type: application/json

{
  "servicePricing": [
    {
      "platform": "instagram",
      "serviceType": "follower",
      "creditsPerUnit": 2
    }
  ]
}
```

#### Get Pricing Rules
```http
GET /api/v1/pricing/rules
GET /api/v1/pricing/rules?scope=global
GET /api/v1/pricing/rules?companyId=comp_123
GET /api/v1/pricing/rules?userId=65abc123
GET /api/v1/pricing/rules?isActive=true
```

#### Delete Pricing Rule
```http
DELETE /api/v1/pricing/rules/:id
```

#### Calculate Credits for Order
```http
POST /api/v1/pricing/calculate
Content-Type: application/json

{
  "platform": "instagram",
  "serviceType": "follower",
  "quantity": 1000
}
```
Returns:
```json
{
  "success": true,
  "data": {
    "creditsRequired": 5000,
    "creditsPerUnit": 5,
    "quantity": 1000,
    "platform": "instagram",
    "serviceType": "follower"
  }
}
```

#### Get User's Effective Pricing
```http
GET /api/v1/pricing/user/:userId
GET /api/v1/pricing/user (gets current user's pricing)
```

---

### Order Status Synchronization

#### Sync Single Order
```http
POST /api/v1/order-sync/sync/:orderId
```

#### Sync Multiple Orders (Admin Only)
```http
POST /api/v1/order-sync/sync/multiple
Content-Type: application/json

{
  "orderIds": ["65abc123...", "65def456..."]
}
```

#### Sync All Pending Orders (Admin Only)
```http
POST /api/v1/order-sync/sync/pending
```
Syncs all orders with status "pending" or "in_progress".

---

### Updated Order Creation

Orders now automatically deduct credits:

```http
POST /api/v1/orders
Content-Type: application/json

{
  "companyId": "comp_123",
  "serviceId": 123,
  "link": "https://instagram.com/p/abc123",
  "quantity": 1000
}
```

Response includes credits deducted:
```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "companyId": "comp_123",
    "quantity": 1000,
    "creditsUsed": 5000,
    "status": "pending",
    ...
  }
}
```

**Error if insufficient credits:**
```json
{
  "success": false,
  "message": "Insufficient credits. Required: 5000, Available: 2500"
}
```

---

## Admin Capabilities

### Setting Custom Pricing

**Example 1: Give a specific user cheaper Instagram followers**
```http
POST /api/v1/pricing/rules
{
  "name": "User ABC - Discounted Instagram",
  "scope": "user",
  "userId": "65abc123",
  "servicePricing": [
    {
      "platform": "instagram",
      "serviceType": "follower",
      "creditsPerUnit": 2
    }
  ]
}
```
Now this user pays 2 credits/follower instead of default 5.

**Example 2: Give a company custom subscription pricing**
```http
POST /api/v1/pricing/rules
{
  "name": "Company XYZ - Custom Plan",
  "scope": "company",
  "companyId": "comp_xyz",
  "subscriptionPlans": [
    {
      "plan": "growth",
      "credits": 5000,
      "price": 29
    }
  ]
}
```
This company gets 5000 credits for $29 instead of default 2500.

---

## Database Models

### User Model (Updated)
```javascript
{
  email: String,
  password: String,
  role: String, // SUPER_ADMIN, COMPANY_ADMIN, COMPANY_USER
  companyId: String,
  credits: {
    balance: Number,
    totalPurchased: Number,
    totalSpent: Number
  },
  subscription: {
    plan: String,
    status: String,
    startDate: Date,
    endDate: Date,
    autoRenew: Boolean
  },
  status: String
}
```

### Subscription Model
```javascript
{
  userId: ObjectId,
  companyId: String,
  plan: String,
  credits: Number,
  price: Number,
  currency: String,
  billingCycle: String,
  status: String,
  startDate: Date,
  endDate: Date,
  autoRenew: Boolean,
  paymentMethod: String,
  paymentId: String
}
```

### Transaction Model
```javascript
{
  userId: ObjectId,
  companyId: String,
  type: String, // credit_purchase, credit_deduction, credit_refund
  amount: Number,
  credits: Number,
  balanceBefore: Number,
  balanceAfter: Number,
  status: String,
  paymentMethod: String,
  paymentId: String,
  orderId: ObjectId,
  subscriptionId: ObjectId
}
```

### PricingRule Model
```javascript
{
  name: String,
  description: String,
  scope: String, // global, company, user
  companyId: String,
  userId: ObjectId,
  servicePricing: [{
    platform: String,
    serviceType: String,
    creditsPerUnit: Number,
    minQuantity: Number,
    maxQuantity: Number
  }],
  subscriptionPlans: [{
    plan: String,
    credits: Number,
    price: Number,
    currency: String,
    billingCycle: String
  }],
  isActive: Boolean,
  priority: Number
}
```

### Order Model (Updated)
```javascript
{
  companyId: String,
  userId: ObjectId,
  providerId: ObjectId,
  serviceId: Number,
  serviceName: String,
  serviceType: String,
  targetUrl: String,
  quantity: Number,
  cost: Number,
  creditsUsed: Number,
  status: String,
  apiOrderId: String,
  ...
}
```

---

## Setup Instructions

### 1. Seed Default Pricing
```bash
cd backend
node scripts/seed-pricing.js
```

### 2. Environment Variables
No new environment variables needed. Uses existing:
- `DATABASE_URL`
- `JWT_SECRET`
- etc.

### 3. Automatic Order Sync
The order sync runs automatically every 5 minutes in production. No manual setup needed.

---

## Testing Workflow

### 1. Create Admin User (if not exists)
```bash
node scripts/seed.js
```

### 2. Login as Admin
```http
POST /api/v1/auth/login
{
  "email": "admin@socialscale.com",
  "password": "Admin@12345"
}
```

### 3. Check Default Pricing
```http
GET /api/v1/pricing/rules?scope=global
```

### 4. Create a Test User Subscription
```http
POST /api/v1/subscriptions
{
  "plan": "growth",
  "paymentMethod": "mercury",
  "paymentId": "test_payment_123"
}
```

### 5. Activate Subscription (Simulate Payment Webhook)
```http
POST /api/v1/subscriptions/activate
{
  "subscriptionId": "<subscription_id>",
  "paymentId": "test_payment_123"
}
```

### 6. Check Credits
```http
GET /api/v1/subscriptions/credits
```
Should show 2500 credits.

### 7. Create an Order
```http
POST /api/v1/orders
{
  "companyId": "<company_id>",
  "serviceId": 123,
  "link": "https://instagram.com/p/test",
  "quantity": 100
}
```
Credits will be automatically deducted.

### 8. Sync Order Status
```http
POST /api/v1/order-sync/sync/<order_id>
```

---

## Priority & Pricing Resolution

When a user creates an order, the system checks pricing rules in this order:
1. **User-specific** (priority 20)
2. **Company-specific** (priority 10)
3. **Global** (priority 0)

The highest priority rule is used.

---

## Default Service Pricing

| Platform  | Service   | Credits/Unit | Min Qty | Max Qty   |
|-----------|-----------|--------------|---------|-----------|
| Instagram | Follower  | 5            | 10      | 100,000   |
| Instagram | Like      | 0.2          | 10      | 100,000   |
| LinkedIn  | Follower  | 20           | 10      | 50,000    |
| LinkedIn  | Like      | 10           | 5       | 10,000    |
| YouTube   | Subscribe | 10           | 10      | 100,000   |
| TikTok    | Follower  | 5            | 10      | 100,000   |

---

## Payment Integration (Mercury)

### Webhook Flow:
1. User selects plan and initiates payment
2. Frontend calls `POST /api/v1/subscriptions` (status: pending)
3. Frontend redirects to Mercury payment page
4. Mercury processes payment
5. Mercury calls webhook: `POST /api/v1/subscriptions/activate`
6. Backend adds credits to user account
7. User can now create orders

---

## Notes

- Order status sync runs automatically every 5 minutes
- Credits are calculated dynamically based on pricing rules
- All transactions are logged for audit purposes
- Admin can change pricing anytime without code changes
- Supports Mercury, Stripe, and manual payment methods

---

## Support

For issues or questions, check logs in production or contact the development team.
