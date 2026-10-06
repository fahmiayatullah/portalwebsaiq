<<<<<<< HEAD
# portalwebsaiq
=======
<<<<<<< HEAD
# portalwebsaiq
=======
# PORTAL INFORMASI AKADEMIK SDI SAIQ AL-HIKMAH

Portal Web Resmi dan Sistem Informasi Akademik Terpadu **SDI SAIQ AL-HIKMAH**.

> **PENTING TENTANG SISTEM UJIAN**:  
> Sistem ujian online sekolah, bank soal, timer, pengerjaan, dan koreksi jawaban ujian dikelola secara terpisah pada sistem CBT eksternal resmi milik sekolah (`VITE_EXTERNAL_EXAM_URL`). Portal ini berfungsi sebagai **pintu gerbang (gateway)** menuju sistem ujian dan **ruang informasi akademik pribadi siswa** (nilai, catatan bimbingan guru, pengumuman, dan perkembangan belajar).

---

## 🚀 Fitur & Modul Utama

### 1. Website / Portal Besar SDI SAIQ AL-HIKMAH (`/`)
- Landing page resmi: Beranda, Profil, Visi & Misi, Program Unggulan, Dewan Guru, Berita, Agenda, dan Kontak.
- Tombol aksi utama **"MASUK PORTAL"** menuju gerbang portal terpadu.
- Gerbang akses langsung ke **Sistem Ujian Online CBT Sekolah**.

### 2. Portal Informasi Siswa (`/portal/siswa`)
- **Tampilan Ramah Anak & Bersih**: Kartu identitas siswa (Nama, NIS, Kelas, Semester, Tahun Pelajaran, Foto).
- **Nilai Saya**: Daftar nilai yang telah dipublikasikan oleh guru (Desktop table & Mobile cards), dilengkapi modal detail nilai (tanpa kunci jawaban).
- **Keterangan Guru**: Saluran komunikasi bimbingan belajar personal dari guru ke siswa, dengan status dibaca/belum dibaca dan tombol konfirmasi telah dibaca.
- **Perkembangan Belajar**: Grafik visual progres capaian nilai per mata pelajaran (misal: *PJOK 72 → 78 → 85*).
- **E-Tugas**: Daftar tugas dan catatan umpan balik dari guru.
- **Pengumuman**: Pengumuman resmi dari sekolah dan guru pengampu.
- **Notifikasi Terpadu**: Notifikasi interaktif saat ada nilai atau keterangan baru yang diterbitkan.
- **Mobile Bottom Navigation**: Navigasi nyaman untuk penggunaan di layar smartphone.

### 3. Portal Penilaian Guru (`/portal/guru`)
- **Dashboard Ringkasan**: Statistik jumlah kelas, total siswa, nilai terbit, dan draft pending.
- **Data Siswa**: Daftar siswa per rombel kelas.
- **Input Nilai Individu**: Form pengisian nilai dengan pilihan **Simpan Draft** atau **Publikasikan**.
- **Input Nilai 1 Kelas (Massal)**: Tabel cepat untuk mengisi nilai dan catatan satu rombel sekaligus.
- **Keterangan Siswa**: Pengiriman catatan pembinaan belajar pribadi ke siswa tertentu.
- **Pengumuman**: Pembuatan pengumuman untuk seluruh siswa atau rombel tertentu.
- **Riwayat Penilaian**: Log dan arsip nilai serta catatan yang pernah dibuat.

### 4. Portal Wali Murid (`/portal/wali`)
- **Akses Read-Only Transparan**: Memantau perkembangan akademik ananda tanpa hak mengubah data.
- Memantau profil anak, transkrip nilai terbit, catatan bimbingan guru, grafik perkembangan belajar, dan pengumuman sekolah.

### 5. Portal Administrator (`/portal/admin`)
- Pengelolaan data master: Siswa, Guru, Kelas/Rombel, dan Mata Pelajaran.
- Monitoring log aktivitas penginputan nilai dan keterangan oleh dewan guru.
- Konfigurasi profil sekolah dan URL integrasi sistem ujian CBT eksternal.

---

## 🛠️ Arsitektur & Teknologi

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide React.
- **Hosting & Deployment**: Dioptimalkan untuk **Vercel** (`vercel.json` SPA rewrites & security headers).
- **Backend & Database**: Arsitektur **Supabase-ready** (`src/services/supabaseClient.ts`) dengan sinkronisasi reaktif ke `storageService.ts` (LocalStorage fallback cerdas tanpa ketergantungan runtime).

---

## ⚙️ Variabel Lingkungan (`.env`)

```env
# URL Sistem Ujian Eksternal CBT SDI SAIQ AL-HIKMAH
VITE_EXTERNAL_EXAM_URL=https://cbt.sdisaiqalhikmah.sch.id

# Konfigurasi Supabase (Opsional)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 💻 Menjalankan Project

```bash
# Install dependensi (jika belum)
npm install

# Jalankan server pengembangan
npm run dev

# Build produksi untuk Vercel
npm run build
```

---

## 👥 Akun Demo untuk Pengujian Cepat

Pada halaman login (`/portal/login`) atau tombol switcher di pojok kanan atas portal, tersedia opsi akses 1-klik:
1. **Siswa**: Fahmi Ayatollah (NIS: `2024001`)
2. **Guru**: Ust. Ahmad, S.Pd. (NIP: `198503142010011002`)
3. **Wali Murid**: Bpk. H. Rahmatullah (Wali Fahmi Ayatollah)
4. **Admin**: Administrator SDI SAIQ AL-HIKMAH
>>>>>>> 215716a (Initial commit)
>>>>>>> 4e2c947 (Initial commit)
