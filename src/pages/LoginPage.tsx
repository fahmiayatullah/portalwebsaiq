import React, { useState } from 'react';
import {
  Lock, ArrowRight, ArrowLeft, School, Eye, EyeOff,
  AlertCircle, CheckCircle2, Loader2, HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { signIn, resetPassword, navigate, isConfigured, profile, user } = useAuth();

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

  // If already logged in, redirect to appropriate portal
  React.useEffect(() => {
    if (user && profile) {
      if (profile.role === 'student') navigate('/portal/siswa');
      else if (profile.role === 'teacher') navigate('/portal/guru');
      else if (profile.role === 'admin') navigate('/portal/admin');
      else if (profile.role === 'parent') navigate('/portal/wali');
    }
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Harap isi alamat email dan kata sandi.');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setErrorMessage('Email atau kata sandi tidak sesuai. Pastikan akun telah didaftarkan oleh admin sekolah.');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 flex flex-col justify-center items-center p-4 relative font-sans">
      {/* Background Decor */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none"></div>

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs md:text-sm font-bold text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Website Utama</span>
        </button>
      </div>

      <div className="w-full max-w-md my-12 relative z-10">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 text-slate-800">
          {/* Logo & School Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg mb-3">
              <School className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SDI SAIQ AL-HIKMAH</h1>
            <p className="text-xs text-slate-500 mt-0.5">Portal Informasi Akademik Resmi</p>
          </div>

          {/* Not Configured Alert */}
          {!isConfigured && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Supabase Belum Dikonfigurasi:</strong>
                <p className="mt-1">
                  Harap atur <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">VITE_SUPABASE_URL</code> dan <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">VITE_SUPABASE_ANON_KEY</code> pada berkas <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">.env.local</code> Anda.
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
                  Alamat Email Akun
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                  placeholder="nama@sdisaiqalhikmah.sch.id"
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
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium pr-10"
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
                className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Masuk ke Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Forgot Password Form */
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="text-xs text-slate-600 mb-2">
                Masukkan alamat email yang terdaftar pada sistem sekolah untuk menerima tautan pemulihan kata sandi Supabase Auth.
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
                  placeholder="email@sekolah.sch.id"
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
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Tautan Reset'}
                </button>
              </div>
            </form>
          )}

          {/* School Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Belum memiliki akun?</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Akun siswa dan dewan guru dibuat dan dikelola langsung oleh pihak administrasi sekolah. Silakan hubungi bagian TU untuk informasi kredensial resmi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
