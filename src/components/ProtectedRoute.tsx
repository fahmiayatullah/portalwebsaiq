import React, { type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, profile, loading, navigate, isConfigured } = useAuth();

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-700">Memeriksa sesi autentikasi Supabase...</p>
        <p className="text-xs text-slate-400 mt-1">SDI SAIQ AL-HIKMAH</p>
      </div>
    );
  }

  // 2. Unconfigured State Warning
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-xl border border-amber-200 text-center">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 mb-2">Supabase Belum Dikonfigurasi</h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            Untuk menggunakan autentikasi nyata, silakan masukkan URL dan Anon Key proyek Supabase Anda ke dalam file <code className="bg-slate-100 px-2 py-0.5 rounded text-emerald-700 font-mono">.env.local</code>.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // 3. Unauthenticated -> Redirect to Login
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-xl border border-slate-200 text-center">
          <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 mb-2">Autentikasi Diperlukan</h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            Anda harus masuk menggunakan akun terdaftar untuk mengakses ruang portal ini.
          </p>
          <button
            onClick={() => navigate('/portal/login')}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
          >
            Masuk ke Halaman Login
          </button>
        </div>
      </div>
    );
  }

  // 4. Role Authorization Check (Berdasarkan profil database terverifikasi)
  const currentRole = profile?.role;
  if (!currentRole || !allowedRoles.includes(currentRole)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-xl border border-slate-200 text-center">
          <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 mb-1">Akses Tidak Diizinkan</h2>
          <p className="text-xs text-slate-500 mb-6">
            Peran akun Anda (<strong className="text-slate-800">{currentRole || 'Belum Terdaftar'}</strong>) tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (currentRole === 'student') navigate('/portal/siswa');
                else if (currentRole === 'teacher') navigate('/portal/guru');
                else if (currentRole === 'admin') navigate('/portal/admin');
                else if (currentRole === 'parent') navigate('/portal/wali');
                else navigate('/');
              }}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              Ke Portal Saya
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Web Utama</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Authorized
  return <>{children}</>;
};
