import React, { useState, useEffect } from 'react';
import {
  GraduationCap, BookOpen, Calendar, Award, FileText, CheckCircle,
  Mail, MapPin, Phone, ArrowUp, Star, Heart,
  ArrowRight, ExternalLink, ShieldCheck, ChevronRight,
  Sparkles, Menu, X, Users, BrainCircuit, Laptop, Medal, Palette, Globe,
  LogIn, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStoredArticles, getStoredAgendas } from '../services/articleService';

export const LandingPage: React.FC = () => {
  const { navigate, openExternalExam, externalExamUrl } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [articles] = useState(() => getStoredArticles());
  const [agendas] = useState(() => getStoredAgendas());

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const quickAccessData = [
    {
      icon: <GraduationCap className="w-6 h-6 text-emerald-600" />,
      title: "Portal Siswa",
      desc: "Nilai & Keterangan Guru",
      action: () => navigate('/portal/siswa'),
      badge: "Siswa",
      color: "bg-emerald-50",
    },
    {
      icon: <UserCheck className="w-6 h-6 text-blue-600" />,
      title: "Portal Guru",
      desc: "Input Nilai & Catatan",
      action: () => navigate('/portal/guru'),
      badge: "Guru",
      color: "bg-blue-50",
    },
    {
      icon: <ExternalLink className="w-6 h-6 text-amber-600" />,
      title: "Sistem Ujian CBT",
      desc: "Akses Ujian Online Sekolah",
      action: () => setShowExamModal(true),
      badge: "Eksternal",
      color: "bg-amber-50",
    },
    {
      icon: <Users className="w-6 h-6 text-purple-600" />,
      title: "Portal Wali Murid",
      desc: "Pantau Informasi Anak",
      action: () => navigate('/portal/wali'),
      badge: "Orang Tua",
      color: "bg-purple-50",
    },
    {
      icon: <FileText className="w-6 h-6 text-emerald-600" />,
      title: "E-Tugas",
      desc: "Informasi tugas akademik",
      action: () => navigate('/portal/siswa'),
      badge: "Akademik",
      color: "bg-emerald-50",
    },
    {
      icon: <Award className="w-6 h-6 text-rose-600" />,
      title: "Transkrip Nilai",
      desc: "Riwayat penilaian belajar",
      action: () => navigate('/portal/siswa'),
      badge: "Nilai",
      color: "bg-rose-50",
    },
    {
      icon: <Calendar className="w-6 h-6 text-teal-600" />,
      title: "Agenda & Kalender",
      desc: "Jadwal kegiatan sekolah",
      action: () => {
        const el = document.getElementById('agenda');
        el?.scrollIntoView({ behavior: 'smooth' });
      },
      badge: "Informasi",
      color: "bg-teal-50",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-indigo-600" />,
      title: "Portal Admin",
      desc: "Manajemen Data Sekolah",
      action: () => navigate('/portal/admin'),
      badge: "Staf",
      color: "bg-indigo-50",
    },
  ];

  const programData = [
    { icon: <Heart className="w-6 h-6" />, title: "Pendidikan Karakter & Akhlak", desc: "Membentuk budi pekerti luhur dengan pembiasaan adab Islami setiap hari." },
    { icon: <BookOpen className="w-6 h-6" />, title: "Tahfidz & Tahsin Al-Quran", desc: "Target hafalan terukur dengan bimbingan makharijul huruf yang fasih." },
    { icon: <BrainCircuit className="w-6 h-6" />, title: "Literasi & Nalar Kritis", desc: "Membangun budaya membaca, problem-solving, dan eksplorasi sains dasar." },
    { icon: <Laptop className="w-6 h-6" />, title: "Teknologi Digital & Koding", desc: "Literasi digital ramah anak, pengenalan logika pemrograman sejak dini." },
    { icon: <Medal className="w-6 h-6" />, title: "Kebugaran & Olahraga PJOK", desc: "Pengembangan motorik, ketangkasan, dan kerjasama tim yang sehat." },
    { icon: <Palette className="w-6 h-6" />, title: "Kreativitas Seni & Budaya", desc: "Mengasah ekspresi visual, keterampilan tangan, dan apresiasi seni Islam." },
    { icon: <Globe className="w-6 h-6" />, title: "Bahasa Arab & Inggris", desc: "Pengenalan percakapan bilingual dasar untuk memperluas wawasan global." },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Banner Info */}
      <div className="bg-emerald-800 text-white text-xs md:text-sm py-2 px-4">
        <div className="container mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded text-[11px]">INFO</span>
            <span className="truncate">📢 PPDB SDI SAIQ AL-HIKMAH Tahun Ajaran Baru Telah Dibuka!</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-emerald-100 text-xs">
            <span>Senin - Jumat: 07.00 - 15.30 WIB</span>
            <span>|</span>
            <span>Telp: (021) 1234-5678</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-white py-4 border-b border-slate-100'}`}>
        <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
          {/* Logo */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-lg leading-tight text-slate-900 tracking-tight">SDI SAIQ</div>
              <div className="text-xs font-bold tracking-widest text-emerald-600">AL-HIKMAH</div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden xl:flex items-center space-x-6 text-sm font-semibold text-slate-600">
            <a href="#beranda" className="hover:text-emerald-600 transition-colors">Beranda</a>
            <a href="#profil" className="hover:text-emerald-600 transition-colors">Profil</a>
            <a href="#visimisi" className="hover:text-emerald-600 transition-colors">Visi & Misi</a>
            <a href="#program" className="hover:text-emerald-600 transition-colors">Program</a>
            <a href="#akademik" className="hover:text-emerald-600 transition-colors">Akademik</a>
            <a href="#guru" className="hover:text-emerald-600 transition-colors">Guru</a>
            <a href="#berita" className="hover:text-emerald-600 transition-colors">Berita</a>
            <a href="#agenda" className="hover:text-emerald-600 transition-colors">Agenda</a>
            <a href="#kontak" className="hover:text-emerald-600 transition-colors">Kontak</a>
          </div>

          {/* Portal Gateway Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setShowExamModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200 transition-all flex items-center gap-1.5"
              title="Akses Sistem Ujian Online Sekolah"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Sistem Ujian
            </button>
            <button
              onClick={() => navigate('/portal')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-700/20 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              MASUK PORTAL
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => navigate('/portal')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600"
            >
              Portal
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-5 shadow-xl animate-in slide-in-from-top">
            <div className="flex flex-col space-y-3 font-semibold text-slate-700">
              <a href="#beranda" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-emerald-600">Beranda</a>
              <a href="#profil" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-emerald-600">Profil</a>
              <a href="#visimisi" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-emerald-600">Visi & Misi</a>
              <a href="#program" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-emerald-600">Program Unggulan</a>
              <a href="#akademik" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-emerald-600">Akademik</a>
              <a href="#guru" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-emerald-600">Guru & Pendidik</a>
              <a href="#berita" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-emerald-600">Berita & Informasi</a>
              <a href="#agenda" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-emerald-600">Agenda Kegiatan</a>
              <a href="#kontak" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-emerald-600">Kontak</a>
              
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate('/portal'); }}
                  className="w-full py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 text-center"
                >
                  MASUK KE PORTAL
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); setShowExamModal(true); }}
                  className="w-full py-2.5 rounded-xl font-bold text-amber-800 bg-amber-100 text-center flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> Masuk ke Sistem Ujian
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="beranda" className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white py-16 md:py-24">
        {/* Glow & Backdrop */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl opacity-25 animate-float pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float-reverse pointer-events-none"></div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs md:text-sm font-medium">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Portal Informasi Resmi SDI SAIQ AL-HIKMAH</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Mendidik Generasi <br />
              <span className="text-amber-300">Cerdas, Qurani,</span> & Berakhlak Mulia
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-emerald-100 max-w-2xl leading-relaxed">
              Selamat datang di Portal Informasi SDI SAIQ AL-HIKMAH. Ruang informasi akademik terpadu antara sekolah, guru, siswa, dan orang tua.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => navigate('/portal')}
                className="px-7 py-3.5 rounded-xl font-bold text-emerald-900 bg-white hover:bg-slate-100 shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 text-base group"
              >
                <span>MASUK PORTAL</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/portal/siswa')}
                className="px-6 py-3.5 rounded-xl font-bold text-white bg-emerald-600/60 hover:bg-emerald-600 border border-white/30 backdrop-blur-md transition-all flex items-center gap-2"
              >
                <GraduationCap className="w-5 h-5 text-amber-300" />
                Portal Siswa
              </button>
            </div>

            {/* Quick Stats Pill */}
            <div className="pt-4 grid grid-cols-3 gap-3 max-w-lg text-center">
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                <div className="text-xl md:text-2xl font-black text-amber-300">500+</div>
                <div className="text-[11px] md:text-xs text-emerald-100 font-medium">Siswa Aktif</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                <div className="text-xl md:text-2xl font-black text-amber-300">A (Unggul)</div>
                <div className="text-[11px] md:text-xs text-emerald-100 font-medium">Akreditasi</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                <div className="text-xl md:text-2xl font-black text-amber-300">100%</div>
                <div className="text-[11px] md:text-xs text-emerald-100 font-medium">Transparansi Nilai</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-3xl p-2 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800"
                alt="Kegiatan Belajar Siswa SDI SAIQ"
                className="rounded-2xl object-cover w-full h-80 sm:h-96 shadow-inner"
              />
              <div className="absolute -bottom-4 -left-4 bg-white text-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Fokus Utama</div>
                  <div className="text-sm font-extrabold text-slate-800">Transparansi Nilai & Keterangan</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Menu Cards */}
      <section className="py-10 relative z-20 -mt-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {quickAccessData.map((item, idx) => (
              <div
                key={idx}
                onClick={item.action}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer border border-slate-100 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base mb-1 group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-emerald-600 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Akses Sekarang</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Profil Sekolah & Visi Misi */}
      <section id="profil" className="py-16 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-4">
                TENTANG KAMI
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-5">
                Membangun Karakter Qurani dengan Pendekatan Ramah Anak
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                SDI SAIQ AL-HIKMAH adalah sekolah dasar Islam terpadu yang memadukan kurikulum nasional dan nilai-nilai Islami secara menyeluruh. Kami percaya bahwa setiap anak memiliki potensi unik yang dapat berkembang optimal dalam suasana belajar yang menyenangkan, aman, dan beradab.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                Melalui portal terintegrasi ini, orang tua dan siswa dapat secara langsung memantau perkembangan nilai, membaca catatan pembinaan guru, serta mengetahui pengumuman akademik tanpa hambatan.
              </p>

              {/* Visi Misi Card */}
              <div id="visimisi" className="bg-[#fdfbf7] p-6 rounded-2xl border border-amber-200/60 shadow-sm space-y-4">
                <div>
                  <h4 className="font-extrabold text-emerald-800 text-base flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Visi SDI SAIQ AL-HIKMAH
                  </h4>
                  <p className="text-sm text-slate-700 italic">
                    "Terwujudnya generasi Islam yang bertauhid lurus, berakhlak mulia, unggul dalam sains, dan berwawasan luas."
                  </p>
                </div>
                <div className="border-t border-amber-200/40 pt-3">
                  <h4 className="font-extrabold text-emerald-800 text-base flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Misi Utama
                  </h4>
                  <ul className="text-xs md:text-sm text-slate-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
                      <span>Menanamkan kecintaan kepada Al-Quran melalui bimbingan tahsin dan tahfidz berstandar mutqin.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
                      <span>Menerapkan pembelajaran aktif, kreatif, dan ramah teknologi tanpa meninggalkan adab Islami.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
                      <span>Membangun kemitraan erat dan transparan antara guru dan orang tua dalam mendampingi tumbuh kembang anak.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800"
                  alt="Gedung Kampus SDI SAIQ AL-HIKMAH"
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <div className="font-bold text-lg">Gedung Pendidikan Ramah Anak</div>
                    <div className="text-xs text-emerald-200">Dilengkapi perpustakaan digital, sarana olahraga, dan masjid terpadu.</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    15+
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Tenaga Ahli</div>
                    <div className="text-sm font-bold text-slate-800">Guru Berpengalaman</div>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                    A
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Standar Mutu</div>
                    <div className="text-sm font-bold text-slate-800">Akreditasi Unggul</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Unggulan */}
      <section id="program" className="py-16 bg-[#f8fafc]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
              PROGRAM UNGGULAN
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
              Kurikulum Holistik & Terpadu
            </h2>
            <p className="text-slate-600 text-sm md:text-base">
              Menyeimbangkan potensi spiritual, intelektual, fisik, dan sosial emosional anak.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {programData.map((prog, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {prog.icon}
                  </div>
                  <h3 className="font-bold text-slate-800 text-base mb-2 group-hover:text-emerald-700 transition-colors">
                    {prog.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {prog.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-semibold">
                  <span>SDI SAIQ AL-HIKMAH</span>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guru & Tenaga Pendidik */}
      <section id="guru" className="py-16 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-3">
              DEWAN GURU
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
              Dididik oleh Pendidik Penuh Kasih & Berdedikasi
            </h2>
            <p className="text-slate-600 text-sm">
              Guru menjadi pembimbing langsung yang senantiasa memantau dan memberikan catatan perkembangan kepada para siswa.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Ust. Ahmad Syafi'i, M.Pd.", role: "Kepala Sekolah", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300" },
              { name: "Ust. Ahmad, S.Pd.", role: "Guru PJOK & Olahraga", photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300" },
              { name: "Bpk. Budi Santoso, S.Kom.", role: "Guru Matematika & IT", photo: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=300" },
              { name: "Usth. Siti Fatimah, S.Pd.I", role: "Wali Kelas 3A & Tahfidz", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300" },
            ].map((t, idx) => (
              <div key={idx} className="bg-[#f8fafc] rounded-2xl p-4 text-center border border-slate-100 hover:shadow-md transition-shadow">
                <img
                  src={t.photo}
                  alt={t.name}
                  className="w-24 h-24 mx-auto rounded-full object-cover mb-3 border-2 border-emerald-500 shadow-sm"
                />
                <h4 className="font-bold text-slate-800 text-sm md:text-base">{t.name}</h4>
                <p className="text-xs text-emerald-600 font-semibold mt-1">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agenda & Berita */}
      <section id="agenda" className="py-16 bg-[#f8fafc] border-t border-slate-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Agenda Akademik */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-emerald-600" /> Agenda Akademik
                </h3>
              </div>
              <div className="space-y-3">
                {agendas.map((ag) => (
                  <div key={ag.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-black leading-none">{ag.day}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider">{ag.month}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{ag.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{ag.time} • {ag.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Berita Sekolah */}
            <div id="berita" className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-emerald-600" /> Berita & Kegiatan
                </h3>
                <span className="text-xs font-bold text-emerald-600 cursor-pointer hover:underline">Lihat Semua</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {articles.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <img src={item.img} alt={item.title} className="w-full h-36 object-cover" />
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">{item.category}</span>
                        <span>{item.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-2 hover:text-emerald-600 transition-colors">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Masuk Portal */}
      <section className="py-16 bg-gradient-to-r from-emerald-800 to-teal-800 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Akses Informasi Akademik Ananda Sekarang
          </h2>
          <p className="text-emerald-100 text-sm md:text-base leading-relaxed mb-8">
            Dapatkan transparansi nilai secara berkala, baca keterangan pembinaan dari bapak/ibu guru, dan periksa pengumuman sekolah langsung melalui Portal SDI SAIQ AL-HIKMAH.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate('/portal')}
              className="px-8 py-3.5 rounded-xl font-extrabold text-emerald-900 bg-amber-400 hover:bg-amber-300 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              MASUK KE PORTAL RESMI
            </button>
            <button
              onClick={() => navigate('/portal/login')}
              className="px-6 py-3.5 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 transition-all"
            >
              Halaman Login
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="kontak" className="bg-slate-900 text-slate-300 pt-14 pb-8 border-t border-slate-800">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Kolom 1 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-white text-base">SDI SAIQ</div>
                  <div className="text-[11px] font-bold text-emerald-400">AL-HIKMAH</div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lembaga pendidikan dasar Islam terpadu yang berdedikasi mencetak generasi rabbani yang berilmu, beramal, dan berakhlakul karimah.
              </p>
            </div>

            {/* Kolom 2 */}
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Navigasi Cepat</h4>
              <ul className="text-xs space-y-2 text-slate-400">
                <li><a href="#beranda" className="hover:text-emerald-400 transition-colors">Beranda Utama</a></li>
                <li><a href="#profil" className="hover:text-emerald-400 transition-colors">Profil & Visi Misi</a></li>
                <li><a href="#program" className="hover:text-emerald-400 transition-colors">Program Pembelajaran</a></li>
                <li><a href="#guru" className="hover:text-emerald-400 transition-colors">Dewan Tenaga Pendidik</a></li>
                <li><a href="#agenda" className="hover:text-emerald-400 transition-colors">Agenda & Berita</a></li>
              </ul>
            </div>

            {/* Kolom 3 */}
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Portal & Layanan</h4>
              <ul className="text-xs space-y-2 text-slate-400">
                <li>
                  <button onClick={() => navigate('/portal/siswa')} className="hover:text-emerald-400 transition-colors text-left">
                    Portal Informasi Siswa
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/portal/guru')} className="hover:text-emerald-400 transition-colors text-left">
                    Portal Penilaian Guru
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/portal/wali')} className="hover:text-emerald-400 transition-colors text-left">
                    Portal Wali Murid
                  </button>
                </li>
                <li>
                  <button onClick={() => setShowExamModal(true)} className="hover:text-amber-400 transition-colors text-left flex items-center gap-1 text-amber-300">
                    <ExternalLink className="w-3 h-3" /> Sistem Ujian Sekolah
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/portal/admin')} className="hover:text-emerald-400 transition-colors text-left">
                    Portal Admin Sistem
                  </button>
                </li>
              </ul>
            </div>

            {/* Kolom 4 */}
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm mb-4">Hubungi Kami</h4>
              <div className="flex items-start gap-2.5 text-xs text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Jl. Pendidikan No. 123, Komplek Islamic Center, Kota Pendidikan</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-400">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>+62 21 1234 5678</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-400">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>info@sdisaiqalhikmah.sch.id</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-3">
            <div>
              &copy; {new Date().getFullYear()} SDI SAIQ AL-HIKMAH. Hak cipta dilindungi undang-undang.
            </div>
            <div className="flex gap-4">
              <span>Berbasis Vercel & Supabase</span>
              <span>•</span>
              <span>Portal Informasi Terpadu</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 w-11 h-11 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-40 hover:bg-emerald-500 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
        aria-label="Kembali ke atas"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* MODAL SISTEM UJIAN EKSTERNAL (SESUAI ATURAN NO 27) */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-extrabold text-center text-slate-900 mb-2">
              Sistem Ujian Online Sekolah
            </h3>
            <p className="text-xs text-slate-600 text-center leading-relaxed mb-6">
              Sistem ujian online, bank soal, timer, dan pengerjaan tes dikelola pada sistem ujian sekolah tersendiri. Anda akan diarahkan ke server ujian:
              <br />
              <code className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-[11px] font-mono mt-2 inline-block">
                {externalExamUrl}
              </code>
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setShowExamModal(false);
                  openExternalExam();
                }}
                className="w-full py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md flex items-center justify-center gap-2"
              >
                <span>Buka Sistem Ujian</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowExamModal(false)}
                className="w-full py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
