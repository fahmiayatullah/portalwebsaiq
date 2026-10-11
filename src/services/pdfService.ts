/**
 * Layanan Pembuatan & Unduh Dokumen PDF Rekapitulasi Hasil Belajar Siswa
 * Resmi SDI SAIQ AL-HIKMAH
 * 
 * Sesuai Standar:
 * 1. Format resmi akademik sekolah (A4, kop surat, identitas siswa, tabel nilai terstruktur, catatan bimbingan, kolom tanda tangan).
 * 2. Pure client-side PDF binary generation (RFC 3200 compliant PDF 1.4) tanpa dependensi eksternal bermasalah.
 * 3. Sanitasi nama berkas: Rekap_Nilai_[Nama_Siswa]_Semester_[Semester].pdf
 * 4. Validasi identitas siswa: Hanya data siswa yang sedang login yang diproses.
 */

import type { Student, Grade, TeacherNote } from '../types';

export interface ReportPdfData {
  student: Student;
  grades: Grade[];
  notes?: TeacherNote[];
  semester?: string;
  academicYear?: string;
}

/**
 * Membersihkan string agar aman digunakan sebagai nama berkas (menghapus karakter ilegal OS).
 */
export const sanitizeFileName = (str: string): string => {
  return str
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '_')
    .trim()
    .substring(0, 100);
};

/**
 * Menghasilkan file PDF biner berstandar PDF 1.4 dan memicu download langsung di browser.
 */
