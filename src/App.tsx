import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { BrandingProvider } from "./contexts/BrandingContext";
import { PaystackSettingsProvider } from "./contexts/PaystackSettingsContext";
import Layout from "./components/Layout";
import FloatingActions from "./components/FloatingActions";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Categories from "./pages/Categories";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import WishlistPage from "./pages/WishlistPage";
import AccountPage from "./pages/AccountPage";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminHomeText from "./pages/admin/AdminHomeText";
import AdminBranding from "./pages/admin/AdminBranding";
import AdminPaymentSettings from "./pages/admin/AdminPaymentSettings";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="home-text" element={<AdminHomeText />} />
          <Route path="branding" element={<AdminBranding />} />
          <Route path="payment-settings" element={<AdminPaymentSettings />} />
        </Route>

        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:id" element={<CategoryPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route
          path="*"
          element={
            <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
              <h1 className="font-display text-5xl text-luxury-black dark:text-pure-white">404</h1>
              <p className="mt-3 text-sm text-muted-grey">This page could not be found.</p>
            </div>
          }
        />
      </Routes>
      <FloatingActions />
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <BrandingProvider>
              <PaystackSettingsProvider>
                <CartProvider>
                  <ScrollToTop />
                  <AppRoutes />
                </CartProvider>
              </PaystackSettingsProvider>
            </BrandingProvider>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
