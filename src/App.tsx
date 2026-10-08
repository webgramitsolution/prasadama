import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { DeliveryLocationProvider } from "@/contexts/DeliveryLocationContext";

import { SecurityHeaders } from "@/components/SecurityHeaders";
import { ScrollToTop } from "@/components/ScrollToTop";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { PWAInstallPrompt } from "@/pwa/PWAInstallPrompt";

import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { RouteCanonical } from "./components/RouteCanonical";

// Eager: user-facing pages — instant navigation, no white flash
import Index from "./pages/Index";
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const RFQ = lazy(() => import("./pages/RFQ"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Chat = lazy(() => import("./pages/Chat"));
const Help = lazy(() => import("./pages/Help"));
const CourierTracking = lazy(() => import("./pages/CourierTracking"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PageContent = lazy(() => import("./pages/PageContent"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const PWADiagnosticsPage = lazy(() => import("./pages/PWADiagnostics"));
const SEOChecklist = lazy(() => import("./pages/SEOChecklist"));

const BambooVsCottonGuide = lazy(() => import("./pages/guides/BambooVsCottonTowels"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const Connect = lazy(() => import("./pages/Connect"));
const EmailPreview = lazy(() => import("./pages/dev/EmailPreview"));
const VoiceAssistant = lazy(() => import("./components/voice/VoiceAssistant").then(m => ({ default: m.VoiceAssistant })));


// Admin — eager imports to eliminate white-flash on route changes
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminUserCreate = lazy(() => import("./pages/admin/UserCreate"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminRFQ = lazy(() => import("./pages/admin/RFQ"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminBrands = lazy(() => import("./pages/admin/Brands"));
const AdminChat = lazy(() => import("./pages/admin/Chat"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));

const AdminOffers = lazy(() => import("./pages/admin/Offers"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews"));
const AdminCustomTabs = lazy(() => import("./pages/admin/CustomTabs"));
const AdminHeroSlides = lazy(() => import("./pages/admin/HeroSlides"));
const AdminPromoBanners = lazy(() => import("./pages/admin/PromoBanners"));
const AdminCoupons = lazy(() => import("./pages/admin/Coupons"));
const AdminPincodes = lazy(() => import("./pages/admin/Pincodes"));

const AdminReels = lazy(() => import("./pages/admin/Reels"));
const AdminRoles = lazy(() => import("./pages/admin/Roles"));
const AdminDiagnostics = lazy(() => import("./pages/admin/Diagnostics"));
const AdminContactInquiries = lazy(() => import("./pages/admin/ContactInquiries"));
const AdminEkartLogs = lazy(() => import("./pages/admin/EkartLogs"));
const AdminEkartSettings = lazy(() => import("./pages/admin/EkartSettings"));
const AdminBlog = lazy(() => import("./pages/admin/Blog"));
const AdminFamilyTestimonials = lazy(() => import("./pages/admin/FamilyTestimonials"));
const AdminWebhookLogs = lazy(() => import("./pages/admin/WebhookLogs"));
const AdminOtpLogs = lazy(() => import("./pages/admin/OtpLogs"));
const AdminSecurityLogs = lazy(() => import("./pages/admin/SecurityLogs"));
const InvoicePreview = lazy(() => import("./pages/dev/InvoicePreview"));
const AdminSecurityDiagnostics = lazy(() => import("./pages/admin/SecurityDiagnostics"));
const AdminSmsLogs = lazy(() => import("./pages/admin/SmsLogs"));
const AdminEmailSettings = lazy(() => import("./pages/admin/EmailSettings"));
const AdminHomeMerchandising = lazy(() => import("./pages/admin/HomeMerchandising"));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — reduces repeated network calls (site_settings, categories, etc.)
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-accent" aria-label="Loading" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DeliveryLocationProvider>
        <CartProvider>
      <TooltipProvider>
        <SecurityHeaders />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <RouteCanonical />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/rfq" element={<RFQ />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/courier-tracking" element={<CourierTracking />} />
              <Route path="/help" element={<Help />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/pwa-diagnostics" element={<PWADiagnosticsPage />} />
              <Route path="/seo-checklist" element={<SEOChecklist />} />
              <Route path="/guides/bamboo-towels-benefits" element={<Navigate to="/guides/bamboo-vs-cotton-towels" replace />} />
              <Route path="/guides/bamboo-vs-cotton-towels" element={<BambooVsCottonGuide />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="/connect" element={<Connect />} />
              <Route path="/track-order" element={<CourierTracking />} />
              <Route path="/track-order/:orderNumber" element={<CourierTracking />} />
              <Route path="/privacy-policy" element={<PageContent pageKey="privacy_policy" title="Privacy Policy" description="How Prasadam collects, uses, stores, and protects your personal data — including cookies, order history, and marketing preferences." />} />
              <Route path="/terms-of-service" element={<PageContent pageKey="terms_of_service" title="Terms of Service" description="The terms governing your use of Prasadam — accounts, orders, payments, cancellations, and acceptable use of the marketplace." />} />
              <Route path="/payment-terms" element={<PageContent pageKey="payment_terms" title="Payment Terms" description="Accepted payment methods, invoicing rules, taxes, and refund timing for retail and wholesale orders on Prasadam." />} />
              <Route path="/shipping-delivery" element={<PageContent pageKey="shipping_delivery" title="Shipping & Delivery" description="Shipping timelines, courier partners, delivery charges, and how Prasadam handles delayed or damaged shipments across India." />} />
              <Route path="/shipping-policy" element={<Navigate to="/shipping-delivery" replace />} />
              <Route path="/return-policy" element={<Navigate to="/payment-terms" replace />} />


              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/new" element={<AdminUserCreate />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="rfq" element={<AdminRFQ />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="brands" element={<AdminBrands />} />
                <Route path="hero-slides" element={<AdminHeroSlides />} />
                <Route path="promo-banners" element={<AdminPromoBanners />} />
                <Route path="home-merchandising" element={<AdminHomeMerchandising />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="pincodes" element={<AdminPincodes />} />
                <Route path="chat" element={<AdminChat />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="offers" element={<AdminOffers />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="custom-tabs" element={<AdminCustomTabs />} />
                
                <Route path="reels" element={<AdminReels />} />
                <Route path="roles" element={<AdminRoles />} />
                <Route path="diagnostics" element={<AdminDiagnostics />} />
                <Route path="security-diagnostics" element={<AdminSecurityDiagnostics />} />
                <Route path="contact-inquiries" element={<AdminContactInquiries />} />
                <Route path="ekart-logs" element={<AdminEkartLogs />} />
                <Route path="ekart-settings" element={<AdminEkartSettings />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="family-testimonials" element={<AdminFamilyTestimonials />} />
                <Route path="webhook-logs" element={<AdminWebhookLogs />} />
                 <Route path="otp-logs" element={<AdminOtpLogs />} />
                 <Route path="security-logs" element={<AdminSecurityLogs />} />
                 <Route path="sms-logs" element={<AdminSmsLogs />} />
                 <Route path="email-settings" element={<AdminEmailSettings />} />
                 <Route path="dev/invoice-preview" element={<InvoicePreview />} />
                 <Route path="dev/email-preview-internal" element={<EmailPreview />} />
                 
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          
          <BottomNavigation />
          <PWAInstallPrompt />
          <Suspense fallback={null}><VoiceAssistant /></Suspense>
        </BrowserRouter>

      </TooltipProvider>
        </CartProvider>
      </DeliveryLocationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
