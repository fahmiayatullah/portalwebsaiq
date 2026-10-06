import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Cek apakah Supabase telah dikonfigurasi dengan URL dan key yang valid.
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-or-publishable-key-here' &&
    supabaseAnonKey !== 'your-anon-key-here'
  );
};

// Gunakan URL & Key fallback aman jika env belum diisi agar createClient tidak crash saat bundle init
const safeUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder-project.supabase.co';
const safeKey = isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key-1234567890';

/**
 * Supabase Client Resmi untuk SDI SAIQ AL-HIKMAH
 * Menggunakan persistSession: true dan autoRefreshToken: true untuk mengelola sesi pengguna.
 */
export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});
