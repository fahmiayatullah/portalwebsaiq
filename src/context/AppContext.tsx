/**
 * @deprecated Legacy AppContext has been completely replaced by AuthContext (Supabase).
 * All authentication and data access now run through verified Supabase sessions.
 */
export { AuthProvider as AppProvider, useAuth as useApp } from './AuthContext';
