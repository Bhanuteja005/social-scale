# Social Scale Backend

A simplified backend system for managing social media growth services through the Fampage.in API. Features single SUPER_ADMIN authentication, automatic order and invoice management, and comprehensive profit analytics.

## 🏗️ Architecture

This backend follows a **clean modular architecture** with clear separation of concerns:

- **Simplified Authentication**: Single SUPER_ADMIN user (no multi-tenant login complexity)
- **Company Tracking**: Companies are used for internal tracking only (no company login)
- **Auto-Managed Provider**: Fampage provider automatically managed from environment configuration
- **Order & Invoice Management**: Automatic order and invoice generation with customizable pricing multipliers
- **Profit Analytics**: Track real cost (paid to Fampage) vs revenue (charged to customers) with profit calculations

## 📁 Project Structure

```
src/
├── app.js                      # Express application setup
├── server.js                   # Server entry point
├── config/                     # Configuration files
│   ├── db.js                   # MongoDB connection
│   ├── env.js                  # Environment variables
│   ├── logger.js               # Winston logger setup
│   └── roles.js                # Role definitions and helpers
├── controllers/                # Request handlers
│   ├── auth.js
│   ├── companies.js
│   ├── apiIntegrations.js
│   ├── orders.js
│   ├── invoices.js
│   └── analytics.js
├── services/                   # Business logic layer
│   ├── auth.js
│   ├── companies.js
│   ├── apiIntegrations.js
│   ├── FampageProvider.js     # Fampage.in API implementation
│   ├── BaseProvider.js         # Abstract API provider class
│   ├── orders.js
│   ├── invoices.js
│   ├── pdfGenerator.js         # PDF invoice generation
│   └── analytics.js
├── models/                     # Mongoose schemas
│   ├── User.js
│   ├── Company.js
│   ├── ApiProvider.js          # Contains ApiProvider & ApiIntegrationLog
│   ├── Order.js                # Internal order records
│   ├── Invoice.js              # Invoice records
│   └── AnalyticsSummary.js
├── routes/                     # Express route definitions
│   ├── auth.js
│   ├── companies.js
│   ├── apiIntegrations.js
│   ├── orders.js
│   ├── invoices.js
│   └── analytics.js
├── validations/                # Joi validation schemas
│   ├── auth.js
│   ├── companies.js
│   ├── apiIntegrations.js
│   ├── orders.js
│   ├── invoices.js
│   └── analytics.js
├── middlewares/                # Express middlewares
│   ├── auth.js                 # JWT authentication & authorization
│   ├── errorHandler.js         # Centralized error handling
│   └── notFound.js             # 404 handler
└── utils/                      # Utility functions
    ├── errors.js               # Custom error classes
    └── pagination.js           # Pagination helpers
```

## 🚀 Features

### 🔐 Authentication & Authorization

- JWT-based authentication (Access + Refresh tokens)
- Single SUPER_ADMIN user (no multi-tenant login complexity)
- Password management (change password, forgot password, reset password)
- Secure password hashing with bcrypt

### 🏢 Company Management

- Auto-generated UUID-based company IDs
- Companies used for internal tracking only (no company login)
- Soft-delete support
- Basic company information management

### 🔌 Fampage API Integration

- Auto-managed Fampage provider (configured via environment variables)
- No provider CRUD operations needed
- Service listing with network categorization (Instagram, TikTok, etc.)
- Order creation, status checking, refilling, and cancellation
- Account balance retrieval
- Integration logging for audit trails

### 📦 Order Management

- Internal order records automatically created when placing Fampage orders
- Tracks: service details, target URL, quantity, cost, status
- Status synchronization with Fampage API
- Order statistics and filtering (by company, cost, quantity, etc.)

### 🧾 Invoice Management

- Automatic invoice generation when orders are placed
- Customizable pricing multiplier (default 8x)
- PDF invoice download
- Invoice status tracking
- Cost vs revenue tracking

### 📊 Analytics

