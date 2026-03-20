import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { Hotels } from './pages/Hotels';
import { HotelDetail } from './pages/HotelDetail';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminHotels } from './pages/admin/AdminHotels';
import { AdminHotelEdit } from './pages/admin/AdminHotelEdit';
import { AdminUsers } from './pages/admin/AdminUsers';
import { MobileBottomNav } from './components/MobileBottomNav';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <Routes>
            {/* Auth pages render without header/footer */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Admin panel — separate layout */}
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
