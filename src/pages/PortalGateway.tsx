import React from 'react';
import {
  GraduationCap, UserCheck, Users, ShieldCheck, ArrowRight,
  ExternalLink, ArrowLeft, Sparkles, School, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PortalGateway: React.FC = () => {
  const { navigate, openExternalExam, externalExamUrl } = useAuth();

  const portals = [
    {
      path: '/portal/siswa',
      title: 'Portal Siswa',
      subtitle: 'Ruang Informasi Akademik Pribadi Siswa',
      icon: <GraduationCap className="w-8 h-8 text-emerald-600" />,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Siswa / Murid',
      bgLight: 'bg-emerald-50',
      features: [
        'Melihat nilai tugas & latihan yang diterbitkan guru',
        'Membaca catatan & bimbingan personal dari guru',
        'Grafik perkembangan belajar per mata pelajaran',
        'Pengumuman akademik resmi madrasah',
      ],
    },
    {
      path: '/portal/guru',
      title: 'Portal Guru',
      subtitle: 'Pusat Penginputan Nilai & Catatan Akademik',
      icon: <UserCheck className="w-8 h-8 text-blue-600" />,
      color: 'from-blue-600 to-cyan-600',
      badge: 'Bapak / Ibu Guru',
      bgLight: 'bg-blue-50',
      features: [
        'Input nilai individu & simpan Draft atau Publikasi',
        'Kirim catatan & motivasi bimbingan belajar siswa',
        'Lihat daftar siswa terdaftar pada setiap rombel',
        'Terbitkan pengumuman akademik sekolah',
      ],
    },
    {
      path: '/portal/wali',
      title: 'Portal Wali Murid',
      subtitle: 'Pemantauan Transparan Kemajuan Belajar Ananda',
      icon: <Users className="w-8 h-8 text-amber-600" />,
      color: 'from-amber-500 to-orange-500',
      badge: 'Orang Tua / Wali',
      bgLight: 'bg-amber-50',
      features: [
        'Melihat transkrip nilai ananda secara transparan',
        'Membaca evaluasi dan keterangan pembinaan guru',
        'Pantau grafik perkembangan nilai ananda',
        'Akses pengumuman penting sekolah',
      ],
    },
    {
      path: '/portal/admin',
      title: 'Portal Administrator',
      subtitle: 'Pengelolaan Akun Pengguna & Data Sekolah',
      icon: <ShieldCheck className="w-8 h-8 text-purple-600" />,
      color: 'from-purple-600 to-indigo-600',
      badge: 'Staf Administrasi',
      bgLight: 'bg-purple-50',
      features: [
        'Pembuatan akun siswa resmi via Supabase Auth Admin',
        'Kelola data master guru, kelas, dan mata pelajaran',
        'Audit aktivitas penginputan nilai dewan guru',
        'Konfigurasi profil sekolah dan sistem CBT eksternal',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Website Utama</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <School className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-slate-800 text-sm hidden sm:inline">SDI SAIQ AL-HIKMAH</span>
          </div>

          <button
            onClick={() => navigate('/portal/login')}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            Masuk / Login
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-10 md:py-16 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>PORTAL INFORMASI AKADEMIK</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
            Pilih Ruang Akses Portal
          </h1>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            Sistem informasi akademik terpadu SDI SAIQ AL-HIKMAH dengan autentikasi akun Supabase terverifikasi.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
          {portals.map((p, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-slate-200/80 flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-center mb-5">
                  <div className={`w-14 h-14 rounded-2xl ${p.bgLight} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {p.icon}
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {p.badge}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">
                  {p.title}
                </h2>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  {p.subtitle}
                </p>

                <div className="space-y-2 mb-6 border-t border-slate-100 pt-4">
                  {p.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button
                  onClick={() => navigate(p.path)}
                  className={`w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r ${p.color} shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm`}
                >
                  <span>Masuk Ruang {p.badge}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* External Exam Banner (Section 27) */}
        <div className="mt-12 max-w-3xl mx-auto w-full bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-amber-500/10 border border-amber-300/80 rounded-3xl p-6 text-center shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold mb-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>SISTEM UJIAN RESMI SEKOLAH</span>
          </div>
          <h3 className="text-lg md:text-xl font-extrabold text-slate-900 mb-2">
            Mencari Tempat Pelaksanaan Ujian Online?
          </h3>
          <p className="text-xs md:text-sm text-slate-600 max-w-xl mx-auto mb-4 leading-relaxed">
            Portal ini difokuskan sebagai ruang informasi akademik, nilai, dan catatan guru. Pelaksanaan ujian online berlangsung pada server ujian sekolah mandiri yang sudah ada.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3">
            <button
              onClick={openExternalExam}
              className="px-6 py-2.5 rounded-xl font-extrabold text-sm text-amber-950 bg-amber-400 hover:bg-amber-300 shadow-md flex items-center gap-2 transition-all hover:scale-105"
            >
              <span>Masuk ke Sistem Ujian Sekolah</span>
              <ExternalLink className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 font-mono">
              ({externalExamUrl})
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-500 border-t border-slate-200 bg-white">
        SDI SAIQ AL-HIKMAH • Portal Informasi Akademik Siswa & Guru
      </footer>
    </div>
  );
};
