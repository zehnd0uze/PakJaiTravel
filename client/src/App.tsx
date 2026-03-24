import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { Hotels } from './pages/Hotels';
import { HotelDetail } from './pages/HotelDetail';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import HostDashboard from './pages/HostDashboard';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminHotels } from './pages/admin/AdminHotels';
import { AdminHotelEdit } from './pages/admin/AdminHotelEdit';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminLogin } from './pages/admin/AdminLogin';
import { MobileBottomNav } from './components/MobileBottomNav';

// Lightweight component to pig the server on every page navigation
const TrafficTracker = () => {
  const location = useLocation();
  useEffect(() => {
    fetch('/api/track', { method: 'POST' }).catch(() => {});
  }, [location.pathname]);
  return null;
};

function App() {
  return (
    <BrowserRouter>
      <TrafficTracker />
      <AuthProvider>
        <div className="app-container">
          <Routes>
            {/* Auth pages render without header/footer */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin panel — separate layout (Protected internally) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="hotels" element={<AdminHotels />} />
              <Route path="hotels/:id/edit" element={<AdminHotelEdit />} />
              <Route path="hotels/new" element={<AdminHotelEdit />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>

            {/* Main public layout */}
            <Route
              path="*"
              element={
                <>
                  <Header />
                  <main>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/community" element={<CommunityPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/dashboard" element={<HostDashboard />} />
                      <Route path="/hotels" element={<Hotels />} />
                      <Route path="/hotels/:id" element={<HotelDetail />} />
                    </Routes>
                  </main>
                  <Footer />
                  <MobileBottomNav />
                </>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
