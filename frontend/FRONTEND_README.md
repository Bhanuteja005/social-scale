# Social Scale Frontend

A comprehensive dashboard application for managing social media growth operations.

## Features

### 🏢 Company Management
- Create and manage multiple client companies
- Track company details, billing information, and settings
- Company-specific order tracking

### 📦 Order Management
- Create orders for Instagram followers and other social services
- Real-time order status tracking
- Filter and search orders by company, status, or target
- Progress visualization for ongoing orders
- Service selection with pricing details

### 📊 Analytics Dashboard
- Comprehensive overview of all operations
- Visual charts and graphs using Recharts
- Time-series analysis of orders and spending
- Service type performance breakdown
- Company performance comparison
- Top target URLs analysis
- Key metrics: success rate, average order value, cost per unit

### 🔐 Authentication
- Secure login system
- JWT token-based authentication
- Auto-refresh token mechanism
- Protected routes

## Technology Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **React Router** - Navigation
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **date-fns** - Date formatting
- **Vite** - Build tool

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend server running on http://localhost:3000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── UI.tsx          # Common UI elements
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── hooks/              # Custom React hooks
│   └── useApi.ts       # API data fetching hooks
├── layouts/            # Layout components
│   └── MainLayout.tsx  # Main app layout
├── pages/              # Page components
│   ├── Login.tsx       # Login page
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Companies.tsx   # Company management
│   ├── Orders.tsx      # Order management
│   └── Analytics.tsx   # Analytics dashboard
├── services/           # API services
│   └── api.ts          # API client
├── types/              # TypeScript types
│   └── index.ts        # Type definitions
├── config/             # Configuration
│   └── constants.ts    # App constants
├── App.tsx             # Main app component
├── App.css             # App styles
└── main.tsx            # Entry point
```

## Key Features Explained

### Company Portal
Each company operates in its own logical workspace with:
- Unique Company ID
- Custom settings (timezone, currency, invoice multiplier)
- Billing and contact information
- Status management (active/inactive/suspended)

### Order Creation Workflow
1. Select a company
2. Choose Instagram follower service from available options
3. Enter target Instagram profile URL
4. Specify quantity (validated against service min/max)
5. See estimated cost before submitting
6. Track order progress in real-time

### Analytics Features
- **Time Range Selection**: 7 days, 30 days, 90 days, or 1 year
- **Company Filtering**: View analytics for specific companies or all
- **Visual Charts**:
  - Orders over time (Area chart)
  - Spending trends (Line chart)
  - Service type distribution (Bar chart)
  - Status distribution (Pie chart)
  - Company performance comparison
- **Key Metrics**:
  - Total orders, spent, quantity
  - Success rate percentage
  - Average order value
  - Cost per unit

### Authentication Flow
1. User logs in with email/password
2. Receives access token and refresh token
3. Access token stored and used for API requests
4. Auto-refresh when access token expires
5. Secure logout clears all tokens

## API Integration

The frontend integrates with the Social Scale backend API:

- **Auth**: `/api/v1/auth/*`
- **Companies**: `/api/v1/companies/*`
- **Orders**: `/api/v1/orders/*`
- **Analytics**: `/api/v1/analytics/*`
- **API Integrations**: `/api/v1/api-integrations/*`

All requests include:
- JWT Bearer token authentication
- Automatic token refresh
- Error handling and retry logic
- Request/response interceptors

## Default Credentials

For testing purposes:
- Email: `admin@example.com`
- Password: `password123`

## Color Scheme

The application uses a professional color palette:
- Primary: Indigo (#4f46e5)
- Success: Green (#10b981)
- Warning: Yellow (#f59e0b)
- Danger: Red (#ef4444)
- Info: Blue (#3b82f6)

## Status Indicators

Orders and companies have visual status indicators:
- **Completed**: Green badge
- **Pending**: Yellow badge
- **In Progress**: Blue badge
- **Failed**: Red badge
- **Active**: Green badge
- **Inactive**: Gray badge

## Responsive Design

The application is fully responsive:
- Mobile: Collapsible sidebar, stacked layouts
- Tablet: Optimized grid layouts
- Desktop: Full sidebar, multi-column layouts

## Development

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `App.tsx`
3. Add navigation item in `Sidebar.tsx`

### Adding New API Endpoints
1. Add method to `src/services/api.ts`
2. Create custom hook in `src/hooks/useApi.ts`
3. Use hook in component

### Styling Guidelines
- Use Tailwind CSS utility classes
- Follow existing component patterns
- Maintain consistent spacing and colors
- Use the `Card`, `Button`, `Input` components for consistency

## Production Build

```bash
npm run build
```

The build artifacts will be in the `dist/` directory, ready for deployment.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.
