import React from 'react';
import {
  LogOut, ArrowLeft, GraduationCap, UserCheck, Users, ShieldCheck, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface PortalHeaderProps {
  title: string;
  subtitle?: string;
  activeRole: UserRole;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({ title, subtitle, activeRole }) => {
  const {
    profile,
    studentData,
    teacherData,
    navigate,
    signOut,
  } = useAuth();

  const roleLabels: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
    student: { label: 'Siswa', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    teacher: { label: 'Guru', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <UserCheck className="w-3.5 h-3.5" /> },
    parent: { label: 'Wali Murid', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Users className="w-3.5 h-3.5" /> },
    admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  };

  const displayName = profile?.full_name || studentData?.name || teacherData?.name || 'Pengguna';
  const displayIdentifier = studentData?.nis ? `NIS: ${studentData.nis}` : teacherData?.nip ? `NIP: ${teacherData.nip}` : profile?.role;
  const avatarUrl = studentData?.photo_url || teacherData?.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256';

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-4 md:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Branding & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors hidden sm:flex items-center gap-1.5 text-xs font-bold"
            title="Ke Website Utama"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Web Utama</span>
          </button>
          
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {title}
              </h1>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${roleLabels[activeRole]?.color || 'bg-slate-100 text-slate-800'}`}>
                {roleLabels[activeRole]?.icon}
                <span>{roleLabels[activeRole]?.label || activeRole}</span>
              </span>
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 hidden md:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Authenticated User Info & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-2">
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-extrabold text-slate-800 leading-tight truncate max-w-[140px]">
                {displayName}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold truncate max-w-[140px]">
                {displayIdentifier}
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
              title="Keluar / Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
