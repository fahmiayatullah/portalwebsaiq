-- ===================================================================
-- MIGRATION: 20261012_teacher_account_management.sql
-- PERBAIKAN SISTEM AUTENTIKASI 1 GURU 1 AKUN & RELASI AUTH_USER_ID
-- SDI SAIQ AL-HIKMAH
-- ===================================================================

-- 1. Tambahkan kolom email dan status pada tabel teachers (jika belum ada)
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 2. Pastikan kolom auth_user_id pada teachers dan students mengizinkan NULL
-- agar admin dapat mendaftarkan guru/siswa terlebih dahulu sebelum akun auth dibuat
ALTER TABLE public.teachers ALTER COLUMN auth_user_id DROP NOT NULL;
ALTER TABLE public.students ALTER COLUMN auth_user_id DROP NOT NULL;

-- 3. Pastikan relasi 1 Guru = 1 Akun unik di tingkat database (independen dan eksklusif)
CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_auth_user_id_unique 
  ON public.teachers(auth_user_id) 
  WHERE auth_user_id IS NOT NULL;

-- 4. Perbarui fungsi get_teacher_id_by_auth agar HANYA mengembalikan ID guru
-- jika status guru adalah 'active'. Guru yang dinonaktifkan secara otomatis
-- kehilangan akses query database ke penginputan nilai dan portal guru.
CREATE OR REPLACE FUNCTION public.get_teacher_id_by_auth(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM public.teachers 
  WHERE auth_user_id = p_user_id 
    AND (status IS NULL OR status = 'active')
  LIMIT 1;
$$;

-- 5. Kebijakan RLS pada tabel teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teachers_select_all" ON public.teachers;
CREATE POLICY "teachers_select_all" ON public.teachers
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "teachers_admin_manage" ON public.teachers;
CREATE POLICY "teachers_admin_manage" ON public.teachers
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- 6. Trigger untuk memastikan profiles.role guru konsisten
CREATE OR REPLACE FUNCTION public.sync_teacher_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.auth_user_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET role = 'teacher', updated_at = now() 
    WHERE id = NEW.auth_user_id AND role <> 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_teacher_profile_role ON public.teachers;
CREATE TRIGGER trg_sync_teacher_profile_role
  AFTER INSERT OR UPDATE OF auth_user_id ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_teacher_profile_role();