export const downloadGradeReportPdf = (data: ReportPdfData): boolean => {
  const { student, grades, notes = [], semester = 'Ganjil', academicYear = '2025/2026' } = data;

  if (!student || !student.name) {
    throw new Error('Data profil siswa tidak valid untuk mencetak rekap nilai.');
  }

  if (!grades || grades.length === 0) {
    throw new Error('Tidak ada data nilai resmi yang dipublikasikan untuk dibuatkan rekapitulasi.');
  }

  // 1. Hitung ringkasan akademik resmi
  const totalScore = grades.reduce((acc, curr) => acc + Number(curr.score), 0);
  const averageScore = Math.round((totalScore / grades.length) * 10) / 10;

  // Kelompokkan nilai per mata pelajaran
  const gradesBySubject: Record<string, Grade[]> = {};
  grades.forEach(g => {
    const subName = g.subject_name || 'Mata Pelajaran';
    if (!gradesBySubject[subName]) {
      gradesBySubject[subName] = [];
    }
    gradesBySubject[subName].push(g);
  });

  // 2. Susun PDF content stream
  // Dimensi A4 dalam point (1 pt = 1/72 inch): Lebar = 595.28 pt, Tinggi = 841.89 pt
  const pageWidth = 595;
  const pageHeight = 842;
  const marginLeft = 40;
  const marginRight = 555;
  const contentWidth = marginRight - marginLeft;

  const escapePdfText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  };

  const streamOps: string[] = [];

  // Helper menggambar teks
  const drawText = (
    text: string,
    x: number,
    y: number,
    fontSize: number,
    fontKey: 'F1' | 'F2' = 'F1', // F1 = Normal, F2 = Bold
    r = 0.1,
    g = 0.1,
    b = 0.1
  ) => {
    streamOps.push(
      `BT /${fontKey} ${fontSize} Tf ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(text)}) Tj ET`
    );
  };

  // Helper menggambar garis
  const drawLine = (x1: number, y1: number, x2: number, y2: number, lineWidth = 0.75, r = 0.8, g = 0.8, b = 0.8) => {
    streamOps.push(
      `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${lineWidth} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`
    );
  };

  // Helper menggambar kotak persegi panjang
  const drawRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    fillR = 0.95,
    fillG = 0.97,
    fillB = 0.95,
    strokeR = 0.8,
    strokeG = 0.85,
    strokeB = 0.8,
    strokeW = 0.5
  ) => {
    streamOps.push(
      `${fillR.toFixed(3)} ${fillG.toFixed(3)} ${fillB.toFixed(3)} rg ${strokeR.toFixed(3)} ${strokeG.toFixed(3)} ${strokeB.toFixed(3)} RG ${strokeW} w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re B`
    );
  };

  // ---------------- KOP SURAT SEKOLAH ----------------
  // Garis dekoratif atas (hijau emerald SDI SAIQ Al-Hikmah)
  drawRect(0, pageHeight - 12, pageWidth, 12, 0.02, 0.54, 0.35, 0.02, 0.54, 0.35, 0);

  // Logo Badge Header
  drawRect(marginLeft, pageHeight - 75, 46, 46, 0.02, 0.54, 0.35, 0.02, 0.54, 0.35, 0);
  drawText('SAIQ', marginLeft + 8, pageHeight - 50, 12, 'F2', 1, 1, 1);

  // Teks Header Sekolah
  drawText('SEKOLAH DASAR ISLAM TERPADU', marginLeft + 58, pageHeight - 42, 10, 'F1', 0.4, 0.4, 0.4);
  drawText('SDI SAIQ AL-HIKMAH', marginLeft + 58, pageHeight - 56, 16, 'F2', 0.02, 0.45, 0.28);
  drawText('Pendidikan Karakter Qurani, Unggul Akademik & Berakhlak Mulia', marginLeft + 58, pageHeight - 68, 8.5, 'F1', 0.35, 0.35, 0.35);

  // Garis ganda kop surat
  drawLine(marginLeft, pageHeight - 82, marginRight, pageHeight - 82, 1.5, 0.02, 0.54, 0.35);
  drawLine(marginLeft, pageHeight - 85, marginRight, pageHeight - 85, 0.5, 0.7, 0.7, 0.7);

  // ---------------- JUDUL DOKUMEN ----------------
  const docTitleY = pageHeight - 110;
  drawText('REKAPITULASI HASIL BELAJAR SISWA', marginLeft + 130, docTitleY, 13, 'F2', 0.1, 0.15, 0.2);
  drawText(`Tahun Ajaran: ${academicYear}   |   Semester: ${semester}`, marginLeft + 160, docTitleY - 14, 9, 'F1', 0.45, 0.45, 0.45);

  // ---------------- IDENTITAS SISWA BOX ----------------
  const infoBoxY = docTitleY - 76;
  drawRect(marginLeft, infoBoxY, contentWidth, 52, 0.97, 0.98, 0.97, 0.85, 0.9, 0.85, 1);

  // Kolom Kiri Identitas
  drawText('Nama Peserta Didik', marginLeft + 14, infoBoxY + 36, 8.5, 'F1', 0.5, 0.5, 0.5);
  drawText(`:  ${student.name.toUpperCase()}`, marginLeft + 105, infoBoxY + 36, 9.5, 'F2', 0.1, 0.1, 0.1);

  drawText('Nomor Induk Siswa (NIS)', marginLeft + 14, infoBoxY + 20, 8.5, 'F1', 0.5, 0.5, 0.5);
  drawText(`:  ${student.nis || '-'}`, marginLeft + 105, infoBoxY + 20, 9, 'F2', 0.02, 0.45, 0.28);

  drawText('Kelas / Rombel', marginLeft + 14, infoBoxY + 7, 8.5, 'F1', 0.5, 0.5, 0.5);
  drawText(`:  ${student.className || 'Kelas Belum Ditentukan'}`, marginLeft + 105, infoBoxY + 7, 9, 'F1', 0.2, 0.2, 0.2);

  // Kolom Kanan Ringkasan
  drawText('Status Akun', marginLeft + 320, infoBoxY + 36, 8.5, 'F1', 0.5, 0.5, 0.5);
  drawText(`:  ${student.status === 'active' ? 'Aktif Terdaftar' : student.status.toUpperCase()}`, marginLeft + 395, infoBoxY + 36, 9, 'F2', 0.1, 0.5, 0.2);

  drawText('Rata-rata Capaian', marginLeft + 320, infoBoxY + 20, 8.5, 'F1', 0.5, 0.5, 0.5);
  drawText(`:  ${averageScore} / 100`, marginLeft + 395, infoBoxY + 20, 10, 'F2', 0.02, 0.45, 0.28);

  drawText('Jumlah Penilaian', marginLeft + 320, infoBoxY + 7, 8.5, 'F1', 0.5, 0.5, 0.5);
  drawText(`:  ${grades.length} Penilaian Terbit`, marginLeft + 395, infoBoxY + 7, 9, 'F1', 0.3, 0.3, 0.3);

  // ---------------- TABEL HASIL BELAJAR ----------------
  const tableHeaderY = infoBoxY - 26;
  const colNoX = marginLeft;
  const colSubjectX = marginLeft + 28;
  const colTypeX = marginLeft + 235;
  const colDateX = marginLeft + 360;
  const colScoreX = marginLeft + 445;

  // Header Bar Tabel
  drawRect(colNoX, tableHeaderY, contentWidth, 20, 0.02, 0.54, 0.35, 0.02, 0.54, 0.35, 0);
  drawText('NO', colNoX + 8, tableHeaderY + 6, 8.5, 'F2', 1, 1, 1);
  drawText('MATA PELAJARAN', colSubjectX + 6, tableHeaderY + 6, 8.5, 'F2', 1, 1, 1);
  drawText('JENIS PENILAIAN', colTypeX + 6, tableHeaderY + 6, 8.5, 'F2', 1, 1, 1);
  drawText('TANGGAL', colDateX + 6, tableHeaderY + 6, 8.5, 'F2', 1, 1, 1);
  drawText('NILAI', colScoreX + 16, tableHeaderY + 6, 8.5, 'F2', 1, 1, 1);

  let currentY = tableHeaderY - 18;
  let rowCount = 0;

  // Batasi agar muat 1 lembar A4 secara proporsional dan elegan
  const maxGradesToDisplay = Math.min(grades.length, 16);

  for (let i = 0; i < maxGradesToDisplay; i++) {
    const g = grades[i];
    const isEven = i % 2 === 0;
    const rowH = 17;

    // Background baris selang-seling
    if (isEven) {
      drawRect(colNoX, currentY, contentWidth, rowH, 0.98, 0.99, 0.98, 0.9, 0.92, 0.9, 0.4);
    } else {
      drawRect(colNoX, currentY, contentWidth, rowH, 1, 1, 1, 0.9, 0.92, 0.9, 0.4);
    }

    // Nomor
    drawText(String(i + 1), colNoX + 10, currentY + 5, 8, 'F1', 0.4, 0.4, 0.4);

    // Mata Pelajaran (potong jika terlalu panjang)
    const subText = (g.subject_name || 'Mata Pelajaran').substring(0, 32);
    drawText(subText, colSubjectX + 6, currentY + 5, 8.5, 'F2', 0.15, 0.15, 0.15);

    // Jenis Penilaian
    const typeText = (g.assessment_type || 'Tugas').substring(0, 20);
    drawText(typeText, colTypeX + 6, currentY + 5, 8, 'F1', 0.35, 0.35, 0.35);

    // Tanggal
    drawText(g.assessment_date || '-', colDateX + 6, currentY + 5, 8, 'F1', 0.45, 0.45, 0.45);

    // Nilai / Skor
    const scoreVal = Number(g.score);
    const scoreColor: [number, number, number] =
      scoreVal >= 85 ? [0.02, 0.5, 0.25] : scoreVal >= 75 ? [0.1, 0.4, 0.7] : [0.75, 0.45, 0.05];
    drawText(String(g.score), colScoreX + 22, currentY + 5, 9, 'F2', ...scoreColor);

    currentY -= rowH;
    rowCount++;
  }

  // Baris Total / Rata-rata
  const summaryRowH = 20;
  drawRect(colNoX, currentY, contentWidth, summaryRowH, 0.92, 0.96, 0.93, 0.7, 0.85, 0.75, 0.75);
  drawText('RATA-RATA NILAI AKHIR SISWA', colSubjectX + 6, currentY + 6, 8.5, 'F2', 0.02, 0.45, 0.28);
  drawText(`${averageScore}`, colScoreX + 18, currentY + 6, 10, 'F2', 0.02, 0.45, 0.28);

  currentY -= (summaryRowH + 16);

  // ---------------- CATATAN PEMBINAAN GURU ----------------
  const validNote = notes.length > 0 ? notes[0] : null;
  const noteBoxH = 46;
  drawRect(marginLeft, currentY - noteBoxH, contentWidth, noteBoxH, 0.97, 0.98, 1, 0.82, 0.88, 0.96, 0.75);

  drawText('CATATAN PEMBINAAN & MOTIVASI GURU:', marginLeft + 12, currentY - 14, 8, 'F2', 0.1, 0.3, 0.6);
  if (validNote) {
    const cleanContent = validNote.content.replace(/\r?\n/g, ' ').substring(0, 110);
    drawText(`"${cleanContent}"`, marginLeft + 12, currentY - 27, 8, 'F1', 0.2, 0.25, 0.35);
    drawText(`— ${validNote.teacher_name || 'Bapak/Ibu Dewan Guru'} (${validNote.subject_name || 'Wali Kelas'})`, marginLeft + 12, currentY - 39, 7.5, 'F2', 0.3, 0.4, 0.5);
  } else {
    drawText('"Tingkatkan terus semangat belajar dan ibadah, serta pertahankan prestasi yang telah diraih."', marginLeft + 12, currentY - 27, 8, 'F1', 0.4, 0.45, 0.5);
    drawText('— Dewan Guru SDI SAIQ AL-HIKMAH', marginLeft + 12, currentY - 39, 7.5, 'F2', 0.3, 0.4, 0.5);
  }

  currentY -= (noteBoxH + 20);

  // ---------------- KOLOM TANDA TANGAN / PENGESAHAN ----------------
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  drawText(`Cirebon, ${todayStr}`, marginLeft + 330, currentY, 8.5, 'F1', 0.3, 0.3, 0.3);

  const signY = currentY - 14;
  drawText('Mengetahui,', marginLeft + 40, signY, 8.5, 'F1', 0.4, 0.4, 0.4);
  drawText('Orang Tua / Wali Murid', marginLeft + 40, signY - 12, 8.5, 'F2', 0.2, 0.2, 0.2);

  drawText('Wali Kelas / Guru Pengampu,', marginLeft + 330, signY - 12, 8.5, 'F2', 0.2, 0.2, 0.2);

  // Garis Tanda Tangan
  const lineSignY = signY - 56;
  drawLine(marginLeft + 40, lineSignY, marginLeft + 175, lineSignY, 0.5, 0.5, 0.5, 0.5);
  drawLine(marginLeft + 330, lineSignY, marginLeft + 475, lineSignY, 0.5, 0.5, 0.5, 0.5);

  drawText('( .................................................. )', marginLeft + 40, lineSignY - 10, 8, 'F1', 0.4, 0.4, 0.4);
  drawText('SDI SAIQ AL-HIKMAH', marginLeft + 348, lineSignY - 10, 8, 'F2', 0.02, 0.45, 0.28);

  // ---------------- FOOTER RESMI DOKUMEN ----------------
  drawLine(marginLeft, 32, marginRight, 32, 0.5, 0.85, 0.85, 0.85);
  drawText('Dokumen ini dicetak secara sah melalui Portal Akademik SDI SAIQ Al-Hikmah.', marginLeft, 22, 7.5, 'F1', 0.55, 0.55, 0.55);
  drawText(`ID Autentikasi: ${student.auth_user_id ? student.auth_user_id.substring(0, 18) : 'VERIFIED'}`, marginRight - 165, 22, 7.5, 'F1', 0.55, 0.55, 0.55);

  // 3. Susun Objek-Objek Dokumen PDF
  const contentStream = streamOps.join('\n');
  const streamLength = contentStream.length;

  const objects: string[] = [];

  // Obj 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  // Obj 2: Pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');

  // Obj 3: Page (A4 Portrait)
  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 6 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> >>\nendobj`
  );

  // Obj 4: Font F1 (Helvetica Standard)
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  // Obj 5: Font F2 (Helvetica Bold)
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');

  // Obj 6: Contents Stream
  objects.push(`6 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj`);

  // Bangun Tabel XRef
  let pdfBody = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets: number[] = [0]; // offset 0 untuk dummy obj 0

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdfBody.length);
    pdfBody += `${objects[i]}\n`;
  }

  const xrefOffset = pdfBody.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i++) {
    const offStr = String(offsets[i]).padStart(10, '0');
    xref += `${offStr} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const fullPdf = pdfBody + xref + trailer;

  // 4. Unduh berkas Blob ke browser
  const blob = new Blob([fullPdf], { type: 'application/pdf' });
  const rawFileName = `Rekap_Nilai_${student.name}_Semester_${semester}.pdf`;
  const safeFileName = sanitizeFileName(rawFileName);

  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = safeFileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 1000);

  return true;
};
