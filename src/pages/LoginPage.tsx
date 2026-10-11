import React, { useState, useEffect } from 'react';
import {
  Lock, ArrowRight, ArrowLeft, School, Eye, EyeOff,
  AlertCircle, CheckCircle2, Loader2, HelpCircle,
  ShieldCheck, GraduationCap, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  forcedType?: 'admin' | 'student' | 'teacher';
}

export const LoginPage: React.FC<LoginPageProps> = ({ forcedType }) => {
  const { signIn, resetPassword, navigate, isConfigured, profile, user, currentPath } = useAuth();

  // Deteksi tipe login dari prop atau URL rute
  const portalType: 'admin' | 'student' | 'teacher' | 'general' =
    forcedType ||
    (currentPath.includes('/login/admin')
      ? 'admin'
      : currentPath.includes('/login/siswa')
        ? 'student'
        : currentPath.includes('/login/guru')
          ? 'teacher'
          : 'general');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password mode
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Redirect terarah berdasarkan role database terverifikasi
  useEffect(() => {
    if (user && profile) {
      if (portalType === 'admin') {
        if (profile.role !== 'admin') {
          setErrorMessage('Akses Ditolak: Akun Anda bukan akun Administrator. Siswa silakan masuk melalui Portal Siswa.');
          return;
        }
        navigate('/portal/admin');
      } else if (portalType === 'student') {
        if (profile.role === 'admin') {
          navigate('/portal/admin');
          return;
        }
        if (profile.role !== 'student') {
          setErrorMessage('Akun ini bukan akun Siswa terdaftar. Silakan gunakan portal yang sesuai dengan hak akses Anda.');
          return;
        }
        navigate('/portal/siswa');
      } else if (portalType === 'teacher') {
        if (profile.role === 'admin') {
          navigate('/portal/admin');
          return;
        }
        if (profile.role !== 'teacher') {
          setErrorMessage('Akun ini bukan akun Dewan Guru terdaftar.');
          return;
        }
        navigate('/portal/guru');
      } else {
        // Rute umum /portal/login
        if (profile.role === 'student') navigate('/portal/siswa');
        else if (profile.role === 'teacher') navigate('/portal/guru');
        else if (profile.role === 'admin') navigate('/portal/admin');
        else if (profile.role === 'parent') navigate('/portal/wali');
      }
    }
  }, [user, profile, portalType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Harap isi alamat email dan kata sandi akun.');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setErrorMessage('Email atau kata sandi tidak cocok. Pastikan akun telah didaftarkan resmi oleh admin sekolah.');
      } else {
        setErrorMessage(error.message);
      }
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetEmail) {
      setErrorMessage('Masukkan email akun yang terdaftar.');
      return;
    }

    setIsResetting(true);
    const { error } = await resetPassword(resetEmail);
    setIsResetting(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage('Tautan pemulihan kata sandi telah dikirim ke email Anda.');
      setShowForgotPassword(false);
      setResetEmail('');
    }
  };

  const isAdminView = portalType === 'admin';
  const isStudentView = portalType === 'student';
  const isTeacherView = portalType === 'teacher';

  const themeColors = isAdminView
    ? {
        bgGradient: 'from-purple-900 via-indigo-900 to-slate-900',
        cardBadgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        iconBg: 'from-purple-600 to-indigo-600',
        btnBg: 'bg-purple-600 hover:bg-purple-700',
        ringFocus: 'focus:ring-purple-500',
        textAccent: 'text-purple-700',
      }
    : isTeacherView
      ? {
          bgGradient: 'from-blue-900 via-indigo-950 to-slate-900',
          cardBadgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
          iconBg: 'from-blue-600 to-cyan-600',
          btnBg: 'bg-blue-600 hover:bg-blue-700',
          ringFocus: 'focus:ring-blue-500',
          textAccent: 'text-blue-700',
        }
      : {
          bgGradient: 'from-emerald-800 via-emerald-700 to-teal-900',
          cardBadgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          iconBg: 'from-emerald-600 to-teal-500',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700',
          ringFocus: 'focus:ring-emerald-500',
          textAccent: 'text-emerald-700',
        };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeColors.bgGradient} flex flex-col justify-center items-center p-4 relative font-sans`}>
      {/* Background Decor */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none"></div>

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs md:text-sm font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Website Utama</span>
        </button>
      </div>

      <div className="w-full max-w-md my-12 relative z-10">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 text-slate-800">
          {/* Logo & School Header */}
          <div className="text-center mb-6">
            <div className={`w-14 h-14 bg-gradient-to-tr ${themeColors.iconBg} rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg mb-3`}>
              {isAdminView ? (
                <ShieldCheck className="w-7 h-7" />
              ) : isStudentView ? (
                <GraduationCap className="w-7 h-7" />
              ) : isTeacherView ? (
                <UserCheck className="w-7 h-7" />
              ) : (
                <School className="w-7 h-7" />
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SDI SAIQ AL-HIKMAH</h1>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2 border ${themeColors.cardBadgeBg}">
              {isAdminView && <span>Portal Khusus Administrator Sekolah</span>}
              {isStudentView && <span>Ruang Informasi Akademik Pribadi Siswa</span>}
              {isTeacherView && <span>Ruang Penilaian & Bimbingan Dewan Guru</span>}
              {!isAdminView && !isStudentView && !isTeacherView && <span>Portal Informasi Akademik Terpadu</span>}
            </div>
          </div>

          {/* Tab Pemilih Cepat jika di /portal/login */}
          {!isAdminView && !isStudentView && (
            <div className="flex rounded-2xl bg-slate-100 p-1 mb-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => navigate('/login/siswa')}
                className="flex-1 py-2 rounded-xl transition-all text-slate-600 hover:text-emerald-700 flex items-center justify-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Portal Siswa</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/login/admin')}
                className="flex-1 py-2 rounded-xl transition-all text-slate-600 hover:text-purple-700 flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Portal Admin</span>
              </button>
            </div>
          )}

          {/* Not Configured Alert */}
          {!isConfigured && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Supabase Belum Dikonfigurasi:</strong>
                <p className="mt-1">
                  Harap atur <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">VITE_SUPABASE_URL</code> dan <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">VITE_SUPABASE_ANON_KEY</code> pada berkas <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">.env.local</code>.
                </p>
              </div>
            </div>
          )}

          {/* Error / Success Feedback */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          {!showForgotPassword ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAdminView ? 'Email Administrator' : isStudentView ? 'Email Akun Siswa' : 'Alamat Email Terdaftar'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 ${themeColors.ringFocus} focus:border-transparent font-medium`}
                  placeholder={isAdminView ? 'admin@sdisaiqalhikmah.sch.id' : 'siswa@sdisaiqalhikmah.sch.id'}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setShowForgotPassword(true);
                    }}
                    className={`text-[11px] font-bold ${themeColors.textAccent} hover:underline`}
                  >
                    Lupa Sandi?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className={`w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 ${themeColors.ringFocus} focus:border-transparent font-medium pr-10`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 rounded-xl font-bold text-white ${themeColors.btnBg} shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-70`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{isAdminView ? 'Masuk Portal Admin' : isStudentView ? 'Masuk Portal Siswa' : 'Masuk ke Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Forgot Password Form */
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="text-xs text-slate-600 mb-2 leading-relaxed">
                Masukkan alamat email yang terdaftar untuk menerima tautan pemulihan kata sandi Supabase Auth resmi.
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Akun Terdaftar
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  disabled={isResetting}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  placeholder="nama@sdisaiqalhikmah.sch.id"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={isResetting}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className={`flex-1 py-2.5 rounded-xl ${themeColors.btnBg} text-white font-bold text-xs shadow-md flex items-center justify-center gap-2`}
                >
                  {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Tautan Reset'}
                </button>
              </div>
            </form>
          )}

          {/* Switcher & Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center gap-2 text-center">
            {isAdminView ? (
              <button
                onClick={() => navigate('/login/siswa')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors flex items-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Bukan Administrator? Masuk ke Portal Siswa</span>
              </button>
            ) : isStudentView ? (
              <button
                onClick={() => navigate('/login/admin')}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk sebagai Administrator Sekolah</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/portal')}
                className="text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
              >
                Lihat Panduan Ruang Portal
              </button>
            )}

            <div className="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-2">
              <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
              <span>Akun dikelola oleh Administrasi SDI SAIQ Al-Hikmah</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
