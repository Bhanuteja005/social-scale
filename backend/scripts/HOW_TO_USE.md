# How to Increase Instagram Followers - Step by Step Guide

This guide shows you exactly how to use the system to increase Instagram followers (or any other social metric).

## Prerequisites

✅ Server is running (`npm run dev`)  
✅ Database is seeded (`npm run seed`)  
✅ You have Fampay balance (₹16.61 INR available)

## Step 1: Login and Get Access Token

**Request:**
```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@socialscale.com",
  "password": "Admin@12345"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "email": "admin@socialscale.com",
      "role": "SUPER_ADMIN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the accessToken** - you'll need it for all subsequent requests!

---

## Step 2: Get Your Company ID

**Request:**
```bash
GET http://localhost:3000/api/v1/companies
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "companyId": "e6972aee-388f-4d01-b965-7ba1385880f1",
        "name": "Test Company",
        "status": "active"
      }
    ]
  }
}
```

**Save the companyId** - you'll need it for creating orders!

---

## Step 3: Browse Available Instagram Services

**Request:**
```bash
GET http://localhost:3000/api/v1/api-integrations/services?network=Instagram
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (Sample):**
```json
{
  "success": true,
  "data": {
    "categorized": [
      {
        "network": "Instagram",
        "services": [
          {
            "service": 1680,
            "name": "Foreign Story Views",
            "type": "Default",
            "rate": "18.6640",
            "min": 100,
            "max": 15000,
            "refill": false,
            "cancel": true
          },
          {
            "service": 2313,
            "name": "Instagram Followers [ 50K Pack ] [ Lifetime Refill ]",
            "type": "Package Regular",
            "rate": "7270.3112",
            "min": 50000,
            "max": 50000,
            "refill": true,
            "cancel": false
          }
          // ... 100+ more Instagram services
        ]
      }
    ],
    "total": 423
  }
}
```

**Pick a service:**
- Note the `service` ID (e.g., 1680)
- Check the `min` and `max` quantity
- Check the `rate` (price per 1000 units)
- Note if `refill` is available

---

## Step 4: Check Your Balance (Optional but Recommended)

**Request:**
```bash
GET http://localhost:3000/api/v1/api-integrations/balance
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": "16.6132",
    "currency": "INR"
  }
}
```

**Current Balance:** ₹16.61 INR ✅

---

## Step 5: Create Order to Increase Followers

**Example: Add 100 Instagram Followers**

**Request:**
```bash
POST http://localhost:3000/api/v1/api-integrations/orders
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "companyId": "e6972aee-388f-4d01-b965-7ba1385880f1",
  "service": 1680,
  "link": "https://www.instagram.com/your_instagram_username/",
  "quantity": 100,
  "serviceName": "Instagram Followers",
  "serviceType": "follow",
  "invoiceMultiplier": 8
}
```

**Important Parameters:**
- `service`: Service ID from services list (1680 in this example)
- `link`: Your Instagram profile URL (must be public!)
- `quantity`: Number of followers (must be between service min/max)
- `invoiceMultiplier`: Markup for invoice (8 = 8x cost)

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully and invoice generated",
  "data": {
    "order": 123456
  },
  "apiOrderId": 123456,
  "orderId": "69527fab123...",
  "order": {
    "_id": "69527fab123...",
    "companyId": "e6972aee-388f-4d01-b965-7ba1385880f1",
    "apiOrderId": "123456",
    "serviceName": "Instagram Followers",
    "serviceType": "follow",
    "targetUrl": "https://www.instagram.com/your_instagram_username/",
    "quantity": 100,
    "cost": 1.87,
    "status": "pending",
    "invoiceId": {
      "invoiceNumber": "INV-2025-0001",
      "total": 14.96,
      "status": "draft"
    }
  }
}
```

**What Just Happened:**
1. ✅ Order sent to Fampay
2. ✅ Order saved to database
3. ✅ Invoice auto-generated (₹1.87 × 8 = ₹14.96)
4. ✅ Fampay will start delivering followers to your Instagram!

**Save the apiOrderId (123456)** - you'll use this to check status!

---

## Step 6: Check Order Status

**Request:**
```bash
GET http://localhost:3000/api/v1/api-integrations/orders/123456/status
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Replace `123456` with your actual apiOrderId from Step 5.

**Response:**
```json
{
  "success": true,
  "data": {
    "charge": "1.87",
    "start_count": "1250",
    "status": "In progress",
    "remains": "42",
    "currency": "INR"
  },
  "order": {
    "_id": "69527fab123...",
    "status": "in_progress",
    "quantity": 100,
    "stats": {
      "startCount": 1250,
      "remains": 42,
      "charge": 1.87,
      "currency": "INR"
    }
  }
}
```

**Understanding the Status:**
- `status: "In progress"` - Order is being processed
- `start_count: 1250` - You had 1,250 followers when order started
- `remains: 42` - 42 followers still to be delivered
- `charge: 1.87` - Actual cost charged by Fampay

**Possible Statuses:**
- `In progress` - Followers being delivered
- `Completed` - All followers delivered ✅
- `Partial` - Only some followers delivered
- `Awaiting` - Waiting to start
- `Canceled` - Order was canceled
- `Fail` - Order failed

---

## Step 7: Monitor Progress

Keep checking the status every few minutes until it shows "Completed":

