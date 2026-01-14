# Vici Shop Frontend - Modern E-Commerce Platform

A modern, full-featured e-commerce frontend built with React 19, TypeScript, Vite, TanStack Router, Tailwind CSS, and Shadcn UI.

## 📸 Application Screenshots

Explore the beautiful, responsive interface of Vici Shop:

### 🏠 Home Page
![Home Page](../images/home.png)

**Features showcased:**
- Modern hero section with gradient backgrounds
- Floating product images with animations
- Featured product collections
- Category navigation
- Personalized recommendations section

---

### 🤖 AI-Powered Recommendations
![Recommendations](../images/recommendation-section.png)

**Features showcased:**
- Personalized product suggestions
- Machine learning-based recommendations
- Beautiful product cards with ratings
- Add to cart functionality
- Sale badges and pricing display

---

### 🛒 Shopping Cart
![Shopping Cart](../images/cart.png)

**Features showcased:**
- Real-time price calculations
- Quantity adjustments
- Coupon code support
- Shipping and tax estimates
- Order summary
- Secure checkout button

> 💡 **Live Demo**: The application runs on `http://localhost:3001` when started in development mode.

## 🎯 Overview

The Vici frontend provides a responsive, user-friendly interface for the e-commerce platform, connecting to a microservices backend architecture. Built with modern web technologies for optimal performance and developer experience.

## ✨ Key Features

- 🎨 **Modern UI/UX** - Beautiful, responsive design with Tailwind CSS and Shadcn UI
- 🚀 **Fast Performance** - Vite build tool with instant HMR and optimized production builds
- 🔐 **Secure Authentication** - JWT-based auth with refresh tokens
- 🛒 **Smart Shopping Cart** - Real-time updates with optimistic UI
- 💳 **Payment Integration** - Stripe payment processing
- 🤖 **AI Recommendations** - Personalized product suggestions
- 📱 **Responsive Design** - Mobile-first approach, works on all devices
- 🔍 **Advanced Search** - Fast product search with filters
- 🎯 **Type Safety** - Full TypeScript coverage with strict mode

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

Visit `http://localhost:3001` (auto-switches to 3001 if 3000 is in use)

### Environment Setup

Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000/api

# Feature Flags
VITE_USE_MOCK_DATA=false
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_RECOMMENDATIONS=true

# External Services
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

## 🏗️ Backend Integration

The frontend connects to the backend API Gateway running at `http://localhost:3000`

### API Endpoints (via API Gateway)

Configured in [src/config/api.ts](src/config/api.ts):

| Endpoint | Service | Purpose |
|----------|---------|---------|
| `/api/auth/*` | Auth Service | Login, register, logout, token refresh |
| `/api/users/*` | User Service | User profiles, addresses, preferences |
| `/api/products/*` | Product Service | Product catalog, search, categories |
| `/api/cart/*` | Cart Service | Shopping cart operations, coupons |
| `/api/orders/*` | Order Service | Order creation, history, tracking |
| `/api/checkout/*` | Payment Service | Payment processing, Stripe integration |
| `/api/recommendations/*` | Recommendation Service | AI-powered product recommendations |

### State Management

- **Zustand stores** for global state (auth, cart, user preferences)
- **React Query** for server state and caching
- **Local state** for UI components and forms

## 🛠️ Tech Stack

### Core
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6.4 (fast HMR, optimized builds)
- **Router**: TanStack Router (type-safe routing with file-based routes)
- **Styling**: Tailwind CSS 3.4 (utility-first CSS)
- **UI Components**: Shadcn UI (accessible, customizable components)

### State & Data
- **State Management**: Zustand (lightweight, intuitive state)
- **API Client**: Axios (HTTP client with interceptors)
- **Server State**: TanStack Query (data fetching & caching)
- **Forms**: React Hook Form + Zod (validation)

