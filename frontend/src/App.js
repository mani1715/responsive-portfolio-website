import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Portfolio from './pages/PortfolioNew';
import PortfolioItem from './pages/PortfolioItemPage';
import Contact from './pages/Contact';
import Chat from './pages/Chat';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import SubmitTestimonial from './pages/SubmitTestimonial';
import ClientLogin from './pages/ClientLogin';
import ClientDashboard from './pages/ClientDashboard';
import SecurityPrivacy from './pages/SecurityPrivacy';
import { Toaster } from './components/ui/sonner';
import { CartProvider } from './context/CartContext';
import { AdminProvider } from './admin/context/AdminContext';

// E-commerce Demo Pages
import EcommerceHome from './demos/ecommerce/EcommerceHome';
import EcommerceShop from './demos/ecommerce/EcommerceShop';
import EcommerceProductDetail from './demos/ecommerce/EcommerceProductDetail';
import EcommerceCart from './demos/ecommerce/EcommerceCart';
import EcommerceCheckout from './demos/ecommerce/EcommerceCheckout';

// Corporate Demo Pages
import CorporateHome from './demos/corporate/CorporateHome';

// Mobile Design System Demo
import MobileDesignHome from './demos/mobile-design/MobileDesignHome';

// Restaurant Booking Demo
import RestaurantBookingHome from './demos/restaurant/RestaurantBookingHome';

// Hospitality Demo
import HospitalityHome from './demos/hospitality/HospitalityHome';

// SaaS Landing Demo
import SaasLandingHome from './demos/saas/SaasLandingHome';

// Social Media Management Demo
import SocialMediaHome from './demos/social-media/SocialMediaHome';

// Analytics Dashboard Demo
import AnalyticsDashboard from './demos/analytics/AnalyticsDashboard';

// LMS Demo Pages
import LmsHome from './demos/lms/LmsHome';
import LmsCourses from './demos/lms/LmsCourses';
import LmsCourseDetail from './demos/lms/LmsCourseDetail';

// Real Estate Demo Pages
import RealEstateHome from './demos/real-estate/RealEstateHome';
import RealEstateListings from './demos/real-estate/RealEstateListings';
import RealEstatePropertyDetail from './demos/real-estate/RealEstatePropertyDetail';

// Admin Pages
import AdminLogin from './admin/pages/Login';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import ContentEditor from './admin/pages/ContentEditor';
import StorageManager from './admin/pages/StorageManager';
import ServicesManager from './admin/pages/ServicesManager';
import PortfolioManager from './admin/pages/PortfolioManager';
import ContactManager from './admin/pages/ContactManager';
import SkillsManager from './admin/pages/SkillsManager';
import ChatManager from './admin/pages/ChatManager';
import AdminsManager from './admin/pages/AdminsManager';
import NotesManager from './admin/pages/NotesManager';
import AboutManager from './admin/pages/AboutManager';
import DemoManager from './admin/pages/DemoManager';
import Settings from './admin/pages/Settings';
import ContactPageManager from './admin/pages/ContactPageManager';
import BlogsManager from './admin/pages/BlogsManager';
import TestimonialsManager from './admin/pages/TestimonialsManager';
import NewsletterManager from './admin/pages/NewsletterManager';
import PricingSettings from './admin/pages/PricingSettings';
import Analytics from './admin/pages/Analytics';
import ClientsManager from './admin/pages/ClientsManager';
import ClientProjectsManager from './admin/pages/ClientProjectsManager';
import BookingsManager from './admin/pages/BookingsManager';
import BookingSettings from './admin/pages/BookingSettings';
import SecurityCenter from './admin/pages/SecurityCenter';

