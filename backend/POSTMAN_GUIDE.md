# Postman Collection Guide

## 📥 Import Instructions

1. **Import Collection**

   - Open Postman
   - Click **Import** button
   - Select `Social_Scale_Backend_New.postman_collection.json`
   - Collection will be imported with all folders

2. **Import Environment (Optional but Recommended)**
   - Click **Import** button
   - Select `Social_Scale_Backend_New.postman_environment.json`
   - Select the environment from the dropdown (top right)
   - Environment variables will be automatically managed

## 📁 Collection Structure

The collection is organized into the following folders:

### 1. **Authentication** 🔐

- Register First SUPER_ADMIN (one-time setup)
- Login (SUPER_ADMIN only)
- Refresh Token
- Get Current User
- Change Password
- Forgot Password
- Reset Password

**Note:**

- **Only SUPER_ADMIN can log in** - There is only one admin account
- **No user creation** - No additional users are created with passwords
- Companies are created for tracking purposes only, NOT for authentication

### 2. **Companies** 🏢

- Create Company (Public - no auth required)
- Get All Companies (SUPER_ADMIN only)
- Get Company by ID (SUPER_ADMIN only)
- Update Company (SUPER_ADMIN only)
- Delete Company (SUPER_ADMIN only)
- Restore Company (SUPER_ADMIN only)

**Note:** Companies are created for tracking and organization purposes only. No company-based authentication exists.

### 3. **Fampage API Integration** 🔌

**Note:** Fampage provider is automatically managed from environment configuration. No provider CRUD operations needed.

- Get Services (Fampage - SUPER_ADMIN only)
  - Returns services categorized by network (Instagram, TikTok, etc.)
  - Optional filters: `network`, `minRate`, `maxRate`, `minQuantity`, `maxQuantity`
- Create Order (Fampage - SUPER_ADMIN only)
  - Creates order in Fampage API
  - Automatically creates internal Order record and Invoice
  - Optional: `invoiceMultiplier` (default 8x)
- Get Order Status (Fampage - SUPER_ADMIN only)
  - Gets status of single order from Fampage
  - Uses Fampage order ID (integer)
- Get Orders Status (Fampage - SUPER_ADMIN only)
  - Gets status of multiple orders (comma-separated IDs)
- Refill Order (Fampage - SUPER_ADMIN only)
- Get Balance (Fampage - SUPER_ADMIN only)
- Cancel Order (Fampage - SUPER_ADMIN only)
- Get Integration Logs (SUPER_ADMIN only)

### 4. **Orders** 📦

- Create Order (SUPER_ADMIN only)
- Get All Orders (SUPER_ADMIN only)
- Get Order Statistics (SUPER_ADMIN only)
- Get Company Orders (SUPER_ADMIN only)
- Get Order by ID (SUPER_ADMIN only)
- Update Order Status (SUPER_ADMIN only)
- Update Order Stats (SUPER_ADMIN only)

### 5. **Invoices** 🧾

- Create Invoice for Order (SUPER_ADMIN only)
- Get All Invoices (SUPER_ADMIN only)
- Get Company Invoices (SUPER_ADMIN only)
- Get Invoice by ID (SUPER_ADMIN only)
- Update Invoice Status (SUPER_ADMIN only)

### 6. **Analytics** 📊

- Get Company Analytics (SUPER_ADMIN only)
- Get Statistics Summary (SUPER_ADMIN only)
- Get Order Details by Target URL (SUPER_ADMIN only)
- Get Company Order History (SUPER_ADMIN only)

### 7. **Health Check** 🏥

- Health Check

## 🔧 Environment Variables

The collection uses the following variables (automatically set via tests):

