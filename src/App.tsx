import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { PortalGateway } from './pages/PortalGateway';
import { LoginPage } from './pages/LoginPage';
import { StudentPortal } from './pages/StudentPortal';
import { TeacherPortal } from './pages/TeacherPortal';
import { ParentPortal } from './pages/ParentPortal';
import { AdminPortal } from './pages/AdminPortal';

const AppRouter: React.FC = () => {
  const { currentPath } = useAuth();

  // Public Gateway & Login
  if (currentPath === '/portal' || currentPath === '/portal/') {
    return <PortalGateway />;
  }
  if (currentPath === '/portal/login') {
    return <LoginPage />;
  }

  // Protected Role-based Portals
  if (currentPath.startsWith('/portal/siswa')) {
    return (
      <ProtectedRoute allowedRoles={['student', 'admin']}>
        <StudentPortal />
      </ProtectedRoute>
    );
  }

  if (currentPath.startsWith('/portal/guru')) {
    return (
      <ProtectedRoute allowedRoles={['teacher', 'admin']}>
        <TeacherPortal />
      </ProtectedRoute>
    );
  }

  if (currentPath.startsWith('/portal/wali')) {
    return (
      <ProtectedRoute allowedRoles={['parent', 'admin']}>
        <ParentPortal />
      </ProtectedRoute>
    );
  }

  if (currentPath.startsWith('/portal/admin')) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminPortal />
      </ProtectedRoute>
    );
  }

  // Default to Main Landing Page
  return <LandingPage />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}