```bash
GET http://localhost:3000/api/v1/api-integrations/orders/123456/status
Authorization: Bearer YOUR_ACCESS_TOKEN
```

When `status: "Completed"` and `remains: 0`, all followers have been delivered! 🎉

---

## Step 8: View Your Orders

**Request:**
```bash
GET http://localhost:3000/api/v1/orders
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "69527fab123...",
      "companyId": "e6972aee-388f-4d01-b965-7ba1385880f1",
      "apiOrderId": "123456",
      "serviceName": "Instagram Followers",
      "serviceType": "follow",
      "targetUrl": "https://www.instagram.com/your_username/",
      "quantity": 100,
      "cost": 1.87,
      "status": "completed",
      "stats": {
        "startCount": 1250,
        "remains": 0,
        "charge": 1.87
      },
      "invoiceId": {
        "invoiceNumber": "INV-2025-0001",
        "total": 14.96,
        "status": "draft"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## Step 9: View Analytics

**Request:**
```bash
GET http://localhost:3000/api/v1/analytics/dashboard?companyId=e6972aee-388f-4d01-b965-7ba1385880f1
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 1,
    "totalSpent": 1.87,
    "totalInvoices": 1,
    "totalRevenue": 14.96,
    "totalProfit": 13.09,
    "completedOrders": 1,
    "pendingOrders": 0,
    "byServiceType": {
      "follow": {
        "count": 1,
        "quantity": 100,
        "spent": 1.87,
        "revenue": 14.96,
        "profit": 13.09
      }
    }
  }
}
```

**Your Profit:** ₹13.09 on this order! 💰

---

## Other Services You Can Use

### Instagram Services (100+ available):

**Followers:**
```json
{
  "service": 1680,
  "name": "Foreign Story Views",
  "min": 100,
  "max": 15000,
  "rate": "18.6640"
}
```

**Likes:**
```json
{
  "service": 2188,
  "name": "Instagram Custom Comments",
  "min": 5,
  "max": 1000,
  "rate": "1871.4636"
}
```

**Views:**
```json
{
  "service": 2313,
  "name": "Instagram Followers [ 50K Pack ]",
  "min": 50000,
  "max": 50000,
  "rate": "7270.3112"
}
```

### Facebook Services:
- Page likes
- Post likes
- Shares
- Comments
- Video views

### TikTok Services:
- Followers
- Likes
- Views
- Shares

### YouTube Services:
- Subscribers
- Views
- Likes
- Comments

**Total Available Services: 423+ across 17 networks!**

---

## Tips for Best Results

### 1. Start Small
- Test with minimum quantity first
- Verify service quality before ordering more
- Check if followers are retained

### 2. Check Refill Policy
- Some services have lifetime refill
- If followers drop, you can refill for free
- Check `refill: true` in service details

### 3. Monitor Your Account
- Instagram may detect sudden follower spikes
- Use gradual growth services when available
- Mix different service types for natural growth

### 4. Verify Target URL
- Ensure Instagram account is public
- Double-check username spelling
- Test with a small order first

### 5. Track Performance
- Use analytics to see ROI
- Compare different services
- Monitor completion rates

---

## Refilling Dropped Followers

If followers drop and service has `refill: true`:

**Request:**
```bash
POST http://localhost:3000/api/v1/api-integrations/orders/123456/refill
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "refill": 1
  },
  "refillId": 1
}
```

The system will automatically restore dropped followers!

---

## Canceling an Order

If order has `cancel: true` and is still pending:

**Request:**
```bash
POST http://localhost:3000/api/v1/api-integrations/orders/123456/cancel
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "ok": "true"
  }
}
```

---

## Troubleshooting

### Error: "insufficient_funds"
**Solution:** Add more balance to your Fampay account

### Error: "Invalid service ID"
**Solution:** Check the service ID from the services list

### Error: "Quantity out of range"
**Solution:** Check min/max for the service (e.g., min: 100, max: 15000)

### Error: "Invalid link"
**Solution:** 
- Ensure profile is public
- Use full URL: `https://www.instagram.com/username/`
- Check username is correct

### Order stuck in "Awaiting"
**Solution:** Wait 5-10 minutes, then check status again

### Followers not showing up
**Solution:** 
- Check order status (might still be in progress)
- Wait for "Completed" status
- Some services take 24-48 hours

---

## Cost Calculator

**Formula:** 
```
Total Cost = (Quantity / 1000) × Rate
Invoice Amount = Total Cost × Multiplier
Profit = Invoice Amount - Total Cost
```

**Example:**
- Service Rate: ₹18.66 per 1000
- Quantity: 100 followers
- Cost: (100 / 1000) × 18.66 = ₹1.87
- Invoice (8x): ₹1.87 × 8 = ₹14.96
- Profit: ₹14.96 - ₹1.87 = ₹13.09

---

## Ready to Start!

You now have everything you need to:
- ✅ Increase Instagram followers
- ✅ Boost engagement (likes, comments, views)
- ✅ Grow on 17+ social networks
- ✅ Track orders and analytics
- ✅ Generate automated invoices
- ✅ Calculate profits

**Current Status:**
- Server: ✅ Running
- Balance: ₹16.61 INR ✅
- Services: 423+ ✅
- System: 100% Operational ✅

**Start increasing your followers now! 🚀**