- Company analytics with profit calculations
- Real cost (paid to Fampage) vs revenue (charged to customers)
- Profit margin calculations
- Order history by company and target URL
- Statistics summary with cost breakdowns
- MongoDB aggregation pipelines for performance

## 📦 Tech Stack

- **Runtime**: Node.js (Latest LTS)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS
- **Rate Limiting**: express-rate-limit

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd social_scale_backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:

   - MongoDB connection string
   - JWT secrets
   - API configuration
   - Rate limiting settings

4. **Start MongoDB**

   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

5. **Run the application**

   ```bash
   # Development mode with nodemon
   npm run dev

   # Production mode
   npm start
   ```

## 🔑 Environment Variables

See `.env.example` for all available configuration options:

```env
NODE_ENV=development
PORT=3000
API_VERSION=v1

MONGODB_URI=mongodb://localhost:27017/social_scale
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Fampage API
FAMPAGE_API_KEY=your-fampage-api-key
FAMPAGE_BASE_URL=https://fampage.in/api/v2

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📡 API Endpoints

Base URL: `/api/v1`

### Authentication (`/auth`)

- `POST /register` - Register first SUPER_ADMIN only (public, works only if no SUPER_ADMIN exists)
- `POST /login` - Login (SUPER_ADMIN only)
- `POST /refresh-token` - Refresh access token
- `GET /me` - Get current user (protected)
- `POST /change-password` - Change password (requires authentication)
- `POST /forgot-password` - Request password reset (public)
- `POST /reset-password` - Reset password with token (public)

**Note:** Only one SUPER_ADMIN user exists in the system. No other user roles are supported.

### Companies (`/companies`)

- `POST /` - Create company (public, no authentication required)
- `GET /` - Get all companies
- `GET /:companyId` - Get company by ID
- `PUT /:companyId` - Update company
- `DELETE /:companyId` - Soft delete company (SUPER_ADMIN only)
- `POST /:companyId/restore` - Restore deleted company (SUPER_ADMIN only)

### Orders (`/orders`)

- `POST /` - Create order manually (SUPER_ADMIN only)
- `GET /` - Get all orders (SUPER_ADMIN only)
- `GET /stats` - Get order statistics (SUPER_ADMIN only)
- `GET /company/:companyId` - Get orders for a company (SUPER_ADMIN only)
- `GET /:id` - Get order by ID (SUPER_ADMIN only)
- `PUT /:id/status` - Update order status (SUPER_ADMIN only)
- `PUT /:id/stats` - Update order stats (SUPER_ADMIN only)

### Invoices (`/invoices`)

- `POST /order/:orderId` - Create invoice for an order (SUPER_ADMIN only)
- `GET /` - Get all invoices (SUPER_ADMIN only)
- `GET /company/:companyId` - Get invoices for a company (SUPER_ADMIN only)
- `GET /:id` - Get invoice by ID (SUPER_ADMIN only)
- `GET /:id/download` - Download invoice as PDF (SUPER_ADMIN only)
- `PUT /:id/status` - Update invoice status (SUPER_ADMIN only)

### API Integrations (`/api-integrations`)

**Fampage API Operations (SUPER_ADMIN only):**

**Important Notes:**

- Fampage provider is **auto-managed** from environment variables (`FAMPAGE_API_KEY` and `FAMPAGE_BASE_URL`)
- No provider management endpoints exist (no CRUD operations for providers)
- No `providerId` is required in URLs - all endpoints work directly with the auto-managed Fampage provider
- The system automatically creates/updates the Fampage provider record from config when needed

- `GET /services` - Get list of Fampage services (optional: `?network=Instagram` to filter)
- `POST /orders` - Create order (add service) - automatically creates internal Order and Invoice
- `GET /orders/:orderId/status` - Get single order status (updates internal order record)
- `GET /orders/status?orderIds=1,2,3` - Get multiple orders status (comma-separated orderIds)
- `POST /orders/:orderId/refill` - Refill order
- `GET /balance` - Get account balance
- `POST /orders/:orderId/cancel` - Cancel order
- `GET /logs` - Get integration logs

### Analytics (`/analytics`)

- `GET /` - Get company analytics with profit calculations (SUPER_ADMIN only)
- `GET /stats` - Get statistics summary with real cost vs revenue (SUPER_ADMIN only)
- `GET /target/:targetUrl` - Get orders by target URL with profit data (SUPER_ADMIN only)
- `GET /company/:companyId/history` - Get company order history with profit summary (SUPER_ADMIN only)

## 📋 cURL Commands

Base URL: `http://localhost:3000/api/v1` (adjust port as needed)

