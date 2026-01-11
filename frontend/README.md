# Vici Frontend - E-Commerce Platform

A modern, full-featured e-commerce frontend built with React 19, TypeScript, Vite, TanStack Router, Tailwind CSS, and Shadcn UI.

## 🎯 Overview

The Vici frontend provides a responsive, user-friendly interface for the e-commerce platform, connecting to a microservices backend architecture. Built with modern web technologies for optimal performance and developer experience.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Backend services running (see [backend/README.md](../backend/README.md))

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### Environment Setup

Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Feature Flags
VITE_USE_MOCK_DATA=false
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_RECOMMENDATIONS=true

# Development
VITE_DEBUG_MODE=true
```

## 🏗️ Backend Integration

The frontend connects to the backend API Gateway running at `http://localhost:3000`

### API Endpoints (via API Gateway)

Configured in [src/config/api.ts](src/config/api.ts):

| Endpoint | Service | Purpose |
|----------|---------|---------|
| `/api/auth/*` | Auth Service | Login, register, logout |
| `/api/users/*` | User Service | User profiles, addresses |
| `/api/products/*` | Product Service | Product catalog, search |
| `/api/cart/*` | Cart Service | Shopping cart operations |
| `/api/orders/*` | Order Service | Order management |
| `/api/payments/*` | Payment Service | Payment processing |
| `/api/recommendations/*` | Recommendation Service | Product recommendations |

### State Management

- **Zustand stores** for global state
- **React Query** for server state
- **Local state** for UI components

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite (fast HMR, optimized builds)
- **Router**: TanStack Router (type-safe routing)
- **Styling**: Tailwind CSS (utility-first CSS)
- **UI Components**: Shadcn UI (accessible components)
- **State Management**: Zustand (lightweight state)
- **API Client**: Axios (HTTP client)
- **Forms**: React Hook Form + Zod (validation)
- **Icons**: Lucide React

## 📚 Documentation

- **[Migration Plan](./docs/MIGRATION_PLAN.md)** - Current migration status and roadmap
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture and data flow
- **[Development Plan](./docs/DEVELOPMENT_PLAN.md)** - Comprehensive development guide
- **[Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md)** - What's been implemented

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Router**: TanStack Router (planned)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI (planned)
- **State**: Zustand (planned)
- **API Client**: Axios (planned)
- **Forms**: React Hook Form + Zod (planned)

## 🎨 Features

### Implemented Features
- ✅ **Product Catalog** - Browse and search products
- ✅ **Product Filtering** - Filter by category, price, rating
- ✅ **Shopping Cart** - Add, remove, update quantities
- ✅ **User Authentication** - Login, register, JWT tokens
- ✅ **User Dashboard** - Profile management, order history
- ✅ **Checkout Flow** - Address, shipping, payment
- ✅ **Product Recommendations** - AI-powered suggestions
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **AI Product Studio** - Unique feature for product creation

### Planned Enhancements
- 🔄 **Wishlist** - Save favorite products
- 🔄 **Product Reviews** - User ratings and reviews
- 🔄 **Order Tracking** - Real-time order status
- 🔄 **Advanced Search** - Filters, sorting, faceted search
- 🔄 **Social Sharing** - Share products on social media
- 🔄 **Multi-language** - Internationalization support

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── cart/           # Shopping cart components
│   │   ├── checkout/       # Checkout flow components
│   │   ├── product/        # Product display components
│   │   ├── common/         # Shared components (Header, Footer)
│   │   └── ui/             # Shadcn UI components
│   │
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── ProductList.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── Cart.tsx
│   │   ├── Checkout.tsx
│   │   └── Dashboard.tsx
│   │
│   ├── services/           # API service layer
│   │   ├── api.ts         # Axios instance
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   ├── cart.service.ts
│   │   └── order.service.ts
│   │
│   ├── stores/            # Zustand state stores
│   │   ├── auth.store.ts
│   │   ├── cart.store.ts
│   │   └── ui.store.ts
│   │
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   └── useProducts.ts
│   │
│   ├── types/             # TypeScript type definitions
│   │   ├── product.ts
│   │   ├── user.ts
│   │   ├── order.ts
│   │   └── cart.ts
│   │
│   ├── lib/               # Utility functions
│   │   ├── utils.ts
│   │   └── validators.ts
│   │
│   ├── config/            # Configuration files
│   │   ├── api.ts        # API endpoints
│   │   ├── env.ts        # Environment variables
│   │   └── theme.ts      # Theme configuration
│   │
│   ├── styles/           # Global styles
│   │   └── globals.css
│   │
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── router.tsx        # Route definitions
│
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT_PLAN.md
│   └── MIGRATION_PLAN.md
│
├── public/              # Static assets
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies
```

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start dev server with HMR
npm run build        # Production build
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## 🌐 API Integration

### Authentication Flow

1. User logs in via `/api/auth/login`
2. Backend returns JWT token
3. Token stored in localStorage
4. Token sent in `Authorization` header for protected routes
5. Auto-refresh token before expiration

### Error Handling

- Network errors display user-friendly messages
- 401 errors redirect to login
- 500 errors show retry option
- Form validation errors shown inline

### Request/Response Interceptors

```typescript
// Automatic token injection
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
    }
    return Promise.reject(error);
  }
);
```

## 📚 Documentation

- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture and data flow
- **[Development Plan](./docs/DEVELOPMENT_PLAN.md)** - Comprehensive development guide
- **[Migration Plan](./docs/MIGRATION_PLAN.md)** - Current migration status
- **[Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md)** - What's been implemented

## 🧪 Testing Strategy

- **Unit Tests**: Component logic with Vitest
- **Integration Tests**: API integration tests
- **E2E Tests**: User flows with Playwright (planned)
- **Accessibility Tests**: axe-core integration

## 🚢 Production Build

### Build Optimization

```bash
# Create optimized production build
npm run build

# Preview locally
npm run preview
```

Build output in `dist/`:
- Code splitting for optimal loading
- Asset optimization (images, fonts)
- CSS purging via Tailwind
- Minification and compression

### Deployment Checklist

- [ ] Update `.env` with production API URL
- [ ] Set `VITE_USE_MOCK_DATA=false`
- [ ] Configure CORS on backend
- [ ] Set up CDN for static assets
- [ ] Enable HTTPS
- [ ] Configure domain DNS
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure analytics

## 🔐 Security

- JWT token authentication
- HTTPS in production
- XSS protection via React
- CSRF token for mutations
- Content Security Policy headers
- Input validation with Zod
- Sanitized user inputs

## 🎯 Performance

- **Code Splitting**: Dynamic imports for routes
- **Lazy Loading**: Images and components
- **Caching**: API responses with React Query
- **Optimization**: Vite production builds
- **Bundle Size**: Tree-shaking unused code

## 🚧 Development Status

**Current Phase**: Active Development

**Recent Updates**:
- ✅ Docker infrastructure with vici naming
- ✅ Environment variable configuration
- ✅ Database initialization scripts
- ✅ API endpoint configuration

**Next Steps**:
1. Complete backend service implementation
2. Integrate frontend with live API
3. Implement remaining UI features
4. Add comprehensive testing
5. Performance optimization

See [docs/MIGRATION_PLAN.md](./docs/MIGRATION_PLAN.md) for detailed roadmap.
