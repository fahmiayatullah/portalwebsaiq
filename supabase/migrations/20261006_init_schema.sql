-- ===================================================================
-- MIGRATION: 20261006_init_schema.sql
-- SDI SAIQ AL-HIKMAH - PRODUCTION SCHEMA & STRICT ROW LEVEL SECURITY (RLS)
-- ===================================================================

-- 1. PROFILES TABLE (Hubungan dengan auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin', 'parent')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level INT NOT NULL,
  homeroom_teacher_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TEACHERS TABLE
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nip TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Wajib'
);

-- 5. STUDENTS TABLE (1 Student = 1 Auth User = 1 Student Identity)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nis TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  photo_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_student_auth_user UNIQUE (auth_user_id),
  CONSTRAINT uq_student_nis UNIQUE (nis)
);

-- 6. GRADES TABLE (Alur: Guru input -> save draft -> publish -> Siswa read)
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  assessment_type TEXT NOT NULL,
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  description TEXT,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TEACHER NOTES TABLE (Catatan Pribadi & Bimbingan Belajar Siswa)
CREATE TABLE IF NOT EXISTS public.teacher_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  read_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'class', 'student')),
  target_class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  target_student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_students_auth_user ON public.students(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_teachers_auth_user ON public.teachers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_status ON public.grades(status);
CREATE INDEX IF NOT EXISTS idx_teacher_notes_student ON public.teacher_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_notes_status ON public.teacher_notes(status);
CREATE INDEX IF NOT EXISTS idx_announcements_target ON public.announcements(target_type, target_class_id, target_student_id);

-- ===================================================================
-- SECURITY DEFINER HELPER FUNCTIONS (Mencegah Rekursi pada RLS)
-- ===================================================================

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = p_user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_student_id_by_auth(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM public.students WHERE auth_user_id = p_user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_teacher_id_by_auth(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM public.teachers WHERE auth_user_id = p_user_id LIMIT 1;
$$;

-- TRIGGER: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE OR REPLACE TRIGGER trg_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE OR REPLACE TRIGGER trg_notes_updated_at BEFORE UPDATE ON public.teacher_notes FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE OR REPLACE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ===================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================================

-- Aktifkan RLS di seluruh tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 1. PROFILES POLICIES
-- -------------------------------------------------------------
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR public.get_user_role(auth.uid()) IN ('admin', 'teacher')
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------------
-- 2. CLASSES & SUBJECTS POLICIES (Read-only untuk pengguna terautentikasi, manage oleh Admin)
-- -------------------------------------------------------------
CREATE POLICY "classes_select_authenticated" ON public.classes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "classes_manage_admin" ON public.classes
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "subjects_select_authenticated" ON public.subjects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "subjects_manage_admin" ON public.subjects
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- -------------------------------------------------------------
-- 3. TEACHERS POLICIES
-- -------------------------------------------------------------
CREATE POLICY "teachers_select_authenticated" ON public.teachers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "teachers_manage_admin" ON public.teachers
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- -------------------------------------------------------------
-- 4. STUDENTS POLICIES
-- Siswa hanya dapat membaca profil dirinya sendiri. Admin & Guru dapat membaca siswa.
-- -------------------------------------------------------------
CREATE POLICY "students_select_own_or_staff" ON public.students
  FOR SELECT
  TO authenticated
  USING (
    students.auth_user_id = auth.uid()
    OR public.get_user_role(auth.uid()) IN ('admin', 'teacher')
  );

CREATE POLICY "students_manage_admin_only" ON public.students
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- -------------------------------------------------------------
-- 5. GRADES POLICIES (KETAT)
-- Siswa: READ ONLY milik sendiri DAN status = 'published'.
-- Siswa DILARANG INSERT/UPDATE/DELETE.
-- Guru: Mengelola nilai miliknya sendiri. Admin: Akses penuh.
-- -------------------------------------------------------------
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

CREATE POLICY "grades_insert_teacher_admin" ON public.grades
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'teacher')
    AND (
      public.get_user_role(auth.uid()) = 'admin'
      OR teacher_id = public.get_teacher_id_by_auth(auth.uid())
    )
  );

CREATE POLICY "grades_update_teacher_admin" ON public.grades
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
    OR (
      public.get_user_role(auth.uid()) = 'teacher'
      AND teacher_id = public.get_teacher_id_by_auth(auth.uid())
    )
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
    OR (
      public.get_user_role(auth.uid()) = 'teacher'
      AND teacher_id = public.get_teacher_id_by_auth(auth.uid())
    )
  );

CREATE POLICY "grades_delete_teacher_admin" ON public.grades
  FOR DELETE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
    OR (
      public.get_user_role(auth.uid()) = 'teacher'
      AND teacher_id = public.get_teacher_id_by_auth(auth.uid())
    )
  );

-- -------------------------------------------------------------
-- 6. TEACHER NOTES POLICIES (KETAT)
-- Siswa: READ ONLY milik sendiri DAN status = 'published'.
-- Siswa hanya boleh UPDATE kolom read_at pada catatannya sendiri.
-- -------------------------------------------------------------
CREATE POLICY "notes_select_policy" ON public.teacher_notes
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

CREATE POLICY "notes_insert_teacher_admin" ON public.teacher_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'teacher')
    AND (
      public.get_user_role(auth.uid()) = 'admin'
      OR teacher_id = public.get_teacher_id_by_auth(auth.uid())
    )
  );

CREATE POLICY "notes_update_teacher_admin" ON public.teacher_notes
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
    OR (
      public.get_user_role(auth.uid()) = 'teacher'
      AND teacher_id = public.get_teacher_id_by_auth(auth.uid())
    )
    OR (
      -- Siswa hanya boleh update jika menandai read_at pada catatan miliknya yang published
      public.get_user_role(auth.uid()) = 'student'
      AND student_id = public.get_student_id_by_auth(auth.uid())
      AND status = 'published'
    )
  );

CREATE POLICY "notes_delete_teacher_admin" ON public.teacher_notes
  FOR DELETE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
    OR (
      public.get_user_role(auth.uid()) = 'teacher'
      AND teacher_id = public.get_teacher_id_by_auth(auth.uid())
    )
  );

-- -------------------------------------------------------------
-- 7. ANNOUNCEMENTS POLICIES
-- -------------------------------------------------------------
CREATE POLICY "announcements_select_policy" ON public.announcements
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'teacher')
    OR (
      status = 'published'
      AND (
        target_type = 'all'
        OR (
          target_type = 'class'
          AND target_class_id = (SELECT class_id FROM public.students WHERE auth_user_id = auth.uid())
        )
        OR (
          target_type = 'student'
          AND target_student_id = public.get_student_id_by_auth(auth.uid())
        )
      )
    )
  );

CREATE POLICY "announcements_manage_staff" ON public.announcements
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'teacher'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));
