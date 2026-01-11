# Vici Shop E-Commerce Platform

A modern, full-featured e-commerce platform built with React, TypeScript, Vite, TanStack Router, Tailwind CSS, and Shadcn UI.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000`

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

## 📁 Project Structure

```
frontend/
├── src/                    # New production structure
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   ├── stores/           # State management
│   ├── services/         # API services
│   ├── hooks/            # Custom hooks
│   └── ...
├── docs/                 # Documentation
├── App.tsx              # Current app (being migrated)
└── package.json
```

## 🎨 Features

### Current (AI Studio Generated)
- ✅ Product browsing and filtering
- ✅ Shopping cart
- ✅ Checkout flow
- ✅ User authentication
- ✅ User dashboard
- ✅ Admin panel
- ✅ AI Product Studio (unique feature)

### Planned Enhancements
- 🔄 TanStack Router for routing
- 🔄 Zustand for state management
- 🔄 Shadcn UI components
- 🔄 Advanced product search
- 🔄 Wishlist functionality
- 🔄 Product reviews
- 🔄 Order tracking

## 🔧 Development

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
```

## 🚧 Migration Status

Currently migrating from AI-generated flat structure to production-ready architecture.

**Status**: Phase 2 - Creating mock data and infrastructure

See [MIGRATION_PLAN.md](./docs/MIGRATION_PLAN.md) for details.

## 📝 Environment Variables

```env
VITE_USE_MOCK_DATA=true
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENABLE_AI_FEATURES=true
```

## 🤝 Contributing

1. Follow the folder structure in `src/`
2. Use TypeScript strict mode
3. Follow the migration plan
4. Test your changes
5. Update documentation

## 📄 License

Private - All rights reserved