### Additional Libraries
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: Sonner (toast notifications)
- **Date Handling**: date-fns
- **AI Integration**: @google/genai

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/            # App-wide setup
│   ├── components/     # Reusable UI components
│   │   ├── cart/       # Cart-related components
│   │   ├── checkout/   # Checkout flow components
│   │   ├── common/     # Shared components (Header, Footer)
│   │   ├── product/    # Product display components
│   │   └── ui/         # Shadcn UI components
│   ├── config/         # Configuration files
│   │   ├── api.ts      # API endpoints
│   │   └── env.ts      # Environment variables
│   ├── data/           # Mock data (JSON files)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── pages/          # Page components
│   │   ├── auth/       # Login, Register pages
│   │   ├── cart/       # Cart page
│   │   ├── checkout/   # Checkout flow
│   │   ├── dashboard/  # User dashboard
│   │   ├── home/       # Home page
│   │   ├── orders/     # Order history
│   │   ├── product/    # Product detail page
│   │   └── shop/       # Product listing page
│   ├── routes/         # TanStack Router routes
│   ├── services/       # API services
│   │   ├── api/        # Real API calls
│   │   └── mock/       # Mock services for development
│   ├── stores/         # Zustand stores
│   ├── styles/         # Global styles
│   └── types/          # TypeScript type definitions
├── images/             # Screenshots and documentation images
├── docs/               # Additional documentation
└── public/             # Static assets
```

## 🎨 Features

### ✅ Implemented Features
- **Product Catalog** - Browse products with beautiful card layouts
- **Product Details** - Detailed product pages with image galleries
- **Product Filtering** - Filter by category, price range, rating
- **Advanced Search** - Fast search with real-time results
- **Shopping Cart** - Add, remove, update quantities with optimistic UI
- **User Authentication** - Secure login/register with JWT tokens
- **User Dashboard** - Profile management, addresses, preferences
- **Order History** - View past orders with detailed information
- **Checkout Flow** - Multi-step checkout with address and payment
- **Payment Integration** - Stripe payment processing
- **AI Recommendations** - Personalized product suggestions based on behavior
- **Responsive Design** - Mobile-first, works perfectly on all devices
- **Dark Mode Support** - Beautiful UI in both light and dark themes
- **Real-time Notifications** - Toast notifications for user actions
- **Product Reviews** - User ratings and review system
- **Category Navigation** - Browse by product categories

### 🔄 Planned Enhancements
- **Wishlist** - Save favorite products for later
- **Order Tracking** - Real-time shipment tracking
- **Multi-language** - Internationalization (i18n) support
- **Social Sharing** - Share products on social media
- **Product Comparison** - Compare multiple products side-by-side
- **Advanced Filters** - More filtering options and faceted search
- **Live Chat** - Customer support chat integration

## 🎯 Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero section, featured products, recommendations |
| `/shop` | Shop | Product listing with filters and search |
| `/product/:slug` | Product Detail | Product information, images, reviews |
| `/cart` | Shopping Cart | Cart items, coupon codes, price summary |
| `/checkout` | Checkout | Multi-step checkout flow |
| `/login` | Login | User authentication |
| `/register` | Register | New user registration |
| `/dashboard` | Dashboard | User profile and preferences |
| `/orders` | Order History | Past orders and tracking |
| `/contact` | Contact | Contact form and information |

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server with HMR
npm run type-check       # Type-check without emitting files

# Production
npm run build            # Build for production
npm run preview          # Preview production build locally

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

## 🚀 Build & Deployment

### Production Build

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
```

The build output will be in the `dist/` directory, optimized and ready for deployment.

### Deployment Options

- **Vercel** - Recommended for Next.js/React apps (zero config)
- **Netlify** - Easy deployment with continuous integration
- **AWS S3 + CloudFront** - Scalable static hosting
- **Docker** - Containerized deployment

### Environment Variables for Production

```env
VITE_API_URL=https://api.yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_STRIPE_PUBLIC_KEY=pk_live_xxx
VITE_GOOGLE_API_KEY=your_production_key
```

## 🔐 Authentication Flow

1. User enters credentials on login page
2. Frontend sends request to `/api/auth/login`
3. Backend validates and returns JWT access token + refresh token
4. Frontend stores tokens in localStorage
5. Access token included in Authorization header for API requests
6. Refresh token used to get new access token when expired

## 🛒 Shopping Cart Flow

1. User adds product to cart
2. Cart state updated via Zustand store
3. API call to `/api/cart/items` to sync with backend
4. Real-time price calculations with tax and shipping
5. Coupon code validation and discounts applied
6. Cart persists across sessions

## 📊 Data Flow

```
User Action → Component → Zustand Store → API Service → Backend
                              ↓
                        Local State Update (Optimistic UI)
                              ↓
                        Backend Response → Store Update → UI Update
```

## 🎨 UI Components

All UI components are built with Shadcn UI and customized with Tailwind CSS:

- **Buttons** - Primary, secondary, outline, ghost variants
- **Forms** - Input, textarea, select, checkbox, radio
- **Cards** - Product cards, info cards, dashboard cards
- **Modals** - Dialog, drawer, sheet components
- **Navigation** - Header, footer, breadcrumbs, tabs
- **Feedback** - Toast notifications, loading states, error messages
- **Data Display** - Tables, lists, badges, avatars

## 🧪 Development Tips

### Mock Data vs Real API

Toggle between mock data and real API in `.env`:

```env
# Use mock data for development without backend
VITE_USE_MOCK_DATA=true

# Use real API (requires backend services running)
VITE_USE_MOCK_DATA=false
```

### Hot Module Replacement (HMR)

Vite provides instant HMR - changes reflect immediately without full page reload.

### Type Safety

TypeScript strict mode enabled for maximum type safety. All API responses and component props are fully typed.

## 📚 Additional Documentation

- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System architecture and data flow
- **[Development Plan](./docs/DEVELOPMENT_PLAN.md)** - Comprehensive development guide
- **[Migration Plan](./docs/MIGRATION_PLAN.md)** - Migration status and roadmap
- **[Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md)** - What's been implemented

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes following the code style
3. Add/update tests if applicable
4. Update documentation as needed
5. Submit a pull request

## 📝 License

This project is part of the Vici e-commerce platform.

## 🔗 Related Links

- [Backend Repository](../backend/README.md)
- [API Documentation](../backend/docs/API.md)
- [System Architecture](../docs/system-architecture.md)

---

**Built with ❤️ using React, TypeScript, and modern web technologies**
````
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
