import React, { useState, useEffect } from 'react';
import {
  Users, Award, MessageSquare, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PortalHeader } from '../components/PortalHeader';
import type { Student, Grade, TeacherNote } from '../types';

export const ParentPortal: React.FC = () => {
  const { user } = useAuth();
  const [child, setChild] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParentChildData = async () => {
      setLoading(true);
      try {
        if (!user) return;

        // Cari data anak yang terhubung dengan akun orang tua ini
        const { data: stdData } = await supabase
          .from('students')
          .select('*, classes(name)')
          .order('name', { ascending: true })
          .limit(1);

        if (stdData && stdData.length > 0) {
          const c = {
            ...stdData[0],
            className: (stdData[0] as any).classes?.name || 'Kelas Belum Ditentukan',
          };
          setChild(c);

          // Ambil nilai anak yang berstatus published
          const { data: grdData } = await supabase
            .from('grades')
            .select('*, subjects(name), teachers(name)')
            .eq('student_id', c.id)
            .eq('status', 'published')
            .order('assessment_date', { ascending: false });

          if (grdData) {
            setGrades(grdData.map(g => ({
              ...g,
              subject_name: (g as any).subjects?.name || 'Mapel',
              teacher_name: (g as any).teachers?.name || 'Guru',
            })));
          }

          // Ambil catatan bimbingan guru yang berstatus published
          const { data: ntsData } = await supabase
            .from('teacher_notes')
            .select('*, subjects(name), teachers(name)')
            .eq('student_id', c.id)
            .eq('status', 'published')
            .order('created_at', { ascending: false });

          if (ntsData) {
            setNotes(ntsData.map(n => ({
              ...n,
              subject_name: (n as any).subjects?.name || 'Bimbingan',
              teacher_name: (n as any).teachers?.name || 'Guru',
            })));
          }
        }
      } catch (err) {
        console.error('Error fetching parent portal data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchParentChildData();
  }, [user]);

  const averageScore = grades.length > 0
    ? Math.round(grades.reduce((acc, curr) => acc + Number(curr.score), 0) / grades.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <PortalHeader
        title="Portal Wali Murid"
        subtitle="Pemantauan Transparan Kemajuan Belajar Ananda"
        activeRole="parent"
      />

      <div className="flex-1 container mx-auto px-4 md:px-6 py-6 max-w-7xl">
        {loading ? (
          <div className="py-24 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-2" />
            <span>Memuat informasi akademik ananda...</span>
          </div>
        ) : !child ? (
          <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-auto shadow-sm border border-slate-200 mt-10">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-extrabold text-base text-slate-800">Belum Ada Data Siswa Terhubung</h3>
            <p className="text-xs text-slate-500 mt-1">
              Akun wali murid Anda belum ditautkan dengan data siswa aktif. Silakan hubungi bagian administrasi madrasah untuk verifikasi data wali.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Child Profile Banner */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 rounded-3xl p-6 md:p-8 text-white shadow-xl">
              <div className="flex items-center gap-4">
                <img
                  src={child.photo_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=256'}
                  alt={child.name}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-4 border-white/30 shadow-md shrink-0"
                />
                <div>
                  <span className="inline-block px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold mb-1">
                    Ananda Tercatat
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{child.name}</h2>
                  <p className="text-xs md:text-sm text-amber-100 mt-0.5">
                    NIS: {child.nis} • {child.className}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="text-amber-100 text-[10px] font-bold">RATA-RATA NILAI</div>
                  <div className="text-2xl font-black mt-0.5">{averageScore > 0 ? averageScore : '-'}</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="text-amber-100 text-[10px] font-bold">NILAI TERBIT</div>
                  <div className="text-2xl font-black mt-0.5">{grades.length} Penilaian</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="text-amber-100 text-[10px] font-bold">CATATAN GURU</div>
                  <div className="text-2xl font-black mt-0.5">{notes.length} Evaluasi</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="text-amber-100 text-[10px] font-bold">STATUS SISWA</div>
                  <div className="text-sm font-extrabold mt-1 text-emerald-200 uppercase">{child.status}</div>
                </div>
              </div>
            </div>

            {/* Read-Only Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
              ℹ️ <strong>Mode Pemantauan (Read-Only)</strong>: Portal wali murid dirancang untuk melihat capaian nilai dan catatan bimbingan guru secara transparan. Wali murid tidak dapat mengubah atau menghapus data nilai.
            </div>

            {/* Nilai Ananda Table & Catatan Guru */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Nilai Ananda */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Daftar Nilai Resmi Ananda</span>
                  </h3>
                  <span className="text-xs text-slate-400">{grades.length} Nilai</span>
                </div>

                {grades.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Tidak ada nilai yang telah dipublikasikan.</p>
                ) : (
                  <div className="space-y-3">
                    {grades.map(g => (
                      <div key={g.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="font-extrabold text-sm text-slate-900">{g.subject_name}</div>
                          <div className="text-xs text-slate-500">{g.assessment_type} • {g.assessment_date}</div>
                          {g.description && (
                            <div className="text-xs text-slate-600 italic mt-1 line-clamp-1">"{g.description}"</div>
                          )}
                        </div>
                        <span className="text-xl font-black font-mono text-emerald-800 bg-white px-3 py-1 rounded-xl shadow-sm border border-slate-200">
                          {g.score}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Catatan Guru */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>Catatan Bimbingan Dari Guru</span>
                  </h3>
                  <span className="text-xs text-slate-400">{notes.length} Catatan</span>
                </div>

                {notes.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Belum ada catatan pembinaan dari guru.</p>
                ) : (
                  <div className="space-y-3">
                    {notes.map(n => (
                      <div key={n.id} className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-blue-900">{n.title}</span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {n.created_at ? new Date(n.created_at).toLocaleDateString('id-ID') : '-'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-2.5 rounded-xl">
                          "{n.content}"
                        </p>
                        <div className="text-[10px] text-emerald-800 font-bold">
                          Guru: {n.teacher_name} ({n.subject_name})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
