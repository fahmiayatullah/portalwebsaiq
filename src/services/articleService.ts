import type { NewsArticle, SchoolAgenda } from '../types';

const ARTICLES_STORAGE_KEY = 'saiq_school_articles';
const AGENDAS_STORAGE_KEY = 'saiq_school_agendas';

const DEFAULT_ARTICLES: NewsArticle[] = [
  {
    id: 'art-1',
    title: 'Siswa SDI SAIQ Raih Prestasi di Ajang Olimpiade Sains & Matematika',
    category: 'Prestasi',
    date: '5 Oktober 2026',
    img: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=400',
    content: 'Alhamdulillah, siswa perwakilan SDI SAIQ AL-HIKMAH berhasil menorehkan prestasi gemilang dengan meraih medali emas dalam kompetisi olimpiade tingkat provinsi.',
  },
  {
    id: 'art-2',
    title: 'Kegiatan Praktik PJOK dan Pembinaan Kebugaran Jasmani Anak',
    category: 'Akademik',
    date: '3 Oktober 2026',
    img: 'https://images.unsplash.com/photo-1511649475669-e288648b2339?auto=format&fit=crop&q=80&w=400',
    content: 'Pembelajaran kebugaran jasmani santri dilaksanakan dengan penuh antusias dan dipandu langsung oleh dewan guru olahraga bersertifikasi.',
  },
];

const DEFAULT_AGENDAS: SchoolAgenda[] = [
  {
    id: 'agd-1',
    day: '12',
    month: 'Okt',
    title: 'Pekan Penilaian Tengah Semester (PTS)',
    time: '07.30 - 11.30 WIB',
    location: 'Ruang Kelas Masing-masing',
  },
  {
    id: 'agd-2',
    day: '18',
    month: 'Okt',
    title: "Tasmi' Tahfidz Akbar Juz 30 Bersama Wali Murid",
    time: '08.00 - 12.00 WIB',
    location: 'Masjid SDI SAIQ',
  },
  {
    id: 'agd-3',
    day: '24',
    month: 'Okt',
    title: 'Pekan Olahraga Santri & Senam Ceria PJOK',
    time: '07.00 - 10.00 WIB',
    location: 'Lapangan Utama Sekolah',
  },
];

export const getStoredArticles = (): NewsArticle[] => {
  if (typeof window === 'undefined') return DEFAULT_ARTICLES;
  try {
    const raw = localStorage.getItem(ARTICLES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(DEFAULT_ARTICLES));
      return DEFAULT_ARTICLES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ARTICLES;
  }
};

export const saveStoredArticles = (articles: NewsArticle[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(articles));
  } catch (e) {
    console.error('Failed to save articles:', e);
  }
};

export const addStoredArticle = (article: Omit<NewsArticle, 'id'>): NewsArticle => {
  const current = getStoredArticles();
  const newArticle: NewsArticle = {
    ...article,
    id: `art-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  const updated = [newArticle, ...current];
  saveStoredArticles(updated);
  return newArticle;
};

export const deleteStoredArticle = (id: string): void => {
  const current = getStoredArticles();
  const updated = current.filter(a => a.id !== id);
  saveStoredArticles(updated);
};

export const getStoredAgendas = (): SchoolAgenda[] => {
  if (typeof window === 'undefined') return DEFAULT_AGENDAS;
  try {
    const raw = localStorage.getItem(AGENDAS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AGENDAS_STORAGE_KEY, JSON.stringify(DEFAULT_AGENDAS));
      return DEFAULT_AGENDAS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_AGENDAS;
  }
};

export const saveStoredAgendas = (agendas: SchoolAgenda[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AGENDAS_STORAGE_KEY, JSON.stringify(agendas));
  } catch (e) {
    console.error('Failed to save agendas:', e);
  }
};

export const addStoredAgenda = (agenda: Omit<SchoolAgenda, 'id'>): SchoolAgenda => {
  const current = getStoredAgendas();
  const newAgenda: SchoolAgenda = {
    ...agenda,
    id: `agd-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  const updated = [...current, newAgenda];
  saveStoredAgendas(updated);
  return newAgenda;
};

export const deleteStoredAgenda = (id: string): void => {
  const current = getStoredAgendas();
  const updated = current.filter(a => a.id !== id);
  saveStoredAgendas(updated);
};
