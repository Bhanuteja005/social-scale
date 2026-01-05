# Social Scale

## 🎯 Overview

Social Scale is a comprehensive multi-tenant platform for managing social media growth operations. This guide will walk you through the complete setup process.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ installed
- **MongoDB** running (local or cloud)
- **Git** installed
- A code editor (VS Code recommended)

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend directory**
```powershell
cd backend
```

2. **Install dependencies**
```powershell
npm install
```

3. **Create environment file**

Create a `.env` file in the backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=mongodb://localhost:27017/social_scale

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Fampage API (Instagram Services)
FAMPAGE_API_KEY=your-fampage-api-key-here
FAMPAGE_BASE_URL=https://fampage.in/api/v2

# API Provider Settings
API_PROVIDER_TIMEOUT=30000
API_PROVIDER_RETRY_ATTEMPTS=3
API_PROVIDER_RETRY_DELAY=1000
API_SANDBOX_MODE=false

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. **Seed the database**
```powershell
node scripts/seed.js
```

This creates:
- A super admin user (admin@example.com / password123)
- Sample company data
- API provider configuration

5. **Start the backend server**
```powershell
npm run dev
```

The backend will be running at http://localhost:3000

### Frontend Setup

1. **Navigate to frontend directory**
```powershell
cd frontend
```

2. **Install dependencies**
```powershell
npm install
```

3. **Create environment file**

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

4. **Start the development server**
```powershell
npm run dev
```

The frontend will be running at http://localhost:5173

## 🔑 Default Credentials

After seeding the database, you can login with:

- **Email**: admin@example.com
- **Password**: password123
- **Role**: SUPER_ADMIN

## 📁 Project Structure

```
social_scale/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # Request handlers
│   │   ├── middlewares/      # Express middlewares
│   │   ├── models/           # MongoDB models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Utility functions
│   │   └── validations/      # Request validators
│   ├── scripts/              # Utility scripts
│   ├── logs/                 # Application logs
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/       # Reusable UI components
    │   ├── contexts/         # React contexts
    │   ├── hooks/            # Custom hooks
    │   ├── layouts/          # Layout components
    │   ├── pages/            # Page components
    │   ├── services/         # API services
    │   ├── types/            # TypeScript types
    │   └── config/           # Configuration
    └── package.json
```

## 🎨 Features Implemented

### 1. Dashboard
- **Overview Statistics**: Total companies, orders, revenue
- **Visual Analytics**: Charts showing order trends and distributions
- **Recent Orders**: Quick view of latest transactions
- **Quick Stats**: Pending orders, active companies, monthly revenue

### 2. Company Management
- **Create Companies**: Add new client companies with full details
- **Company Profiles**: Name, logo, notes, contact information
- **Billing Details**: Contact info, tax ID, billing address
- **Settings**: Timezone, currency, invoice multiplier
- **Status Management**: Active, inactive, or suspended

### 3. Order Creation & Management
- **Instagram Followers**: Full order creation workflow
- **Service Selection**: Browse available services with pricing
- **Real-time Pricing**: Automatic cost calculation
- **Order Tracking**: Status updates and progress monitoring
- **Filtering**: By company, status, or search query
- **Progress Visualization**: Visual progress bars

### 4. Analytics Dashboard
- **Comprehensive Metrics**: Total orders, spending, quantities
- **Time Series Analysis**: Orders and spending over time
- **Service Breakdown**: Performance by service type
- **Status Distribution**: Visual pie charts
- **Company Performance**: Comparison across companies
- **Top Targets**: Most active Instagram profiles
- **Advanced Calculations**: Average order value, cost per unit

### 5. Authentication & Security
- **JWT Authentication**: Secure token-based auth
- **Auto-refresh Tokens**: Seamless session management
- **Protected Routes**: Role-based access control
- **Secure Storage**: Encrypted passwords with bcrypt

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user (first SUPER_ADMIN only)
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/change-password` - Change password

### Companies
- `GET /api/v1/companies` - Get all companies
- `POST /api/v1/companies` - Create company
- `GET /api/v1/companies/:id` - Get company by ID
- `PUT /api/v1/companies/:id` - Update company
- `DELETE /api/v1/companies/:id` - Delete company

### Orders
- `GET /api/v1/orders` - Get all orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/:id` - Get order by ID
- `GET /api/v1/orders/company/:companyId` - Get company orders
- `GET /api/v1/orders/stats` - Get order statistics
- `PUT /api/v1/orders/:id/status` - Update order status