**Note**: Replace `<ACCESS_TOKEN>`, `<REFRESH_TOKEN>`, `<COMPANY_ID>`, `<ORDER_ID>`, `<INVOICE_ID>`, `<FAMPAGE_ORDER_ID>`, and other placeholders with actual values from your system.

### 🔐 Authentication

#### Register First SUPER_ADMIN (Only works if no SUPER_ADMIN exists)

**Important:** This endpoint only works for creating the first SUPER_ADMIN. Once a SUPER_ADMIN exists, this endpoint will reject any registration attempt.

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "SuperSecurePass123!",
    "role": "SUPER_ADMIN"
  }'
```

#### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'
```

#### Refresh Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>"
  }'
```

#### Get Current User

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Change Password (Requires Authentication)

```bash
curl -X POST http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "CurrentPassword123!",
    "newPassword": "NewSecurePassword123!"
  }'
```

#### Forgot Password (Public)

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Note:** In development, the reset token is returned in the response. In production, this should be sent via email.

#### Reset Password (Public)

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "resetToken": "reset-token-from-email",
    "newPassword": "NewSecurePassword123!"
  }'
```

### 🏢 Companies

#### Create Company (Public - No Authentication Required)

```bash
curl -X POST http://localhost:3000/api/v1/companies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "logo": "https://example.com/logo.png",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "billingDetails": {
      "contactName": "John Doe",
      "contactEmail": "billing@acme.com",
      "contactPhone": "+1-555-123-4567",
      "taxId": "TAX123456",
      "billingAddress": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      }
    },
    "settings": {
      "timezone": "America/New_York",
      "currency": "USD"
    }
  }'
```

#### Get All Companies

```bash
curl -X GET http://localhost:3000/api/v1/companies \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Get Company by ID

```bash
curl -X GET http://localhost:3000/api/v1/companies/<COMPANY_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Update Company

```bash
curl -X PUT http://localhost:3000/api/v1/companies/<COMPANY_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp Updated",
    "logo": "https://example.com/new-logo.png",
    "settings": {
      "timezone": "America/Los_Angeles",
      "currency": "USD"
    }
  }'
```

#### Delete Company (SUPER_ADMIN only - soft delete)

```bash
curl -X DELETE http://localhost:3000/api/v1/companies/<COMPANY_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Restore Company (SUPER_ADMIN only)

```bash
curl -X POST http://localhost:3000/api/v1/companies/<COMPANY_ID>/restore \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 📦 Orders

#### Create Order (SUPER_ADMIN only)

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "<COMPANY_ID>",
    "apiOrderId": 12345,
    "service": {
      "id": 1,
      "name": "Instagram Followers",
      "category": "Followers"
    },
    "targetUrl": "instagram.com/example",
    "quantity": 1000,
    "cost": 10.50,
    "status": "pending"
  }'
```

#### Get All Orders (SUPER_ADMIN only)

```bash
curl -X GET "http://localhost:3000/api/v1/orders?page=1&limit=20" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Get Order Statistics (SUPER_ADMIN only)

```bash
curl -X GET http://localhost:3000/api/v1/orders/stats \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Get Company Orders (SUPER_ADMIN only)

```bash
curl -X GET http://localhost:3000/api/v1/orders/company/<COMPANY_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Get Order by ID (SUPER_ADMIN only)

```bash
curl -X GET http://localhost:3000/api/v1/orders/<ORDER_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Update Order Status (SUPER_ADMIN only)

```bash
curl -X PUT http://localhost:3000/api/v1/orders/<ORDER_ID>/status \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

#### Update Order Stats (SUPER_ADMIN only)