| Variable         | Description                                   | Auto-set?                       |
| ---------------- | --------------------------------------------- | ------------------------------- |
| `baseUrl`        | Base API URL (default: http://localhost:3000) | Manual                          |
| `accessToken`    | JWT Access Token                              | ✅ Yes (after login/register)   |
| `refreshToken`   | JWT Refresh Token                             | ✅ Yes (after login/register)   |
| `companyId`      | Company ID                                    | ✅ Yes (after creating company) |
| `fampageOrderId` | Fampage API Order ID (integer)                | ✅ Yes (after creating order)   |
| `orderId`        | Internal Order ID                             | ✅ Yes (after creating order)   |
| `invoiceId`      | Invoice ID                                    | ✅ Yes (after creating invoice) |
| `resetToken`     | Password Reset Token                          | Manual                          |
| `userEmail`      | User email for login                          | Manual                          |
| `userPassword`   | User password for login                       | Manual                          |

## 🚀 Quick Start Workflow

### 1. Setup

- Import collection and environment
- Ensure `baseUrl` is set correctly (default: `http://localhost:3000`)

### 2. Authentication Flow

```
1. Register First SUPER_ADMIN (one-time setup)
   → Auto-saves accessToken and refreshToken
   → This is the ONLY user account in the system

2. Login (SUPER_ADMIN only)
   → Auto-saves accessToken and refreshToken

3. Get Current User (to verify authentication)
```

**Important:** No other users are created. The system only has one SUPER_ADMIN account.

### 3. Create Resources

```
1. Create Company (Public - no auth required)
   → Companies are created for tracking orders and generating analytics ONLY
   → Companies do NOT have login credentials
   → Auto-saves companyId

2. Get Services List (SUPER_ADMIN only)
   → View available Fampage services by network
   → Optional: Filter by network, price range, quantity range

3. Create Order via Fampage API (SUPER_ADMIN only)
   → Requires: companyId, service, link, quantity
   → Optional: invoiceMultiplier (default 8x)
   → Automatically creates internal Order record and Invoice
   → Auto-saves fampageOrderId, orderId, and invoiceId

4. Check Order Status (SUPER_ADMIN only)
   → Updates internal order with latest status from Fampage
   → Uses fampageOrderId (Fampage API order ID)

5. View Analytics (SUPER_ADMIN only)
   → Get company analytics with profit calculations
   → Get order history and statistics
```

### 4. Test Other Endpoints

- All other endpoints will use the auto-saved IDs
- You can manually update variables if needed

## ✨ Auto-Save Feature

The collection includes **test scripts** that automatically save response data:

- **Login/Register** → Saves `accessToken` and `refreshToken`
- **Create Company** → Saves `companyId` (for tracking purposes)
- **Create Order (Fampage)** → Saves `fampageOrderId`, `orderId`, and `invoiceId`
- **Create Invoice** → Saves `invoiceId` (if created separately)

## 📝 Manual Setup (Without Environment)

If you don't use the environment file:

1. Go to **Collection Variables** (click collection → Variables tab)
2. Set `baseUrl` to your API URL
3. After login/register, copy the `accessToken` from response
4. Set it in the `accessToken` variable
5. Use the token in subsequent requests

## 🔄 Using Refresh Token

1. Token expires (15 minutes default)
2. Use **Refresh Token** endpoint
3. New `accessToken` is auto-saved
4. Continue using the API

## 🧪 Testing Tips

1. **Run in Sequence**: Some requests depend on previous ones
2. **Check Auto-Saved Variables**: Look at environment after each request
3. **Update Variables Manually**: If auto-save doesn't work, update manually
4. **Use Collection Runner**: Run entire folders in sequence for testing

## 📋 Common Scenarios

### Scenario 1: First Time Setup

```
1. Register First SUPER_ADMIN (one-time setup)
   → Auto-saves accessToken and refreshToken

2. Create Company (Public - no auth required)
   → Companies are created for tracking orders and analytics
   → Auto-saves companyId
   → Note: Companies are NOT used for authentication/login
```

### Scenario 2: Create Order and Generate Invoice

```
1. Login as SUPER_ADMIN
2. Create Company (if needed, public endpoint)
   → Auto-saves companyId
3. Get Services List (to see available Fampage services by network)
4. Create Order via Fampage API
   → Requires: companyId, service, link, quantity
   → Optional: invoiceMultiplier (default 8x)
   → Automatically creates internal Order and Invoice
   → Auto-saves fampageOrderId, orderId, and invoiceId
5. Check Order Status
   → Uses fampageOrderId to get status from Fampage
   → Updates internal order record
6. Download Invoice PDF
7. Get Company Analytics (with profit calculations)
```

### Scenario 3: Track Order Progress

```
1. Login as SUPER_ADMIN
2. Get Order Status (updates order in database)
3. Update Order Stats (before/after counts)
4. Get Company Order History
5. Get Statistics Summary
```

### Scenario 4: Password Reset Flow

```
1. Forgot Password (get resetToken)
2. Copy resetToken from response
3. Reset Password with token
```

## 🐛 Troubleshooting

### Token Expired

- Use **Refresh Token** endpoint
- Or login again

### Missing Variables

- Check environment variables
- Manually set IDs from previous responses

### 401 Unauthorized

- Ensure `accessToken` is set
- Check if token expired (refresh or re-login)
- Verify Authorization header is present

### 403 Forbidden

- Check user role permissions
- **All management endpoints require SUPER_ADMIN** (except company creation which is public)
- Ensure you're logged in as SUPER_ADMIN user

### Missing companyId in Order Creation

- When creating orders via Fampage API, you must provide `companyId` in the request body
- Use the `companyId` variable that was auto-saved when creating a company

## 📚 Additional Resources

- See `README.md` for detailed API documentation
- All endpoints are documented with examples
- Check validation requirements in README

## 🎯 Collection Runner

To test complete flows:

1. Right-click on a folder
2. Select **Run folder**
3. Configure iterations
4. View test results

This is useful for:

- Testing complete authentication flow
- Testing company creation workflow
- Testing order creation and invoice generation flow
- Testing analytics and reporting with profit calculations

## 🔑 Important Notes

### Authentication Model

- **Only SUPER_ADMIN can log in** - There is only one admin account in the system
- **No user creation with passwords** - The system does not create additional users
- **No company-based authentication** - Companies are created for tracking purposes only
- **Companies do NOT have login credentials** - They are purely for data organization and analytics
- Company creation is **public** (no authentication required) - used for organizing orders by company
- All management operations require **SUPER_ADMIN authentication**

### Order Creation Workflow

1. **Create Company** (public endpoint - for tracking purposes)
   - Companies are used for internal tracking only, no login required
2. **Get Services List** to see available Fampage services (categorized by network)
   - Filter by network, price range, or quantity range as needed
3. **Create Order via Fampage API** with:
   - `companyId` (from step 1)
   - `service` (service ID from services list)
   - `link` (target URL - e.g., instagram.com/account - no need to pre-register accounts)
   - `quantity` (number of followers/likes/etc.)
   - `invoiceMultiplier` (optional, default 8x for pricing)
   - This automatically creates internal Order record and Invoice
   - Returns: Fampage order ID, internal order ID, and invoice details
4. **Check Order Status** to track progress (uses Fampage order ID)
   - Updates internal order record with latest status from Fampage
5. **Download Invoice PDF** when needed
6. **View Analytics** to see profit calculations (real cost vs revenue)
   - Analytics show real cost (paid to Fampage) vs revenue (charged to customers)
   - Detailed analytics include profit and profit margin calculations

### Company-Based Tracking

- Companies are created for **tracking and organization purposes only**
- All orders are associated with a `companyId` for analytics and reporting
- Analytics are organized by company to track usage per company
- Invoices are generated per order per company
- Use company `notes` field to track company-specific information
- **Companies do NOT have login credentials** - they are purely for data organization

---

**Happy Testing! 🚀**
