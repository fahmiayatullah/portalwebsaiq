import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, UserCheck, BookOpen, Layers,
  Activity, School, Plus, ExternalLink, Loader2, AlertCircle,
  CheckCircle2, Trash2, Calendar, Newspaper, ArrowRight,
  GraduationCap
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

type AdminTab = 'dashboard' | 'siswa' | 'guru' | 'kelas' | 'mapel' | 'artikel' | 'aktivitas' | 'profil-sekolah';

export const AdminPortal: React.FC = () => {
  const { externalExamUrl, navigate, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

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

  // Modals state
  const [showAddStudent, setShowAddStudent] = useState(false);
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
        supabase.from('grades').select('*, students(name), teachers(name), subjects(name)').order('created_at', { ascending: false }).limit(50)
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

  // 1. TAMBAH SISWA
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.nis || !newStudent.email || !newStudent.password) {
      showNotification('error', 'Semua kolom siswa wajib diisi lengkap.');
      return;
    }

    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-student', {
        body: {
          email: newStudent.email.trim(),
          password: newStudent.password,
          nis: newStudent.nis.trim(),
          name: newStudent.name.trim(),
          class_id: newStudent.classId || null,
        },
      });

      if (error || data?.error) {
        // Fallback: direct insert to students table
        const { error: insertErr } = await supabase.from('students').insert({
          name: newStudent.name.trim(),
          nis: newStudent.nis.trim(),
          class_id: newStudent.classId || null,
          auth_user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          status: 'active',
        });

        if (insertErr) {
          showNotification('error', `Gagal menambahkan siswa: ${insertErr.message}`);
        } else {
          showNotification('success', `Data siswa ${newStudent.name} (NIS: ${newStudent.nis}) berhasil ditambahkan ke database!`);
          setShowAddStudent(false);
          setNewStudent({ name: '', nis: '', email: '', password: '', classId: classes[0]?.id || '' });
          loadAllData();
        }
      } else {
        showNotification('success', `Akun siswa ${newStudent.name} (NIS: ${newStudent.nis}) berhasil dibuat via Edge Function!`);
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

  // 2. TAMBAH GURU
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
        auth_user_id: user?.id || '00000000-0000-0000-0000-000000000000',
      });

      if (error) {
        showNotification('error', `Gagal menambahkan guru: ${error.message}`);
      } else {
        showNotification('success', `Guru ${newTeacher.name} berhasil ditambahkan!`);
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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <PortalHeader
        title="Portal Administrator"
        subtitle="Manajemen Pengguna, Halaman Depan & Pengawasan Penilaian Sekolah"
        activeRole="admin"
      />

      {/* Quick Navigation Toolbar to Guru & Murid portals */}
      <div className="bg-purple-900 text-white px-4 md:px-8 py-2.5 shadow-sm text-xs">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-purple-200">
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            <span>Mode Super Administrator (Akses Penuh):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/portal/guru')}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-white transition-colors flex items-center gap-1.5"
              title="Langsung Buka & Periksa Portal Guru"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Buka Portal Guru</span>
            </button>
            <button
              onClick={() => navigate('/portal/siswa')}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition-colors flex items-center gap-1.5"
              title="Langsung Buka & Periksa Portal Siswa"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Buka Portal Siswa</span>
            </button>
            <button
              onClick={() => navigate('/portal/wali')}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 font-bold text-white transition-colors flex items-center gap-1.5"
              title="Langsung Buka Portal Wali Murid"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Buka Portal Wali</span>
            </button>
          </div>
        </div>
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
                { id: 'guru' as const, label: 'Kelola Guru', icon: <UserCheck className="w-4 h-4" />, count: teachers.length },
                { id: 'kelas' as const, label: 'Kelas & Rombel', icon: <Layers className="w-4 h-4" />, count: classes.length },
                { id: 'mapel' as const, label: 'Mata Pelajaran', icon: <BookOpen className="w-4 h-4" />, count: subjects.length },
                { id: 'artikel' as const, label: 'Artikel & Agenda Depan', icon: <Newspaper className="w-4 h-4" />, count: articles.length + agendas.length },
                { id: 'aktivitas' as const, label: 'Audit Penilaian Guru', icon: <Activity className="w-4 h-4" />, count: grades.length },
                { id: 'profil-sekolah' as const, label: 'Profil Sekolah & CBT', icon: <School className="w-4 h-4" /> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20 text-xs">
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all" onClick={() => setActiveTab('siswa')}>
                    <div className="text-purple-200 text-[10px] font-bold">TOTAL SISWA</div>
                    <div className="text-2xl font-black mt-0.5">{students.length}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all" onClick={() => setActiveTab('guru')}>
                    <div className="text-purple-200 text-[10px] font-bold">TOTAL GURU</div>
                    <div className="text-2xl font-black mt-0.5">{teachers.length}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all" onClick={() => setActiveTab('artikel')}>
                    <div className="text-purple-200 text-[10px] font-bold">BERITA & AGENDA</div>
                    <div className="text-2xl font-black mt-0.5">{articles.length + agendas.length}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all" onClick={() => setActiveTab('aktivitas')}>
                    <div className="text-purple-200 text-[10px] font-bold">NILAI TERCATAT</div>
                    <div className="text-2xl font-black mt-0.5">{grades.length}</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  onClick={() => navigate('/portal/guru')}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-2">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                    Periksa Portal Guru
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Langsung input nilai & catatan guru</p>
                </button>

                <button
                  onClick={() => navigate('/portal/siswa')}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-2">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Inspeksi Portal Siswa
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Lihat transparansi nilai & catatan siswa</p>
                </button>
              </div>

              {/* Log Aktivitas Penilaian Guru */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <span>Audit Trail: Aktivitas Penilaian Guru Terakhir</span>
                  </h3>
                  <button onClick={() => setActiveTab('aktivitas')} className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1">
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
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
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
                  <button
                    onClick={() => setShowAddStudent(true)}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Siswa Baru</span>
                  </button>
                </div>

                {loading ? (
                  <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
                    <span>Memuat data siswa dari Supabase...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-extrabold text-[11px]">
                          <th className="py-3 px-4 rounded-l-xl">Nama Siswa</th>
                          <th className="py-3 px-3">NIS</th>
                          <th className="py-3 px-3">Kelas</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 rounded-r-xl text-center">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">Belum ada data siswa terdaftar.</td>
                          </tr>
                        ) : (
                          students.map(s => (
                            <tr key={s.id} className="hover:bg-purple-50/30 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                              <td className="py-3 px-3 font-mono font-bold text-purple-800">{s.nis}</td>
                              <td className="py-3 px-3 text-slate-600">{s.className}</td>
                              <td className="py-3 px-3">
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                  {s.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => handleDeleteStudent(s.id, s.name)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Hapus Siswa"
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

          {/* ==================== 7. AUDIT PENILAIAN ==================== */}
          {activeTab === 'aktivitas' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-purple-600" />
                    <span>Audit Penilaian Guru Seluruh Sekolah</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pengawasan transparan seluruh nilai yang diinput oleh dewan guru ke siswa.
                  </p>
                </div>

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-extrabold text-[11px]">
                        <th className="py-3 px-4 rounded-l-xl">Siswa</th>
                        <th className="py-3 px-3">Guru Pengampu</th>
                        <th className="py-3 px-3">Mapel</th>
                        <th className="py-3 px-3">Jenis</th>
                        <th className="py-3 px-3 text-center">Skor</th>
                        <th className="py-3 px-3">Tanggal</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 rounded-r-xl text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grades.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">Belum ada catatan nilai.</td>
                        </tr>
                      ) : (
                        grades.map(g => (
                          <tr key={g.id} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{g.student_name}</td>
                            <td className="py-3 px-3 text-slate-700">{g.teacher_name}</td>
                            <td className="py-3 px-3 font-semibold text-purple-800">{g.subject_name}</td>
                            <td className="py-3 px-3 text-slate-500">{g.assessment_type}</td>
                            <td className="py-3 px-3 text-center font-black font-mono text-emerald-800">{g.score}</td>
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
                                title="Hapus Nilai"
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