```bash
curl -X PUT http://localhost:3000/api/v1/orders/<ORDER_ID>/stats \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "startCount": 1000,
    "currentCount": 1950,
    "delivered": 950
  }'
```

### 🧾 Invoices

#### Create Invoice for Order (SUPER_ADMIN only)

```bash
curl -X POST http://localhost:3000/api/v1/invoices/order/<ORDER_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "multiplier": 8
  }'
```

#### Get All Invoices (SUPER_ADMIN only)

```bash
curl -X GET "http://localhost:3000/api/v1/invoices?page=1&limit=20" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Get Company Invoices (SUPER_ADMIN only)

```bash
curl -X GET http://localhost:3000/api/v1/invoices/company/<COMPANY_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Get Invoice by ID (SUPER_ADMIN only)

```bash
curl -X GET http://localhost:3000/api/v1/invoices/<INVOICE_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Download Invoice PDF (SUPER_ADMIN only)

```bash
curl -X GET http://localhost:3000/api/v1/invoices/<INVOICE_ID>/download \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  --output invoice.pdf
```

#### Update Invoice Status (SUPER_ADMIN only)

```bash
curl -X PUT http://localhost:3000/api/v1/invoices/<INVOICE_ID>/status \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid"
  }'
```

### 🔌 API Integrations

**Note:** Fampage provider is automatically managed from environment variables (`FAMPAGE_API_KEY`). No provider management endpoints exist.

#### Get Integration Logs (SUPER_ADMIN only)

```bash
curl -X GET "http://localhost:3000/api/v1/api-integrations/logs?page=1&limit=50&status=success" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Get Services (Fampage - SUPER_ADMIN only)

```bash
# Get all services
curl -X GET http://localhost:3000/api/v1/api-integrations/services \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Filter by network
curl -X GET "http://localhost:3000/api/v1/api-integrations/services?network=Instagram" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Create Order (Fampage - SUPER_ADMIN only)

**Note:** This automatically creates an internal Order record and generates an Invoice with the specified multiplier (default 8x).

```bash
curl -X POST http://localhost:3000/api/v1/api-integrations/orders \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "<COMPANY_ID>",
    "service": 1,
    "link": "instagram.com/instagram",
    "quantity": 100,
    "invoiceMultiplier": 8
  }'
```

#### Get Order Status (Fampage - SUPER_ADMIN only)

**Note:** `orderId` is the Fampage API order ID (integer), not the internal MongoDB ID.

```bash
# Single order
curl -X GET http://localhost:3000/api/v1/api-integrations/orders/<FAMPAGE_ORDER_ID>/status \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Multiple orders (comma-separated)
curl -X GET "http://localhost:3000/api/v1/api-integrations/orders/status?orderIds=1,2,3" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Refill Order (Fampage - SUPER_ADMIN only)

```bash
curl -X POST http://localhost:3000/api/v1/api-integrations/orders/<FAMPAGE_ORDER_ID>/refill \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Get Balance (Fampage - SUPER_ADMIN only)

```bash
curl -X GET http://localhost:3000/api/v1/api-integrations/balance \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Cancel Order (Fampage - SUPER_ADMIN only)

```bash
curl -X POST http://localhost:3000/api/v1/api-integrations/orders/<FAMPAGE_ORDER_ID>/cancel \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 📊 Analytics

#### Get Company Analytics (SUPER_ADMIN only)

```bash
curl -X GET "http://localhost:3000/api/v1/analytics?companyId=<COMPANY_ID>&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Get Statistics Summary (SUPER_ADMIN only)

```bash
curl -X GET "http://localhost:3000/api/v1/analytics/stats?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Get Orders by Target URL (SUPER_ADMIN only)

```bash
curl -X GET "http://localhost:3000/api/v1/analytics/target/instagram.com/example?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Get Company Order History (SUPER_ADMIN only)

