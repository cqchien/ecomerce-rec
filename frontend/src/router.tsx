import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { HomePage } from '@/pages/home/HomePage';
import { ShopPage } from '@/pages/shop/ShopPage';
import { ProductDetailPage } from '@/pages/product/ProductDetailPage';
import { CartPage } from '@/pages/cart/CartPage';
import { CheckoutPage } from '@/pages/checkout/CheckoutPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { OrdersPage } from '@/pages/orders/OrdersPage';
import { ContactPage } from '@/pages/contact/ContactPage';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';

// Root Layout Component with Cart Initialization
const RootLayout = () => {
  const { isAuthenticated } = useAuthStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    // Fetch cart when user is authenticated
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
};

// Root Route with Layout
const rootRoute = createRootRoute({
  component: RootLayout,
});


// Home Route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

// Shop Route
const shopRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shop',
  component: ShopPage,
});

// Cart Route
const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
});

// Checkout Route
const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  component: CheckoutPage,
});

// Product Detail Route
const productRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/product/$slug',
  component: ProductDetailPage,
});

// Login Route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Register Route
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

// Dashboard Route
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
});

// Orders Route
const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders',
  component: OrdersPage,
});

// Contact Route
const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contact',
  component: ContactPage,
});

// Admin Route - placeholder for now
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: () => <div className="pt-20 px-4 min-h-screen">Admin Panel - Coming Soon</div>,
});

// Create route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  shopRoute,
  cartRoute,
  checkoutRoute,
  productRoute,
  loginRoute,
  registerRoute,
  dashboardRoute,
  ordersRoute,
  contactRoute,
  adminRoute,
]);

// Create and export router
export const router = createRouter({ routeTree });

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
