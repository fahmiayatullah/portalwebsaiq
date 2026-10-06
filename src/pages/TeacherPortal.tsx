import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, UserCheck, Award, MessageSquare,
  Megaphone, History, User, PlusCircle, CheckCircle2,
  Save, Send, ChevronRight, Loader2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PortalHeader } from '../components/PortalHeader';
import type { Teacher, Student, Grade, TeacherNote, Announcement, ClassRoom, Subject } from '../types';

export const TeacherPortal: React.FC = () => {
  const { teacherData, currentPath, navigate } = useAuth();

  const getTabFromPath = () => {
    if (currentPath === '/portal/guru/kelas') return 'kelas';
    if (currentPath === '/portal/guru/siswa') return 'siswa';
    if (currentPath === '/portal/guru/nilai') return 'nilai';
    if (currentPath === '/portal/guru/keterangan') return 'keterangan';
    if (currentPath === '/portal/guru/pengumuman') return 'pengumuman';
    if (currentPath === '/portal/guru/riwayat') return 'riwayat';
    if (currentPath === '/portal/guru/profil') return 'profil';
    return 'dashboard';
  };

  const activeTab = getTabFromPath();

  const handleTabChange = (tab: string) => {
    if (tab === 'dashboard') navigate('/portal/guru');
    else navigate(`/portal/guru/${tab}`);
  };

  // Real Database States
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacherGrades, setTeacherGrades] = useState<Grade[]>([]);
  const [teacherNotes, setTeacherNotes] = useState<TeacherNote[]>([]);

  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form: Input Nilai
  const [gradeForm, setGradeForm] = useState({
    classId: '',
    studentId: '',
    subjectId: '',
    assessmentType: 'Tugas Praktik',
    assessmentDate: new Date().toISOString().split('T')[0],
    score: 85,
    description: '',
  });

  // Form: Catatan Guru
  const [noteForm, setNoteForm] = useState({
    classId: '',
    studentId: '',
    subjectId: '',
    title: '',
    content: '',
  });

  // Form: Pengumuman
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    targetType: 'all' as 'all' | 'class' | 'student',
    targetClassId: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Master Data & Teacher Records from Supabase
  const loadTeacherData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Classes
      const { data: clsData } = await supabase
        .from('classes')
        .select('*')
        .order('level', { ascending: true });
      if (clsData) {
        setClasses(clsData as ClassRoom[]);
        if (clsData.length > 0 && !gradeForm.classId) {
          setGradeForm(prev => ({ ...prev, classId: clsData[0].id }));
          setNoteForm(prev => ({ ...prev, classId: clsData[0].id }));
        }
      }

      // 2. Fetch Subjects
      const { data: sbjData } = await supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true });
      if (sbjData) {
        setSubjects(sbjData as Subject[]);
        if (sbjData.length > 0 && !gradeForm.subjectId) {
          setGradeForm(prev => ({ ...prev, subjectId: sbjData[0].id }));
          setNoteForm(prev => ({ ...prev, subjectId: sbjData[0].id }));
        }
      }

      // 3. Fetch Students
      const { data: stdData } = await supabase
        .from('students')
        .select('*, classes(name)')
        .order('name', { ascending: true });
      if (stdData) {
        const mapped = stdData.map(s => ({
          ...s,
          className: (s as any).classes?.name || 'Kelas Belum Ditentukan',
        }));
        setStudents(mapped);
        if (mapped.length > 0 && !gradeForm.studentId) {
          setGradeForm(prev => ({ ...prev, studentId: mapped[0].id }));
          setNoteForm(prev => ({ ...prev, studentId: mapped[0].id }));
        }
      }

      // 4. Fetch Teacher Grades
      if (teacherData?.id) {
        const { data: grdData } = await supabase
          .from('grades')
          .select('*, students(name), subjects(name)')
          .eq('teacher_id', teacherData.id)
          .order('created_at', { ascending: false });

        if (grdData) {
          setTeacherGrades(grdData.map(g => ({
            ...g,
            student_name: (g as any).students?.name || 'Siswa',
            subject_name: (g as any).subjects?.name || 'Mapel',
          })));
        }

        // 5. Fetch Teacher Notes
        const { data: ntsData } = await supabase
          .from('teacher_notes')
          .select('*, students(name), subjects(name)')
          .eq('teacher_id', teacherData.id)
          .order('created_at', { ascending: false });

        if (ntsData) {
          setTeacherNotes(ntsData.map(n => ({
            ...n,
            student_name: (n as any).students?.name || 'Siswa',
            subject_name: (n as any).subjects?.name || 'Mapel',
          })));
        }
      }
    } catch (err) {
      console.error('Error loading teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherData();
  }, [teacherData]);

  // Handler: Input Nilai (Draft / Publish) dengan Validasi Skor 0 - 100
  const handleSaveGrade = async (status: 'draft' | 'published') => {
    setFormError(null);

    if (!teacherData?.id) {
      setFormError('Data identitas guru belum terverifikasi.');
      return;
    }

    if (!gradeForm.studentId || !gradeForm.subjectId) {
      setFormError('Pilih siswa dan mata pelajaran terlebih dahulu.');
      return;
    }

    const scoreNum = Number(gradeForm.score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      setFormError('Nilai harus berupa angka antara 0 hingga 100.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('grades').insert({
        student_id: gradeForm.studentId,
        teacher_id: teacherData.id,
        subject_id: gradeForm.subjectId,
        assessment_type: gradeForm.assessmentType,
        score: scoreNum,
        description: gradeForm.description.trim() || null,
        assessment_date: gradeForm.assessmentDate,
        status,
        published_at: status === 'published' ? now : null,
      });

      if (error) {
        setFormError(`Gagal menyimpan nilai: ${error.message}`);
      } else {
        showToast(status === 'published' ? '✅ Nilai berhasil dipublikasikan ke siswa!' : '📝 Nilai disimpan sebagai Draft.');
        setGradeForm(prev => ({ ...prev, description: '' }));
        loadTeacherData();
      }
    } catch (err: any) {
      setFormError('Terjadi kendala saat menyimpan nilai ke database.');
    }
  };

  // Handler: Catatan Guru (Draft / Publish)
  const handleSaveNote = async (status: 'draft' | 'published') => {
    setFormError(null);

    if (!teacherData?.id) {
      setFormError('Data guru belum terverifikasi.');
      return;
    }

    if (!noteForm.studentId || !noteForm.title.trim() || !noteForm.content.trim()) {
      setFormError('Lengkapi judul dan isi catatan bimbingan.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('teacher_notes').insert({
        student_id: noteForm.studentId,
        teacher_id: teacherData.id,
        subject_id: noteForm.subjectId || null,
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
        status,
        published_at: status === 'published' ? now : null,
      });

      if (error) {
        setFormError(`Gagal mengirim catatan: ${error.message}`);
      } else {
        showToast(status === 'published' ? '✅ Catatan berhasil dipublikasikan ke siswa!' : '📝 Catatan disimpan sebagai Draft.');
        setNoteForm(prev => ({ ...prev, title: '', content: '' }));
        loadTeacherData();
      }
    } catch (err) {
      setFormError('Terjadi kendala saat menyimpan catatan.');
    }
  };

  // Filtered Students for chosen class
  const filteredStudents = gradeForm.classId
    ? students.filter(s => s.class_id === gradeForm.classId)
    : students;

  const draftGradesCount = teacherGrades.filter(g => g.status === 'draft').length;
  const draftNotesCount = teacherNotes.filter(n => n.status === 'draft').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <PortalHeader
        title="Portal Guru"
        subtitle="Pemberian Nilai & Catatan Akademik Siswa"
        activeRole="teacher"
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-800 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex-1 container mx-auto px-4 md:px-6 py-6 max-w-7xl flex flex-col md:flex-row gap-6">
        {/* Desktop Sidebar Nav */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 sticky top-24 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <img
                src={teacherData?.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256'}
                alt={teacherData?.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-500 shadow-sm"
              />
              <div className="overflow-hidden">
                <div className="font-extrabold text-sm text-slate-900 truncate">{teacherData?.name || 'Bapak/Ibu Guru'}</div>
                <div className="text-xs text-blue-700 font-semibold truncate">{teacherData?.title || 'Tenaga Pendidik'}</div>
                <div className="text-[11px] text-slate-400 truncate">NIP: {teacherData?.nip || '-'}</div>
              </div>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
                { id: 'kelas', label: 'Kelas', icon: <Users className="w-4 h-4" />, count: classes.length },
                { id: 'siswa', label: 'Data Siswa', icon: <UserCheck className="w-4 h-4" />, count: students.length },
                { id: 'nilai', label: 'Input Nilai', icon: <Award className="w-4 h-4" />, count: draftGradesCount > 0 ? draftGradesCount : undefined, alert: draftGradesCount > 0 },
                { id: 'keterangan', label: 'Catatan Guru', icon: <MessageSquare className="w-4 h-4" />, count: draftNotesCount > 0 ? draftNotesCount : undefined, alert: draftNotesCount > 0 },
                { id: 'riwayat', label: 'Riwayat Penilaian', icon: <History className="w-4 h-4" /> },
                { id: 'profil', label: 'Profil Guru', icon: <User className="w-4 h-4" /> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-700/20'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === item.id
                        ? 'bg-white/20 text-white'
                        : item.alert
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 space-y-6 pb-20 md:pb-8">
          {/* ==================== 1. DASHBOARD ==================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Ahlan wa Sahlan, {teacherData?.name || 'Bapak/Ibu Guru'} 👋
                </h2>
                <p className="text-xs md:text-sm text-blue-100 mt-1 max-w-xl">
                  Portal penginputan nilai dan pemberian catatan bimbingan akademik untuk siswa SDI SAIQ AL-HIKMAH.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                    <div className="text-[10px] text-blue-200 font-bold">ROMBEL / KELAS</div>
                    <div className="text-2xl font-black mt-0.5">{classes.length}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                    <div className="text-[10px] text-blue-200 font-bold">TOTAL SISWA</div>
                    <div className="text-2xl font-black mt-0.5">{students.length}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                    <div className="text-[10px] text-blue-200 font-bold">NILAI DITERBITKAN</div>
                    <div className="text-2xl font-black mt-0.5">{teacherGrades.filter(g => g.status === 'published').length}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                    <div className="text-[10px] text-blue-200 font-bold">DRAFT TERTUNDA</div>
                    <div className="text-2xl font-black mt-0.5 text-amber-300">{draftGradesCount + draftNotesCount}</div>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleTabChange('nilai')}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-2">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Input Nilai Siswa
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Penilaian formatif, praktik, dan harian</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleTabChange('keterangan')}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-2">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                      Kirim Catatan Guru
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Catatan bimbingan belajar personal siswa</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Riwayat Penilaian Terakhir */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-sm">Aktivitas Penilaian Terakhir Saya</h3>
                  <button
                    onClick={() => handleTabChange('riwayat')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    Buka Riwayat
                  </button>
                </div>

                {teacherGrades.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Belum ada penilaian yang diinput ke Supabase.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {teacherGrades.slice(0, 4).map(g => (
                      <div key={g.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{g.student_name}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-blue-700 font-semibold">{g.subject_name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              g.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {g.status === 'published' ? 'Terbit' : 'Draft'}
                            </span>
                          </div>
                          <p className="text-slate-500 mt-0.5">{g.assessment_type}: "{g.description || 'Tanpa catatan'}"</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-black text-base text-slate-900 font-mono">{g.score}</div>
                          <div className="text-[10px] text-slate-400">{g.assessment_date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 2. INPUT NILAI GURU ==================== */}
          {activeTab === 'nilai' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <PlusCircle className="w-6 h-6 text-emerald-600" />
                    <span>Input Nilai Siswa</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Masukkan capaian nilai nyata siswa (0 - 100) dan catatan guru. Simpan sebagai Draft untuk ditinjau, atau Publikasikan agar langsung dapat dilihat oleh siswa.
                  </p>
                </div>

                {formError && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSaveGrade('published');
                  }}
                  className="mt-6 space-y-4 max-w-2xl"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Pilih Kelas */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Kelas</label>
                      <select
                        value={gradeForm.classId}
                        onChange={e => setGradeForm(prev => ({ ...prev, classId: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Pilih Siswa */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Siswa</label>
                      <select
                        value={gradeForm.studentId}
                        onChange={e => setGradeForm(prev => ({ ...prev, studentId: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {filteredStudents.length === 0 ? (
                          <option value="">Belum ada siswa di kelas ini</option>
                        ) : (
                          filteredStudents.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.nis})</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Mata Pelajaran */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                      <select
                        value={gradeForm.subjectId}
                        onChange={e => setGradeForm(prev => ({ ...prev, subjectId: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {subjects.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Jenis Penilaian */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Penilaian</label>
                      <input
                        type="text"
                        value={gradeForm.assessmentType}
                        onChange={e => setGradeForm(prev => ({ ...prev, assessmentType: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Contoh: Tugas Praktik / Latihan"
                        required
                      />
                    </div>

                    {/* Tanggal Penilaian */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                      <input
                        type="date"
                        value={gradeForm.assessmentDate}
                        onChange={e => setGradeForm(prev => ({ ...prev, assessmentDate: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Nilai (Validasi score >= 0 AND score <= 100) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nilai Siswa (0 - 100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={gradeForm.score}
                      onChange={e => setGradeForm(prev => ({ ...prev, score: Number(e.target.value) }))}
                      className="w-32 px-3.5 py-2.5 rounded-xl border border-slate-200 text-lg font-black text-emerald-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  {/* Keterangan Guru */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Keterangan & Catatan Guru
                    </label>
                    <textarea
                      rows={3}
                      value={gradeForm.description}
                      onChange={e => setGradeForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Contoh: Sudah memahami gerakan dasar dengan baik."
                    ></textarea>
                  </div>

                  {/* Aksi: Simpan Draft atau Publikasikan */}
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleSaveGrade('draft')}
                      className="px-5 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-xs flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4 text-slate-500" />
                      <span>Simpan Draft</span>
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all text-xs flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      <span>Publikasikan (Siswa Dapat Melihat)</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ==================== 3. CATATAN GURU ==================== */}
          {activeTab === 'keterangan' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                    <span>Kirim Catatan Bimbingan Siswa</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kirimkan catatan evaluasi perkembangan pembelajaran secara langsung dan privat kepada siswa terkait.
                  </p>
                </div>

                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSaveNote('published');
                  }}
                  className="mt-6 space-y-4 max-w-2xl"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Target Siswa</label>
                      <select
                        value={noteForm.studentId}
                        onChange={e => setNoteForm(prev => ({ ...prev, studentId: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.className})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran (Opsional)</label>
                      <select
                        value={noteForm.subjectId}
                        onChange={e => setNoteForm(prev => ({ ...prev, subjectId: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Bimbingan Umum / Karakter</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Judul Catatan</label>
                    <input
                      type="text"
                      value={noteForm.title}
                      onChange={e => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contoh: Perkembangan Praktik / Catatan Latihan Berhitung"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Isi Catatan Guru</label>
                    <textarea
                      rows={4}
                      value={noteForm.content}
                      onChange={e => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tuliskan bimbingan secara konstruktif dan memotivasi..."
                      required
                    ></textarea>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleSaveNote('draft')}
                      className="px-5 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4 text-slate-500" />
                      <span>Simpan Draft</span>
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all text-xs flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      <span>Publikasikan ke Siswa</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ==================== 4. DATA SISWA ==================== */}
          {activeTab === 'siswa' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                    <span>Data Siswa Terdaftar</span>
                  </h2>
                </div>

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-extrabold text-[11px]">
                        <th className="py-3 px-4 rounded-l-xl">Siswa</th>
                        <th className="py-3 px-3">NIS</th>
                        <th className="py-3 px-3">Kelas</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 rounded-r-xl text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map(st => (
                        <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{st.name}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">{st.nis}</td>
                          <td className="py-3 px-3 text-slate-600">{st.className}</td>
                          <td className="py-3 px-3">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {st.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                setGradeForm(prev => ({ ...prev, studentId: st.id, classId: st.class_id || '' }));
                                handleTabChange('nilai');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold"
                            >
                              Beri Nilai
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 5. RIWAYAT PENILAIAN ==================== */}
          {activeTab === 'riwayat' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <History className="w-6 h-6 text-indigo-600" />
                    <span>Riwayat Penilaian & Catatan Guru</span>
                  </h2>
                </div>

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-extrabold text-[11px]">
                        <th className="py-3 px-4 rounded-l-xl">Siswa</th>
                        <th className="py-3 px-3">Mapel</th>
                        <th className="py-3 px-3">Jenis</th>
                        <th className="py-3 px-3 text-center">Skor</th>
                        <th className="py-3 px-4">Keterangan</th>
                        <th className="py-3 px-3">Tanggal</th>
                        <th className="py-3 px-3 rounded-r-xl text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teacherGrades.map(g => (
                        <tr key={g.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{g.student_name}</td>
                          <td className="py-3 px-3 font-semibold text-blue-700">{g.subject_name}</td>
                          <td className="py-3 px-3 text-slate-600">{g.assessment_type}</td>
                          <td className="py-3 px-3 text-center font-black font-mono">{g.score}</td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={g.description || ''}>
                            "{g.description || '-'}"
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{g.assessment_date}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              g.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {g.status === 'published' ? 'Terbit' : 'Draft'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 6. KELAS SAYA ==================== */}
          {activeTab === 'kelas' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    <span>Daftar Rombel Kelas</span>
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {classes.map(c => {
                    const count = students.filter(s => s.class_id === c.id).length;
                    return (
                      <div key={c.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-extrabold text-base text-slate-900">{c.name}</h4>
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            Tingkat {c.level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Jumlah Siswa: <strong className="text-slate-800">{count} Siswa</strong>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 7. PROFIL GURU ==================== */}
          {activeTab === 'profil' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <User className="w-6 h-6 text-blue-600" />
                    <span>Profil Guru Pendidik</span>
                  </h2>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <img
                    src={teacherData?.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256'}
                    alt={teacherData?.name}
                    className="w-28 h-28 rounded-3xl object-cover border-4 border-blue-500 shadow-lg"
                  />
                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">{teacherData?.name}</h3>
                      <p className="text-xs text-blue-700 font-bold">{teacherData?.title}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Nomor Induk Pegawai (NIP)</span>
                        <strong className="text-slate-800 text-sm font-mono">{teacherData?.nip || '-'}</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">ID Pengguna Supabase Auth</span>
                        <strong className="text-slate-600 text-[11px] font-mono truncate block">{teacherData?.auth_user_id}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation for Teacher */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex justify-around items-center safe-bottom shadow-lg">
        {[
          { id: 'dashboard', label: 'Beranda', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'nilai', label: 'Input Nilai', icon: <Award className="w-5 h-5" /> },
          { id: 'keterangan', label: 'Catatan', icon: <MessageSquare className="w-5 h-5" /> },
          { id: 'siswa', label: 'Siswa', icon: <Users className="w-5 h-5" /> },
          { id: 'profil', label: 'Profil', icon: <User className="w-5 h-5" /> },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
              activeTab === item.id ? 'text-blue-700 font-extrabold' : 'text-slate-400 font-medium'
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
