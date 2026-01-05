# How the Social Scale Backend Works

## Overview

The Social Scale Backend is a simplified backend system for managing social media growth services through the Fampage.in API. It uses a single SUPER_ADMIN authentication model and automatically manages the Fampage provider configuration.

---

## System Architecture

### 1. Authentication System

- **Single SUPER_ADMIN Role**: Only one SUPER_ADMIN user can exist in the system
- **First Registration**: The first user registration creates the SUPER_ADMIN (no other roles supported)
- **Authentication Flow**:
  1. Register the first SUPER_ADMIN user (one-time setup)
  2. Login with email/password to get access and refresh tokens
  3. Use access token in `Authorization: Bearer <token>` header for all API calls
  4. Refresh token when access token expires
- **Password Management**:
  - Change password (requires authentication)
  - Forgot password (public, sends reset token via email)
  - Reset password (public, uses reset token)

### 2. Company Management

- **Purpose**: Companies are used for internal tracking only (no company login)
- **Creation**: Can be created without authentication (public endpoint)
- **Management**: Only SUPER_ADMIN can view, update, delete companies
- **Usage**: Companies track which organization received which social media services

### 3. Fampage API Integration (Simplified)

#### Key Concept: Auto-Managed Provider

Since there's only **one provider (Fampage)**, the system automatically manages it:

- **No Provider CRUD Operations**: You cannot create, update, or manage providers via API
- **Configuration**: Fampage API key is set via `FAMPAGE_API_KEY` environment variable
- **Auto-Creation**: The system automatically creates/updates the Fampage provider record from config when needed
- **No ProviderId Required**: All Fampage endpoints work directly without providerId in the URL

#### Fampage Endpoints (All require SUPER_ADMIN authentication):

1. **Get Services** - `GET /api/v1/api-integrations/services`

   - Returns list of Fampage services, categorized by network (Instagram, TikTok, etc.)
   - Optional query: `?network=Instagram` to filter by network
   - Optional query: `?companyId=<id>` for logging

2. **Create Order** - `POST /api/v1/api-integrations/orders`

   - Creates an order in Fampage API
   - Automatically creates an internal Order record
   - Automatically generates an Invoice with customizable multiplier (default 8x)
   - Request body: `{ companyId, service, link, quantity, invoiceMultiplier, ... }`
   - Returns: Fampage order ID, internal order ID, and invoice details

3. **Get Order Status** - `GET /api/v1/api-integrations/orders/:orderId/status`

   - Gets status of a single order from Fampage
   - Updates internal order record with latest status and stats
   - `orderId` is the Fampage API order ID (integer)

4. **Get Multiple Orders Status** - `GET /api/v1/api-integrations/orders/status?orderIds=1,2,3`

   - Gets status of multiple orders from Fampage
   - Updates internal order records
   - Query param: `orderIds` (comma-separated)

5. **Refill Order** - `POST /api/v1/api-integrations/orders/:orderId/refill`

   - Requests a refill for an order in Fampage

6. **Get Balance** - `GET /api/v1/api-integrations/balance`

   - Gets current account balance from Fampage

7. **Cancel Order** - `POST /api/v1/api-integrations/orders/:orderId/cancel`

   - Cancels an order in Fampage
   - Updates internal order status to "canceled"

8. **Get Integration Logs** - `GET /api/v1/api-integrations/logs`
   - View all API integration logs for debugging/monitoring

### 4. Order Management

- **Internal Order Records**: Created automatically when orders are placed via Fampage API
- **Fields**: Stores companyId, providerId (auto-linked to Fampage), apiOrderId (Fampage ID), service details, status, stats, etc.
- **Status Updates**: Automatically synced when checking order status from Fampage
- **Endpoints**:
  - `POST /api/v1/orders` - Create order manually (advanced)
  - `GET /api/v1/orders` - Get all orders
  - `GET /api/v1/orders/:id` - Get order by ID
  - `GET /api/v1/orders/stats` - Get order statistics
  - `GET /api/v1/orders/company/:companyId` - Get orders for a company
  - `PUT /api/v1/orders/:id/status` - Update order status
  - `PUT /api/v1/orders/:id/stats` - Update order stats

### 5. Invoice Management

- **Auto-Generation**: Invoices are automatically created when orders are placed (via Fampage API)
- **Customizable Multiplier**: Default 8x multiplier (order cost × 8), can be customized per order
- **PDF Download**: Invoices can be downloaded as PDF
- **Endpoints**:
  - `POST /api/v1/invoices/order/:orderId` - Create invoice for an order
  - `GET /api/v1/invoices` - Get all invoices
  - `GET /api/v1/invoices/:id` - Get invoice by ID
  - `GET /api/v1/invoices/:id/download` - Download invoice as PDF
  - `GET /api/v1/invoices/company/:companyId` - Get invoices for a company
  - `PUT /api/v1/invoices/:id/status` - Update invoice status

### 6. Analytics

- **Company Analytics**: Track orders, services, spending per company
- **Statistics Summary**: Overall system statistics with real cost vs revenue comparison
- **Order History**: Detailed history for companies with profit calculations
- **Endpoints**:
  - `GET /api/v1/analytics` - Get company analytics (includes profit calculations)
  - `GET /api/v1/analytics/stats` - Get statistics summary (real cost vs revenue)
  - `GET /api/v1/analytics/target/:targetUrl` - Get orders by target URL (with profit data)
  - `GET /api/v1/analytics/company/:companyId/history` - Get company order history (with profit summary)

---

## Workflow Example

### Typical Order Flow:

1. **Create Company** (if needed)

   ```
   POST /api/v1/companies
   { "name": "Client Corp", ... }
   ```

2. **Get Available Services**

   ```
   GET /api/v1/api-integrations/services?network=Instagram
   ```

3. **Create Order via Fampage**

   ```
   POST /api/v1/api-integrations/orders
   {
     "companyId": "comp123",
     "service": 1,
     "link": "instagram.com/account",
     "quantity": 1000,
     "invoiceMultiplier": 8
   }
   ```

   - This automatically:
     - Creates order in Fampage API
     - Creates internal Order record
     - Creates Invoice with cost × 8

4. **Check Order Status**

   ```
   GET /api/v1/api-integrations/orders/:fampageOrderId/status
   ```

   - Updates internal order with latest status from Fampage

5. **Download Invoice**

   ```
   GET /api/v1/invoices/:invoiceId/download
   ```

6. **View Analytics**
   ```
   GET /api/v1/analytics/company/:companyId/history
   ```

---

## Environment Variables

Required environment variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/social_scale

# JWT
JWT_SECRET=your-secret-key
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
```

---

## Key Features

1. **Simplified Authentication**: Single SUPER_ADMIN user, no multi-tenant login complexity
2. **Auto-Managed Provider**: Fampage provider automatically managed from config
3. **Automatic Invoice Generation**: Invoices created automatically with customizable pricing multiplier
4. **Order Synchronization**: Internal orders stay in sync with Fampage API
5. **Comprehensive Analytics**: Track everything by company, service, target URL, etc.
6. **PDF Invoices**: Download invoices as PDF documents

---

## Important Notes

- **No Provider Management**: You cannot create/manage providers via API - only Fampage is supported
- **Single Admin**: Only one SUPER_ADMIN user exists
- **Companies are Trackers**: Companies don't have login - they're just for internal tracking
- **Fampage API Key**: Must be set in environment variables - system auto-creates provider record
