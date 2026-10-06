export type UserRole = 'student' | 'teacher' | 'admin' | 'parent';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  level: number;
  homeroom_teacher_id?: string | null;
  created_at?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: string;
}

export interface Teacher {
  id: string;
  auth_user_id: string;
  nip: string;
  name: string;
  title?: string | null;
  photo_url?: string | null;
  created_at?: string;
}

export interface Student {
  id: string;
  auth_user_id: string;
  nis: string;
  name: string;
  class_id?: string | null;
  className?: string; // Resolved from classes
  photo_url?: string | null;
  status: 'active' | 'inactive' | 'graduated';
  created_at?: string;
  updated_at?: string;
}

export interface Grade {
  id: string;
  student_id: string;
  teacher_id: string;
  subject_id: string;
  assessment_type: string;
  score: number;
  description?: string | null;
  assessment_date: string;
  status: 'draft' | 'published';
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined presentation fields
  subject?: Subject;
  teacher?: Teacher;
  student?: Student;
  subject_name?: string;
  teacher_name?: string;
  student_name?: string;
}

export interface TeacherNote {
  id: string;
  student_id: string;
  teacher_id: string;
  subject_id?: string | null;
  title: string;
  content: string;
  status: 'draft' | 'published';
  read_at?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined presentation fields
  subject?: Subject;
  teacher?: Teacher;
  student?: Student;
  subject_name?: string;
  teacher_name?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_type: 'all' | 'class' | 'student';
  target_class_id?: string | null;
  target_student_id?: string | null;
  created_by?: string | null;
  status: 'draft' | 'published';
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  author_name?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'grade' | 'note' | 'announcement';
}
