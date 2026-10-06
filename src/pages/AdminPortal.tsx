import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, UserCheck, BookOpen, Layers,
  Activity, School, Plus, ExternalLink, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PortalHeader } from '../components/PortalHeader';
import type { Student, Teacher, ClassRoom, Subject, Grade } from '../types';

type AdminTab = 'dashboard' | 'siswa' | 'guru' | 'kelas' | 'mapel' | 'aktivitas' | 'profil-sekolah';

export const AdminPortal: React.FC = () => {
  const { externalExamUrl } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Form Tambah Siswa Baru
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    nis: '',
    email: '',
    password: '',
    classId: '',
  });

  const loadAllData = async () => {
    setLoading(true);
    try {
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
        supabase.from('grades').select('*, students(name), teachers(name), subjects(name)').order('created_at', { ascending: false }).limit(20)
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

  // Pembuatan Akun Siswa Menggunakan Supabase Edge Function (Aman, Tanpa Service Role di Browser)
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!newStudent.name || !newStudent.nis || !newStudent.email || !newStudent.password) {
      setFeedback({ type: 'error', message: 'Semua kolom wajib diisi lengkap.' });
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
        setFeedback({
          type: 'error',
          message: data?.error || error?.message || 'Gagal membuat akun siswa melalui server Edge Function.',
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Akun siswa ${newStudent.name} (NIS: ${newStudent.nis}) berhasil dibuat dan dihubungkan ke Supabase Auth!`,
        });
        setShowAddStudent(false);
        setNewStudent({ name: '', nis: '', email: '', password: '', classId: classes[0]?.id || '' });
        loadAllData();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Koneksi ke Edge Function gagal. Pastikan fungsi create-student telah di-deploy ke Supabase.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <PortalHeader
        title="Portal Administrator"
        subtitle="Manajemen Pengguna & Pengawasan Penilaian Sekolah"
        activeRole="admin"
      />

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
                { id: 'dashboard' as const, label: 'Dashboard', icon: <Activity className="w-4 h-4" /> },
                { id: 'siswa' as const, label: 'Kelola Siswa', icon: <Users className="w-4 h-4" />, count: students.length },
                { id: 'guru' as const, label: 'Kelola Guru', icon: <UserCheck className="w-4 h-4" />, count: teachers.length },
                { id: 'kelas' as const, label: 'Kelas & Rombel', icon: <Layers className="w-4 h-4" />, count: classes.length },
                { id: 'mapel' as const, label: 'Mata Pelajaran', icon: <BookOpen className="w-4 h-4" />, count: subjects.length },
                { id: 'aktivitas' as const, label: 'Audit Penilaian Guru', icon: <Activity className="w-4 h-4" /> },
                { id: 'profil-sekolah' as const, label: 'Profil Sekolah', icon: <School className="w-4 h-4" /> },
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
                  Pengawasan menyeluruh data siswa, akun guru, dan aktivitas penerbitan nilai resmi di SDI SAIQ AL-HIKMAH.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20 text-xs">
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                    <div className="text-purple-200 text-[10px] font-bold">TOTAL SISWA</div>
                    <div className="text-2xl font-black mt-0.5">{students.length}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                    <div className="text-purple-200 text-[10px] font-bold">TOTAL GURU</div>
                    <div className="text-2xl font-black mt-0.5">{teachers.length}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                    <div className="text-purple-200 text-[10px] font-bold">ROMBEL / KELAS</div>
                    <div className="text-2xl font-black mt-0.5">{classes.length}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                    <div className="text-purple-200 text-[10px] font-bold">NILAI TERCATAT</div>
                    <div className="text-2xl font-black mt-0.5">{grades.length}</div>
                  </div>
                </div>
              </div>

              {/* Log Aktivitas Penilaian Guru */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <span>Audit Trail: Aktivitas Penilaian Guru Terakhir</span>
                  </h3>
                </div>

                {grades.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Belum ada aktivitas penilaian yang tercatat di Supabase.</p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {grades.map(g => (
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
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <Users className="w-6 h-6 text-purple-600" />
                      <span>Manajemen Siswa (Supabase Auth)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Setiap siswa terhubung 1:1 dengan akun Supabase Auth resmi. Pembuatan akun dilakukan aman via Edge Function.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddStudent(true)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Akun Siswa</span>
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
                          <th className="py-3 px-3 rounded-r-xl">Auth User ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.map(s => (
                          <tr key={s.id} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                            <td className="py-3 px-3 font-mono font-bold text-purple-800">{s.nis}</td>
                            <td className="py-3 px-3 text-slate-600">{s.className}</td>
                            <td className="py-3 px-3">
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                {s.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-400 truncate max-w-[150px]">
                              {s.auth_user_id}
                            </td>
                          </tr>
                        ))}
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
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-purple-600" />
                    <span>Daftar Guru & Tenaga Pendidik</span>
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  {teachers.map(t => (
                    <div key={t.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-4">
                      <img
                        src={t.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256'}
                        alt={t.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500 shrink-0"
                      />
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{t.name}</h4>
                        <p className="text-xs text-purple-700 font-semibold">{t.title}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">NIP: {t.nip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 4. PROFIL SEKOLAH ==================== */}
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
                        className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-1"
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

      {/* Modal Tambah Siswa via Edge Function */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Tambah Akun Siswa Baru</h3>
            <p className="text-xs text-slate-500 mb-4">
              Akun dibuat secara aman melalui Supabase Auth Admin API di server.
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
    </div>
  );
};
