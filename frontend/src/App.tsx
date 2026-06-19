import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import TeachingPreparation from './pages/TeachingPreparation';
import LessonCreate from '@/pages/Lessons/Create';

const LessonCreateWrapper: React.FC = () => {
  const location = useLocation();
  return <LessonCreate key={location.search} />;
};
import LessonDetail from '@/pages/Lessons/Detail';
import LessonEdit from '@/pages/Lessons/Edit';
import SyncEdit from '@/pages/Lessons/SyncEdit';
import LessonGenerate from '@/pages/Lessons/Generate';
import Resources from '@/pages/Resources';
import Portfolios from '@/pages/Portfolios';
import PortfolioView from '@/pages/PortfolioView';
import PPT from '@/pages/PPT';
import PPTDetail from '@/pages/PPTDetail';
import Profile from '@/pages/Profile';
import KnowledgeBase from '@/pages/KnowledgeBase';
import UserManagement from '@/pages/Admin/UserManagement';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" /> : <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/teaching-preparation" element={<ProtectedRoute><TeachingPreparation /></ProtectedRoute>} />
          <Route
            path="/lessons/create"
            element={
              <ProtectedRoute>
                <LessonCreateWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lessons/:id"
            element={
              <ProtectedRoute>
                <LessonDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lessons/:id/edit"
            element={
              <ProtectedRoute>
                <LessonEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lessons/sync"
            element={
              <ProtectedRoute>
                <SyncEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lessons/:id/sync"
            element={
              <ProtectedRoute>
                <SyncEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lessons/generate"
            element={
              <ProtectedRoute>
                <LessonGenerate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <Resources />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolios"
            element={
              <ProtectedRoute>
                <Portfolios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolios/:id/view"
            element={
              <PortfolioView />
            }
          />
          <Route
            path="/ppt"
            element={
              <ProtectedRoute>
                <PPT />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ppt/:id"
            element={
              <ProtectedRoute>
                <PPTDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge-base"
            element={
              <ProtectedRoute>
                <KnowledgeBase />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
