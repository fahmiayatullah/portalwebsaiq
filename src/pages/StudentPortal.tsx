import React, { useState, useEffect } from 'react';
import {
  Home, Award, MessageSquare, Megaphone,
  User, TrendingUp, CheckCircle2,
  ExternalLink, ChevronRight, Eye, Check, Loader2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PortalHeader } from '../components/PortalHeader';
import type { Grade, TeacherNote, Announcement } from '../types';

export const StudentPortal: React.FC = () => {
  const { studentData, currentPath, navigate, openExternalExam } = useAuth();

  // Determine active tab from URL sub-path
  const getTabFromPath = () => {
    if (currentPath === '/portal/siswa/nilai') return 'nilai';
    if (currentPath === '/portal/siswa/keterangan') return 'keterangan';
    if (currentPath === '/portal/siswa/pengumuman') return 'pengumuman';
    if (currentPath === '/portal/siswa/perkembangan') return 'perkembangan';
    if (currentPath === '/portal/siswa/profil') return 'profil';
    return 'beranda';
  };

  const activeTab = getTabFromPath();

  const handleTabChange = (tab: string) => {
    if (tab === 'beranda') navigate('/portal/siswa');
    else navigate(`/portal/siswa/${tab}`);
  };

  // Real Database States
  const [grades, setGrades] = useState<Grade[]>([]);
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  const [gradeError, setGradeError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Modal Detail Nilai
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  // Fetch Real Grades from Supabase
  useEffect(() => {
    if (!studentData?.id) {
      setLoadingGrades(false);
      return;
    }

    const fetchGrades = async () => {
      setLoadingGrades(true);
      setGradeError(null);
      try {
        const { data, error } = await supabase
          .from('grades')
          .select('*, subjects(name, code), teachers(name)')
          .eq('student_id', studentData.id)
          .eq('status', 'published')
          .order('assessment_date', { ascending: false });

        if (error) {
          console.error('Error fetching student grades:', error.message);
          setGradeError('Gagal memuat data nilai dari server.');
        } else if (data) {
          const formatted: Grade[] = data.map(item => ({
            ...item,
            subject_name: (item as any).subjects?.name || 'Mata Pelajaran',
            teacher_name: (item as any).teachers?.name || 'Guru Pengampu',
          }));
          setGrades(formatted);
        }
      } catch (err) {
        setGradeError('Terjadi kendala saat memuat data nilai.');
      } finally {
        setLoadingGrades(false);
      }
    };

    fetchGrades();
  }, [studentData]);

  // Fetch Real Teacher Notes from Supabase
  useEffect(() => {
    if (!studentData?.id) {
      setLoadingNotes(false);
      return;
    }

    const fetchNotes = async () => {
      setLoadingNotes(true);
      setNoteError(null);
      try {
        const { data, error } = await supabase
          .from('teacher_notes')
          .select('*, subjects(name), teachers(name)')
          .eq('student_id', studentData.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching teacher notes:', error.message);
          setNoteError('Gagal memuat catatan guru dari server.');
        } else if (data) {
          const formatted: TeacherNote[] = data.map(item => ({
            ...item,
            subject_name: (item as any).subjects?.name || 'Bimbingan Umum',
            teacher_name: (item as any).teachers?.name || 'Bapak/Ibu Guru',
          }));
          setNotes(formatted);
        }
      } catch (err) {
        setNoteError('Terjadi kendala saat memuat catatan guru.');
      } finally {
        setLoadingNotes(false);
      }
    };

    fetchNotes();
  }, [studentData]);

  // Fetch Real Announcements from Supabase
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoadingAnnouncements(true);
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setAnnouncements(data as Announcement[]);
        }
      } catch (err) {
        console.error('Error fetching announcements:', err);
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    fetchAnnouncements();
  }, [studentData]);

  // Handler: Siswa menandai catatan telah dibaca (RLS mengizinkan update read_at miliknya)
  const handleMarkNoteRead = async (noteId: string) => {
    const now = new Date().toISOString();
    try {
      const { error } = await supabase
        .from('teacher_notes')
        .update({ read_at: now })
        .eq('id', noteId);

      if (!error) {
        setNotes(prev =>
          prev.map(n => (n.id === noteId ? { ...n, read_at: now } : n))
        );
      }
    } catch (err) {
      console.error('Error marking note as read:', err);
    }
  };

  // Perhitungan Perkembangan Belajar Berdasarkan Nilai Nyata
  const averageScore = grades.length > 0
    ? Math.round(grades.reduce((acc, curr) => acc + Number(curr.score), 0) / grades.length)
    : 0;

  const gradesBySubject: Record<string, Grade[]> = {};
  grades.forEach(g => {
    const sub = g.subject_name || 'Mata Pelajaran';
    if (!gradesBySubject[sub]) {
      gradesBySubject[sub] = [];
    }
    gradesBySubject[sub].push(g);
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <PortalHeader
        title="Portal Siswa"
        subtitle="Ruang Informasi Akademik Pribadi Siswa"
        activeRole="student"
      />

      <div className="flex-1 container mx-auto px-4 md:px-6 py-6 max-w-7xl flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav (Desktop) */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 sticky top-24 space-y-4">
            {/* Student Mini Profile */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <img
                src={studentData?.photo_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=256'}
                alt={studentData?.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
              />
              <div className="overflow-hidden">
                <div className="font-extrabold text-sm text-slate-900 truncate">
                  {studentData?.name || 'Siswa Terdaftar'}
                </div>
                <div className="text-xs text-emerald-700 font-semibold truncate">
                  NIS: {studentData?.nis || '-'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {studentData?.className || 'SDI SAIQ AL-HIKMAH'}
                </div>
              </div>
            </div>

            {/* Menu List */}
            <nav className="space-y-1">
              {[
                { id: 'beranda', label: 'Beranda', icon: <Home className="w-4 h-4" /> },
                { id: 'nilai', label: 'Nilai Saya', icon: <Award className="w-4 h-4" />, count: grades.length },
                { id: 'keterangan', label: 'Catatan Guru', icon: <MessageSquare className="w-4 h-4" />, count: notes.filter(n => !n.read_at).length, alert: true },
                { id: 'perkembangan', label: 'Perkembangan Belajar', icon: <TrendingUp className="w-4 h-4" /> },
                { id: 'pengumuman', label: 'Pengumuman', icon: <Megaphone className="w-4 h-4" />, count: announcements.length },
                { id: 'profil', label: 'Profil Siswa', icon: <User className="w-4 h-4" /> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === item.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === item.id
                        ? 'bg-white/20 text-white'
                        : item.alert
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Pintu Masuk Sistem Ujian Eksternal Sekolah (Section 27) */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={openExternalExam}
                className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 flex items-center justify-between text-xs font-extrabold transition-all group"
                title="Buka sistem ujian online resmi sekolah"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-amber-600" />
                  <span>Sistem Ujian Online</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <p className="text-[10px] text-slate-400 mt-1 px-1 text-center">
                Pintu masuk ke CBT eksternal sekolah
              </p>
            </div>
          </div>
        </aside>

        {/* Main Sub-view Content */}
        <main className="flex-1 space-y-6 pb-20 md:pb-8">
          {/* ==================== 1. BERANDA ==================== */}
          {activeTab === 'beranda' && (
            <div className="space-y-6">
              {/* Welcome Header */}
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <img
                    src={studentData?.photo_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=256'}
                    alt={studentData?.name}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-4 border-white/30 shadow-md shrink-0"
                  />
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-semibold mb-1 backdrop-blur-sm">
                      <span>👋 Selamat Datang di Ruang Informasi Akademik</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                      Selamat datang, {studentData?.name || 'Siswa'}
                    </h2>
                    <p className="text-xs md:text-sm text-emerald-100 mt-1">
                      Pantau nilai, catatan pembinaan bapak/ibu guru, dan perkembangan belajarmu di sini.
                    </p>
                  </div>
                </div>

                {/* Identity Badges */}
                <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                    <div className="text-emerald-200 text-[10px] font-bold">NOMOR INDUK (NIS)</div>
                    <div className="font-extrabold text-sm mt-0.5">{studentData?.nis || '-'}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                    <div className="text-emerald-200 text-[10px] font-bold">KELAS</div>
                    <div className="font-extrabold text-sm mt-0.5 truncate">{studentData?.className || '-'}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                    <div className="text-emerald-200 text-[10px] font-bold">STATUS SISWA</div>
                    <div className="font-extrabold text-sm mt-0.5 text-emerald-200 uppercase">{studentData?.status || 'Aktif'}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                    <div className="text-emerald-200 text-[10px] font-bold">RATA-RATA NILAI</div>
                    <div className="font-extrabold text-sm mt-0.5">{averageScore > 0 ? averageScore : '-'}</div>
                  </div>
                </div>
              </div>

              {/* 4 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Card Nilai Terbaru */}
                <div
                  onClick={() => handleTabChange('nilai')}
                  className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer border border-slate-200/80 flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {grades.length} Terbit
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">NILAI TERBARU</h3>
                    {loadingGrades ? (
                      <div className="py-4 text-xs text-slate-400 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memuat data nilai...</span>
                      </div>
                    ) : grades.length > 0 ? (
                      <div className="mt-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-base font-extrabold text-slate-900">{grades[0].subject_name}</span>
                          <span className="text-xl font-black text-emerald-700">{grades[0].score}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                          "{grades[0].description || 'Tanpa keterangan'}"
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mt-2">Tidak ada nilai yang telah dipublikasikan.</p>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-bold">
                    <span>Lihat Semua Nilai</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Card Catatan Guru */}
                <div
                  onClick={() => handleTabChange('keterangan')}
                  className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer border border-slate-200/80 flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      {notes.filter(n => !n.read_at).length} Belum Dibaca
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">CATATAN GURU</h3>
                    {loadingNotes ? (
                      <div className="py-4 text-xs text-slate-400 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memuat catatan...</span>
                      </div>
                    ) : notes.length > 0 ? (
                      <div className="mt-2">
                        <div className="text-sm font-extrabold text-slate-900 line-clamp-1">{notes[0].title}</div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          "{notes[0].content}"
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mt-2">Belum ada catatan dari guru.</p>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-bold">
                    <span>Buka Catatan Guru</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Card Perkembangan Belajar */}
                <div
                  onClick={() => handleTabChange('perkembangan')}
                  className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer border border-slate-200/80 flex flex-col justify-between group sm:col-span-2 lg:col-span-1"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      Rata-rata: {averageScore > 0 ? averageScore : '-'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">PERKEMBANGAN BELAJAR</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Pantau grafik tren capaian nilai pada setiap mata pelajaran berdasarkan penilaian resmi.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-amber-600 font-bold">
                    <span>Lihat Perkembangan</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 2. NILAI SAYA ==================== */}
          {activeTab === 'nilai' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <Award className="w-6 h-6 text-emerald-600" />
                      <span>Nilai Saya</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Daftar nilai resmi yang telah diterbitkan oleh dewan guru di SDI SAIQ AL-HIKMAH.
                    </p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-2xl text-xs font-bold self-start">
                    Rata-rata: <span className="text-sm font-black">{averageScore > 0 ? averageScore : '-'}</span>
                  </div>
                </div>

                {loadingGrades ? (
                  <div className="text-center py-16 text-slate-400 text-sm flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                    <span>Memuat data nilai dari server Supabase...</span>
                  </div>
                ) : gradeError ? (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 mt-4">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{gradeError}</span>
                  </div>
                ) : grades.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-sm">
                    Tidak ada nilai yang telah dipublikasikan.
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto mt-4">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-extrabold text-[11px]">
                            <th className="py-3 px-4 rounded-l-xl">Mata Pelajaran</th>
                            <th className="py-3 px-3">Jenis Penilaian</th>
                            <th className="py-3 px-3">Tanggal</th>
                            <th className="py-3 px-3 text-center">Nilai</th>
                            <th className="py-3 px-4">Keterangan Guru</th>
                            <th className="py-3 px-3">Guru</th>
                            <th className="py-3 px-3 rounded-r-xl text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {grades.map(grade => (
                            <tr key={grade.id} className="hover:bg-emerald-50/40 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-slate-900">{grade.subject_name}</td>
                              <td className="py-3.5 px-3 font-medium text-slate-600">{grade.assessment_type}</td>
                              <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px]">{grade.assessment_date}</td>
                              <td className="py-3.5 px-3 text-center">
                                <span className={`inline-block font-black text-sm px-2.5 py-1 rounded-xl ${
                                  grade.score >= 85
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : grade.score >= 75
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {grade.score}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={grade.description || ''}>
                                "{grade.description || 'Tanpa catatan'}"
                              </td>
                              <td className="py-3.5 px-3 text-slate-600 font-medium">{grade.teacher_name}</td>
                              <td className="py-3.5 px-3 text-center">
                                <button
                                  onClick={() => setSelectedGrade(grade)}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                  title="Lihat Detail Nilai"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="md:hidden space-y-3 mt-4">
                      {grades.map(grade => (
                        <div
                          key={grade.id}
                          onClick={() => setSelectedGrade(grade)}
                          className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 cursor-pointer hover:bg-emerald-50/30 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-900">{grade.subject_name}</h4>
                              <p className="text-xs text-slate-500">{grade.assessment_type} • {grade.assessment_date}</p>
                            </div>
                            <span className="text-base font-black px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-mono">
                              {grade.score}
                            </span>
                          </div>
                          {grade.description && (
                            <div className="text-xs text-slate-600 italic bg-white p-2 rounded-xl border border-slate-100">
                              "{grade.description}"
                            </div>
                          )}
                          <div className="text-[11px] text-emerald-700 font-bold">
                            Guru: {grade.teacher_name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ==================== 3. KETERANGAN GURU ==================== */}
          {activeTab === 'keterangan' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                    <span>Catatan Bimbingan Guru</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Komunikasi akademik dan catatan perkembangan pembelajaran pribadi langsung dari dewan guru.
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  {loadingNotes ? (
                    <div className="text-center py-16 text-slate-400 text-sm flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                      <span>Memuat catatan guru...</span>
                    </div>
                  ) : noteError ? (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      {noteError}
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-sm">
                      Belum ada catatan atau keterangan yang dipublikasikan oleh guru.
                    </div>
                  ) : (
                    notes.map(note => {
                      const isUnread = !note.read_at;
                      return (
                        <div
                          key={note.id}
                          className={`rounded-3xl p-5 border transition-all ${
                            isUnread
                              ? 'bg-gradient-to-r from-blue-50/60 to-emerald-50/40 border-blue-200 shadow-sm'
                              : 'bg-slate-50/80 border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                                  {note.subject_name}
                                </span>
                                {isUnread ? (
                                  <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                                    Belum Dibaca
                                  </span>
                                ) : (
                                  <span className="bg-slate-200 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-600" /> Sudah Dibaca
                                  </span>
                                )}
                              </div>
                              <h3 className="text-base font-extrabold text-slate-900 mt-2">{note.title}</h3>
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              {note.created_at ? new Date(note.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                            </div>
                          </div>

                          <div className="bg-white p-4 rounded-2xl border border-slate-100 text-sm text-slate-700 leading-relaxed shadow-inner">
                            "{note.content}"
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
                            <div className="text-xs text-slate-600 font-medium">
                              <span className="text-slate-400">Guru:</span> <strong className="text-emerald-800">{note.teacher_name}</strong>
                            </div>

                            {isUnread && (
                              <button
                                onClick={() => handleMarkNoteRead(note.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Tandai Sudah Dibaca</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 4. PERKEMBANGAN BELAJAR ==================== */}
          {activeTab === 'perkembangan' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                    <span>Perkembangan Belajar</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Grafik capaian nilai siswa dari waktu ke waktu per mata pelajaran berdasarkan data penilaian nyata.
                  </p>
                </div>

                {grades.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-sm">
                    Belum ada riwayat nilai untuk menampilkan perkembangan belajar.
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                        <div className="text-xs text-emerald-700 font-bold">Rata-rata Nilai</div>
                        <div className="text-3xl font-black text-emerald-800 mt-1">{averageScore}</div>
                        <div className="text-[11px] text-emerald-600 mt-0.5">Dari {grades.length} penilaian terbit</div>
                      </div>
                      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                        <div className="text-xs text-blue-700 font-bold">Nilai Tertinggi</div>
                        <div className="text-3xl font-black text-blue-800 mt-1">
                          {Math.max(...grades.map(g => Number(g.score)))}
                        </div>
                        <div className="text-[11px] text-blue-600 mt-0.5">Capaian optimal ananda</div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <h3 className="font-extrabold text-sm text-slate-900">Grafik Nilai Per Mata Pelajaran</h3>
                      {Object.keys(gradesBySubject).map(subName => {
                        const subGrades = gradesBySubject[subName];
                        const scoresTrend = subGrades.map(g => g.score).reverse();

                        return (
                          <div key={subName} className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-extrabold text-sm text-slate-900">{subName}</span>
                              <span className="font-mono text-xs font-bold text-emerald-700">
                                {scoresTrend.join(' → ')}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {subGrades.slice().reverse().map(g => (
                                <div key={g.id} className="flex items-center gap-3 text-xs">
                                  <span className="w-24 text-slate-500 text-[11px] truncate">{g.assessment_type}</span>
                                  <div className="flex-1 bg-white rounded-full h-3 overflow-hidden border border-slate-200">
                                    <div
                                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                      style={{ width: `${Math.min(100, Math.max(0, Number(g.score)))}%` }}
                                    ></div>
                                  </div>
                                  <span className="w-8 text-right font-black text-slate-800 font-mono">{g.score}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 5. PENGUMUMAN ==================== */}
          {activeTab === 'pengumuman' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Megaphone className="w-6 h-6 text-teal-600" />
                    <span>Pengumuman Sekolah</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Informasi resmi kegiatan akademik, tata tertib, dan jadwal penting dari madrasah.
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  {loadingAnnouncements ? (
                    <div className="text-center py-16 text-slate-400 text-sm flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
                      <span>Memuat pengumuman...</span>
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-sm">
                      Belum ada pengumuman yang dipublikasikan.
                    </div>
                  ) : (
                    announcements.map(anc => (
                      <div key={anc.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {anc.target_type === 'all' ? 'Seluruh Siswa' : 'Informasi Rombel'}
                          </span>
                          <span className="text-slate-400 font-mono">
                            {anc.created_at ? new Date(anc.created_at).toLocaleDateString('id-ID') : '-'}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-base text-slate-900">{anc.title}</h3>
                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                          {anc.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 6. PROFIL SISWA ==================== */}
          {activeTab === 'profil' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <User className="w-6 h-6 text-emerald-600" />
                    <span>Profil Siswa</span>
                  </h2>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <img
                    src={studentData?.photo_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=256'}
                    alt={studentData?.name}
                    className="w-28 h-28 rounded-3xl object-cover border-4 border-emerald-500 shadow-lg"
                  />
                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">{studentData?.name}</h3>
                      <p className="text-xs text-emerald-700 font-bold">Status: {studentData?.status || 'Aktif'}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Nomor Induk Siswa (NIS)</span>
                        <strong className="text-slate-800 text-sm font-mono">{studentData?.nis}</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Kelas & Rombel</span>
                        <strong className="text-slate-800 text-sm">{studentData?.className || 'Kelas Belum Ditentukan'}</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">ID Pengguna Supabase Auth</span>
                        <strong className="text-slate-600 text-[11px] font-mono truncate block">{studentData?.auth_user_id}</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Terdaftar Sejak</span>
                        <strong className="text-slate-800 text-sm">
                          {studentData?.created_at ? new Date(studentData.created_at).toLocaleDateString('id-ID') : '-'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Detail Nilai */}
      {selectedGrade && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">Detail Penilaian</h3>
              <button onClick={() => setSelectedGrade(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>
            <div className="py-4 space-y-3">
              <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <div>
                  <span className="text-xs text-emerald-800 font-bold">{selectedGrade.subject_name}</span>
                  <div className="text-base font-extrabold text-slate-900">{selectedGrade.assessment_type}</div>
                </div>
                <div className="text-3xl font-black text-emerald-800 font-mono">{selectedGrade.score}</div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 italic">
                "{selectedGrade.description || 'Tidak ada catatan khusus.'}"
              </div>
              <div className="text-xs text-slate-500">
                Guru: <strong className="text-slate-800">{selectedGrade.teacher_name}</strong> • Tanggal: {selectedGrade.assessment_date}
              </div>
            </div>
            <button
              onClick={() => setSelectedGrade(null)}
              className="w-full py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex justify-around items-center safe-bottom shadow-lg">
        {[
          { id: 'beranda', label: 'Beranda', icon: <Home className="w-5 h-5" /> },
          { id: 'nilai', label: 'Nilai', icon: <Award className="w-5 h-5" /> },
          { id: 'keterangan', label: 'Catatan', icon: <MessageSquare className="w-5 h-5" />, alert: notes.some(n => !n.read_at) },
          { id: 'pengumuman', label: 'Pengumuman', icon: <Megaphone className="w-5 h-5" /> },
          { id: 'profil', label: 'Profil', icon: <User className="w-5 h-5" /> },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors relative ${
              activeTab === item.id ? 'text-emerald-700 font-extrabold' : 'text-slate-400 font-medium'
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-0.5">{item.label}</span>
            {item.alert && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
