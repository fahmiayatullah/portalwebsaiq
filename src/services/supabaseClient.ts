/**
 * Supabase Client Configuration & Adapter for SDI SAIQ AL-HIKMAH
 * 
 * Mendukung integrasi backend Supabase melalui REST API atau environment variables.
 * Jika kredensial belum diisi, sistem otomatis menggunakan StorageService (LocalStorage terstruktur).
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL && 
    SUPABASE_ANON_KEY && 
    SUPABASE_URL !== 'https://your-project.supabase.co' &&
    SUPABASE_ANON_KEY !== 'your-anon-key-here'
  );
};

export const getSupabaseConfig = () => ({
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY,
  isConfigured: isSupabaseConfigured()
});

/**
 * Helper REST fetcher untuk Supabase jika SDK belum diinstall
 */
export async function fetchFromSupabase<T>(table: string, queryParams: string = ''): Promise<T[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${queryParams}`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn(`Supabase fetch failed for ${table}:`, res.statusText);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(`Error querying Supabase table ${table}:`, error);
    return null;
  }
}
