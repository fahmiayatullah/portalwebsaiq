-- ===================================================================
-- MIGRATION: 20261012_student_account_management.sql
-- PERBAIKAN SISTEM 1 SISWA 1 AKUN & KEAMANAN AKUN NONAKTIF
-- SDI SAIQ AL-HIKMAH
-- ===================================================================

-- 1. Tambahkan kolom email pada tabel students (jika belum ada)
-- Memudahkan administrasi akun dan pengiriman instruksi reset password
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2. Pastikan relasi 1 Siswa = 1 Akun unik di tingkat database
-- Menghentikan kemungkinan satu akun auth digunakan oleh lebih dari satu siswa
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_auth_user_id_unique 
  ON public.students(auth_user_id) 
  WHERE auth_user_id IS NOT NULL;

-- 3. Perbarui fungsi get_student_id_by_auth agar HANYA mengembalikan ID siswa
-- jika status siswa adalah 'active'. Siswa yang dinonaktifkan secara otomatis
-- kehilangan akses query database ke seluruh tabel grades & teacher_notes.
CREATE OR REPLACE FUNCTION public.get_student_id_by_auth(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM public.students 
  WHERE auth_user_id = p_user_id 
    AND status = 'active' 
  LIMIT 1;
$$;

-- 4. Perbarui RLS Policy pada tabel students
-- Memastikan siswa inactive tidak dapat membaca data di luar status dirinya sendiri
DROP POLICY IF EXISTS "students_select_own_or_staff" ON public.students;

CREATE POLICY "students_select_own_or_staff" ON public.students
  FOR SELECT
  TO authenticated
  USING (
    students.auth_user_id = auth.uid()
    OR public.get_user_role(auth.uid()) IN ('admin', 'teacher')
  );

-- 5. Kebijakan RLS Tambahan: Pastikan siswa DILARANG KERAS memanipulasi role di tabel profiles
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    -- Siswa tidak boleh mengubah role dirinya sendiri menjadi admin/teacher
    AND (
      public.get_user_role(auth.uid()) = 'admin' 
      OR role = 'student'
    )
  );

-- 6. Verifikasi RLS pada tabel grades
-- Memastikan siswa hanya dapat melihat nilai miliknya sendiri yang sudah 'published'
DROP POLICY IF EXISTS "grades_select_policy" ON public.grades;

CREATE POLICY "grades_select_policy" ON public.grades
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
    OR (
      public.get_user_role(auth.uid()) = 'teacher'
      AND teacher_id = public.get_teacher_id_by_auth(auth.uid())
    )
    OR (
      public.get_user_role(auth.uid()) = 'student'
      AND student_id = public.get_student_id_by_auth(auth.uid())
      AND status = 'published'
    )
  );

-- Catatan Penerapan:
-- Jalankan migration SQL ini di Supabase SQL Editor / Dashboard proyek Anda.
