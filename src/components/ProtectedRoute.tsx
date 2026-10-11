import React, { type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { LoginPage } from '../pages/LoginPage';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, profile, loading, navigate, isConfigured, studentData, teacherData, signOut } = useAuth();

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

  // 3. Unauthenticated -> Langsung tampilkan form login tanpa halaman perantara (Autentikasi Diperlukan dihapus)
  if (!user) {
    const isOnlyAdmin = allowedRoles.length === 1 && allowedRoles[0] === 'admin';
    const isOnlyStudent = allowedRoles.length === 1 && allowedRoles[0] === 'student';
    return <LoginPage forcedType={isOnlyAdmin ? 'admin' : isOnlyStudent ? 'student' : undefined} />;
  }

  // 4. Role Authorization Check (Berdasarkan profil database terverifikasi)
  const currentRole = profile?.role;
  const isAuthorized = currentRole ? allowedRoles.includes(currentRole) : false;

  if (!currentRole || !isAuthorized) {
    const isStudentTryingAdmin = currentRole === 'student' && allowedRoles.includes('admin');
    const isAdminTryingStudent = currentRole === 'admin' && allowedRoles.includes('student');

    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 text-center">
          <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-1">Akses Tidak Diizinkan</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            {isStudentTryingAdmin
              ? 'Akun Anda adalah akun Siswa dan tidak memiliki kewenangan membuka Portal Administrasi Sekolah.'
              : isAdminTryingStudent
                ? 'Portal Siswa dikhususkan untuk akun santri/siswa dengan identitas profil akademik aktif. Untuk memantau nilai seluruh siswa, gunakan Portal Admin.'
                : `Peran akun Anda (${currentRole || 'Belum Terdaftar'}) tidak memiliki izin untuk mengakses halaman ini.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                if (currentRole === 'student') navigate('/portal/siswa');
                else if (currentRole === 'teacher') navigate('/portal/guru');
                else if (currentRole === 'admin') navigate('/portal/admin');
                else if (currentRole === 'parent') navigate('/portal/wali');
                else navigate('/');
              }}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Ke Portal Saya ({currentRole ? currentRole.toUpperCase() : 'Beranda'})
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Web Utama</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Khusus Siswa: Validasi Profil Akademik & Status Akun (1 Siswa = 1 Akun Aktif)
  if (currentRole === 'student') {
    // Akun auth belum memiliki tautan record di tabel students
    if (!studentData) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-200 text-center">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Profil Siswa Belum Ditautkan</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Akun autentikasi Anda (<span className="font-semibold text-slate-800">{user.email}</span>) telah terdaftar, namun belum memiliki profil akademik siswa yang tertaut di basis data sekolah.
              <br /><br />
              Silakan hubungi bagian Tata Usaha / Administrator SDI SAIQ AL-HIKMAH untuk mengaitkan akun Anda dengan NIS dan kelas yang sah.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => signOut('/login/siswa')}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Keluar & Ganti Akun
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Akun dinonaktifkan oleh administrator
    if (studentData.status === 'inactive') {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-rose-200 text-center">
            <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Akun Siswa Dinonaktifkan</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Status akun siswa ananda <strong className="text-slate-800">{studentData.name}</strong> (NIS: {studentData.nis}) saat ini berstatus <strong>NONAKTIF</strong>.
              <br /><br />
              Akses ke ruang portal nilai dibatasi. Silakan hubungi bagian administrasi madrasah untuk mengaktifkan kembali akun ananda.
            </p>
            <button
              onClick={() => signOut('/login/siswa')}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Keluar dari Sistem
            </button>
          </div>
        </div>
      );
    }
  }

  // 5.B Khusus Guru: Validasi Profil Pendidik & Status Akun (1 Guru = 1 Akun Aktif)
  if (currentRole === 'teacher') {
    if (!teacherData) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-200 text-center">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Profil Guru Belum Ditautkan</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Akun autentikasi Anda (<span className="font-semibold text-slate-800">{user.email}</span>) telah terdaftar, namun belum memiliki profil guru yang tertaut di basis data sekolah.
              <br /><br />
              Silakan hubungi Administrator SDI SAIQ AL-HIKMAH untuk mengaitkan akun Anda dengan NIP dan identitas guru yang sah.
            </p>
            <button
              onClick={() => signOut('/login/guru')}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Keluar & Ganti Akun
            </button>
          </div>
        </div>
      );
    }

    if (teacherData.status === 'inactive') {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-rose-200 text-center">
            <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Akun Guru Dinonaktifkan</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Status akun guru <strong className="text-slate-800">{teacherData.name}</strong> (NIP: {teacherData.nip}) saat ini berstatus <strong>NONAKTIF</strong>.
              <br /><br />
              Akses ke Portal Guru dibatasi. Silakan hubungi bagian administrasi sekolah untuk mengaktifkan kembali akun Anda.
            </p>
            <button
              onClick={() => signOut('/login/guru')}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Keluar dari Sistem
            </button>
          </div>
        </div>
      );
    }
  }

  // 6. Authorized & Validated
  return <>{children}</>;
};