```bash
curl -X GET "http://localhost:3000/api/v1/analytics/company/<COMPANY_ID>/history?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 🏥 Health Check

#### Health Check

```bash
curl -X GET http://localhost:3000/health
```

## 🔐 Authentication Flow

1. **Register/Login**: User provides credentials
2. **Token Generation**: System returns access token (15min) and refresh token (7 days)
3. **API Requests**: Include `Authorization: Bearer <access_token>` header
4. **Token Refresh**: Use refresh token to get new access token when expired

## 🏢 Company Management

Companies are used for internal tracking only:

- **No Company Login**: Companies don't have login credentials - they're just tracking entities
- **Public Creation**: Companies can be created without authentication
- **SUPER_ADMIN Only Management**: Only SUPER_ADMIN can view, update, delete, and restore companies
- **Order Tracking**: All orders and invoices are linked to companies for analytics and reporting

## 📊 Database Models

### User

- Email, password (hashed), role (SUPER_ADMIN only)
- companyId (not used - only SUPER_ADMIN exists)
- Status: active, inactive, suspended
- Last login tracking

### Company

- Auto-generated UUID companyId
- Name, logo, address, billing details
- Settings (timezone, currency)
- Soft delete support (deletedAt)

### Order

- companyId, providerId (auto-linked to Fampage)
- apiOrderId (Fampage order ID - integer)
- service (id, name, category)
- targetUrl, quantity, cost
- status, stats (startCount, currentCount, delivered)
- Timestamps: createdAt, updatedAt

### Invoice

- companyId, orderId (reference to internal Order)
- invoiceNumber (auto-generated)
- cost (real cost from Fampage)
- revenue (cost × multiplier)
- multiplier (default 8x, customizable)
- status (pending, paid, overdue, cancelled)
- Timestamps: createdAt, updatedAt

### ApiProvider

- Name, baseUrl, apiKey, apiSecret
- Config (timeout, retry, sandbox mode)
- Rate limits, credit pricing
- Endpoint configurations

### AnalyticsSummary

- Pre-computed analytics per company/date/platform/actionType
- Metrics aggregation
- Anomaly flags

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Helmet**: Security headers
- **CORS**: Configurable cross-origin policies
- **Rate Limiting**: Request throttling
- **Input Validation**: Joi schema validation
- **Error Handling**: Centralized error middleware
- **API Keys**: Secure storage (select: false in models)

## 📈 Indexing Strategy

MongoDB indexes are defined for optimal query performance:

- **User**: `email`, `companyId`, `status`
- **Company**: `companyId`, `name`, `status`
- **Order**: `companyId`, `apiOrderId`, `status`, `createdAt`
- **Invoice**: `companyId`, `orderId`, `status`, `createdAt`
- **AnalyticsSummary**: `companyId + date`, `companyId + platform + date`, `companyId + actionType + date`

## 🧪 Error Handling

Centralized error handling with meaningful HTTP status codes:

- **400**: Validation errors
- **401**: Authentication/Authorization errors
- **403**: Forbidden (insufficient permissions)
- **404**: Resource not found
- **409**: Conflict (duplicate entries)
- **500**: Internal server errors

## 📝 Logging

Winston logger with:

- Console output (development)
- File logging (error.log, combined.log)
- JSON format with timestamps
- Configurable log levels

## 🚦 Rate Limiting

- Default: 100 requests per 15 minutes (900000ms) per IP
- Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` environment variables
- Applied to all `/api/*` routes

## 🔄 API Versioning

All routes are versioned under `/api/v1/` for future compatibility.

## 📋 Sample Request/Response

### Register First SUPER_ADMIN

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "superadmin@example.com",
  "password": "SuperSecurePass123!",
  "role": "SUPER_ADMIN"
}
```

### Create Order via Fampage

```http
POST /api/v1/api-integrations/orders
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "companyId": "company-uuid",
  "service": 1,
  "link": "instagram.com/example",
  "quantity": 1000,
  "invoiceMultiplier": 8
}
```

**Note:** This automatically creates an internal Order record and generates an Invoice.

## 🔍 Query Parameters

Most list endpoints support:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sortBy` - Field to sort by
- `sortOrder` - asc or desc
- Additional filters per endpoint
