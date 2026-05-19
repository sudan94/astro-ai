import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PersonsPage } from './pages/PersonsPage';
import { PersonDetailPage } from './pages/PersonDetailPage';
import { PersonChatPage } from './pages/PersonChatPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LandingPage } from './pages/LandingPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { GOOGLE_CLIENT_ID } from './config/constants';

function App() {
  return (
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
