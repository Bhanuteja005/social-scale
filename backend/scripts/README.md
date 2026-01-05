# Test Scripts

This folder contains scripts for testing and seeding the Social Scale Backend.

## Available Scripts

### 1. Seed Database (`seed.js`)

Seeds the database with initial data:
- Creates a SUPER_ADMIN user
- Creates a test company

**Usage:**
```bash
node scripts/seed.js
```

**Default Credentials:**
- Email: `admin@socialscale.com`
- Password: `Admin@12345`

### 2. API Test Suite (`test-api.js`)

Comprehensive end-to-end test of the Fampay integration.

**Tests Include:**
1. ✅ Login as SUPER_ADMIN
2. ✅ Get Companies List
3. ✅ Check Fampay Balance
4. ✅ Get Fampay Services
5. ⚠️  Create Order (Disabled by default - uncomment to enable)
6. ✅ Check Order Status
7. ✅ Get All Orders
8. ✅ Get Analytics Dashboard

**Usage:**
```bash
# Make sure the server is running first
npm run dev

# In another terminal, run the tests
node scripts/test-api.js
```

**Important Notes:**
- Test 5 (Create Order) is commented out by default to prevent accidental charges
- Uncomment the code in `test5_CreateOrder()` to enable real order creation
- Make sure you have sufficient Fampay balance before creating orders
- Update the service ID, link, and quantity in the test to match your requirements

## Quick Start Guide

### 1. Setup Database
```bash
# Seed the database with initial data
node scripts/seed.js
```

### 2. Start Server
```bash
# Start in development mode
npm run dev
```

### 3. Run Tests
```bash
# In a new terminal
node scripts/test-api.js
```

## Environment Variables Required

Make sure your `.env` file contains:
```
DATABASE_URL=your_mongodb_connection_string
FAMPAGE_API_KEY=your_fampage_api_key
FAMPAGE_BASE_URL=https://fampage.in/api/v2
JWT_SECRET=your_jwt_secret
```

## Manual Testing with Postman

Alternatively, you can use the provided Postman collection:
- `Social_Scale_Backend_New.postman_collection.json`
- `Social_Scale_Backend_New.postman_environment.json`

Import these into Postman for manual testing.
