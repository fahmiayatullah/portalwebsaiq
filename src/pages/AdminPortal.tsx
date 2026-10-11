import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, UserCheck, BookOpen, Layers,
  Activity, School, Plus, ExternalLink, Loader2, AlertCircle,
  CheckCircle2, Trash2, Calendar, Newspaper, ArrowRight,
  Search, Filter, KeyRound, Mail,
  ToggleLeft, ToggleRight, FileSpreadsheet, Lock,
  Eye, EyeOff, UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PortalHeader } from '../components/PortalHeader';
import type {
  Student, Teacher, ClassRoom, Subject, Grade,
  NewsArticle, SchoolAgenda
} from '../types';
import {
  getStoredArticles, addStoredArticle, deleteStoredArticle,
  getStoredAgendas, addStoredAgenda, deleteStoredAgenda
} from '../services/articleService';

export type AdminTab =
  | 'dashboard'
  | 'siswa'
  | 'akun'
  | 'akun-guru'
  | 'nilai'
  | 'guru'
  | 'kelas'
  | 'mapel'
  | 'artikel'
  | 'aktivitas'
  | 'profil-sekolah';

export const AdminPortal: React.FC = () => {
  const { externalExamUrl, navigate, currentPath } = useAuth();

  // URL Route Synchronization for Admin Portal
  const getTabFromPath = (): AdminTab => {
    if (currentPath === '/portal/admin/siswa') return 'siswa';
    if (currentPath === '/portal/admin/akun') return 'akun';
    if (currentPath === '/portal/admin/akun-guru') return 'akun-guru';
    if (currentPath === '/portal/admin/nilai') return 'nilai';
    if (currentPath === '/portal/admin/guru') return 'guru';
    if (currentPath === '/portal/admin/kelas') return 'kelas';
    if (currentPath === '/portal/admin/mapel') return 'mapel';
    if (currentPath === '/portal/admin/artikel') return 'artikel';
    if (currentPath === '/portal/admin/aktivitas') return 'nilai';
    if (currentPath === '/portal/admin/profil-sekolah') return 'profil-sekolah';
    return 'dashboard';
  };

  const activeTab = getTabFromPath();

  const handleTabChange = (tab: AdminTab) => {
    if (tab === 'dashboard') navigate('/portal/admin');
    else navigate(`/portal/admin/${tab}`);
  };

  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  // Articles & Agendas
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [agendas, setAgendas] = useState<SchoolAgenda[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Search & Filter States
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('all');
  const [studentStatusFilter, setStudentStatusFilter] = useState('all');

  const [accountSearch, setAccountSearch] = useState('');
  const [accountStatusFilter, setAccountStatusFilter] = useState('all');

  // Teacher Account States
  const [teacherAccountSearch, setTeacherAccountSearch] = useState('');
  const [teacherAccountStatusFilter, setTeacherAccountStatusFilter] = useState('all');

  const [gradeSearch, setGradeSearch] = useState('');
  const [gradeSubjectFilter, setGradeSubjectFilter] = useState('all');
  const [gradeClassFilter, setGradeClassFilter] = useState('all');
  const [gradeStatusFilter, setGradeStatusFilter] = useState('all');

  // Modals state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [accountMode, setAccountMode] = useState<'existing' | 'new'>('existing');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [accountEmail, setAccountEmail] = useState<string>('');
  const [accountPassword, setAccountPassword] = useState<string>('');
  const [showAccountPassword, setShowAccountPassword] = useState<boolean>(false);

  // Teacher Account Modal State
  const [showCreateTeacherAccountModal, setShowCreateTeacherAccountModal] = useState(false);
  const [teacherAccountMode, setTeacherAccountMode] = useState<'existing' | 'new'>('existing');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [teacherAccountEmail, setTeacherAccountEmail] = useState<string>('');
  const [teacherAccountPassword, setTeacherAccountPassword] = useState<string>('');
  const [showTeacherAccountPassword, setShowTeacherAccountPassword] = useState<boolean>(false);

  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddArticle, setShowAddArticle] = useState(false);
  const [showAddAgenda, setShowAddAgenda] = useState(false);

  // Form states
  const [newStudent, setNewStudent] = useState({
    name: '',
    nis: '',
    email: '',
    password: '',
    classId: '',
  });

  const [newTeacher, setNewTeacher] = useState({
    name: '',
    nip: '',
    title: '',
    photo_url: '',
  });

  const [newClass, setNewClass] = useState({
    name: '',
    level: 1,
  });

  const [newSubject, setNewSubject] = useState({
    code: '',
    name: '',
    category: 'Wajib',
  });

  const [newArticle, setNewArticle] = useState({
    title: '',
    category: 'Prestasi',
    date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    img: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=400',
    content: '',
  });

  const [newAgenda, setNewAgenda] = useState({
    day: new Date().getDate().toString(),
    month: 'Okt',
    title: '',
    time: '08.00 - 11.30 WIB',
    location: 'Ruang Kelas',
  });

  const showNotification = (type: 'error' | 'success', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load stored articles & agendas
      setArticles(getStoredArticles());
      setAgendas(getStoredAgendas());

      // Load DB data
      const [
        { data: stdData },
        { data: tchData },
        { data: clsData },
        { data: sbjData },
        { data: grdData }
      ] = await Promise.all([
        supabase.from('students').select('*, classes(name)').order('name', { ascending: true }),
        supabase.from('teachers').select('*').order('name', { ascending: true }),
        supabase.from('classes').select('*').order('level', { ascending: true }),
        supabase.from('subjects').select('*').order('name', { ascending: true }),
        supabase.from('grades').select('*, students(name, nis, class_id), teachers(name), subjects(name)').order('created_at', { ascending: false }).limit(100)
      ]);

      if (stdData) {
        setStudents(stdData.map(s => ({
          ...s,
          className: (s as any).classes?.name || 'Kelas Belum Ditentukan',
        })));
      }
      if (tchData) setTeachers(tchData as Teacher[]);
      if (clsData) {
        setClasses(clsData as ClassRoom[]);
        if (clsData.length > 0 && !newStudent.classId) {
          setNewStudent(prev => ({ ...prev, classId: clsData[0].id }));
        }
      }
      if (sbjData) setSubjects(sbjData as Subject[]);
      if (grdData) {
        setGrades(grdData.map(g => ({
          ...g,
          student_name: (g as any).students?.name || 'Siswa',
          student_nis: (g as any).students?.nis || '-',
          student_class_id: (g as any).students?.class_id || null,
          teacher_name: (g as any).teachers?.name || 'Guru',
          subject_name: (g as any).subjects?.name || 'Mapel',
        })));
      }
    } catch (err) {
      console.error('Error loading admin portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 1. TAMBAH SISWA BARU (Sistem 1 Siswa 1 Akun Resmi)
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.nis || !newStudent.email || !newStudent.password) {
      showNotification('error', 'Semua kolom siswa wajib diisi lengkap.');
      return;
    }

    setActionLoading(true);
    try {
      // 1. Validasi Keunikan NIS di Database
      const { data: existingNis } = await supabase
        .from('students')
        .select('id, name')
        .eq('nis', newStudent.nis.trim())
        .maybeSingle();

      if (existingNis) {
        showNotification('error', `NIS ${newStudent.nis} sudah terdaftar atas nama siswa: ${existingNis.name}.`);
        setActionLoading(false);
        return;
      }

      // 2. Buat Akun via Supabase Edge Function (Auth Admin API)
      const { data, error } = await supabase.functions.invoke('create-account', {
        body: {
          account_type: 'student',
          email: newStudent.email.trim(),
          password: newStudent.password,
          nis: newStudent.nis.trim(),
          name: newStudent.name.trim(),
          class_id: newStudent.classId || null,
        },
      });

      if (error || data?.error) {
        const errorMsg = data?.error || error?.message || 'Layanan pembuatan akun auth belum merespons.';
        showNotification(
          'error',
          `Gagal membuat akun auth siswa: ${errorMsg}. Pastikan Edge Function 'create-account' telah aktif di server Supabase.`
        );
      } else {
        showNotification(
          'success',
          `Akun siswa ${newStudent.name} (NIS: ${newStudent.nis}) berhasil dibuat dan ditautkan dengan aman ke Supabase Auth!`
        );
        setShowAddStudent(false);
        setNewStudent({ name: '', nis: '', email: '', password: '', classId: classes[0]?.id || '' });
        loadAllData();
      }
    } catch {
      showNotification('error', 'Terjadi kesalahan jaringan saat membuat akun siswa.');
    } finally {
      setActionLoading(false);
    }
  };

  // 1.A-2 PILIH SISWA UNTUK PEMBUATAN AKUN (Sistem 1 Siswa 1 Akun)
  const handleSelectStudentForAccount = (studentId: string) => {
    setSelectedStudentId(studentId);
    const chosen = students.find(s => s.id === studentId);
    if (chosen) {
      const safeName = chosen.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const suggestedEmail = chosen.email || `${safeName}.${chosen.nis}@siswa.saiq.sch.id`;
      setAccountEmail(suggestedEmail);
    } else {
      setAccountEmail('');
    }
  };

  const openCreateAccountForStudent = (s: Student) => {
    setSelectedStudentId(s.id);
    const safeName = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    setAccountEmail(s.email || `${safeName}.${s.nis}@siswa.saiq.sch.id`);
    setAccountPassword('');
    setAccountMode('existing');
    setShowCreateAccountModal(true);
  };

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountEmail || !accountPassword) {
      showNotification('error', 'Email dan kata sandi awal wajib diisi.');
      return;
    }

    if (accountPassword.length < 6) {
      showNotification('error', 'Kata sandi minimal harus 6 karakter.');
      return;
    }

    const payload: any = {
      account_type: 'student',
      email: accountEmail.trim(),
      password: accountPassword,
    };

    if (accountMode === 'existing') {
      if (!selectedStudentId) {
        showNotification('error', 'Silakan pilih siswa yang akan dibuatkan akun.');
        return;
      }
      const chosen = students.find(s => s.id === selectedStudentId);
      if (chosen?.auth_user_id) {
        showNotification(
          'error',
          `Siswa "${chosen.name}" sudah memiliki akun aktif. Sistem menolak pembuatan akun kedua demi mencegah duplikasi akun.`
        );
        return;
      }
      payload.student_id = selectedStudentId;
    } else {
      if (!newStudent.name || !newStudent.nis) {
        showNotification('error', 'Nama dan NIS siswa wajib diisi.');
        return;
      }
      payload.name = newStudent.name.trim();
      payload.nis = newStudent.nis.trim();
      payload.class_id = newStudent.classId || null;
    }

    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-account', {
        body: payload,
      });

      if (error || data?.error) {
        const errorMsg = data?.error || error?.message || 'Layanan pembuatan akun auth belum merespons.';
        showNotification('error', `Gagal membuat akun siswa: ${errorMsg}`);
      } else {
        showNotification(
          'success',
          data?.message || 'Akun siswa berhasil dibuat dan ditautkan dengan aman ke Supabase Auth!'
        );
        setShowCreateAccountModal(false);
        setSelectedStudentId('');
        setAccountEmail('');
        setAccountPassword('');
        setNewStudent({ name: '', nis: '', email: '', password: '', classId: classes[0]?.id || '' });
        await loadAllData();
      }
    } catch {
      showNotification('error', 'Terjadi kesalahan jaringan saat membuat akun siswa.');
    } finally {
      setActionLoading(false);
    }
  };

  // 1.B TOGGLE STATUS AKUN SISWA (Aktif <-> Nonaktif)
  const handleToggleStudentStatus = async (studentId: string, currentStatus: string, studentName: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionText = nextStatus === 'inactive' ? 'MENONAKTIFKAN' : 'MENGAKTIFKAN KEMBALI';

    if (!window.confirm(`Yakin ingin ${actionText} akun siswa ${studentName}? ${nextStatus === 'inactive' ? 'Siswa tidak akan dapat mengakses portal hasil belajar.' : 'Siswa akan dapat kembali masuk ke portal pribadinya.'}`)) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ status: nextStatus })
        .eq('id', studentId);

      if (error) {
        showNotification('error', `Gagal mengubah status akun: ${error.message}`);
      } else {
        showNotification(
          'success',
          `Status akun ${studentName} berhasil diubah menjadi ${nextStatus === 'active' ? 'AKTIF' : 'NONAKTIF'}.`
        );
        loadAllData();
      }
    } catch {
      showNotification('error', 'Kendala saat memperbarui status akun siswa.');
    } finally {
      setActionLoading(false);
    }
  };

  // 1.C RESET KATA SANDI SISWA
  const handleResetStudentPassword = async (email: string, studentName: string) => {
    if (!email) {
      showNotification('error', `Email login untuk ${studentName} belum tercatat.`);
      return;
    }

    if (!window.confirm(`Kirim tautan reset kata sandi akun ke email: ${email}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/portal/reset-password`,
      });

      if (error) {
        showNotification('error', `Gagal mengirim tautan reset: ${error.message}`);
      } else {
        showNotification('success', `Tautan reset sandi telah dikirim ke ${email}.`);
      }
    } catch {
      showNotification('error', 'Kendala saat mengirim email reset sandi.');
    } finally {
      setActionLoading(false);
    }
  };

  // HAPUS SISWA
  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`Yakin ingin menghapus data siswa ${studentName}? Seluruh riwayat nilai siswa ini akan terhapus.`)) return;
    try {
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) {
        showNotification('error', `Gagal menghapus siswa: ${error.message}`);
      } else {
        showNotification('success', `Data siswa ${studentName} berhasil dihapus.`);
        loadAllData();
      }
    } catch {
      showNotification('error', 'Kendala saat menghapus siswa.');
    }
  };

  // 2. TAMBAH GURU (Data Master Pendidik)
  const handleAddTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacher.name || !newTeacher.nip) {
      showNotification('error', 'Nama dan NIP guru wajib diisi.');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.from('teachers').insert({
        name: newTeacher.name.trim(),
        nip: newTeacher.nip.trim(),
        title: newTeacher.title.trim() || 'Tenaga Pendidik',
        photo_url: newTeacher.photo_url.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256',
        auth_user_id: null,
        status: 'active',
      });

      if (error) {
        showNotification('error', `Gagal menambahkan guru: ${error.message}`);
      } else {
        showNotification('success', `Guru ${newTeacher.name} berhasil ditambahkan! Anda dapat membuat akun login di tab Akun Guru.`);
        setShowAddTeacher(false);
        setNewTeacher({ name: '', nip: '', title: '', photo_url: '' });
        loadAllData();
      }
    } catch {
      showNotification('error', 'Kendala saat menambahkan guru.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2.A-1 PILIH GURU UNTUK PEMBUATAN AKUN (Sistem 1 Guru 1 Akun)
  const handleSelectTeacherForAccount = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    const chosen = teachers.find(t => t.id === teacherId);
    if (chosen) {
      const safeName = chosen.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanNip = chosen.nip ? chosen.nip.replace(/[^0-9]/g, '') : '';
      const suggestedEmail = chosen.email || `${safeName}${cleanNip ? `.${cleanNip}` : ''}@guru.saiq.sch.id`;
      setTeacherAccountEmail(suggestedEmail);
    } else {
      setTeacherAccountEmail('');
    }
  };

  const openCreateAccountForTeacher = (t: Teacher) => {
    setSelectedTeacherId(t.id);
    const safeName = t.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanNip = t.nip ? t.nip.replace(/[^0-9]/g, '') : '';
    setTeacherAccountEmail(t.email || `${safeName}${cleanNip ? `.${cleanNip}` : ''}@guru.saiq.sch.id`);
    setTeacherAccountPassword('');
    setTeacherAccountMode('existing');
    setShowCreateTeacherAccountModal(true);
  };

  const handleCreateTeacherAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherAccountEmail || !teacherAccountPassword) {
      showNotification('error', 'Email dan kata sandi awal guru wajib diisi.');
      return;
    }

    if (teacherAccountPassword.length < 6) {
      showNotification('error', 'Kata sandi minimal harus 6 karakter.');
      return;
    }

    const payload: any = {
      account_type: 'teacher',
      email: teacherAccountEmail.trim(),
      password: teacherAccountPassword,
    };

    if (teacherAccountMode === 'existing') {
      if (!selectedTeacherId) {
        showNotification('error', 'Silakan pilih dewan guru yang akan dibuatkan akun.');
        return;
      }
      const chosen = teachers.find(t => t.id === selectedTeacherId);
      if (chosen?.auth_user_id) {
        showNotification(
          'error',
          `Guru "${chosen.name}" sudah memiliki akun aktif. Sistem menolak pembuatan akun kedua demi mencegah duplikasi akun.`
        );
        return;
      }
      payload.teacher_id = selectedTeacherId;
    } else {
      if (!newTeacher.name || !newTeacher.nip) {
        showNotification('error', 'Nama dan NIP guru wajib diisi.');
        return;
      }
      payload.name = newTeacher.name.trim();
      payload.nip = newTeacher.nip.trim();
      payload.title = newTeacher.title.trim() || 'Tenaga Pendidik';
      payload.photo_url = newTeacher.photo_url.trim() || undefined;
    }

    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-account', {
        body: payload,
      });

      if (error || data?.error) {
        const errorMsg = data?.error || error?.message || 'Layanan pembuatan akun auth guru belum merespons.';
        showNotification('error', `Gagal membuat akun guru: ${errorMsg}`);
      } else {
        showNotification(
          'success',
          data?.message || 'Akun dewan guru berhasil dibuat dan ditautkan dengan aman ke Supabase Auth!'
        );
        setShowCreateTeacherAccountModal(false);
        setSelectedTeacherId('');
        setTeacherAccountEmail('');
        setTeacherAccountPassword('');
        setNewTeacher({ name: '', nip: '', title: '', photo_url: '' });
        await loadAllData();
      }
    } catch {
      showNotification('error', 'Terjadi kesalahan jaringan saat membuat akun guru.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2.B TOGGLE STATUS AKUN GURU (Aktif <-> Nonaktif)
  const handleToggleTeacherStatus = async (teacherId: string, currentStatus: string | undefined, teacherName: string) => {
    const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    const actionText = nextStatus === 'inactive' ? 'MENONAKTIFKAN' : 'MENGAKTIFKAN KEMBALI';

    if (!window.confirm(`Yakin ingin ${actionText} akses portal dewan guru ${teacherName}? ${nextStatus === 'inactive' ? 'Guru tidak akan dapat login atau menginput nilai.' : 'Guru akan dapat kembali mengakses portal dewan guru.'}`)) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('teachers')
        .update({ status: nextStatus })
        .eq('id', teacherId);

      if (error) {
        showNotification('error', `Gagal mengubah status akses guru: ${error.message}`);
      } else {
        showNotification(
          'success',
          `Status akses ${teacherName} berhasil diubah menjadi ${nextStatus === 'active' ? 'AKTIF' : 'NONAKTIF'}.`
        );
        loadAllData();
      }
    } catch {
      showNotification('error', 'Kendala saat memperbarui status akun guru.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2.C RESET KATA SANDI GURU
  const handleResetTeacherPassword = async (email: string | undefined, teacherName: string) => {
    if (!email) {
      showNotification('error', `Email login untuk ${teacherName} belum tercatat.`);
      return;
    }

    if (!window.confirm(`Kirim tautan reset kata sandi akun pendidik ke email: ${email}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/portal/reset-password`,
      });

      if (error) {
        showNotification('error', `Gagal mengirim tautan reset: ${error.message}`);
      } else {
        showNotification('success', `Tautan reset sandi guru telah dikirim ke ${email}.`);
      }
    } catch {
      showNotification('error', 'Kendala saat mengirim email reset sandi guru.');
    } finally {
      setActionLoading(false);
    }
  };

  // HAPUS GURU
  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    if (!window.confirm(`Yakin ingin menghapus guru ${teacherName}?`)) return;
    try {
      const { error } = await supabase.from('teachers').delete().eq('id', teacherId);
      if (error) {
        showNotification('error', `Gagal menghapus guru: ${error.message}`);
      } else {
        showNotification('success', `Data guru ${teacherName} berhasil dihapus.`);
        loadAllData();
      }
    } catch {
      showNotification('error', 'Kendala saat menghapus guru.');
    }
  };

  // 3. TAMBAH KELAS
  const handleAddClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name) {
      showNotification('error', 'Nama kelas tidak boleh kosong.');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.from('classes').insert({
        name: newClass.name.trim(),
        level: Number(newClass.level),
      });

      if (error) {
        showNotification('error', `Gagal membuat kelas: ${error.message}`);
      } else {
        showNotification('success', `Rombel ${newClass.name} berhasil ditambahkan!`);
        setShowAddClass(false);
        setNewClass({ name: '', level: 1 });
        loadAllData();
      }
    } catch {
      showNotification('error', 'Kendala saat menambahkan kelas.');
    } finally {
      setActionLoading(false);
    }
  };

  // HAPUS KELAS
  const handleDeleteClass = async (classId: string, className: string) => {
    if (!window.confirm(`Yakin ingin menghapus kelas ${className}? Siswa di kelas ini akan dialihkan ke status belum ditentukan.`)) return;
    try {
      const { error } = await supabase.from('classes').delete().eq('id', classId);
      if (error) {
        showNotification('error', `Gagal menghapus kelas: ${error.message}`);
      } else {
        showNotification('success', `Kelas ${className} berhasil dihapus.`);
        loadAllData();
      }
    } catch {
      showNotification('error', 'Kendala saat menghapus kelas.');
    }
  };

  // 4. TAMBAH MAPEL
  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.code || !newSubject.name) {
      showNotification('error', 'Kode dan nama mata pelajaran wajib diisi.');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.from('subjects').insert({
        code: newSubject.code.trim().toUpperCase(),
        name: newSubject.name.trim(),
        category: newSubject.category,
      });

      if (error) {
        showNotification('error', `Gagal menambah mapel: ${error.message}`);
      } else {
        showNotification('success', `Mata pelajaran ${newSubject.name} berhasil ditambahkan!`);
        setShowAddSubject(false);
        setNewSubject({ code: '', name: '', category: 'Wajib' });
        loadAllData();
      }
    } catch {
      showNotification('error', 'Kendala saat menambah mata pelajaran.');
    } finally {
      setActionLoading(false);
    }
  };

  // HAPUS MAPEL
  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    if (!window.confirm(`Yakin ingin menghapus mata pelajaran ${subjectName}?`)) return;
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
      if (error) {
        showNotification('error', `Gagal menghapus mapel: ${error.message}`);
      } else {
        showNotification('success', `Mata pelajaran ${subjectName} berhasil dihapus.`);
        loadAllData();
      }
    } catch {
      showNotification('error', 'Kendala saat menghapus mata pelajaran.');
    }
  };

  // 5. TAMBAH BERITA / ARTIKEL HALAMAN DEPAN
  const handleAddArticleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.title.trim()) {
      showNotification('error', 'Judul artikel berita tidak boleh kosong.');
      return;
    }

    addStoredArticle({
      title: newArticle.title.trim(),
      category: newArticle.category,
      date: newArticle.date,
      img: newArticle.img.trim() || 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=400',
      content: newArticle.content.trim(),
    });

    showNotification('success', 'Berita berhasil dipublikasikan ke halaman depan!');
    setShowAddArticle(false);
    setNewArticle({
      title: '',
      category: 'Prestasi',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      img: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=400',
      content: '',
    });
    setArticles(getStoredArticles());
  };

  const handleDeleteArticle = (id: string, title: string) => {
    if (!window.confirm(`Hapus artikel berita "${title}" dari halaman depan?`)) return;
    deleteStoredArticle(id);
    setArticles(getStoredArticles());
    showNotification('success', 'Artikel berita berhasil dihapus dari halaman depan.');
  };

  // 6. TAMBAH AGENDA SEKOLAH
  const handleAddAgendaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgenda.title.trim() || !newAgenda.day.trim() || !newAgenda.month.trim()) {
      showNotification('error', 'Lengkapi informasi tanggal dan judul agenda.');
      return;
    }

    addStoredAgenda({
      day: newAgenda.day.trim(),
      month: newAgenda.month.trim(),
      title: newAgenda.title.trim(),
      time: newAgenda.time.trim(),
      location: newAgenda.location.trim(),
    });

    showNotification('success', 'Agenda sekolah berhasil dipublikasikan ke halaman depan!');
    setShowAddAgenda(false);
    setNewAgenda({
      day: new Date().getDate().toString(),
      month: 'Okt',
      title: '',
      time: '08.00 - 11.30 WIB',
      location: 'Ruang Kelas',
    });
    setAgendas(getStoredAgendas());
  };

  const handleDeleteAgenda = (id: string, title: string) => {
    if (!window.confirm(`Hapus agenda "${title}"?`)) return;
    deleteStoredAgenda(id);
    setAgendas(getStoredAgendas());
    showNotification('success', 'Agenda berhasil dihapus.');
  };

  // 7. HAPUS NILAI (AUDIT)
  const handleDeleteGrade = async (gradeId: string, studentName: string, subjectName: string) => {
    if (!window.confirm(`Hapus penilaian ${subjectName} untuk ${studentName}?`)) return;
    try {
      const { error } = await supabase.from('grades').delete().eq('id', gradeId);
      if (error) {
        showNotification('error', `Gagal menghapus nilai: ${error.message}`);
      } else {
        showNotification('success', `Nilai ${studentName} berhasil dihapus.`);
        loadAllData();
      }
    } catch {
      showNotification('error', 'Kendala saat menghapus nilai.');
    }
  };

  // Filtered lists for Admin views
  const filteredStudents = students.filter(s => {
    const matchSearch = studentSearch === '' ||
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.nis.toLowerCase().includes(studentSearch.toLowerCase());
    const matchClass = studentClassFilter === 'all' || s.class_id === studentClassFilter;
    const matchStatus = studentStatusFilter === 'all' || s.status === studentStatusFilter;
    return matchSearch && matchClass && matchStatus;
  });

  const filteredAccounts = students.filter(s => {
    const matchSearch = accountSearch === '' ||
      s.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
      s.nis.toLowerCase().includes(accountSearch.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(accountSearch.toLowerCase()));
    let matchStatus = true;
    if (accountStatusFilter === 'active') matchStatus = s.status === 'active' && !!s.auth_user_id;
    else if (accountStatusFilter === 'inactive') matchStatus = s.status === 'inactive' && !!s.auth_user_id;
    else if (accountStatusFilter === 'unlinked') matchStatus = !s.auth_user_id;
    return matchSearch && matchStatus;
  });

  const filteredTeacherAccounts = teachers.filter(t => {
    const matchSearch = teacherAccountSearch === '' ||
      t.name.toLowerCase().includes(teacherAccountSearch.toLowerCase()) ||
      (t.nip && t.nip.toLowerCase().includes(teacherAccountSearch.toLowerCase())) ||
      (t.email && t.email.toLowerCase().includes(teacherAccountSearch.toLowerCase())) ||
      (t.title && t.title.toLowerCase().includes(teacherAccountSearch.toLowerCase()));
    let matchStatus = true;
    if (teacherAccountStatusFilter === 'active') {
      matchStatus = (t.status || 'active') === 'active' && !!t.auth_user_id;
    } else if (teacherAccountStatusFilter === 'inactive') {
      matchStatus = t.status === 'inactive' && !!t.auth_user_id;
    } else if (teacherAccountStatusFilter === 'unlinked') {
      matchStatus = !t.auth_user_id;
    }
    return matchSearch && matchStatus;
  });

  const filteredGrades = grades.filter(g => {
    const matchSearch = gradeSearch === '' ||
      (g.student_name && g.student_name.toLowerCase().includes(gradeSearch.toLowerCase())) ||
      (g.student_nis && g.student_nis.toLowerCase().includes(gradeSearch.toLowerCase())) ||
      (g.teacher_name && g.teacher_name.toLowerCase().includes(gradeSearch.toLowerCase())) ||
      (g.description && g.description.toLowerCase().includes(gradeSearch.toLowerCase()));
    const matchSubject = gradeSubjectFilter === 'all' || g.subject_id === gradeSubjectFilter;
    const matchClass = gradeClassFilter === 'all' || (g as any).student_class_id === gradeClassFilter;
    const matchStatus = gradeStatusFilter === 'all' || g.status === gradeStatusFilter;
    return matchSearch && matchSubject && matchClass && matchStatus;
  });

  const totalGrades = grades.length;
  const avgGrade = totalGrades > 0
    ? (grades.reduce((sum, g) => sum + Number(g.score || 0), 0) / totalGrades).toFixed(1)
    : '0';
  const publishedGrades = grades.filter(g => g.status === 'published').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <PortalHeader
        title="Portal Administrator"
        subtitle="Manajemen Pengguna, Halaman Depan & Pengawasan Penilaian Sekolah"
        activeRole="admin"
      />

      {/* Admin Information Bar */}
      <div className="bg-purple-900 text-white px-4 md:px-8 py-2.5 shadow-sm text-xs">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-purple-200">
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            <span>Portal Administrator SDI SAIQ Al-Hikmah &bull; Akses Manajemen Akademik</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-purple-200 text-xs">
            <span className="bg-purple-800/90 px-3 py-1 rounded-full font-mono text-[11px] border border-purple-700">
              Role: Master Administrator
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Tabs */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 overflow-x-auto flex gap-2 no-scrollbar">
        {[
          { id: 'dashboard' as const, label: 'Dashboard' },
          { id: 'siswa' as const, label: 'Siswa' },
          { id: 'akun' as const, label: 'Akun Siswa' },
          { id: 'akun-guru' as const, label: 'Akun Guru' },
          { id: 'nilai' as const, label: 'Nilai' },
          { id: 'guru' as const, label: 'Guru' },
          { id: 'kelas' as const, label: 'Kelas' },
          { id: 'mapel' as const, label: 'Mapel' },
          { id: 'artikel' as const, label: 'Berita' },
          { id: 'profil-sekolah' as const, label: 'Profil' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === item.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 container mx-auto px-4 md:px-6 py-6 max-w-7xl flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 sticky top-24 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900">Administrator</div>
                <div className="text-[11px] text-purple-700 font-semibold">Master Manager</div>
              </div>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'dashboard' as const, label: 'Dashboard Utama', icon: <Activity className="w-4 h-4" /> },
                { id: 'siswa' as const, label: 'Kelola Siswa', icon: <Users className="w-4 h-4" />, count: students.length },
                { id: 'akun' as const, label: 'Akun Login Siswa', icon: <KeyRound className="w-4 h-4" />, count: students.filter(s => s.auth_user_id).length },
                { id: 'akun-guru' as const, label: 'Akun Login Guru', icon: <UserPlus className="w-4 h-4" />, count: teachers.filter(t => t.auth_user_id).length },
                { id: 'nilai' as const, label: 'Pengawasan Nilai', icon: <FileSpreadsheet className="w-4 h-4" />, count: grades.length },
                { id: 'guru' as const, label: 'Kelola Guru', icon: <UserCheck className="w-4 h-4" />, count: teachers.length },
                { id: 'kelas' as const, label: 'Kelas & Rombel', icon: <Layers className="w-4 h-4" />, count: classes.length },
                { id: 'mapel' as const, label: 'Mata Pelajaran', icon: <BookOpen className="w-4 h-4" />, count: subjects.length },
                { id: 'artikel' as const, label: 'Artikel & Agenda Depan', icon: <Newspaper className="w-4 h-4" />, count: articles.length + agendas.length },
                { id: 'profil-sekolah' as const, label: 'Profil Sekolah & CBT', icon: <School className="w-4 h-4" /> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === item.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-700/20'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === item.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6 pb-20 md:pb-8">
          {/* Feedback Banner */}
          {feedback && (
            <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in ${
              feedback.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}>
              {feedback.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* ==================== 1. DASHBOARD ==================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-xl">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Dashboard Administrator Sekolah
                </h2>
                <p className="text-xs md:text-sm text-purple-100 mt-1 max-w-xl">
                  Pengawasan menyeluruh data siswa, akun guru, artikel berita halaman depan, dan aktivitas penerbitan nilai resmi.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/20 text-xs">
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all" onClick={() => handleTabChange('siswa')}>
                    <div className="text-purple-200 text-[10px] font-bold">TOTAL SISWA</div>
                    <div className="text-2xl font-black mt-0.5">{students.length}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all" onClick={() => handleTabChange('akun')}>
                    <div className="text-purple-200 text-[10px] font-bold">AKUN SISWA</div>
                    <div className="text-2xl font-black mt-0.5">{students.filter(s => s.auth_user_id).length}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all" onClick={() => handleTabChange('guru')}>
                    <div className="text-purple-200 text-[10px] font-bold">TOTAL GURU</div>
                    <div className="text-2xl font-black mt-0.5">{teachers.length}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all" onClick={() => handleTabChange('akun-guru')}>
                    <div className="text-purple-200 text-[10px] font-bold">AKUN GURU</div>
                    <div className="text-2xl font-black mt-0.5">{teachers.filter(t => t.auth_user_id).length}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all" onClick={() => handleTabChange('nilai')}>
                    <div className="text-purple-200 text-[10px] font-bold">NILAI TERCATAT</div>
                    <div className="text-2xl font-black mt-0.5">{grades.length}</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setShowAddArticle(true)}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-2">
                    <Newspaper className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-700 transition-colors">
                    Tulis Berita Depan
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tambah artikel kegiatan ke halaman depan</p>
                </button>

                <button
                  onClick={() => handleTabChange('akun')}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-2">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-purple-700 transition-colors">
                    Kelola Akun Siswa
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Sistem 1 Siswa 1 Akun & kelola hak akses</p>
                </button>

                <button
                  onClick={() => handleTabChange('akun-guru')}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold mb-2">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                    Kelola Akun Guru
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Sistem 1 Guru 1 Akun & hak akses portal pendidik</p>
                </button>

                <button
                  onClick={() => handleTabChange('nilai')}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-2">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Pengawasan Nilai
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Audit & pantau nilai santri seluruh mapel</p>
                </button>
              </div>

              {/* Log Aktivitas Penilaian Guru */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <span>Audit Trail: Aktivitas Penilaian Guru Terakhir</span>
                  </h3>
                  <button onClick={() => handleTabChange('nilai')} className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1">
                    <span>Lihat Semua</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {grades.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Belum ada aktivitas penilaian yang tercatat di Supabase.</p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {grades.slice(0, 6).map(g => (
                      <div key={g.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900">{g.teacher_name}</strong>
                            <span className="text-slate-400">memberi nilai</span>
                            <span className="text-purple-700 font-bold">{g.subject_name}</span>
                            <span className="text-slate-400">kepada</span>
                            <strong className="text-slate-800">{g.student_name}</strong>
                          </div>
                          <p className="text-slate-500 mt-0.5 text-[11px]">
                            {g.assessment_type}: "{g.description || 'Tanpa catatan'}"
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black text-sm text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-lg">
                            {g.score}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">{g.assessment_date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 2. KELOLA SISWA ==================== */}
          {activeTab === 'siswa' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Total Siswa</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{students.length}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-emerald-600 uppercase">Siswa Aktif</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {students.filter(s => s.status === 'active').length}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-rose-500 uppercase">Siswa Nonaktif</div>
                  <div className="text-2xl font-black text-rose-600 mt-1">
                    {students.filter(s => s.status === 'inactive').length}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-purple-600 uppercase">Akun Terhubung</div>
                  <div className="text-2xl font-black text-purple-700 mt-1">
                    {students.filter(s => !!s.auth_user_id).length}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <Users className="w-6 h-6 text-purple-600" />
                      <span>Manajemen Siswa Sekolah</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kelola identitas, NIS, rombel kelas, dan status keaktifan seluruh santri/siswa.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTabChange('akun')}
                      className="px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Kelola Akun Siswa</span>
                    </button>
                    <button
                      onClick={() => setShowAddStudent(true)}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Siswa Baru</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      placeholder="Cari nama atau NIS siswa..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={studentClassFilter}
                      onChange={e => setStudentClassFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="all">Semua Rombel Kelas</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>

                    <select
                      value={studentStatusFilter}
                      onChange={e => setStudentStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="all">Semua Status</option>
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>

                    {(studentSearch || studentClassFilter !== 'all' || studentStatusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setStudentSearch('');
                          setStudentClassFilter('all');
                          setStudentStatusFilter('all');
                        }}
                        className="px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
                    <span>Memuat data siswa dari Supabase...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-extrabold text-[11px]">
                          <th className="py-3 px-4 rounded-l-xl">Nama Siswa</th>
                          <th className="py-3 px-3">NIS</th>
                          <th className="py-3 px-3">Kelas / Rombel</th>
                          <th className="py-3 px-3">Akun Login</th>
                          <th className="py-3 px-3">Status Akses</th>
                          <th className="py-3 px-3 rounded-r-xl text-center">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              Tidak ada siswa yang sesuai dengan filter pencarian.
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map(s => (
                            <tr key={s.id} className="hover:bg-purple-50/30 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{s.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">ID: {s.id.slice(0, 8)}...</div>
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-purple-800">{s.nis}</td>
                              <td className="py-3 px-3 text-slate-600">
                                <span className="inline-block bg-slate-100 px-2 py-0.5 rounded-lg text-slate-700 font-medium">
                                  {s.className}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                {s.auth_user_id ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Terkait</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Belum Terkait</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <button
                                  onClick={() => handleToggleStudentStatus(s.id, s.status, s.name)}
                                  disabled={actionLoading}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                    s.status === 'active'
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                  }`}
                                  title="Klik untuk mengubah status akses portal"
                                >
                                  {s.status === 'active' ? (
                                    <>
                                      <ToggleRight className="w-4 h-4 text-emerald-600" />
                                      <span>Aktif</span>
                                    </>
                                  ) : (
                                    <>
                                      <ToggleLeft className="w-4 h-4 text-rose-600" />
                                      <span>Nonaktif</span>
                                    </>
                                  )}
                                </button>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => handleDeleteStudent(s.id, s.name)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Hapus Data Siswa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 2.B KELOLA AKUN SISWA (SISTEM 1 SISWA 1 AKUN) ==================== */}
          {activeTab === 'akun' && (
            <div className="space-y-4">
              {/* Security Policy Information Banner */}
              <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-3xl p-6 text-white shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-purple-200 font-bold text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-purple-300" />
                  <span>Sistem Keamanan 1 Siswa 1 Akun (Database Level)</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black">
                  Manajemen Kredensial & Hak Akses Portal Siswa
                </h2>
                <p className="text-xs text-purple-100 max-w-3xl leading-relaxed">
                  Setiap akun autentikasi dihubungkan secara eksklusif ke 1 data siswa melalui foreign key <code className="bg-purple-950/60 px-1.5 py-0.5 rounded font-mono text-purple-200">auth_user_id</code>.
                  Siswa tidak dapat mengakses nilai atau data siswa lain. Akun dengan status <strong>Nonaktif</strong> secara otomatis diblokir saat autentikasi.
                </p>
              </div>

              {/* Account Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Total Siswa</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{students.length}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-purple-600 uppercase">Terkoneksi UID</div>
                  <div className="text-2xl font-black text-purple-700 mt-1">
                    {students.filter(s => !!s.auth_user_id).length}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-amber-600 uppercase">Belum Ada Akun</div>
                  <div className="text-2xl font-black text-amber-600 mt-1">
                    {students.filter(s => !s.auth_user_id).length}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-emerald-600 uppercase">Akun Aktif</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {students.filter(s => s.status === 'active' && !!s.auth_user_id).length}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-rose-500 uppercase">Dinonaktifkan</div>
                  <div className="text-2xl font-black text-rose-600 mt-1">
                    {students.filter(s => s.status === 'inactive' && !!s.auth_user_id).length}
                  </div>
                </div>
              </div>

              {/* Accounts Table Container */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-purple-600" />
                      <span>Daftar Akun Autentikasi Siswa</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kelola status izin masuk portal pribadi dan reset kata sandi siswa.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStudentId('');
                      setAccountEmail('');
                      setAccountPassword('');
                      setAccountMode('existing');
                      setShowCreateAccountModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Akun Siswa Baru</span>
                  </button>
                </div>

                {/* Filter and Search Bar for Accounts */}
                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={accountSearch}
                      onChange={e => setAccountSearch(e.target.value)}
                      placeholder="Cari berdasarkan nama, NIS, atau email..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={accountStatusFilter}
                      onChange={e => setAccountStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="all">Semua Siswa & Akun</option>
                      <option value="active">Hanya Akun Aktif</option>
                      <option value="inactive">Hanya Akun Nonaktif</option>
                      <option value="unlinked">Belum Memiliki Akun</option>
                    </select>

                    {(accountSearch || accountStatusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setAccountSearch('');
                          setAccountStatusFilter('all');
                        }}
                        className="px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
                    <span>Memuat daftar akun siswa...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-extrabold text-[11px]">
                          <th className="py-3 px-4 rounded-l-xl">Identitas Siswa</th>
                          <th className="py-3 px-3">Email Login</th>
                          <th className="py-3 px-3">Supabase Auth ID (UID)</th>
                          <th className="py-3 px-3">Status Izin Akses</th>
                          <th className="py-3 px-3 rounded-r-xl text-center">Tindakan Kelola</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAccounts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              Tidak ada akun yang sesuai dengan kriteria pencarian.
                            </td>
                          </tr>
                        ) : (
                          filteredAccounts.map(s => {
                            const studentEmail = s.email || `${s.nis.toLowerCase()}@siswa.saiq.sch.id`;
                            return (
                              <tr key={s.id} className="hover:bg-purple-50/30 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900">{s.name}</div>
                                  <div className="text-[11px] text-purple-800 font-mono font-bold">NIS: {s.nis}</div>
                                  <div className="text-[10px] text-slate-400">{s.className}</div>
                                </td>
                                <td className="py-3 px-3 font-mono text-slate-700">
                                  <div className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{studentEmail}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 font-mono text-[11px]">
                                  {s.auth_user_id ? (
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200" title={s.auth_user_id}>
                                      {s.auth_user_id.slice(0, 13)}...
                                    </span>
                                  ) : (
                                    <span className="text-amber-600 italic">Belum dibuatkan UID</span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  {!s.auth_user_id ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                      <AlertCircle className="w-3 h-3 text-amber-500" />
                                      <span>Belum Ada Akun</span>
                                    </span>
                                  ) : (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                      s.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                                    }`}>
                                      {s.status === 'active' ? 'Aktif (Diberi Akses)' : 'Nonaktif (Diblokir)'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    {!s.auth_user_id ? (
                                      <button
                                        onClick={() => openCreateAccountForStudent(s)}
                                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-sm"
                                        title="Buat Akun Auth untuk siswa ini"
                                      >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        <span>Buat Akun</span>
                                      </button>
                                    ) : (
                                      <>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200" title="Akun Auth terhubung dengan siswa ini">
                                          Sudah memiliki akun
                                        </span>
                                        <button
                                          onClick={() => handleToggleStudentStatus(s.id, s.status, s.name)}
                                          disabled={actionLoading}
                                          className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 ${
                                            s.status === 'active'
                                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                          }`}
                                          title={s.status === 'active' ? 'Nonaktifkan akun ini' : 'Aktifkan kembali akun ini'}
                                        >
                                          {s.status === 'active' ? (
                                            <>
                                              <ToggleLeft className="w-3.5 h-3.5" />
                                              <span>Nonaktifkan</span>
                                            </>
                                          ) : (
                                            <>
                                              <ToggleRight className="w-3.5 h-3.5" />
                                              <span>Aktifkan</span>
                                            </>
                                          )}
                                        </button>

                                        <button
                                          onClick={() => handleResetStudentPassword(studentEmail, s.name)}
                                          disabled={actionLoading}
                                          className="px-2 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[11px] transition-all flex items-center gap-1 border border-slate-200"
                                          title="Kirim email instruksi reset kata sandi"
                                        >
                                          <KeyRound className="w-3 h-3 text-slate-500" />
                                          <span>Reset Sandi</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 2.C KELOLA AKUN GURU (SISTEM 1 GURU 1 AKUN) ==================== */}
          {activeTab === 'akun-guru' && (
            <div className="space-y-4">
              {/* Security Policy Information Banner */}
              <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 rounded-3xl p-6 text-white shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-emerald-200 font-bold text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-emerald-300" />
                  <span>Sistem Keamanan 1 Guru 1 Akun Autentikasi (Database Level)</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black">
                  Manajemen Kredensial & Hak Akses Portal Dewan Guru
                </h2>
                <p className="text-xs text-emerald-100 max-w-3xl leading-relaxed">
                  Setiap ustadz/ustadzah dihubungkan secara eksklusif ke 1 akun autentikasi dengan role <strong>teacher</strong> melalui foreign key <code className="bg-emerald-950/60 px-1.5 py-0.5 rounded font-mono text-emerald-200">teachers.auth_user_id</code>.
                  Guru hanya dapat mengelola nilai santri dan tidak dapat mengakses kewenangan administrator sekolah. Guru yang dinonaktifkan diblokir otomatis dari sistem.
                </p>
              </div>

              {/* Teacher Account Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Total Guru Pendidik</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{teachers.length}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-purple-600 uppercase">Terkoneksi Auth UID</div>
                  <div className="text-2xl font-black text-purple-700 mt-1">
                    {teachers.filter(t => !!t.auth_user_id).length}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-amber-600 uppercase">Belum Memiliki Akun</div>
                  <div className="text-2xl font-black text-amber-600 mt-1">
                    {teachers.filter(t => !t.auth_user_id).length}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-emerald-600 uppercase">Akun Aktif</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {teachers.filter(t => (t.status || 'active') === 'active' && !!t.auth_user_id).length}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-rose-500 uppercase">Akun Nonaktif</div>
                  <div className="text-2xl font-black text-rose-600 mt-1">
                    {teachers.filter(t => t.status === 'inactive' && !!t.auth_user_id).length}
                  </div>
                </div>
              </div>

              {/* Accounts Table Container */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-emerald-600" />
                      <span>Daftar Akun Autentikasi Dewan Guru</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kelola hak akses portal input nilai guru, status aktifasi, dan reset kata sandi ustadz/ustadzah.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTeacherId('');
                      setTeacherAccountEmail('');
                      setTeacherAccountPassword('');
                      setTeacherAccountMode('existing');
                      setShowCreateTeacherAccountModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Akun Guru Baru</span>
                  </button>
                </div>

                {/* Filter and Search Bar for Teachers */}
                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={teacherAccountSearch}
                      onChange={e => setTeacherAccountSearch(e.target.value)}
                      placeholder="Cari berdasarkan nama guru, NIP, email, atau bidang studi..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={teacherAccountStatusFilter}
                      onChange={e => setTeacherAccountStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="all">Semua Status Guru</option>
                      <option value="active">Hanya Akun Aktif</option>
                      <option value="inactive">Hanya Akun Nonaktif</option>
                      <option value="unlinked">Belum Memiliki Akun</option>
                    </select>

                    {(teacherAccountSearch || teacherAccountStatusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setTeacherAccountSearch('');
                          setTeacherAccountStatusFilter('all');
                        }}
                        className="px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                    <span>Memuat daftar akun dewan guru...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-extrabold text-[11px]">
                          <th className="py-3 px-4 rounded-l-xl">Identitas Dewan Guru</th>
                          <th className="py-3 px-3">Email Login</th>
                          <th className="py-3 px-3">Role Sistem</th>
                          <th className="py-3 px-3">Supabase Auth ID (UID)</th>
                          <th className="py-3 px-3">Status Izin Akses</th>
                          <th className="py-3 px-3 rounded-r-xl text-center">Tindakan Kelola</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTeacherAccounts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              Tidak ada akun dewan guru yang sesuai dengan kriteria pencarian.
                            </td>
                          </tr>
                        ) : (
                          filteredTeacherAccounts.map(t => {
                            const safeName = t.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                            const cleanNip = t.nip ? t.nip.replace(/[^0-9]/g, '') : '';
                            const teacherEmail = t.email || `${safeName}${cleanNip ? `.${cleanNip}` : ''}@guru.saiq.sch.id`;
                            const isActive = (t.status || 'active') === 'active';

                            return (
                              <tr key={t.id} className="hover:bg-emerald-50/30 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={t.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256'}
                                      alt={t.name}
                                      className="w-10 h-10 rounded-2xl object-cover border border-emerald-300 shrink-0"
                                    />
                                    <div>
                                      <div className="font-bold text-slate-900">{t.name}</div>
                                      <div className="text-[11px] text-emerald-800 font-mono font-bold">NIP: {t.nip}</div>
                                      <div className="text-[10px] text-slate-500">{t.title}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-3 font-mono text-slate-700">
                                  <div className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{teacherEmail}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="inline-block bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                    Teacher / Guru
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-mono text-[11px]">
                                  {t.auth_user_id ? (
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200" title={t.auth_user_id}>
                                      {t.auth_user_id.slice(0, 13)}...
                                    </span>
                                  ) : (
                                    <span className="text-amber-600 italic">Belum dibuatkan UID</span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  {!t.auth_user_id ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                      <AlertCircle className="w-3 h-3 text-amber-500" />
                                      <span>Belum Ada Akun</span>
                                    </span>
                                  ) : (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                      isActive
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                                    }`}>
                                      {isActive ? 'Aktif (Diberi Akses)' : 'Nonaktif (Diblokir)'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    {!t.auth_user_id ? (
                                      <button
                                        onClick={() => openCreateAccountForTeacher(t)}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-sm"
                                        title="Buat Akun Auth untuk guru ini"
                                      >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        <span>Buat Akun Guru</span>
                                      </button>
                                    ) : (
                                      <>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200" title="Akun Auth terhubung dengan ustadz/ustadzah ini">
                                          Sudah memiliki akun
                                        </span>
                                        <button
                                          onClick={() => handleToggleTeacherStatus(t.id, t.status, t.name)}
                                          disabled={actionLoading}
                                          className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 ${
                                            isActive
                                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                          }`}
                                          title={isActive ? 'Nonaktifkan akses portal guru ini' : 'Aktifkan kembali akses guru ini'}
                                        >
                                          {isActive ? (
                                            <>
                                              <ToggleLeft className="w-3.5 h-3.5" />
                                              <span>Nonaktifkan</span>
                                            </>
                                          ) : (
                                            <>
                                              <ToggleRight className="w-3.5 h-3.5" />
                                              <span>Aktifkan</span>
                                            </>
                                          )}
                                        </button>

                                        <button
                                          onClick={() => handleResetTeacherPassword(teacherEmail, t.name)}
                                          disabled={actionLoading}
                                          className="px-2 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[11px] transition-all flex items-center gap-1 border border-slate-200"
                                          title="Kirim email instruksi reset kata sandi"
                                        >
                                          <KeyRound className="w-3 h-3 text-slate-500" />
                                          <span>Reset</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 3. KELOLA GURU ==================== */}
          {activeTab === 'guru' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-6 h-6 text-purple-600" />
                      <span>Manajemen Dewan Guru & Tenaga Pendidik</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kelola identitas, NIP, gelar pendidik, dan foto seluruh ustadz/ustadzah.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddTeacher(true)}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Guru Baru</span>
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {teachers.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-400 text-xs">Belum ada data guru terdaftar.</div>
                  ) : (
                    teachers.map(t => (
                      <div key={t.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={t.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256'}
                            alt={t.name}
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-500 shrink-0"
                          />
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900">{t.name}</h4>
                            <p className="text-xs text-purple-700 font-semibold">{t.title}</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">NIP: {t.nip}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTeacher(t.id, t.name)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Guru"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 4. KELAS & ROMBEL ==================== */}
          {activeTab === 'kelas' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <Layers className="w-6 h-6 text-purple-600" />
                      <span>Manajemen Kelas & Rombongan Belajar (Rombel)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Daftar dan kelola rombel kelas 1 hingga kelas 6 di SDI SAIQ AL-HIKMAH.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddClass(true)}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Kelas Baru</span>
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {classes.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-400 text-xs">Belum ada rombel kelas yang dibuat.</div>
                  ) : (
                    classes.map(c => {
                      const count = students.filter(s => s.class_id === c.id).length;
                      return (
                        <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                              Tingkat {c.level}
                            </span>
                            <h4 className="font-extrabold text-base text-slate-900 mt-1">{c.name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Siswa Terdaftar: <strong className="text-slate-800">{count} Santri</strong>
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteClass(c.id, c.name)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Kelas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 5. MATA PELAJARAN ==================== */}
          {activeTab === 'mapel' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                      <span>Kurikulum & Mata Pelajaran (Mapel)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kelola mata pelajaran wajib, keislaman, tahfidz, dan muatan lokal.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddSubject(true)}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Mapel Baru</span>
                  </button>
                </div>

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-extrabold text-[11px]">
                        <th className="py-3 px-4 rounded-l-xl">Kode</th>
                        <th className="py-3 px-3">Nama Mata Pelajaran</th>
                        <th className="py-3 px-3">Kategori</th>
                        <th className="py-3 px-3 rounded-r-xl text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subjects.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">Belum ada mata pelajaran terdaftar.</td>
                        </tr>
                      ) : (
                        subjects.map(sub => (
                          <tr key={sub.id} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-purple-800">{sub.code}</td>
                            <td className="py-3 px-3 font-bold text-slate-900">{sub.name}</td>
                            <td className="py-3 px-3">
                              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {sub.category}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleDeleteSubject(sub.id, sub.name)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus Mapel"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 6. ARTIKEL & AGENDA DEPAN ==================== */}
          {activeTab === 'artikel' && (
            <div className="space-y-6">
              {/* Bagian Berita */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <Newspaper className="w-6 h-6 text-purple-600" />
                      <span>Berita & Artikel Halaman Depan</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Artikel yang ditambahkan di sini langsung muncul pada seksi "Berita & Kegiatan" di Landing Page utama.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddArticle(true)}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Berita Baru</span>
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  {articles.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-400 text-xs">Belum ada berita terbit.</div>
                  ) : (
                    articles.map(art => (
                      <div key={art.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex gap-4">
                        <img src={art.img} alt={art.title} className="w-24 h-24 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-1">
                              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">{art.category}</span>
                              <span>{art.date}</span>
                            </div>
                            <h4 className="font-extrabold text-xs text-slate-900 line-clamp-2">{art.title}</h4>
                            {art.content && <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{art.content}</p>}
                          </div>
                          <div className="text-right pt-2">
                            <button
                              onClick={() => handleDeleteArticle(art.id, art.title)}
                              className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Berita</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bagian Agenda */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-purple-600" />
                      <span>Agenda Akademik Halaman Depan</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Jadwal kegiatan yang ditambahkan di sini langsung muncul pada seksi "Agenda Akademik" di Landing Page utama.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddAgenda(true)}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Agenda Baru</span>
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {agendas.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-400 text-xs">Belum ada agenda sekolah.</div>
                  ) : (
                    agendas.map(agd => (
                      <div key={agd.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center shrink-0">
                            <span className="text-base font-black leading-none">{agd.day}</span>
                            <span className="text-[9px] uppercase font-bold tracking-wider">{agd.month}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{agd.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">{agd.time}</p>
                            <p className="text-[10px] text-slate-400">{agd.location}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteAgenda(agd.id, agd.title)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Agenda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 7. AUDIT & PENGAWASAN NILAI ==================== */}
          {(activeTab === 'nilai' || activeTab === 'aktivitas') && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Total Catatan Penilaian</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{totalGrades}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-emerald-600 uppercase">Nilai Terbit Resmi</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">{publishedGrades}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-[11px] font-bold text-purple-600 uppercase">Rata-rata Skor Sekolah</div>
                  <div className="text-2xl font-black text-purple-700 mt-1">{avgGrade}</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="pb-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-6 h-6 text-purple-600" />
                      <span>Pengawasan & Rekap Nilai Akademik Siswa</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Audit menyeluruh terhadap nilai tugas, PH, STS, dan SAS yang diinput dewan guru.
                    </p>
                  </div>
                </div>

                {/* Filter and Search Bar for Grades */}
                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={gradeSearch}
                      onChange={e => setGradeSearch(e.target.value)}
                      placeholder="Cari siswa, NIS, guru, atau keterangan..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={gradeSubjectFilter}
                      onChange={e => setGradeSubjectFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="all">Semua Mapel</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>

                    <select
                      value={gradeClassFilter}
                      onChange={e => setGradeClassFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="all">Semua Kelas</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>

                    <select
                      value={gradeStatusFilter}
                      onChange={e => setGradeStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="all">Semua Status</option>
                      <option value="published">Terbit Resmi</option>
                      <option value="draft">Draft Guru</option>
                    </select>

                    {(gradeSearch || gradeSubjectFilter !== 'all' || gradeClassFilter !== 'all' || gradeStatusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setGradeSearch('');
                          setGradeSubjectFilter('all');
                          setGradeClassFilter('all');
                          setGradeStatusFilter('all');
                        }}
                        className="px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
                    <span>Memuat rekaman nilai dari Supabase...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-extrabold text-[11px]">
                          <th className="py-3 px-4 rounded-l-xl">Siswa</th>
                          <th className="py-3 px-3">Guru Pengampu</th>
                          <th className="py-3 px-3">Mapel</th>
                          <th className="py-3 px-3">Jenis & Keterangan</th>
                          <th className="py-3 px-3 text-center">Skor</th>
                          <th className="py-3 px-3">Tanggal</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 rounded-r-xl text-center">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredGrades.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400">
                              Tidak ada catatan nilai yang cocok dengan filter pencarian.
                            </td>
                          </tr>
                        ) : (
                          filteredGrades.map(g => (
                            <tr key={g.id} className="hover:bg-purple-50/30 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{g.student_name}</div>
                                <div className="text-[10px] text-purple-800 font-mono">NIS: {g.student_nis}</div>
                              </td>
                              <td className="py-3 px-3 text-slate-700">{g.teacher_name}</td>
                              <td className="py-3 px-3 font-semibold text-purple-800">{g.subject_name}</td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-800">{g.assessment_type}</div>
                                {g.description && <div className="text-[11px] text-slate-400 italic">{g.description}</div>}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`font-black font-mono px-2.5 py-1 rounded-lg text-xs ${
                                  Number(g.score) >= 75
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : Number(g.score) >= 60
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {g.score}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{g.assessment_date}</td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  g.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {g.status === 'published' ? 'Terbit' : 'Draft'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => handleDeleteGrade(g.id, g.student_name || 'Siswa', g.subject_name || 'Mapel')}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Hapus Nilai (Audit)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 8. PROFIL SEKOLAH ==================== */}
          {activeTab === 'profil-sekolah' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <School className="w-6 h-6 text-purple-600" />
                    <span>Profil Sekolah & Konfigurasi CBT</span>
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-slate-400 block mb-1">NAMA RESMI SEKOLAH</span>
                    <strong className="text-sm text-slate-900">SDI SAIQ AL-HIKMAH</strong>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-slate-400 block mb-1">STATUS AKREDITASI</span>
                    <strong className="text-sm text-emerald-700">A (Unggul)</strong>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 sm:col-span-2">
                    <span className="text-slate-400 block mb-1">SISTEM UJIAN ONLINE EKSTERNAL (CBT)</span>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={externalExamUrl}
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-xs text-slate-700"
                      />
                      <button
                        onClick={() => window.open(externalExamUrl, '_blank')}
                        className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-1 hover:bg-purple-700 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka CBT</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Pembuatan Akun Siswa Resmi (1 Siswa = 1 Akun Auth) */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Buat Akun Autentikasi Siswa</h3>
                  <p className="text-[11px] text-purple-700 font-semibold">
                    Prinsip: 1 Siswa = 1 Akun Supabase Auth (auth.users)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateAccountModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm"
              >
                &times;
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAccountMode('existing')}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  accountMode === 'existing'
                    ? 'bg-white text-purple-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pilih Siswa Terdaftar (Rekomendasi)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountMode('new');
                  setSelectedStudentId('');
                  setAccountEmail('');
                }}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  accountMode === 'new'
                    ? 'bg-white text-purple-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daftar Siswa Baru Sekaligus
              </button>
            </div>

            <form onSubmit={handleCreateAccountSubmit} className="space-y-3.5 text-xs">
              {accountMode === 'existing' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pilih Siswa yang Belum Memiliki Akun <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedStudentId}
                    onChange={e => handleSelectStudentForAccount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="">-- Pilih Siswa --</option>
                    <optgroup label="Siswa Belum Memiliki Akun">
                      {students.filter(s => !s.auth_user_id).map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} (NIS: {s.nis}) - {s.className}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Siswa Sudah Memiliki Akun (Dilarang Akun Kedua)">
                      {students.filter(s => !!s.auth_user_id).map(s => (
                        <option key={s.id} value={s.id} disabled>
                          {s.name} (NIS: {s.nis}) - [SUDAH TERKONEKSI UID]
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {/* Warning jika terpilih siswa yang sudah punya akun */}
                  {selectedStudentId && students.find(s => s.id === selectedStudentId)?.auth_user_id && (
                    <div className="mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>Siswa ini sudah memiliki akun aktif. Sistem menolak pembuatan akun kedua.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Lengkap Siswa Baru <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newStudent.name}
                      onChange={e => {
                        const val = e.target.value;
                        setNewStudent(prev => ({ ...prev, name: val }));
                        if (val && newStudent.nis) {
                          const safe = val.toLowerCase().replace(/[^a-z0-9]/g, '');
                          setAccountEmail(`${safe}.${newStudent.nis}@siswa.saiq.sch.id`);
                        }
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800"
                      placeholder="Contoh: Ahmad Fauzan"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nomor Induk Siswa (NIS) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newStudent.nis}
                        onChange={e => {
                          const val = e.target.value;
                          setNewStudent(prev => ({ ...prev, nis: val }));
                          if (newStudent.name && val) {
                            const safe = newStudent.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                            setAccountEmail(`${safe}.${val}@siswa.saiq.sch.id`);
                          }
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800"
                        placeholder="Contoh: 2024010"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Rombel Kelas</label>
                      <select
                        value={newStudent.classId}
                        onChange={e => setNewStudent(prev => ({ ...prev, classId: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800"
                      >
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Email Login Siswa <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={accountEmail}
                    onChange={e => setAccountEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800"
                    placeholder="nama.nis@siswa.saiq.sch.id"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Format email resmi sekolah untuk autentikasi Supabase.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kata Sandi Awal <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showAccountPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={accountPassword}
                    onChange={e => setAccountPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800"
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountPassword(!showAccountPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showAccountPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Password dienkripsi langsung oleh Supabase Auth dan tidak disimpan dalam bentuk plaintext.
                </p>
              </div>

              {/* Information Callout */}
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 text-purple-900 text-[11px] leading-relaxed">
                <strong>Prinsip Satu Siswa Satu Akun:</strong> Akun ini akan mendapatkan UUID eksklusif di <code className="font-mono bg-purple-100 px-1 rounded">auth.users</code> dan ditautkan ke kolom <code className="font-mono bg-purple-100 px-1 rounded">students.auth_user_id</code>. Siswa hanya dapat melihat portal pribadinya sendiri.
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateAccountModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || (accountMode === 'existing' && (!selectedStudentId || !!students.find(s => s.id === selectedStudentId)?.auth_user_id))}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Buat & Tautkan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pembuatan Akun Guru Resmi (1 Guru = 1 Akun Auth) */}
      {showCreateTeacherAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Buat Akun Autentikasi Guru</h3>
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    Prinsip: 1 Guru = 1 Akun Supabase Auth (teachers.auth_user_id)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateTeacherAccountModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm"
              >
                &times;
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTeacherAccountMode('existing')}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  teacherAccountMode === 'existing'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pilih Guru Terdaftar (Rekomendasi)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTeacherAccountMode('new');
                  setSelectedTeacherId('');
                  setTeacherAccountEmail('');
                }}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  teacherAccountMode === 'new'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daftar Guru Baru Sekaligus
              </button>
            </div>

            <form onSubmit={handleCreateTeacherAccountSubmit} className="space-y-3.5 text-xs">
              {teacherAccountMode === 'existing' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pilih Guru yang Belum Memiliki Akun <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedTeacherId}
                    onChange={e => handleSelectTeacherForAccount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">-- Pilih Guru --</option>
                    <optgroup label="Guru Belum Memiliki Akun">
                      {teachers.filter(t => !t.auth_user_id).map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} (NIP: {t.nip}) - {t.title}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Guru Sudah Memiliki Akun (Dilarang Akun Kedua)">
                      {teachers.filter(t => !!t.auth_user_id).map(t => (
                        <option key={t.id} value={t.id} disabled>
                          {t.name} (NIP: {t.nip}) - [SUDAH TERKONEKSI UID]
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {/* Warning jika terpilih guru yang sudah punya akun */}
                  {selectedTeacherId && teachers.find(t => t.id === selectedTeacherId)?.auth_user_id && (
                    <div className="mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>Guru ini sudah memiliki akun aktif. Sistem menolak pembuatan akun kedua.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Lengkap Guru & Gelar <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newTeacher.name}
                      onChange={e => {
                        const val = e.target.value;
                        setNewTeacher(prev => ({ ...prev, name: val }));
                        if (val && newTeacher.nip) {
                          const safe = val.toLowerCase().replace(/[^a-z0-9]/g, '');
                          const cleanNip = newTeacher.nip.replace(/[^0-9]/g, '');
                          setTeacherAccountEmail(`${safe}.${cleanNip}@guru.saiq.sch.id`);
                        }
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800"
                      placeholder="Contoh: Ust. Hamdan, S.Pd.I"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nomor Induk Pegawai (NIP) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newTeacher.nip}
                        onChange={e => {
                          const val = e.target.value;
                          setNewTeacher(prev => ({ ...prev, nip: val }));
                          if (newTeacher.name && val) {
                            const safe = newTeacher.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                            const cleanNip = val.replace(/[^0-9]/g, '');
                            setTeacherAccountEmail(`${safe}.${cleanNip}@guru.saiq.sch.id`);
                          }
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800"
                        placeholder="Contoh: 198904122015021004"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Jabatan / Bidang Studi</label>
                      <input
                        type="text"
                        value={newTeacher.title}
                        onChange={e => setNewTeacher(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800"
                        placeholder="Contoh: Guru Tahfidz"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Email Login Guru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={teacherAccountEmail}
                    onChange={e => setTeacherAccountEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800"
                    placeholder="nama.nip@guru.saiq.sch.id"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Format email resmi dewan guru untuk autentikasi Supabase.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kata Sandi Awal Guru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showTeacherAccountPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={teacherAccountPassword}
                    onChange={e => setTeacherAccountPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800"
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherAccountPassword(!showTeacherAccountPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showTeacherAccountPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Password dienkripsi langsung oleh Supabase Auth dan tidak disimpan dalam bentuk plaintext.
                </p>
              </div>

              {/* Information Callout */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900 text-[11px] leading-relaxed">
                <strong>Prinsip Satu Guru Satu Akun:</strong> Akun ini akan mendapatkan UUID eksklusif di <code className="font-mono bg-emerald-100 px-1 rounded">auth.users</code> dengan role <code className="font-mono bg-emerald-100 px-1 rounded">teacher</code> dan ditautkan ke kolom <code className="font-mono bg-emerald-100 px-1 rounded">teachers.auth_user_id</code>. Guru dapat login di <code className="font-mono bg-emerald-100 px-1 rounded">/login/guru</code>.
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateTeacherAccountModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || (teacherAccountMode === 'existing' && (!selectedTeacherId || !!teachers.find(t => t.id === selectedTeacherId)?.auth_user_id))}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Buat & Tautkan Akun Guru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Siswa */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Tambah Akun Siswa Baru</h3>
            <p className="text-xs text-slate-500 mb-4">
              Akun dibuat secara aman terhubung ke database siswa.
            </p>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={e => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Contoh: Muhammad Yusuf"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Induk Siswa (NIS - Unik)</label>
                <input
                  type="text"
                  required
                  value={newStudent.nis}
                  onChange={e => setNewStudent(prev => ({ ...prev, nis: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Contoh: 2024009"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Email Login Siswa</label>
                <input
                  type="email"
                  required
                  value={newStudent.email}
                  onChange={e => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="yusuf@sdisaiqalhikmah.sch.id"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi Awal</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newStudent.password}
                  onChange={e => setNewStudent(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Rombel Kelas</label>
                <select
                  value={newStudent.classId}
                  onChange={e => setNewStudent(prev => ({ ...prev, classId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Buat Akun Siswa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Guru */}
      {showAddTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Tambah Guru Pendidik</h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan identitas ustadz/ustadzah baru ke sistem.
            </p>

            <form onSubmit={handleAddTeacherSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={newTeacher.name}
                  onChange={e => setNewTeacher(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Contoh: Ust. Hamdan, S.Pd.I"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Induk Pegawai (NIP)</label>
                <input
                  type="text"
                  required
                  value={newTeacher.nip}
                  onChange={e => setNewTeacher(prev => ({ ...prev, nip: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Contoh: 198904122015021004"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jabatan / Guru Bidang Studi</label>
                <input
                  type="text"
                  value={newTeacher.title}
                  onChange={e => setNewTeacher(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Contoh: Guru Tahfidz & Bahasa Arab"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Foto Profil (Opsional)</label>
                <input
                  type="url"
                  value={newTeacher.photo_url}
                  onChange={e => setNewTeacher(prev => ({ ...prev, photo_url: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="https://..."
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddTeacher(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Simpan Guru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Kelas */}
      {showAddClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Tambah Rombel Kelas</h3>
            <p className="text-xs text-slate-500 mb-4">Buat rombel kelas belajar santri baru.</p>

            <form onSubmit={handleAddClassSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kelas</label>
                <input
                  type="text"
                  required
                  value={newClass.name}
                  onChange={e => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Contoh: Kelas 2-A Abu Bakar"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tingkat Kelas (1 - 6)</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  required
                  value={newClass.level}
                  onChange={e => setNewClass(prev => ({ ...prev, level: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddClass(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Tambah Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Mapel */}
      {showAddSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Tambah Mata Pelajaran</h3>
            <p className="text-xs text-slate-500 mb-4">Tambahkan kurikulum mapel baru.</p>

            <form onSubmit={handleAddSubjectSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Mapel (Singkat)</label>
                <input
                  type="text"
                  required
                  value={newSubject.code}
                  onChange={e => setNewSubject(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  placeholder="Contoh: PAI / PJOK / MTK"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={newSubject.name}
                  onChange={e => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Contoh: Pendidikan Agama Islam"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={newSubject.category}
                  onChange={e => setNewSubject(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="Wajib">Wajib Nasional</option>
                  <option value="Keislaman">Keislaman & Diniyah</option>
                  <option value="Tahfidz">Tahfidz Quran</option>
                  <option value="Muatan Lokal">Muatan Lokal</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddSubject(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Tambah Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Berita Halaman Depan */}
      {showAddArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Tambah Berita / Artikel Depan</h3>
            <p className="text-xs text-slate-500 mb-4">Berita ini langsung tampil di halaman depan website.</p>

            <form onSubmit={handleAddArticleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Berita</label>
                <input
                  type="text"
                  required
                  value={newArticle.title}
                  onChange={e => setNewArticle(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Contoh: Santri SDI SAIQ Sabet Juara Tahfidz"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={newArticle.category}
                    onChange={e => setNewArticle(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="Prestasi">Prestasi</option>
                    <option value="Akademik">Akademik</option>
                    <option value="Kegiatan">Kegiatan</option>
                    <option value="Pengumuman">Pengumuman</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="text"
                    required
                    value={newArticle.date}
                    onChange={e => setNewArticle(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Foto Artikel</label>
                <input
                  type="url"
                  required
                  value={newArticle.img}
                  onChange={e => setNewArticle(prev => ({ ...prev, img: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Isi Ringkasan Berita</label>
                <textarea
                  rows={3}
                  value={newArticle.content}
                  onChange={e => setNewArticle(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Tuliskan ulasan ringkas mengenai kegiatan ini..."
                ></textarea>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddArticle(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Terbitkan Berita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Agenda */}
      {showAddAgenda && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Tambah Agenda Sekolah</h3>
            <p className="text-xs text-slate-500 mb-4">Agenda tampil di bagian kalender halaman depan.</p>

            <form onSubmit={handleAddAgendaSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal (Hari)</label>
                  <input
                    type="text"
                    required
                    value={newAgenda.day}
                    onChange={e => setNewAgenda(prev => ({ ...prev, day: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    placeholder="Contoh: 15"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bulan (Singkat)</label>
                  <input
                    type="text"
                    required
                    value={newAgenda.month}
                    onChange={e => setNewAgenda(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    placeholder="Contoh: Okt / Nov"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Agenda Kegiatan</label>
                <input
                  type="text"
                  required
                  value={newAgenda.title}
                  onChange={e => setNewAgenda(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Contoh: Wisuda Tahfidz Juz 30"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Waktu Kegiatan</label>
                <input
                  type="text"
                  required
                  value={newAgenda.time}
                  onChange={e => setNewAgenda(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Contoh: 08.00 - 11.30 WIB"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tempat / Lokasi</label>
                <input
                  type="text"
                  required
                  value={newAgenda.location}
                  onChange={e => setNewAgenda(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Contoh: Masjid SDI SAIQ"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddAgenda(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