function AppContent() {
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  const isDemoRoute = location.pathname.startsWith('/demo/');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isClientWorkspace = location.pathname === '/client/dashboard';
  const showChatWidget = !isAdminRoute && !isClientWorkspace; // Show chat widget on all pages except admin

  return (
    <>
      {!isDemoRoute && !isAdminRoute && <Navbar />}
      <main id="main-content" tabIndex={-1} className={isDemoRoute || isAdminRoute ? "" : "main-content"}>
        <Routes>
          {/* Main Website Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:id" element={<PortfolioItem />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />
          <Route path="/submit-testimonial" element={<SubmitTestimonial />} />
          <Route path="/security" element={<SecurityPrivacy />} />

          {/* Client Portal Routes */}
          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />

          {/* E-commerce Demo Routes */}
          <Route path="/demo/ecommerce" element={<EcommerceHome />} />
          <Route path="/demo/ecommerce/shop" element={<EcommerceShop />} />
          <Route path="/demo/ecommerce/product/:slug" element={<EcommerceProductDetail />} />
          <Route path="/demo/ecommerce/cart" element={<EcommerceCart />} />
          <Route path="/demo/ecommerce/checkout" element={<EcommerceCheckout />} />

          {/* Corporate Demo Routes */}
          <Route path="/demo/corporate" element={<CorporateHome />} />

          {/* Mobile Design System Demo */}
          <Route path="/demo/mobile-design" element={<MobileDesignHome />} />
          <Route path="/demo/fitness-app" element={<MobileDesignHome />} />

          {/* Restaurant Booking Demo */}
          <Route path="/demo/restaurant-booking" element={<RestaurantBookingHome />} />
          <Route path="/demo/restaurant" element={<RestaurantBookingHome />} />

          {/* Hospitality Demo */}
          <Route path="/demo/hospitality" element={<HospitalityHome />} />

          {/* SaaS Landing Demo */}
          <Route path="/demo/saas-landing" element={<SaasLandingHome />} />

          {/* Social Media Management Demo */}
          <Route path="/demo/social-media" element={<SocialMediaHome />} />

          {/* Real-Time Analytics Dashboard Demo */}
          <Route path="/demo/analytics" element={<AnalyticsDashboard />} />

          {/* LMS Demo Routes */}
          <Route path="/demo/lms" element={<LmsHome />} />
          <Route path="/demo/lms/courses" element={<LmsCourses />} />
          <Route path="/demo/lms/course/:slug" element={<LmsCourseDetail />} />

          {/* Real Estate Demo Routes */}
          <Route path="/demo/real-estate" element={<RealEstateHome />} />
          <Route path="/demo/real-estate/listings" element={<RealEstateListings />} />
          <Route path="/demo/real-estate/property/:slug" element={<RealEstatePropertyDetail />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="about" element={<AboutManager />} />
            <Route path="contact-page" element={<ContactPageManager />} />
            <Route path="content" element={<ContentEditor />} />
            <Route path="services" element={<ServicesManager />} />
            <Route path="portfolio" element={<PortfolioManager />} />
            <Route path="blogs" element={<BlogsManager />} />
            <Route path="testimonials" element={<TestimonialsManager />} />
            <Route path="demos" element={<DemoManager />} />
            <Route path="contacts" element={<ContactManager />} />
            <Route path="skills" element={<SkillsManager />} />
            <Route path="newsletter" element={<NewsletterManager />} />
            <Route path="pricing" element={<PricingSettings />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="storage" element={<StorageManager />} />
            <Route path="chat" element={<ChatManager />} />
            <Route path="admins" element={<AdminsManager />} />
            <Route path="notes" element={<NotesManager />} />
            <Route path="clients" element={<ClientsManager />} />
            <Route path="client-projects" element={<ClientProjectsManager />} />
            <Route path="bookings" element={<BookingsManager />} />
            <Route path="booking-settings" element={<BookingSettings />} />
            <Route path="settings" element={<Settings />} />
            <Route path="security" element={<SecurityCenter />} />
          </Route>
        </Routes>
      </main>
      {!isDemoRoute && !isAdminRoute && !isClientWorkspace && <Footer />}
      {showChatWidget && <ChatWidget />}
      <Toaster />
    </>
  );
}

function App() {
  return (
    <AdminProvider>
      <CartProvider>
        <div className="App">
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppContent />
          </BrowserRouter>
        </div>
      </CartProvider>
    </AdminProvider>
  );
}

export default App;
