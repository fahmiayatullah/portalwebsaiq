import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile, Student, Teacher, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  studentData: Student | null;
  teacherData: Teacher | null;
  role: UserRole | null;
  loading: boolean;
  isConfigured: boolean;
  currentPath: string;
  navigate: (path: string) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  externalExamUrl: string;
  openExternalExam: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseConfigured();

  // Browser path management
  const getInitialPath = (): string => {
    if (typeof window === 'undefined') return '/';
    const path = window.location.pathname;
    if (path.startsWith('/portal')) return path;
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('/portal')) return hash;
    return path || '/';
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [teacherData, setTeacherData] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const externalExamUrl = import.meta.env.VITE_EXTERNAL_EXAM_URL || 'https://cbt.sdisaiqalhikmah.sch.id';

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openExternalExam = () => {
    window.open(externalExamUrl, '_blank', 'noopener,noreferrer');
  };

  // Popstate listener for back/forward browser buttons
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      if (p.startsWith('/portal')) {
        setCurrentPath(p);
      } else {
        const hash = window.location.hash.replace('#', '');
        setCurrentPath(hash.startsWith('/portal') ? hash : p || '/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch verified profile and role-specific identity from Supabase
  const fetchUserData = async (authUser: User | null) => {
    if (!authUser || !isConfigured) {
      setProfile(null);
      setStudentData(null);
      setTeacherData(null);
      return;
    }

    try {
      // 1. Ambil profile dari public.profiles
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profError) {
        console.error('Error fetching profile:', profError.message);
      }

      if (prof) {
        setProfile(prof as Profile);

        // 2. Jika role adalah student, cari data di public.students
        if (prof.role === 'student') {
          const { data: std, error: stdError } = await supabase
            .from('students')
            .select('*, classes(name)')
            .eq('auth_user_id', authUser.id)
            .maybeSingle();

          if (!stdError && std) {
            setStudentData({
              ...std,
              className: (std as any).classes?.name || 'Kelas Belum Ditentukan',
            });
          }
        }

        // 3. Jika role adalah teacher, cari data di public.teachers
        if (prof.role === 'teacher') {
          const { data: tch, error: tchError } = await supabase
            .from('teachers')
            .select('*')
            .eq('auth_user_id', authUser.id)
            .maybeSingle();

          if (!tchError && tch) {
            setTeacherData(tch as Teacher);
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error loading user identity:', err);
    }
  };

  // Listen to Supabase Auth state changes
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Inisialisasi session pertama kali
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      setUser(initSession?.user ?? null);
      if (initSession?.user) {
        fetchUserData(initSession.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchUserData(newSession.user);
      } else {
        setProfile(null);
        setStudentData(null);
        setTeacherData(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (!isConfigured) {
      return {
        error: new Error('Supabase belum dikonfigurasi. Harap isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local.')
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchUserData(data.user);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error('Gagal masuk ke sistem.') };
    }
  };

  const signOut = async () => {
    if (isConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setStudentData(null);
    setTeacherData(null);
    navigate('/portal/login');
  };

  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    if (!isConfigured) {
      return { error: new Error('Supabase belum dikonfigurasi.') };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/portal/reset-password`,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        studentData,
        teacherData,
        role: profile?.role ?? null,
        loading,
        isConfigured,
        currentPath,
        navigate,
        signIn,
        signOut,
        resetPassword,
        refreshProfile,
        externalExamUrl,
        openExternalExam,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
