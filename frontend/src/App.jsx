import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PersonsPage } from './pages/PersonsPage';
import { PersonDetailPage } from './pages/PersonDetailPage';
import { PersonChatPage } from './pages/PersonChatPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LandingPage } from './pages/LandingPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { MatchPage } from './pages/MatchPage';
import { AdminPage } from './pages/AdminPage';
import { GOOGLE_CLIENT_ID } from './config/constants';
import { theme } from './theme';

const ADMIN_EMAIL = 'sudanupadhaya@gmail.com';

function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || user?.email !== ADMIN_EMAIL) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/persons"
              element={
                <ProtectedRoute>
                  <PersonsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/persons/:id"
              element={
                <ProtectedRoute>
                  <PersonDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/persons/:id/chat"
              element={
                <ProtectedRoute>
                  <PersonChatPage />
                </ProtectedRoute>
              }
            />
            <Route path='/user-profile' element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            } />
            <Route path='/match' element={
              <ProtectedRoute>
                <MatchPage />
              </ProtectedRoute>
            } />
            <Route path='/admin' element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

export default App;
