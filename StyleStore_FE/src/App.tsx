import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPasswordPage from './pages/Auth/ForgotPassword.page';
import VerifyOtpPage from './pages/Auth/VerifyOtp.page';
import ResetPasswordPage from './pages/Auth/ResetPassword.page';
import Home from './pages/Customer/Home/Home.page';
import ProductDetail from './pages/Customer/ProductDetail/ProductDetail.page';
import CartPage from './pages/Customer/Cart/Cart.page';
import ProfilePage from './pages/Customer/Profile/Profile.page';
import UserManager from './pages/Admin/UserManage/UserManager.page';
import ProductManager from './pages/Admin/ProductManage/ProductManage.page';
import DashboardPage from './pages/Admin/Dashboard/Dashboard.page';
import OrderManage from './pages/Admin/OrderManage/OrderManage.page';
import SupportChatPage from './pages/Admin/SupportChat/SupportChat.page';
import OrderPage from './pages/Customer/Order/Order.page';
import OAuth2CallbackPage from './pages/Auth/OAuth2Callback';
import SearchPage from './pages/Customer/Search/Search.page';
import CategoryManager from './pages/Admin/CategoryManage/CategoryManage.page';
import PromotionManage from './pages/Admin/PromotionManage/PromotionManage.page';
import SupplierManagePage from './pages/Admin/SupplierManage/SupplierManage.page';
import ImportReceiptManage from './pages/Admin/ImportReceiptManage/ImportReceiptManage.page';
import SupportChatWidget from './components/SupportChatWidget';
import { getAuthToken, getCurrentUserRole } from './services/auth';
import NotFoundPage from './pages/NotFound.page';
import AIChatPage from './pages/Customer/AIChat/AIChat.page';

const RequireAdminRoute: React.FC = () => {
  const token = getAuthToken();
  const role = getCurrentUserRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId="703295823587-dfr3saq3amv8s0on50caab431g0efl72.apps.googleusercontent.com">
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/oauth2-callback" element={<OAuth2CallbackPage />} />

          {/* Admin Routes */}
          <Route element={<RequireAdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/user-manager" element={<UserManager />} />
              <Route path="/admin/product-manager" element={<ProductManager />} />
              <Route path='/admin/category-manager' element={<CategoryManager />} />
              <Route path='/admin/promotion-manager' element={<PromotionManage />} />
              <Route path='/admin/supplier-manager' element={<SupplierManagePage />} />
              <Route path='/admin/import-receipt-manager' element={<ImportReceiptManage />} />
              <Route path="/admin/order-manager" element={<OrderManage />} />
              <Route path="/admin/support-chat" element={<SupportChatPage />} />
            </Route>
          </Route>

          {/* Customer Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path='/orders' element={<OrderPage />} />
          <Route path="/ai-consultant" element={<AIChatPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <SupportChatWidget />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

export default App;
