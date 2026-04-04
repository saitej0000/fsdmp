import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Auth } from './pages/Auth';
import { Upload } from './pages/Upload';
import { Profile } from './pages/Profile';
import { PostDetail } from './pages/PostDetail';
import { Messages } from './pages/Messages';
import { Notifications } from './pages/Notifications';
import { generateMockIndianAccounts } from './lib/mockData';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="explore" element={<Explore />} />
        <Route path="post/:id" element={<PostDetail />} />
        <Route path="upload" element={<Upload />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:id" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile/:id" element={<Profile />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  useEffect(() => {
    generateMockIndianAccounts();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