### Analytics
- `GET /api/v1/analytics` - Get company analytics
- `GET /api/v1/analytics/dashboard` - Get dashboard stats
- `GET /api/v1/analytics/company/:id/history` - Get company history
- `GET /api/v1/analytics/target/:url` - Get target URL details

### API Integrations (Fampage)
- `GET /api/v1/api-integrations/services` - Get available services
- `POST /api/v1/api-integrations/orders` - Create API order
- `GET /api/v1/api-integrations/orders/:id/status` - Get order status
- `GET /api/v1/api-integrations/logs` - Get integration logs

## 🎨 Design System

### Colors
- **Primary**: Indigo (#4f46e5)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Danger**: Red (#ef4444)
- **Info**: Blue (#3b82f6)

### Typography
- **Font**: Inter, System UI fallback
- **Headings**: Bold, 2xl-3xl
- **Body**: Regular, base-lg
- **Captions**: Medium, xs-sm

### Components
All UI components follow a consistent design pattern:
- Cards with subtle shadows
- Rounded corners (8px)
- Consistent spacing (Tailwind scale)
- Hover states for interactivity
- Focus states for accessibility

## 📊 Data Flow

### Order Creation Flow
```
User Input → Frontend Validation → API Request → Backend Validation
→ Fampage API Call → Create Order Record → Return Response
→ Update UI → Show Success/Error
```

### Analytics Flow
```
Filter Selection → Fetch Orders → Client-side Processing
→ Generate Charts Data → Render Visualizations
```

## 🔍 Troubleshooting

### Backend Issues

**MongoDB Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
Solution: Ensure MongoDB is running
```powershell
# Windows (if using MongoDB service)
net start MongoDB

# Or start manually
mongod
```

**Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::3000
```
Solution: Change PORT in .env or kill the process
```powershell
# Find process
netstat -ano | findstr :3000

# Kill process (use PID from above)
taskkill /PID <PID> /F
```

### Frontend Issues

**Module Not Found**
```
Error: Cannot find module 'axios'
```
Solution: Reinstall dependencies
```powershell
rm -rf node_modules package-lock.json
npm install
```

**API Connection Error**
```
Error: Network Error
```
Solution: Check if backend is running and VITE_API_BASE_URL is correct

## 🚀 Deployment

### Backend Deployment

1. **Build for production**
```powershell
npm run build
```

2. **Set production environment variables**
```env
NODE_ENV=production
DATABASE_URL=your-production-mongodb-url
JWT_SECRET=your-production-secret
```

3. **Start production server**
```powershell
npm start
```

### Frontend Deployment

1. **Build for production**
```powershell
npm run build
```

2. **Deploy the `dist` folder** to your hosting service:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Any static hosting

3. **Set production API URL**
```env
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
```

## 📝 Development Workflow

### Adding a New Feature

1. **Backend**
   - Create model in `models/`
   - Create validation in `validations/`
   - Create service in `services/`
   - Create controller in `controllers/`
   - Create route in `routes/`
   - Add route to `app.js`

2. **Frontend**
   - Add TypeScript types in `types/`
   - Add API method in `services/api.ts`
   - Create custom hook in `hooks/`
   - Create page/component in `pages/` or `components/`
   - Add route in `App.tsx`
   - Update navigation in `Sidebar.tsx`

### Testing

**Backend**
```powershell
# Run tests
npm test

# Test API endpoint
curl http://localhost:3000/health
```

**Frontend**
```powershell
# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

## 🔐 Security Best Practices

1. **Never commit .env files** - Already in .gitignore
2. **Use strong JWT secrets** - Generate random strings
3. **Enable HTTPS in production** - Use SSL certificates
4. **Validate all inputs** - Already implemented with validators
5. **Rate limit API requests** - Already configured
6. **Hash passwords** - Using bcrypt
7. **Sanitize user inputs** - Prevent XSS/SQL injection

## 📚 Additional Resources

- **Backend Documentation**: See `backend/README.md`
- **Frontend Documentation**: See `frontend/FRONTEND_README.md`
- **API Testing**: See `backend/API_TESTING_GUIDE.md`
- **Postman Collection**: See `backend/Social_Scale_Backend_New.postman_collection.json`

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the logs in `backend/logs/`
3. Check browser console for frontend errors
4. Verify environment variables are set correctly

## 📄 License

Proprietary - All rights reserved

---

**Happy Coding! 🎉**
