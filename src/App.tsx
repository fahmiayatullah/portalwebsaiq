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

  // 1. Dedicated & Public Logins
  if (currentPath === '/login/admin' || currentPath.startsWith('/login/admin/')) {
    return <LoginPage forcedType="admin" />;
  }
  if (currentPath === '/login/siswa' || currentPath.startsWith('/login/siswa/')) {
    return <LoginPage forcedType="student" />;
  }
  if (currentPath === '/login/guru' || currentPath.startsWith('/login/guru/')) {
    return <LoginPage forcedType="teacher" />;
  }
  if (currentPath === '/portal/login' || currentPath === '/login' || currentPath === '/login/') {
    return <LoginPage />;
  }

  // 2. Public Portal Gateway
  if (currentPath === '/portal' || currentPath === '/portal/') {
    return <PortalGateway />;
  }

  // 3. Portal Siswa (Langsung masuk ke Portal Siswa tanpa hambatan)
  if (currentPath.startsWith('/portal/siswa')) {
    return <StudentPortal />;
  }

  // 4. Portal Administrator (Eksklusif Hak Akses Admin Terverifikasi)
  if (currentPath.startsWith('/portal/admin')) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminPortal />
      </ProtectedRoute>
    );
  }

  // 5. Portal Dewan Guru & Tenaga Pendidik
  if (currentPath.startsWith('/portal/guru')) {
    return (
      <ProtectedRoute allowedRoles={['teacher', 'admin']}>
        <TeacherPortal />
      </ProtectedRoute>
    );
  }

  // 6. Portal Wali Murid
  if (currentPath.startsWith('/portal/wali')) {
    return (
      <ProtectedRoute allowedRoles={['parent', 'admin']}>
        <ParentPortal />
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