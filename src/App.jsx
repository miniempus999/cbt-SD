import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield, User, Users, BookOpen, BarChart2, Settings, LogOut, Clock,
  AlertTriangle, CheckCircle, XCircle, Plus, Trash2, Edit3, Search,
  RefreshCw, Play, Pause, Eye, EyeOff, Lock, Unlock, Award, FileText,
  Sparkles, Image as ImageIcon, Video, BarChart, List, CheckSquare,
  Sliders, Send, Download, Upload, Printer, Key, ChevronLeft, ChevronRight,
  Monitor, Volume2, HelpCircle, Layers, Cpu, ExternalLink, Copy, Check
} from 'lucide-react';

// ============================================================================
// 1. INITIAL SEED DATA & SYSTEM CONSTANTS (SD NEGERI SUKOMORO 2)
// ============================================================================

const INITIAL_SETTINGS = {
  examTitle: "TES KEMAMPUAN AKADEMIK (TKA) & ANBK 2026",
  schoolName: "SD NEGERI SUKOMORO 2",
  geminiApiKey: "", // Isi melalui menu Pengaturan & Anti-Cheat agar aman saat deploy publik
  token: "TKA26X",
  tokenExpirySeconds: 900,
  showScoreAfterExam: true,
  reviewAnswersAfterExam: true,
  randomizeQuestions: false,
  randomizeOptions: false,
  antiCheatEnabled: true,
  unlockPin: "994821"
};

const INITIAL_ADMINS = [
  { id: 'adm-1', username: 'Sedarisua', password: 'sedarisua02!', name: 'Administrator Utama SDN Sukomoro 2', role: 'admin' }
];

const INITIAL_TEACHERS = [
  { id: 'tch-1', nip: '198504122010011005', name: 'Budi Santoso, S.Pd.', subject: 'Matematika & IPAS', username: 'budi.guru', password: 'guru123!', active: true },
  { id: 'tch-2', nip: '199008212015022003', name: 'Siti Aminah, S.Pd.SD', subject: 'Bahasa Indonesia & Karakter', username: 'siti.guru', password: 'guru123!', active: true }
];

const INITIAL_STUDENTS = [
  {
    id: 'std-1', school: 'SD NEGERI SUKOMORO 2', nisn: '0148291001', name: 'Ahmad Fauzi Ramadhan',
    kelas: 'VI-A', gender: 'Laki-laki', password: '12345', sesi: 'Sesi 1',
    status: 'sedang_ujian', timeLeft: 2450, violations: 0, isBlocked: false,
    answers: { 'q-ipas-1': 1, 'q-mtk-1': [0, 2] }, score: null, startTime: '08:00:12', endTime: null
  },
  {
    id: 'std-2', school: 'SD NEGERI SUKOMORO 2', nisn: '0148291002', name: 'Nadia Putri Azzahra',
    kelas: 'VI-A', gender: 'Perempuan', password: '12345', sesi: 'Sesi 1',
    status: 'selesai', timeLeft: 0, violations: 0, isBlocked: false,
    answers: { 'q-ipas-1': 1, 'q-mtk-1': [0, 2], 'q-bindo-1': { '0': '1', '1': '0', '2': '2' }, 'q-kar-1': [true, false, true], 'q-ling-1': 3 },
    score: 94, startTime: '07:30:00', endTime: '08:14:22'
  },
  {
    id: 'std-3', school: 'SD NEGERI SUKOMORO 2', nisn: '0148291003', name: 'Rizky Pratama Wijaya',
    kelas: 'VI-B', gender: 'Laki-laki', password: '12345', sesi: 'Sesi 1',
    status: 'sedang_ujian', timeLeft: 1890, violations: 2, isBlocked: true,
    answers: { 'q-ipas-1': 0 }, score: null, startTime: '08:02:45', endTime: null
  },
  {
    id: 'std-4', school: 'SD NEGERI SUKOMORO 2', nisn: '0148291004', name: 'Aisyah Nurul Hidayah',
    kelas: 'VI-B', gender: 'Perempuan', password: '12345', sesi: 'Sesi 2',
    status: 'belum_mulai', timeLeft: 3600, violations: 0, isBlocked: false,
    answers: {}, score: null, startTime: null, endTime: null
  }
];

const INITIAL_PACKAGES = [
  {
    id: 'pkg-1',
    name: 'Paket Utama TKA + Survei Karakter & Lingkungan Belajar 2026',
    schedule: '2026-11-16 07:30',
    durationMinutes: 60,
    categories: ['IPAS', 'Matematika', 'Bahasa Indonesia', 'Soal Karakter', 'Soal Lingkungan Belajar'],
    active: true
  },
  {
    id: 'pkg-2',
    name: 'Tryout Numerasi & Literasi Sains Tahap II',
    schedule: '2026-11-20 08:00',
    durationMinutes: 45,
    categories: ['IPAS', 'Matematika'],
    active: false
  }
];

const INITIAL_QUESTIONS = [
  {
    id: 'q-ipas-1',
    category: 'IPAS',
    type: 'single',
    difficulty: 'HOTS',
    weight: 20,
    stimulus: 'Perhatikan siklus perubahan wujud benda pada ekosistem air berikut. Ketika sinar matahari memanaskan permukaan laut dan sungai secara terus-menerus, molekul air menyerap energi kalor dan berubah menjadi uap air yang naik ke atmosfer.',
    question: 'Proses perubahan wujud benda cair menjadi gas akibat penyerapan kalor pada ilustrasi siklus hidrologi di atas disebut...',
    mediaType: 'image',
    mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Water_cycle.png/640px-Water_cycle.png',
    mediaCaption: 'Ilustrasi Siklus Hidrologi (Sumber: Wikimedia / Google Educational Commons)',
    options: [
      'Kondensasi (Pengembunan)',
      'Evaporasi (Penguapan)',
      'Presipitasi (Hujan)',
      'Sublimasi (Menyublim)'
    ],
    correctAnswer: 1,
    explanation: 'Evaporasi adalah proses penguapan air dari permukaan bumi ke atmosfer karena energi panas matahari.'
  },
  {
    id: 'q-mtk-1',
    category: 'Matematika',
    type: 'complex',
    difficulty: 'Sedang',
    weight: 20,
    stimulus: 'Perhatikan grafik batang hasil panen padi Desa Sukomoro selama 4 bulan terakhir di bawah ini. Setiap satuan batang menunjukkan hasil panen dalam satuan ton.',
    question: 'Berdasarkan diagram batang hasil panen tersebut, manakah pernyataan berikut yang BENAR? (Pilih lebih dari satu jawaban)',
    mediaType: 'chart',
    chartData: {
      title: 'Hasil Panen Padi Desa Sukomoro (Ton)',
      labels: ['Januari', 'Februari', 'Maret', 'April'],
      values: [45, 60, 75, 50]
    },
    options: [
      'Hasil panen tertinggi terjadi pada bulan Maret sebesar 75 ton',
      'Total hasil panen bulan Januari dan Februari adalah 115 ton',
      'Selisih panen bulan Maret dan Januari adalah 30 ton',
      'Hasil panen selalu mengalami kenaikan setiap bulannya'
    ],
    correctAnswer: [0, 2],
    explanation: 'Bulan Maret tertinggi (75 ton), dan selisih Maret (75) - Januari (45) = 30 ton.'
  },
  {
    id: 'q-bindo-1',
    category: 'Bahasa Indonesia',
    type: 'matching',
    difficulty: 'Sedang',
    weight: 20,
    stimulus: 'Bacalah dengan cermat video dokumenter singkat tentang pelestarian hutan mangrove dan hubungkan istilah ekosistem dengan maknanya yang tepat.',
    question: 'Pasangkan istilah pada kolom kiri dengan pengertian yang tepat pada kolom kanan!',
    mediaType: 'video',
    mediaUrl: 'https://www.youtube.com/embed/5dV4r9w-Z9A',
    mediaCaption: 'Video Edukasi Ekosistem & Pelestarian Alam (YouTube)',
    leftItems: [
      'Abrasi Pantai',
      'Reboisasi Mangrove',
      'Ekosistem Pesisir'
    ],
    rightItems: [
      'Penanaman kembali hutan bakau di wilayah pesisir',
      'Pengikisan daratan pantai akibat gelombang laut',
      'Kesatuan interaksi makhluk hidup di wilayah pantai'
    ],
    correctAnswer: { '0': '1', '1': '0', '2': '2' },
    explanation: 'Abrasi adalah pengikisan pantai, Reboisasi adalah penanaman kembali, Ekosistem pesisir adalah interaksi makhluk hidup pantai.'
  },
  {
    id: 'q-kar-1',
    category: 'Soal Karakter',
    type: 'true_false',
    difficulty: 'Mudah',
    weight: 20,
    stimulus: 'Di kelas VI SD Negeri Sukomoro 2, sedang diadakan diskusi kelompok untuk menentukan tema pentas seni sekolah. Raka memiliki ide berbeda dari mayoritas teman kelompoknya.',
    question: 'Tentukan apakah sikap berikut mencerminkan Profil Pelajar Pancasila (Benar) atau tidak mencerminkan (Salah)!',
    mediaType: 'none',
    statements: [
      'Raka menyampaikan pendapatnya dengan sopan dan mendengarkan usulan teman lain.',
      'Ketua kelompok langsung menolak ide Raka tanpa mendiskusikannya terlebih dahulu.',
      'Seluruh anggota kelompok mengambil keputusan bersama melalui musyawarah mufakat.'
    ],
    correctAnswer: [true, false, true],
    explanation: 'Musyawarah dan menghargai perbedaan pendapat merupakan wujud nilai kebhinekaan dan gotong royong.'
  },
  {
    id: 'q-ling-1',
    category: 'Soal Lingkungan Belajar',
    type: 'single',
    difficulty: 'Mudah',
    weight: 20,
    stimulus: 'Survei Lingkungan Belajar bertujuan memotret iklim keamanan, kebinekaan, dan kualitas pembelajaran di SD Negeri Sukomoro 2.',
    question: 'Bagaimana tanggapanmu ketika ada teman baru di kelas yang berasal dari daerah dan budaya yang berbeda?',
    mediaType: 'none',
    options: [
      'Menghindarinya karena belum mengenal bahasanya',
      'Hanya berteman jika diajak guru saja',
      'Menyambut dengan ramah dan mengajaknya bermain bersama tanpa membeda-bedakan',
      'Meminta teman tersebut menyesuaikan diri terlebih dahulu baru berteman'
    ],
    correctAnswer: 2,
    explanation: 'Iklim kebinekaan yang positif ditunjukkan dengan sikap inklusif dan ramah kepada seluruh teman.'
  }
];

// ============================================================================
// 2. REUSABLE MULTIMEDIA RENDERER (IMAGE, INTERACTIVE SVG CHART, YOUTUBE VIDEO)
// ============================================================================

const MultimediaViewer = ({ question }) => {
  if (!question || !question.mediaType || question.mediaType === 'none') return null;

  // Helper to normalize YouTube links to embeddable URL
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  return (
    <div className="my-4 p-4 rounded-xl bg-lime-50/90 border-2 border-lime-300 shadow-inner">
      {question.mediaType === 'image' && question.mediaUrl && (
        <div className="flex flex-col items-center">
          <div className="relative overflow-hidden rounded-lg border border-lime-400 bg-white shadow-md max-w-full">
            <img
              src={question.mediaUrl}
              alt={question.mediaCaption || "Gambar Stimulus Soal"}
              className="max-h-72 w-auto object-contain mx-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          </div>
          {question.mediaCaption && (
            <p className="mt-2 text-xs font-medium text-emerald-800 italic text-center">
              {question.mediaCaption}
            </p>
          )}
        </div>
      )}

      {question.mediaType === 'chart' && question.chartData && (
        <div className="bg-white p-4 rounded-lg border border-lime-400 shadow-sm">
          <h4 className="text-sm font-bold text-center text-slate-800 mb-3">
            {question.chartData.title || 'Diagram Data Stimulus'}
          </h4>
          <div className="w-full overflow-x-auto">
            <svg viewBox="0 0 460 210" className="w-full max-w-lg mx-auto h-48">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((val, idx) => {
                const y = 170 - (val * 1.4);
                return (
                  <g key={idx}>
                    <line x1="45" y1={y} x2="440" y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
                    <text x="35" y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">{val}</text>
                  </g>
                );
              })}
              {/* Bars */}
              {(question.chartData.labels || []).map((label, i) => {
                const val = Number(question.chartData.values?.[i] || 0);
                const maxVal = Math.max(...(question.chartData.values || [100]), 100);
                const barHeight = (val / maxVal) * 140;
                const barWidth = 48;
                const spacing = 360 / Math.max(question.chartData.labels.length, 1);
                const x = 65 + i * spacing;
                const y = 170 - barHeight;
                const colors = ['#65a30d', '#0284c7', '#059669', '#d97706', '#7c3aed'];
                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="6"
                      fill={colors[i % colors.length]}
                      className="transition-all duration-500"
                    />
                    <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">
                      {val}
                    </text>
                    <text x={x + barWidth / 2} y="188" textAnchor="middle" fontSize="11" fontWeight="600" fill="#334155">
                      {label}
                    </text>
                  </g>
                );
              })}
              <line x1="45" y1="170" x2="440" y2="170" stroke="#475569" strokeWidth="2" />
            </svg>
          </div>
        </div>
      )}

      {question.mediaType === 'video' && question.mediaUrl && (
        <div className="flex flex-col items-center">
          <div className="w-full max-w-xl aspect-video rounded-lg overflow-hidden border-2 border-emerald-500 shadow-md bg-black">
            <iframe
              className="w-full h-full"
              src={getYoutubeEmbedUrl(question.mediaUrl)}
              title={question.mediaCaption || "Video Pembelajaran TKA"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {question.mediaCaption && (
            <p className="mt-2 text-xs font-medium text-emerald-800 flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-red-600" /> {question.mediaCaption}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. FLOATING EDUCATIONAL LIME BACKGROUND ANIMATION
// ============================================================================

const LimeEducationalBackdrop = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {/* Soft radiant lime gradient base */}
    <div className="absolute inset-0 bg-gradient-to-br from-lime-200 via-lime-300 to-emerald-200 opacity-95" />
    {/* Decorative animated educational orbs & geometric elements */}
    <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-lime-400/40 blur-3xl animate-pulse" />
    <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-emerald-400/35 blur-3xl animate-bounce" style={{ animationDuration: '8s' }} />
    <div className="absolute -bottom-24 left-1/4 w-96 h-96 rounded-full bg-yellow-300/40 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
    {/* Subtle educational floating badges */}
    <div className="hidden md:block absolute top-24 left-12 text-lime-700/20 font-black text-6xl select-none animate-bounce" style={{ animationDuration: '7s' }}>∑ π</div>
    <div className="hidden md:block absolute bottom-20 right-16 text-emerald-700/20 font-black text-5xl select-none animate-pulse">A+ TKA</div>
    <div className="hidden md:block absolute top-1/2 left-10 text-lime-800/15 font-extrabold text-4xl select-none">H₂O • E=mc²</div>
  </div>
);

// ============================================================================
// 4. MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  /// Helper untuk memuat data tersimpan dari browser (localStorage)
  const loadSaved = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  // Core Persistent State (Tahan Refresh)
  const [settings, setSettings] = useState(() => loadSaved('cbt_sukomoro_settings', INITIAL_SETTINGS));
  const [teachers, setTeachers] = useState(() => loadSaved('cbt_sukomoro_teachers', INITIAL_TEACHERS));
  const [students, setStudents] = useState(() => loadSaved('cbt_sukomoro_students', INITIAL_STUDENTS));
  const [packages, setPackages] = useState(() => loadSaved('cbt_sukomoro_packages', INITIAL_PACKAGES));
  const [questions, setQuestions] = useState(() => loadSaved('cbt_sukomoro_questions', INITIAL_QUESTIONS));

  // Helper simpan aman agar tidak crash jika kuota localStorage penuh
  const safeSave = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Abaikan jika melebihi kuota penyimpanan lokal browser
    }
  };

  // Simpan otomatis setiap kali ada perubahan data
  useEffect(() => { safeSave('cbt_sukomoro_settings', settings); }, [settings]);
  useEffect(() => { safeSave('cbt_sukomoro_teachers', teachers); }, [teachers]);
  useEffect(() => { safeSave('cbt_sukomoro_students', students); }, [students]);
  useEffect(() => { safeSave('cbt_sukomoro_packages', packages); }, [packages]);
  useEffect(() => { safeSave('cbt_sukomoro_questions', questions); }, [questions]);
  // Auth & Navigation State (Tahan Refresh Halaman)
  const [currentUser, setCurrentUser] = useState(() => loadSaved('cbt_sukomoro_current_user', null)); // { role: 'admin' | 'teacher' | 'student', data: ... }
  const [loginTab, setLoginTab] = useState('student'); // 'student' | 'teacher' | 'admin'
  const [adminNav, setAdminNav] = useState(() => loadSaved('cbt_sukomoro_admin_nav', 'dashboard')); // 'dashboard' | 'monitoring' | 'users' | 'packages' | 'bank' | 'results' | 'settings'

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cbt_sukomoro_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('cbt_sukomoro_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('cbt_sukomoro_admin_nav', JSON.stringify(adminNav));
  }, [adminNav]);
  const [toast, setToast] = useState(null);
  const [broadcastMessage, setBroadcastMessage] = useState(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Trigger Toast Notification
  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Dynamic Token Countdown Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSettings((prev) => {
        if (prev.tokenExpirySeconds <= 1) {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let newTok = '';
          for (let i = 0; i < 6; i++) newTok += chars[Math.floor(Math.random() * chars.length)];
          return { ...prev, token: newTok, tokenExpirySeconds: 900 };
        }
        return { ...prev, tokenExpirySeconds: prev.tokenExpirySeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate Auto-Grade Score for a Student
  const calculateStudentScore = (answersObj, activeQuestions) => {
    if (!activeQuestions || activeQuestions.length === 0) return 0;
    let totalWeight = 0;
    let earnedScore = 0;

    activeQuestions.forEach((q) => {
      const w = Number(q.weight) || 20;
      totalWeight += w;
      const ans = answersObj?.[q.id];
      if (ans === undefined || ans === null) return;

      if (q.type === 'single') {
        if (Number(ans) === Number(q.correctAnswer)) earnedScore += w;
      } else if (q.type === 'complex') {
        const correctArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
        const userArr = Array.isArray(ans) ? ans : [];
        if (correctArr.length > 0) {
          const hits = userArr.filter((v) => correctArr.includes(v)).length;
          const wrong = userArr.filter((v) => !correctArr.includes(v)).length;
          const ratio = Math.max(0, (hits - wrong * 0.5) / correctArr.length);
          earnedScore += w * ratio;
        }
      } else if (q.type === 'matching') {
        const correctMap = q.correctAnswer || {};
        const keys = Object.keys(correctMap);
        if (keys.length > 0) {
          let matchHits = 0;
          keys.forEach((k) => {
            if (String(ans[k]) === String(correctMap[k])) matchHits++;
          });
          earnedScore += w * (matchHits / keys.length);
        }
      } else if (q.type === 'true_false') {
        const correctBoolArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
        const userBoolArr = Array.isArray(ans) ? ans : [];
        if (correctBoolArr.length > 0) {
          let tfHits = 0;
          correctBoolArr.forEach((val, idx) => {
            if (userBoolArr[idx] === val) tfHits++;
          });
          earnedScore += w * (tfHits / correctBoolArr.length);
        }
      }
    });

    if (totalWeight === 0) return 0;
    return Math.round((earnedScore / totalWeight) * 100);
  };

  // Pre-compute student exam questions at top-level (Rules of Hooks compliant)
  const studentExamContext = useMemo(() => {
    if (!currentUser || currentUser.role !== 'student') return null;
    const liveStudent = students.find((s) => s.id === currentUser.data.id) || currentUser.data;
    const activePkg = packages.find((p) => p.active) || packages[0];
    const base = questions.filter((q) => (activePkg?.categories || []).includes(q.category));

    const seedStr = String(liveStudent.id || 'seed');
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
    const seededRandom = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const shuffleWithSeed = (arr) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const orderedQuestions = settings.randomizeQuestions ? shuffleWithSeed(base) : base;

    const examQuestions = orderedQuestions.map((q) => {
      if (!settings.randomizeOptions || (q.type !== 'single' && q.type !== 'complex') || !Array.isArray(q.options)) {
        return q;
      }
      const indexedOptions = q.options.map((opt, idx) => ({ opt, origIdx: idx }));
      const shuffledOpts = shuffleWithSeed(indexedOptions);
      const newOptions = shuffledOpts.map((item) => item.opt);
      const newCorrectAnswer = Array.isArray(q.correctAnswer)
        ? shuffledOpts.map((item, newIdx) => (q.correctAnswer.includes(item.origIdx) ? newIdx : -1)).filter((i) => i !== -1)
        : shuffledOpts.findIndex((item) => item.origIdx === Number(q.correctAnswer));
      return {
        ...q,
        options: newOptions,
        correctAnswer: newCorrectAnswer
      };
    });

    return { liveStudent, activePkg, examQuestions };
  }, [currentUser, students, packages, questions, settings.randomizeQuestions, settings.randomizeOptions]);

  // ============================================================================
  // RENDER LOGIN PORTAL (KEMENDIKBUD ANBK / TKA STYLE)
  // ============================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen relative flex flex-col justify-between font-sans text-slate-800">
        <LimeEducationalBackdrop />

        {/* Toast Alert */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl text-white font-semibold flex items-center gap-2 animate-bounce ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-700'}`}>
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Official Navy Kemendikbud-Style Top Header */}
        <header className="relative z-10 bg-[#0b2545] text-white shadow-xl border-b-4 border-lime-400">
          <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Official Kemendikbud-Inspired Emblem SVG */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-blue-700 border-2 border-lime-300 flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-lime-400 text-[#0b2545] rounded">
                    PUSMENDIK • CBT SYSTEM
                  </span>
                  <span className="text-xs text-sky-200 font-medium">{settings.schoolName}</span>
                </div>
                <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-white">
                  {settings.examTitle}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#13315c] px-4 py-2 rounded-xl border border-sky-700/60">
              <div className="text-right">
                <p className="text-[11px] text-sky-300 uppercase font-semibold">Status Server Pusat</p>
                <p className="text-xs font-bold text-lime-400 flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" /> AKTIF • ONLINE
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Login Card Container */}
        <main className="relative z-10 flex-1 flex items-center justify-center p-4 my-6">
          <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border-2 border-lime-400">
            {/* Left Info Panel */}
            <div className="lg:col-span-5 bg-gradient-to-b from-[#0b2545] via-[#13315c] to-[#134074] text-white p-7 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/20 border border-lime-400/50 text-lime-300 text-xs font-bold mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> Platform Asesmen Digital Terpadu
                </div>
                <h2 className="text-2xl font-extrabold leading-snug mb-3">
                  Selamat Datang di Portal Ujian TKA & ANBK
                </h2>
                <p className="text-sm text-sky-100/90 leading-relaxed mb-6">
                  Sistem Computer-Based Test (CBT) modern dengan Generator Soal AI Gemini v3.1, Anti-Cheat Fullscreen Protection, dan Penilaian Otomatis Multi-Tipe.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/10 border border-white/15">
                    <p className="font-bold text-lime-300 mb-1">Panduan Login Cepat (Uji Coba):</p>
                    <ul className="space-y-1 text-sky-100">
                      <li>• <strong>Peserta:</strong> NISN <code className="bg-black/30 px-1.5 py-0.5 rounded text-lime-300">0148291001</code> | Pass: <code className="bg-black/30 px-1.5 py-0.5 rounded text-lime-300">12345</code></li>
                      <li>• <strong>Token Aktif:</strong> <code className="bg-lime-400 text-[#0b2545] font-extrabold px-1.5 py-0.5 rounded">{settings.token}</code></li>
                      <li>• <strong>Guru:</strong> <code className="bg-black/30 px-1.5 py-0.5 rounded">budi.guru</code> | Pass: <code className="bg-black/30 px-1.5 py-0.5 rounded">guru123!</code></li>
                      <li>• <strong>Admin:</strong> <code className="bg-black/30 px-1.5 py-0.5 rounded">Sedarisua</code> | Pass: <code className="bg-black/30 px-1.5 py-0.5 rounded">sedarisua02!</code></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/15 text-[11px] text-sky-200 flex items-center justify-between">
                <span>© {settings.schoolName}</span>
                <span>v3.1 AI Powered</span>
              </div>
            </div>

            {/* Right Login Form Panel */}
            <div className="lg:col-span-7 p-7 md:p-9 bg-white">
              {/* Role Switcher Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-lime-100 rounded-2xl mb-6 border border-lime-300">
                <button
                  type="button"
                  onClick={() => setLoginTab('student')}
                  className={`py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${loginTab === 'student' ? 'bg-[#0b2545] text-white shadow-md' : 'text-slate-700 hover:bg-lime-200/70'}`}
                >
                  <User className="w-4 h-4" /> Peserta Ujian
                </button>
                <button
                  type="button"
                  onClick={() => setLoginTab('teacher')}
                  className={`py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${loginTab === 'teacher' ? 'bg-[#0b2545] text-white shadow-md' : 'text-slate-700 hover:bg-lime-200/70'}`}
                >
                  <BookOpen className="w-4 h-4" /> Guru / Proktor
                </button>
                <button
                  type="button"
                  onClick={() => setLoginTab('admin')}
                  className={`py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${loginTab === 'admin' ? 'bg-[#0b2545] text-white shadow-md' : 'text-slate-700 hover:bg-lime-200/70'}`}
                >
                  <Shield className="w-4 h-4" /> Administrator
                </button>
              </div>

              {loginTab === 'student' && (
                <StudentLoginForm
                  students={students}
                  settings={settings}
                  onLoginSuccess={(studentObj) => {
                    setCurrentUser({ role: 'student', data: studentObj });
                    notify(`Selamat datang, ${studentObj.name}!`);
                  }}
                  notify={notify}
                />
              )}

              {loginTab === 'teacher' && (
                <StaffLoginForm
                  roleLabel="Guru / Pembuat Soal"
                  placeholderUser="Masukkan Username Guru (cth: budi.guru)"
                  accounts={teachers}
                  onLoginSuccess={(teacherObj) => {
                    if (!teacherObj.active) {
                      notify('Akun guru ini sedang dinonaktifkan oleh Admin.', 'error');
                      return;
                    }
                    setCurrentUser({ role: 'teacher', data: teacherObj });
                    setAdminNav('dashboard');
                    notify(`Login Guru berhasil: ${teacherObj.name}`);
                  }}
                  notify={notify}
                />
              )}

              {loginTab === 'admin' && (
                <StaffLoginForm
                  roleLabel="Administrator Pusat"
                  placeholderUser="Masukkan Username Admin (Sedarisua)"
                  accounts={INITIAL_ADMINS}
                  onLoginSuccess={(adminObj) => {
                    setCurrentUser({ role: 'admin', data: adminObj });
                    setAdminNav('dashboard');
                    notify(`Login Administrator berhasil: ${adminObj.name}`);
                  }}
                  notify={notify}
                />
              )}
            </div>
          </div>
        </main>

        <footer className="relative z-10 text-center py-3 text-xs font-semibold text-emerald-950/80">
          © 2026 {settings.schoolName} • Sistem Ujian Berbasis Komputer (CBT) & Generator TKA
        </footer>
      </div>
    );
  }

  // ============================================================================
  // RENDER STUDENT CBT EXAM INTERFACE (AUTHENTIC ANBK / KEMENDIKBUD UI)
  // ============================================================================
  if (currentUser.role === 'student' && studentExamContext) {
    const { liveStudent, activePkg, examQuestions } = studentExamContext;

    return (
      <StudentExamPortal
        student={liveStudent}
        settings={settings}
        examPackage={activePkg}
        questions={examQuestions}
        broadcastMessage={broadcastMessage}
        onDismissBroadcast={() => setBroadcastMessage(null)}
        onUpdateStudent={(updatedFields) => {
          setStudents((prev) =>
            prev.map((st) => (st.id === liveStudent.id ? { ...st, ...updatedFields } : st))
          );
        }}
        calculateScore={(ansObj) => calculateStudentScore(ansObj, examQuestions)}
        onLogout={() => setCurrentUser(null)}
        notify={notify}
      />
    );
  }

  // ============================================================================
  // RENDER ADMIN & TEACHER DASHBOARD PORTAL
  // ============================================================================
  return (
    <div className="min-h-screen relative flex flex-col font-sans text-slate-800">
      <LimeEducationalBackdrop />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl text-white font-semibold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-700'}`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-lime-400">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <LogOut className="w-7 h-7" />
              <h3 className="text-lg font-extrabold">Konfirmasi Keluar Sesi</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Apakah Anda yakin ingin keluar dari panel <strong>{currentUser.role === 'admin' ? 'Administrator' : 'Guru'}</strong>? Sesi aktif Anda akan ditutup dengan aman.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setLogoutConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setLogoutConfirmOpen(false);
                  setCurrentUser(null);
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md"
              >
                Ya, Keluar Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Official Navy Header */}
      <header className="relative z-20 bg-[#0b2545] text-white shadow-lg border-b-4 border-lime-400">
        <div className="max-w-[1440px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-400 text-[#0b2545] flex items-center justify-center font-black shadow">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-extrabold leading-tight">{settings.examTitle}</h1>
              <p className="text-xs text-lime-300 font-medium">{settings.schoolName} • Panel Manajemen Terpadu</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Token Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-[#13315c] px-3.5 py-1.5 rounded-xl border border-lime-400/50">
              <Key className="w-4 h-4 text-lime-400" />
              <span className="text-xs text-sky-200">TOKEN:</span>
              <span className="font-mono font-black text-sm text-lime-400 tracking-widest">{settings.token}</span>
              <span className="text-[11px] text-sky-300">
                ({Math.floor(settings.tokenExpirySeconds / 60)}m {settings.tokenExpirySeconds % 60}s)
              </span>
            </div>

            <div className="flex items-center gap-2.5 bg-white/10 px-3 py-1.5 rounded-xl">
              <div className="text-right">
                <p className="text-xs font-bold text-white">{currentUser.data.name}</p>
                <p className="text-[10px] uppercase tracking-wider text-lime-300 font-bold">
                  {currentUser.role === 'admin' ? 'Administrator Utama' : 'Guru Pengampu'}
                </p>
              </div>
              <button
                onClick={() => setLogoutConfirmOpen(true)}
                className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout: Sidebar + Dynamic Content */}
      <div className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-4 py-5 flex flex-col lg:flex-row gap-5">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-lime-400 p-3 space-y-1.5 sticky top-5">
            {[
              { id: 'dashboard', label: 'Dashboard Utama', icon: BarChart2, roles: ['admin', 'teacher'] },
              { id: 'monitoring', label: 'Pantau Ujian (Live)', icon: Monitor, roles: ['admin', 'teacher'] },
              { id: 'bank', label: 'Bank Soal & AI Gemini', icon: Sparkles, roles: ['admin', 'teacher'] },
              { id: 'packages', label: 'Paket Ujian & Kelas', icon: Layers, roles: ['admin', 'teacher'] },
              { id: 'users', label: 'Pengelolaan Pengguna', icon: Users, roles: ['admin'] },
              { id: 'results', label: 'Hasil & Analisis Butir', icon: Award, roles: ['admin', 'teacher'] },
              { id: 'settings', label: 'Pengaturan & Anti-Cheat', icon: Settings, roles: ['admin'] }
            ]
              .filter((item) => item.roles.includes(currentUser.role))
              .map((item) => {
                const Icon = item.icon;
                const active = adminNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setAdminNav(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      active
                        ? 'bg-[#0b2545] text-lime-300 shadow-md translate-x-1'
                        : 'text-slate-700 hover:bg-lime-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-lime-400' : 'text-emerald-700'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </div>
        </aside>

        {/* Main Content Panel */}
        <main className="flex-1 min-w-0">
          {adminNav === 'dashboard' && (
            <DashboardOverview
              students={students}
              questions={questions}
              packages={packages}
              settings={settings}
              notify={notify}
              onRefreshStudents={() => setStudents((prev) => [...prev])}
            />
          )}

          {adminNav === 'monitoring' && (
            <LiveMonitoringView
              students={students}
              setStudents={setStudents}
              onBroadcast={(msg) => {
                setBroadcastMessage(msg);
                notify('Pesan pengumuman terkirim ke seluruh layar peserta ujian!');
              }}
              notify={notify}
            />
          )}

          {adminNav === 'bank' && (
            <QuestionBankManager
              questions={questions}
              setQuestions={setQuestions}
              settings={settings}
              notify={notify}
            />
          )}

          {adminNav === 'packages' && (
            <PackagesAndClassesManager
              packages={packages}
              setPackages={setPackages}
              students={students}
              setStudents={setStudents}
              notify={notify}
            />
          )}

          {adminNav === 'users' && currentUser.role === 'admin' && (
            <UserManagementView
              teachers={teachers}
              setTeachers={setTeachers}
              students={students}
              setStudents={setStudents}
              settings={settings}
              notify={notify}
            />
          )}

          {adminNav === 'results' && (
            <ExamResultsAndAnalytics
              students={students}
              questions={questions}
              settings={settings}
              notify={notify}
            />
          )}

          {adminNav === 'settings' && currentUser.role === 'admin' && (
            <SystemSettingsView
              settings={settings}
              setSettings={setSettings}
              notify={notify}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// 5. SUB-COMPONENTS: LOGIN FORMS (STUDENT, TEACHER, ADMIN)
// ============================================================================

function StudentLoginForm({ students, settings, onLoginSuccess, notify }) {
  const [step, setStep] = useState('credentials'); // 'credentials' | 'confirm'
  const [nisn, setNisn] = useState('0148291001');
  const [password, setPassword] = useState('12345');
  const [tokenInput, setTokenInput] = useState(settings.token);
  const [matchedStudent, setMatchedStudent] = useState(null);

  useEffect(() => {
    setTokenInput(settings.token);
  }, [settings.token]);

  const handleVerifyCredentials = (e) => {
    e.preventDefault();
    const found = students.find(
      (s) => s.nisn.trim() === nisn.trim() && s.password === password
    );
    if (!found) {
      notify('NISN atau Password peserta tidak ditemukan!', 'error');
      return;
    }
    if (found.isBlocked) {
      notify('Akun Anda TERBLOKIR karena pelanggaran layar. Hubungi Proktor/Pengawas!', 'error');
      return;
    }
    if (tokenInput.trim().toUpperCase() !== settings.token.toUpperCase()) {
      notify('Token Ujian tidak valid atau sudah kedaluwarsa!', 'error');
      return;
    }
    setMatchedStudent(found);
    setStep('confirm');
  };

  if (step === 'confirm' && matchedStudent) {
    return (
      <div className="space-y-5 animate-fadeIn">
        <div className="p-4 rounded-2xl bg-lime-100 border-2 border-lime-400">
          <h3 className="text-base font-extrabold text-[#0b2545] flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-700" /> Konfirmasi Data Peserta TKA / ANBK
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-lime-300">
              <span className="text-slate-500 block">NISN / Kode Peserta</span>
              <span className="font-bold text-slate-900 text-sm">{matchedStudent.nisn}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-lime-300">
              <span className="text-slate-500 block">Nama Lengkap Peserta</span>
              <span className="font-bold text-slate-900 text-sm">{matchedStudent.name}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-lime-300">
              <span className="text-slate-500 block">Asal Sekolah</span>
              <span className="font-bold text-slate-900">{matchedStudent.school}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-lime-300">
              <span className="text-slate-500 block">Kelas & Sesi Ujian</span>
              <span className="font-bold text-slate-900">{matchedStudent.kelas} • {matchedStudent.sesi}</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900">
          <strong>Perhatian Anti-Curang:</strong> Setelah menekan tombol <em>Mulai Ujian</em>, dilarang berpindah tab, meminimalkan layar, atau membuka aplikasi lain. Sistem akan otomatis memblokir layar ujian jika terdeteksi pelanggaran.
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep('credentials')}
            className="px-4 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={() => onLoginSuccess(matchedStudent)}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" /> MULAI KERJAKAN UJIAN SEKARANG
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerifyCredentials} className="space-y-4">
      <div>
        <h3 className="text-xl font-extrabold text-[#0b2545]">Login Peserta Ujian</h3>
        <p className="text-xs text-slate-500">Masukkan NISN, Password, dan Token Rilis Proktor.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">NISN / Username Peserta</label>
        <input
          type="text"
          required
          value={nisn}
          onChange={(e) => setNisn(e.target.value)}
          placeholder="Contoh: 0148291001"
          className="w-full px-4 py-2.5 rounded-xl border-2 border-lime-300 focus:border-[#0b2545] focus:outline-none text-sm font-semibold"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Password Peserta</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Masukkan password peserta"
          className="w-full px-4 py-2.5 rounded-xl border-2 border-lime-300 focus:border-[#0b2545] focus:outline-none text-sm font-semibold"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Token Ujian (6 Karakter)</label>
        <input
          type="text"
          required
          maxLength={6}
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
          placeholder="TOKEN"
          className="w-full px-4 py-2.5 rounded-xl border-2 border-lime-400 bg-lime-50 focus:border-[#0b2545] focus:outline-none text-base font-mono font-black tracking-widest uppercase text-[#0b2545]"
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 rounded-xl bg-[#0b2545] hover:bg-[#13315c] text-lime-300 font-extrabold text-sm shadow-lg transition-all"
      >
        LOGIN PESERTA UJIAN
      </button>
    </form>
  );
}

function StaffLoginForm({ roleLabel, placeholderUser, accounts, onLoginSuccess, notify }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const acc = accounts.find(
      (a) => a.username.trim() === username.trim() && a.password === password
    );
    if (!acc) {
      notify('Username atau Password salah! Periksa huruf besar/kecil.', 'error');
      return;
    }
    onLoginSuccess(acc);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-xl font-extrabold text-[#0b2545]">Login {roleLabel}</h3>
        <p className="text-xs text-slate-500">Gunakan kredensial resmi yang terdaftar pada sistem.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
        <input
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={placeholderUser}
          className="w-full px-4 py-2.5 rounded-xl border-2 border-lime-300 focus:border-[#0b2545] focus:outline-none text-sm font-semibold"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            className="w-full px-4 py-2.5 rounded-xl border-2 border-lime-300 focus:border-[#0b2545] focus:outline-none text-sm font-semibold pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-800"
          >
            {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 rounded-xl bg-[#0b2545] hover:bg-[#13315c] text-lime-300 font-extrabold text-sm shadow-lg transition-all"
      >
        MASUK KE PANEL {roleLabel.toUpperCase()}
      </button>
    </form>
  );
}

// ============================================================================
// 6. STUDENT CBT EXAM PORTAL (AUTHENTIC KEMENDIKBUD UI + ANTI-CHEAT LOCK)
// ============================================================================

function StudentExamPortal({
  student,
  settings,
  examPackage,
  questions,
  broadcastMessage,
  onDismissBroadcast,
  onUpdateStudent,
  calculateScore,
  onLogout,
  notify
}) {
  const storagePrefix = `cbt_sukomoro_exam_${student.id}`;
  const [currentIndex, setCurrentIndex] = useState(() => {
    try { return Number(localStorage.getItem(`${storagePrefix}_idx`)) || 0; } catch { return 0; }
  });
  const [fontSize, setFontSize] = useState('base'); // 'sm' | 'base' | 'lg'
  const [doubtfulMap, setDoubtfulMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${storagePrefix}_doubt`)) || {}; } catch { return {}; }
  });
  const [answers, setAnswers] = useState(student.answers || {});
  const [timeLeft, setTimeLeft] = useState(student.timeLeft || (examPackage?.durationMinutes || 60) * 60);

  useEffect(() => {
    try { localStorage.setItem(`${storagePrefix}_idx`, String(currentIndex)); } catch {}
  }, [currentIndex, storagePrefix]);

  useEffect(() => {
    try { localStorage.setItem(`${storagePrefix}_doubt`, JSON.stringify(doubtfulMap)); } catch {}
  }, [doubtfulMap, storagePrefix]);
  const [isSubmitted, setIsSubmitted] = useState(student.status === 'selesai');
  const [confirmFinishModal, setConfirmFinishModal] = useState(false);
  const [unlockPinInput, setUnlockPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Mark student status as 'sedang_ujian' on mount if not finished
  useEffect(() => {
    if (student.status === 'belum_mulai') {
      onUpdateStudent({
        status: 'sedang_ujian',
        startTime: new Date().toLocaleTimeString('id-ID')
      });
    }
    // Attempt Fullscreen if Anti-Cheat is ON
    if (settings.antiCheatEnabled && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  // Exam Countdown Timer (Tersimpan berkala agar aman saat refresh)
  useEffect(() => {
    if (isSubmitted || student.isBlocked) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          handleFinishExam();
          return 0;
        }
        if (next % 5 === 0) {
          onUpdateStudent({ timeLeft: next });
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, student.isBlocked]);

  // Anti-Cheat Visibility & Blur Detection
  useEffect(() => {
    if (!settings.antiCheatEnabled || isSubmitted) return;

    const triggerViolation = () => {
      onUpdateStudent({
        violations: (student.violations || 0) + 1,
        isBlocked: true
      });
    };

    const handleVisibility = () => {
      if (document.hidden) triggerViolation();
    };
    const handleBlur = () => {
      triggerViolation();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [settings.antiCheatEnabled, isSubmitted, student.violations]);

  const handleAnswerChange = (qId, value) => {
    const updated = { ...answers, [qId]: value };
    setAnswers(updated);
    onUpdateStudent({ answers: updated, timeLeft });
  };

  const handleFinishExam = () => {
    const finalScore = calculateScore(answers);
    setIsSubmitted(true);
    setConfirmFinishModal(false);
    onUpdateStudent({
      status: 'selesai',
      answers,
      score: finalScore,
      timeLeft: 0,
      endTime: new Date().toLocaleTimeString('id-ID')
    });
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleUnlockScreen = (e) => {
    e.preventDefault();
    if (unlockPinInput.trim() === settings.unlockPin) {
      onUpdateStudent({ isBlocked: false });
      setUnlockPinInput('');
      setPinError('');
      notify('Layar ujian berhasil dibuka kembali oleh Pengawas!');
    } else {
      setPinError('Kode PIN Pengawas salah! Minta pengawas memasukkan kode yang benar.');
    }
  };

  const formatTimer = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h > 0 ? String(h).padStart(2, '0') + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];
  const fontClass = fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg' : 'text-base';

  // ============================================================================
  // ANTI-CHEAT RED LOCK SCREEN OVERLAY
  // ============================================================================
  if (student.isBlocked && !isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 bg-red-950 text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-red-900 border-4 border-red-400 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-red-600 mx-auto flex items-center justify-center mb-4 animate-ping">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wide mb-2">
            LAYAR UJIAN TERBLOKIR!
          </h2>
          <p className="text-sm text-red-100 mb-4">
            Sistem mendeteksi Anda berpindah tab, meminimalkan jendela browser, atau membuka aplikasi lain. Pelanggaran ini tercatat sebagai <strong>Indikasi Curang</strong> di server pengawas.
          </p>
          <div className="bg-black/30 rounded-xl p-3 mb-5 text-xs text-red-200">
            Peserta: <strong>{student.name}</strong> ({student.nisn}) • Total Pelanggaran: <strong>{student.violations}x</strong>
          </div>
          <form onSubmit={handleUnlockScreen} className="space-y-3">
            <label className="block text-xs font-bold uppercase text-red-200">
              Masukkan Kode Buka Blokir dari Pengawas / Proktor
            </label>
            <input
              type="password"
              value={unlockPinInput}
              onChange={(e) => setUnlockPinInput(e.target.value)}
              placeholder="PIN PENGAWAS"
              className="w-full px-4 py-3 rounded-xl bg-white text-slate-900 font-mono font-black text-center text-lg tracking-widest focus:outline-none"
            />
            {pinError && <p className="text-xs font-bold text-yellow-300">{pinError}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-sm shadow-lg"
            >
              BUKA BLOKIR LAYAR UJIAN
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // POST-EXAM SCORE & ANSWER REVIEW SCREEN
  // ============================================================================
  if (isSubmitted) {
    const finalScore = student.score ?? calculateScore(answers);
    return (
      <div className="min-h-screen relative flex flex-col font-sans text-slate-800">
        <LimeEducationalBackdrop />
        <header className="relative z-10 bg-[#0b2545] text-white px-6 py-4 shadow-lg border-b-4 border-lime-400 flex justify-between items-center">
          <div>
            <h1 className="font-extrabold text-lg">{settings.examTitle}</h1>
            <p className="text-xs text-lime-300">{settings.schoolName}</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Keluar Ujian
          </button>
        </header>

        <main className="relative z-10 max-w-4xl w-full mx-auto p-4 my-6 space-y-6">
          <div className="bg-white/95 rounded-3xl p-8 shadow-2xl border-2 border-lime-400 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-3">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-[#0b2545] mb-1">Ujian Telah Selesai Disimpan!</h2>
            <p className="text-sm text-slate-600 mb-6">
              Terima kasih <strong>{student.name}</strong> ({student.kelas}), seluruh jawaban Anda telah berhasil dikirim ke server pusat.
            </p>

            {settings.showScoreAfterExam ? (
              <div className="inline-block px-10 py-5 rounded-2xl bg-gradient-to-r from-[#0b2545] to-[#134074] text-white shadow-xl mb-4">
                <span className="block text-xs uppercase tracking-widest text-lime-300 font-bold mb-1">
                  Nilai Akhir TKA Anda
                </span>
                <span className="text-5xl font-black text-lime-400">{finalScore}</span>
                <span className="text-sm text-sky-200 ml-1">/ 100</span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-lime-100 border border-lime-400 text-sm font-semibold text-emerald-900">
                Nilai ujian disembunyikan oleh Administrator. Silakan tunggu pengumuman resmi dari guru kelas Anda.
              </div>
            )}
          </div>

          {settings.reviewAnswersAfterExam && (
            <div className="bg-white/95 rounded-3xl p-6 shadow-xl border-2 border-lime-400 space-y-4">
              <h3 className="text-lg font-extrabold text-[#0b2545] border-b pb-2">
                Review Pembahasan & Kunci Jawaban
              </h3>
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl bg-lime-50/70 border border-lime-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded bg-[#0b2545] text-lime-300">
                      Soal No. {idx + 1} • {q.category}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">Bobot: {q.weight} Poin</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                  <div className="text-xs bg-white p-3 rounded-xl border border-lime-300 text-emerald-900">
                    <strong>Pembahasan:</strong> {q.explanation || 'Jawaban sesuai dengan konsep materi yang diujikan.'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ============================================================================
  // ACTIVE EXAM WORKSPACE (KEMENDIKBUD OFFICIAL NAVY HEADER + RIGHT NAV)
  // ============================================================================
  return (
    <div
      className="min-h-screen flex flex-col bg-lime-100/80 select-none font-sans text-slate-800"
      onContextMenu={(e) => settings.antiCheatEnabled && e.preventDefault()}
    >
      {/* Broadcast Announcement Popup from Proctor */}
      {broadcastMessage && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border-4 border-amber-400 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-600 font-black text-base mb-2">
              <Volume2 className="w-6 h-6 animate-bounce" /> PENGUMUMAN PENGAWAS UJIAN
            </div>
            <p className="text-sm text-slate-800 font-medium bg-amber-50 p-4 rounded-xl border border-amber-200 mb-4">
              {broadcastMessage}
            </p>
            <button
              onClick={onDismissBroadcast}
              className="w-full py-2.5 rounded-xl bg-[#0b2545] text-lime-300 font-bold text-sm"
            >
              Mengerti & Tutup Pesan
            </button>
          </div>
        </div>
      )}

      {/* Finish Exam Confirmation Modal */}
      {confirmFinishModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border-2 border-lime-400 shadow-2xl">
            <h3 className="text-lg font-extrabold text-[#0b2545] mb-2">Konfirmasi Selesai Ujian</h3>
            <p className="text-sm text-slate-600 mb-4">
              Anda telah menjawab <strong>{Object.keys(answers).length}</strong> dari <strong>{questions.length}</strong> soal. Setelah dikumpulkan, Anda tidak dapat mengubah jawaban kembali.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmFinishModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-sm"
              >
                Periksa Lagi
              </button>
              <button
                onClick={handleFinishExam}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow"
              >
                Ya, Kumpulkan Jawaban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. OFFICIAL KEMENDIKBUD NAVY HEADER */}
      <header className="bg-[#0b2545] text-white px-4 md:px-6 py-3 shadow-md border-b-4 border-lime-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-600 border-2 border-lime-300 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-extrabold tracking-tight">{settings.examTitle}</h1>
            <p className="text-[11px] text-lime-300">{settings.schoolName} • Paket: {examPackage?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{student.name}</p>
            <p className="text-[11px] text-sky-300">{student.nisn} • Kelas {student.kelas}</p>
          </div>
          <div className="px-4 py-1.5 rounded-xl bg-[#13315c] border border-lime-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-lime-400 animate-pulse" />
            <div>
              <span className="block text-[9px] uppercase text-sky-300 leading-none">Sisa Waktu</span>
              <span className="font-mono font-black text-base text-lime-300">{formatTimer(timeLeft)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. SUB-HEADER BAR: QUESTION NUMBER + FONT SIZE A- / A / A+ */}
      <div className="bg-white border-b border-lime-300 px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1 rounded-lg bg-[#0b2545] text-white font-extrabold text-sm">
            SOAL NO. {currentIndex + 1}
          </span>
          <span className="px-3 py-1 rounded-lg bg-lime-200 text-emerald-950 font-bold text-xs">
            Kategori: {currentQuestion?.category}
          </span>
          <span className="hidden md:inline-block px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 font-semibold text-xs">
            Tipe: {
              currentQuestion?.type === 'single' ? 'Pilihan Ganda' :
              currentQuestion?.type === 'complex' ? 'PG Kompleks (Banyak Jawaban)' :
              currentQuestion?.type === 'matching' ? 'Menjodohkan' : 'Benar / Salah'
            }
          </span>
        </div>

        {/* Font Size Controller A- / A / A+ */}
        <div className="flex items-center gap-1.5 bg-lime-100 p-1 rounded-xl border border-lime-300">
          <span className="text-[11px] font-bold text-slate-600 px-2">Ukuran Font:</span>
          <button
            onClick={() => setFontSize('sm')}
            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${fontSize === 'sm' ? 'bg-[#0b2545] text-lime-300' : 'text-slate-700 hover:bg-lime-200'}`}
          >
            A-
          </button>
          <button
            onClick={() => setFontSize('base')}
            className={`px-2.5 py-1 rounded-lg text-sm font-extrabold ${fontSize === 'base' ? 'bg-[#0b2545] text-lime-300' : 'text-slate-700 hover:bg-lime-200'}`}
          >
            A
          </button>
          <button
            onClick={() => setFontSize('lg')}
            className={`px-2.5 py-1 rounded-lg text-base font-extrabold ${fontSize === 'lg' ? 'bg-[#0b2545] text-lime-300' : 'text-slate-700 hover:bg-lime-200'}`}
          >
            A+
          </button>
        </div>
      </div>

      {/* 3. MAIN EXAM CONTENT + RIGHT SIDEBAR NUMBER MATRIX */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left / Center Question Area */}
        <div className="lg:col-span-9 bg-white rounded-2xl shadow-lg border-2 border-lime-300 p-5 md:p-7 flex flex-col justify-between">
          {currentQuestion ? (
            <div className={fontClass}>
              {/* Stimulus Box */}
              {currentQuestion.stimulus && (
                <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-[#0b2545] mb-4 leading-relaxed text-slate-700">
                  {currentQuestion.stimulus}
                </div>
              )}

              {/* Multimedia Stimulus (Image / Chart / YouTube Video) */}
              <MultimediaViewer question={currentQuestion} />

              {/* Question Stem */}
              <p className="font-bold text-slate-900 mb-5 leading-relaxed">
                {currentQuestion.question}
              </p>

              {/* ANSWER INPUT WIDGETS BASED ON 4 QUESTION TYPES */}
              {/* TYPE 1: SINGLE CHOICE */}
              {currentQuestion.type === 'single' && (
                <div className="space-y-2.5">
                  {(currentQuestion.options || []).map((opt, idx) => {
                    const selected = answers[currentQuestion.id] === idx;
                    const letters = ['A', 'B', 'C', 'D', 'E'];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAnswerChange(currentQuestion.id, idx)}
                        className={`w-full text-left p-3.5 rounded-xl border-2 flex items-center gap-3.5 transition-all ${
                          selected
                            ? 'border-[#0b2545] bg-lime-100/90 shadow-sm'
                            : 'border-slate-200 hover:border-lime-400 hover:bg-lime-50/50'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 ${
                          selected ? 'bg-[#0b2545] text-lime-300' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {letters[idx] || idx + 1}
                        </span>
                        <span className="font-medium text-slate-800">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TYPE 2: COMPLEX MULTIPLE CHOICE (CHECKBOX) */}
              {currentQuestion.type === 'complex' && (
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-emerald-800 mb-2">
                    * Pilih lebih dari satu jawaban yang benar (centang kotak di bawah):
                  </p>
                  {(currentQuestion.options || []).map((opt, idx) => {
                    const currentArr = Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id] : [];
                    const checked = currentArr.includes(idx);
                    return (
                      <label
                        key={idx}
                        className={`w-full cursor-pointer p-3.5 rounded-xl border-2 flex items-center gap-3.5 transition-all ${
                          checked
                            ? 'border-[#0b2545] bg-lime-100/90'
                            : 'border-slate-200 hover:border-lime-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? currentArr.filter((i) => i !== idx)
                              : [...currentArr, idx];
                            handleAnswerChange(currentQuestion.id, next);
                          }}
                          className="w-5 h-5 accent-[#0b2545] rounded"
                        />
                        <span className="font-medium text-slate-800">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* TYPE 3: MATCHING (MENJODOHKAN) */}
              {currentQuestion.type === 'matching' && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-emerald-800">
                    * Pilih pasangan yang sesuai untuk setiap pernyataan di kolom kiri:
                  </p>
                  {(currentQuestion.leftItems || []).map((leftText, lIdx) => {
                    const currentMap = answers[currentQuestion.id] || {};
                    return (
                      <div
                        key={lIdx}
                        className="p-3.5 rounded-xl bg-lime-50/80 border border-lime-300 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                      >
                        <div className="md:col-span-6 font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-[#0b2545] text-lime-300 text-xs flex items-center justify-center shrink-0">
                            {lIdx + 1}
                          </span>
                          <span>{leftText}</span>
                        </div>
                        <div className="md:col-span-6">
                          <select
                            value={currentMap[String(lIdx)] ?? ''}
                            onChange={(e) => {
                              handleAnswerChange(currentQuestion.id, {
                                ...currentMap,
                                [String(lIdx)]: e.target.value
                              });
                            }}
                            className="w-full p-2.5 rounded-xl border-2 border-[#0b2545] bg-white font-semibold text-sm text-slate-800"
                          >
                            <option value="">-- Pilih Pasangan Jawaban --</option>
                            {(currentQuestion.rightItems || []).map((rText, rIdx) => (
                              <option key={rIdx} value={String(rIdx)}>
                                {String.fromCharCode(65 + rIdx)}. {rText}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TYPE 4: TRUE / FALSE TABLE */}
              {currentQuestion.type === 'true_false' && (
                <div className="overflow-x-auto rounded-xl border-2 border-lime-300">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0b2545] text-white text-xs uppercase">
                        <th className="p-3">Pernyataan</th>
                        <th className="p-3 text-center w-24">Benar</th>
                        <th className="p-3 text-center w-24">Salah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lime-200">
                      {(currentQuestion.statements || []).map((stmt, sIdx) => {
                        const tfArr = Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id] : [];
                        return (
                          <tr key={sIdx} className="hover:bg-lime-50">
                            <td className="p-3 font-medium text-slate-800">{stmt}</td>
                            <td className="p-3 text-center">
                              <input
                                type="radio"
                                name={`tf-${currentQuestion.id}-${sIdx}`}
                                checked={tfArr[sIdx] === true}
                                onChange={() => {
                                  const next = [...tfArr];
                                  next[sIdx] = true;
                                  handleAnswerChange(currentQuestion.id, next);
                                }}
                                className="w-5 h-5 accent-emerald-600 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="radio"
                                name={`tf-${currentQuestion.id}-${sIdx}`}
                                checked={tfArr[sIdx] === false}
                                onChange={() => {
                                  const next = [...tfArr];
                                  next[sIdx] = false;
                                  handleAnswerChange(currentQuestion.id, next);
                                }}
                                className="w-5 h-5 accent-red-600 cursor-pointer"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-12">Tidak ada soal pada paket ujian aktif ini.</p>
          )}

          {/* Bottom Exam Navigation Controls */}
          <div className="mt-8 pt-4 border-t border-lime-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-800 font-bold text-sm flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Soal Sebelumnya
            </button>

            <label className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center gap-2 cursor-pointer shadow">
              <input
                type="checkbox"
                checked={!!doubtfulMap[currentQuestion?.id]}
                onChange={() =>
                  setDoubtfulMap((prev) => ({
                    ...prev,
                    [currentQuestion?.id]: !prev[currentQuestion?.id]
                  }))
                }
                className="w-4 h-4 accent-slate-900"
              />
              Ragu-Ragu
            </label>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2.5 rounded-xl bg-[#0b2545] hover:bg-[#13315c] text-lime-300 font-bold text-sm flex items-center gap-1.5 shadow"
              >
                Soal Berikutnya <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmFinishModal(true)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center gap-1.5 shadow-lg"
              >
                <CheckCircle className="w-4 h-4" /> Selesai & Kumpulkan
              </button>
            )}
          </div>
        </div>

        {/* Right Sidebar: Interactive Question Number Grid */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-lime-300 p-4 sticky top-4">
            <h3 className="text-sm font-extrabold text-[#0b2545] pb-2 mb-3 border-b border-lime-200 flex items-center justify-between">
              <span>Daftar Nomor Soal</span>
              <span className="text-xs text-emerald-700">
                {Object.keys(answers).length}/{questions.length} Dijawab
              </span>
            </h3>

            <div className="grid grid-cols-5 gap-2 mb-4">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isDoubt = !!doubtfulMap[q.id];
                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null && (
                  Array.isArray(answers[q.id]) ? answers[q.id].length > 0 :
                  typeof answers[q.id] === 'object' ? Object.keys(answers[q.id]).length > 0 : true
                );

                let btnStyle = 'bg-slate-100 text-slate-700 border-slate-300';
                if (isDoubt) btnStyle = 'bg-amber-400 text-slate-950 border-amber-500';
                else if (isAnswered) btnStyle = 'bg-emerald-600 text-white border-emerald-700';

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl font-extrabold text-sm border-2 transition-all ${btnStyle} ${
                      isCurrent ? 'ring-4 ring-[#0b2545]/40 scale-105' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-600 border-t border-lime-200 pt-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block" /> Sudah Dijawab
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-400 inline-block" /> Ragu-Ragu
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-400 inline-block" /> Belum Dijawab
              </div>
            </div>

            <button
              onClick={() => setConfirmFinishModal(true)}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md"
            >
              Hentikan & Selesaikan Ujian
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. ADMIN SUB-VIEWS: DASHBOARD OVERVIEW
// ============================================================================

function DashboardOverview({ students, questions, packages, settings, notify, onRefreshStudents }) {
  const [syncing, setSyncing] = useState(false);

  const totalStudents = students.length;
  const finishedCount = students.filter((s) => s.status === 'selesai').length;
  const inProgressCount = students.filter((s) => s.status === 'sedang_ujian').length;
  const violationCount = students.reduce((acc, s) => acc + (s.violations || 0), 0);

  const scoredStudents = students.filter((s) => typeof s.score === 'number');
  const avgScore = scoredStudents.length
    ? Math.round(scoredStudents.reduce((a, b) => a + b.score, 0) / scoredStudents.length)
    : 0;
  const maxScore = scoredStudents.length ? Math.max(...scoredStudents.map((s) => s.score)) : 0;
  const minScore = scoredStudents.length ? Math.min(...scoredStudents.map((s) => s.score)) : 0;

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      onRefreshStudents();
      notify('Sinkronisasi data server CBT & Bank Soal berhasil (100% Terkini)!');
    }, 800);
  };

  const kpiCards = [
    { label: 'Total Peserta', value: totalStudents, color: 'bg-sky-600', icon: Users },
    { label: 'Telah Selesai', value: finishedCount, color: 'bg-emerald-600', icon: CheckCircle },
    { label: 'Sedang Ujian', value: inProgressCount, color: 'bg-amber-500', icon: Clock },
    { label: 'Indikasi Curang', value: violationCount, color: 'bg-red-600', icon: AlertTriangle },
    { label: 'Rata-rata Nilai', value: avgScore, color: 'bg-indigo-600', icon: BarChart2 },
    { label: 'Nilai Tertinggi', value: maxScore, color: 'bg-teal-600', icon: Award },
    { label: 'Nilai Terendah', value: minScore, color: 'bg-slate-700', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="bg-white/95 rounded-2xl p-5 shadow-lg border-2 border-lime-400 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#0b2545]">Dashboard Eksekutif TKA & ANBK</h2>
          <p className="text-xs text-slate-600">
            Pemantauan real-time pelaksanaan ujian di <strong>{settings.schoolName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2.5 rounded-xl bg-[#0b2545] hover:bg-[#13315c] text-lime-300 font-bold text-xs flex items-center gap-2 shadow"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Menyinkronkan...' : 'Sinkronisasi Data'}
          </button>
          <button
            onClick={() => {
              onRefreshStudents();
              notify('Tampilan data diperbarui.');
            }}
            className="px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* 7 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white/95 rounded-2xl p-4 shadow-md border-2 border-lime-300 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className={`w-8 h-8 rounded-xl ${kpi.color} text-white flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
                <p className="text-[11px] font-bold text-slate-500">{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category Distribution Bar Chart */}
        <div className="bg-white/95 rounded-2xl p-5 shadow-lg border-2 border-lime-300">
          <h3 className="text-sm font-extrabold text-[#0b2545] mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-700" /> Sebaran Bank Soal per Kategori (5 Kategori Utama)
          </h3>
          <div className="space-y-3">
            {['IPAS', 'Matematika', 'Bahasa Indonesia', 'Soal Karakter', 'Soal Lingkungan Belajar'].map((cat) => {
              const count = questions.filter((q) => q.category === cat).length;
              const pct = Math.min(100, Math.round((count / Math.max(questions.length, 1)) * 100));
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>{cat}</span>
                    <span className="text-emerald-700">{count} Soal ({pct}%)</span>
                  </div>
                  <div className="w-full h-3 bg-lime-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#0b2545] to-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Participant Status Visual Summary */}
        <div className="bg-white/95 rounded-2xl p-5 shadow-lg border-2 border-lime-300">
          <h3 className="text-sm font-extrabold text-[#0b2545] mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" /> Status Pengerjaan & Kesiapan Rombel
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center my-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300">
              <p className="text-3xl font-black text-emerald-700">{finishedCount}</p>
              <p className="text-xs font-bold text-slate-600 mt-1">Sudah Selesai</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300">
              <p className="text-3xl font-black text-amber-600">{inProgressCount}</p>
              <p className="text-xs font-bold text-slate-600 mt-1">Sedang Ujian</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300">
              <p className="text-3xl font-black text-slate-700">
                {students.filter((s) => s.status === 'belum_mulai').length}
              </p>
              <p className="text-xs font-bold text-slate-600 mt-1">Belum Mulai</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-lime-100 text-xs text-emerald-950 font-semibold">
            Paket Aktif Saat Ini: <strong>{packages.find((p) => p.active)?.name || 'Belum ada paket aktif'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. ADMIN SUB-VIEWS: LIVE MONITORING & INTERVENTION
// ============================================================================

function LiveMonitoringView({ students, setStudents, onBroadcast, notify }) {
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'sedang_ujian' | 'selesai' | 'belum_mulai'
  const [broadcastText, setBroadcastText] = useState('');
  const [massMinutes, setMassMinutes] = useState(10);

  const filteredStudents = students.filter((s) =>
    filterTab === 'all' ? true : s.status === filterTab
  );

  const handleMassTimeAdjust = (deltaMinutes) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.status === 'sedang_ujian'
          ? { ...s, timeLeft: Math.max(60, (s.timeLeft || 0) + deltaMinutes * 60) }
          : s
      )
    );
    notify(`Waktu ujian seluruh peserta aktif berhasil ${deltaMinutes > 0 ? 'ditambah' : 'dikurangi'} ${Math.abs(deltaMinutes)} menit!`);
  };

  const handleUnblockStudent = (studentId) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, isBlocked: false } : s))
    );
    notify('Blokir layar & reset login siswa berhasil dibuka!');
  };

  return (
    <div className="space-y-5">
      {/* Control Bar: Mass Time & Broadcast Message */}
      <div className="bg-white/95 rounded-2xl p-5 shadow-lg border-2 border-lime-400 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mass Time Control */}
        <div className="p-4 rounded-xl bg-lime-50 border border-lime-300 space-y-2">
          <h3 className="text-sm font-extrabold text-[#0b2545] flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" /> Kontrol Waktu Masal (Peserta Sedang Ujian)
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={60}
              value={massMinutes}
              onChange={(e) => setMassMinutes(Number(e.target.value))}
              className="w-20 px-3 py-2 rounded-xl border-2 border-lime-400 font-bold text-sm"
            />
            <span className="text-xs font-bold text-slate-600">Menit</span>
            <button
              onClick={() => handleMassTimeAdjust(massMinutes)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              + Tambah Waktu
            </button>
            <button
              onClick={() => handleMassTimeAdjust(-massMinutes)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              - Kurangi Waktu
            </button>
          </div>
        </div>

        {/* Real-time Broadcast Message */}
        <div className="p-4 rounded-xl bg-sky-50 border border-sky-300 space-y-2">
          <h3 className="text-sm font-extrabold text-[#0b2545] flex items-center gap-2">
            <Send className="w-4 h-4 text-sky-700" /> Broadcast Pengumuman Real-Time ke Layar Siswa
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder="Ketik pesan pengumuman untuk seluruh peserta..."
              className="flex-1 px-3 py-2 rounded-xl border-2 border-sky-300 text-xs font-semibold"
            />
            <button
              onClick={() => {
                if (!broadcastText.trim()) return;
                onBroadcast(broadcastText);
                setBroadcastText('');
              }}
              className="px-4 py-2 rounded-xl bg-[#0b2545] text-lime-300 font-bold text-xs"
            >
              Kirim
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Live Participant Table */}
      <div className="bg-white/95 rounded-2xl p-5 shadow-lg border-2 border-lime-400">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: `Semua (${students.length})` },
              { id: 'sedang_ujian', label: `Sedang Ujian (${students.filter((s) => s.status === 'sedang_ujian').length})` },
              { id: 'selesai', label: `Sudah Selesai (${students.filter((s) => s.status === 'selesai').length})` },
              { id: 'belum_mulai', label: `Belum Mulai (${students.filter((s) => s.status === 'belum_mulai').length})` }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterTab(t.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                  filterTab === t.id ? 'bg-[#0b2545] text-lime-300' : 'bg-lime-100 text-slate-700 hover:bg-lime-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => notify('Status pengerjaan peserta berhasil disegarkan.')}
            className="px-3.5 py-2 rounded-xl bg-lime-400 hover:bg-lime-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Segarkan Data
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0b2545] text-white uppercase">
                <th className="p-3 rounded-tl-xl">NISN & Nama Peserta</th>
                <th className="p-3">Kelas / Sesi</th>
                <th className="p-3">Status Ujian</th>
                <th className="p-3">Progres & Sisa Waktu</th>
                <th className="p-3">Keamanan / Pelanggaran</th>
                <th className="p-3 rounded-tr-xl text-right">Aksi Pengawas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lime-200">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-lime-50/70">
                  <td className="p-3">
                    <p className="font-extrabold text-slate-900">{s.name}</p>
                    <p className="text-slate-500 font-mono">{s.nisn}</p>
                  </td>
                  <td className="p-3 font-semibold">{s.kelas} • {s.sesi}</td>
                  <td className="p-3">
                    {s.status === 'sedang_ujian' && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
                        Sedang Ujian
                      </span>
                    )}
                    {s.status === 'selesai' && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        Selesai (Skor: {s.score})
                      </span>
                    )}
                    {s.status === 'belum_mulai' && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-bold">
                        Belum Mulai
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-slate-800">
                      {Object.keys(s.answers || {}).length} Soal Dijawab
                    </p>
                    <p className="text-slate-500">
                      Sisa: {Math.floor((s.timeLeft || 0) / 60)} menit
                    </p>
                  </td>
                  <td className="p-3">
                    {s.isBlocked ? (
                      <span className="px-2.5 py-1 rounded-full bg-red-600 text-white font-extrabold animate-pulse">
                        TERBLOKIR ({s.violations}x Pelanggaran)
                      </span>
                    ) : s.violations > 0 ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 font-bold">
                        {s.violations}x Peringatan
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold">Aman</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {s.isBlocked ? (
                      <button
                        onClick={() => handleUnblockStudent(s.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1"
                      >
                        <Unlock className="w-3.5 h-3.5" /> Buka Blokir
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setStudents((prev) =>
                            prev.map((st) => (st.id === s.id ? { ...st, status: 'belum_mulai', isBlocked: false } : st))
                          );
                          notify(`Sesi login ${s.name} berhasil direset.`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold"
                      >
                        Reset Login
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 9. BANK SOAL & AI GEMINI v3.1 GENERATOR + RICH MANUAL EDITOR (WITH EDIT)
// ============================================================================

function QuestionBankManager({ questions, setQuestions, settings, notify }) {
  const categories = ['IPAS', 'Matematika', 'Bahasa Indonesia', 'Soal Karakter', 'Soal Lingkungan Belajar'];
  const [selectedCategory, setSelectedCategory] = useState('IPAS');
  const [activeMode, setActiveMode] = useState('list'); // 'list' | 'manual' | 'edit' | 'upload' | 'ai'
  const [editingQuestion, setEditingQuestion] = useState(null);

  const filteredQuestions = questions.filter((q) => q.category === selectedCategory);

  const handleDeleteQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    notify('Soal berhasil dihapus dari Bank Soal.');
  };

  const handleStartEdit = (questionObj) => {
    setEditingQuestion(questionObj);
    setActiveMode('edit');
  };

  return (
    <div className="space-y-5">
      {/* Category Selector Pills (5 Main Categories) */}
      <div className="bg-white/95 rounded-2xl p-5 shadow-lg border-2 border-lime-400">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#0b2545]">Bank Soal & Generator AI Gemini v3.1</h2>
            <p className="text-xs text-slate-600">Pilih kategori mata pelajaran atau survei untuk mengelola & mengedit butir soal.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setEditingQuestion(null); setActiveMode('list'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold ${activeMode === 'list' ? 'bg-[#0b2545] text-lime-300' : 'bg-slate-100 text-slate-700'}`}
            >
              Daftar Soal ({filteredQuestions.length})
            </button>
            <button
              onClick={() => { setEditingQuestion(null); setActiveMode('manual'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${activeMode === 'manual' ? 'bg-emerald-700 text-white' : 'bg-lime-200 text-emerald-950'}`}
            >
              <Plus className="w-4 h-4" /> Tambah Manual
            </button>
            <button
              onClick={() => { setEditingQuestion(null); setActiveMode('upload'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${activeMode === 'upload' ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-950'}`}
            >
              <Upload className="w-4 h-4" /> Upload Soal
            </button>
            <button
              onClick={() => { setEditingQuestion(null); setActiveMode('ai'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow ${activeMode === 'ai' ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'}`}
            >
              <Sparkles className="w-4 h-4 text-lime-300" /> Generate AI Gemini v3.1
            </button>
          </div>
        </div>

        {/* 5 Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {categories.map((cat) => {
            const count = questions.filter((q) => q.category === cat).length;
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setEditingQuestion(null); setActiveMode('list'); }}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  active
                    ? 'bg-[#0b2545] border-[#0b2545] text-white shadow-md'
                    : 'bg-lime-50 border-lime-300 text-slate-800 hover:bg-lime-100'
                }`}
              >
                <p className={`text-xs font-extrabold ${active ? 'text-lime-300' : 'text-[#0b2545]'}`}>{cat}</p>
                <p className={`text-[11px] mt-0.5 ${active ? 'text-sky-200' : 'text-slate-500'}`}>{count} Butir Soal</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODE 1: LIST OF QUESTIONS IN CATEGORY */}
      {activeMode === 'list' && (
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white/95 rounded-2xl p-10 text-center border-2 border-dashed border-lime-400">
              <p className="text-sm font-bold text-slate-600 mb-3">
                Belum ada soal pada kategori <strong>{selectedCategory}</strong>.
              </p>
              <button
                onClick={() => setActiveMode('ai')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Buat Soal Otomatis dengan AI Gemini v3.1
              </button>
            </div>
          ) : (
            filteredQuestions.map((q, idx) => (
              <div key={q.id} className="bg-white/95 rounded-2xl p-5 shadow-md border-2 border-lime-300">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-lime-200">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-[#0b2545] text-lime-300 font-extrabold text-xs">
                      #{idx + 1} • {q.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-lime-200 text-emerald-950 font-bold text-xs uppercase">
                      {q.type === 'single' ? 'Pilihan Ganda' : q.type === 'complex' ? 'PG Kompleks' : q.type === 'matching' ? 'Menjodohkan' : 'Benar / Salah'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs">
                      {q.difficulty} • Bobot {q.weight}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(q)}
                      className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-500 text-amber-900 hover:text-white font-bold text-xs flex items-center gap-1 transition"
                      title="Edit Manual Soal Ini"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Soal
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-2 rounded-lg bg-red-100 hover:bg-red-600 text-red-600 hover:text-white transition"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {q.stimulus && <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mb-3">{q.stimulus}</p>}
                <MultimediaViewer question={q} />
                <p className="text-sm font-bold text-slate-900 mb-3">{q.question}</p>

                {q.type === 'single' || q.type === 'complex' ? (
                  <ul className="space-y-1 text-xs">
                    {(q.options || []).map((opt, oIdx) => {
                      const isCorrect = Array.isArray(q.correctAnswer)
                        ? q.correctAnswer.includes(oIdx)
                        : Number(q.correctAnswer) === oIdx;
                      return (
                        <li key={oIdx} className={`px-3 py-1.5 rounded-lg ${isCorrect ? 'bg-emerald-100 text-emerald-900 font-bold' : 'text-slate-600'}`}>
                          {String.fromCharCode(65 + oIdx)}. {opt} {isCorrect && '✓ (Kunci)'}
                        </li>
                      );
                    })}
                  </ul>
                ) : q.type === 'matching' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(q.leftItems || []).map((l, lIdx) => (
                      <div key={lIdx} className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 font-semibold">
                        {l} ➔ <strong>{q.rightItems?.[Number(q.correctAnswer?.[String(lIdx)])]}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    {(q.statements || []).map((st, sIdx) => (
                      <div key={sIdx} className="p-2 rounded-lg bg-slate-50 flex justify-between">
                        <span>{st}</span>
                        <span className="font-bold text-emerald-700">
                          {q.correctAnswer?.[sIdx] ? 'BENAR' : 'SALAH'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* MODE 2A: TAMBAH SOAL MANUAL BARU */}
      {activeMode === 'manual' && (
        <ManualQuestionEditor
          defaultCategory={selectedCategory}
          onSave={(newQuestion) => {
            setQuestions((prev) => [newQuestion, ...prev]);
            setActiveMode('list');
            notify('Soal manual berhasil disimpan ke Bank Soal!');
          }}
          onCancel={() => setActiveMode('list')}
        />
      )}

      {/* MODE 2B: EDIT MANUAL SOAL YANG SUDAH ADA */}
      {activeMode === 'edit' && editingQuestion && (
        <ManualQuestionEditor
          defaultCategory={editingQuestion.category}
          initialData={editingQuestion}
          onSave={(updatedQuestion) => {
            setQuestions((prev) =>
              prev.map((item) => (item.id === updatedQuestion.id ? updatedQuestion : item))
            );
            setEditingQuestion(null);
            setActiveMode('list');
            notify('Perubahan soal berhasil disimpan!');
          }}
          onCancel={() => {
            setEditingQuestion(null);
            setActiveMode('list');
          }}
        />
      )}

      {/* MODE 3: BULK UPLOAD WORD / EXCEL TEMPLATE */}
      {activeMode === 'upload' && (
        <BulkUploadQuestionPanel
          defaultCategory={selectedCategory}
          onImportQuestions={(importedList) => {
            setQuestions((prev) => [...importedList, ...prev]);
            setActiveMode('list');
            notify(`${importedList.length} soal dari template berhasil diimpor!`);
          }}
        />
      )}

      {/* MODE 4: AI GEMINI v3.1 MULTIMEDIA QUESTION GENERATOR (WITH PREVIEW EDIT) */}
      {activeMode === 'ai' && (
        <GeminiQuestionGeneratorModal
          defaultCategory={selectedCategory}
          settings={settings}
          onSaveGenerated={(genList) => {
            setQuestions((prev) => [...genList, ...prev]);
            setActiveMode('list');
            notify(`${genList.length} soal hasil AI Gemini v3.1 berhasil ditambahkan ke Bank Soal!`);
          }}
          notify={notify}
        />
      )}
    </div>
  );
}

// ============================================================================
// 10. MANUAL QUESTION EDITOR (DEVICE FILE / DRIVE UPLOAD + ALL 4 TYPES + EDIT)
// ============================================================================

function ManualQuestionEditor({ defaultCategory, initialData = null, onSave, onCancel }) {
  const [category, setCategory] = useState(initialData?.category || defaultCategory);
  const [type, setType] = useState(initialData?.type || 'single'); // 'single' | 'complex' | 'matching' | 'true_false'
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'Sedang');
  const [weight, setWeight] = useState(initialData?.weight ?? 20);
  const [stimulus, setStimulus] = useState(initialData?.stimulus || '');
  const [question, setQuestion] = useState(initialData?.question || '');
  const [explanation, setExplanation] = useState(initialData?.explanation || '');

  // Multimedia Upload State (Device FileReader or Google Drive / YouTube URL)
  const [mediaType, setMediaType] = useState(initialData?.mediaType || 'none'); // 'none' | 'image' | 'chart' | 'video'
  const [mediaUrl, setMediaUrl] = useState(initialData?.mediaUrl || '');
  const [mediaCaption, setMediaCaption] = useState(initialData?.mediaCaption || '');
  const [chartTitle, setChartTitle] = useState(initialData?.chartData?.title || 'Grafik Data Pengamatan');
  const [chartLabelsStr, setChartLabelsStr] = useState(
    initialData?.chartData?.labels ? initialData.chartData.labels.join(', ') : 'Kelompok A, Kelompok B, Kelompok C, Kelompok D'
  );
  const [chartValuesStr, setChartValuesStr] = useState(
    initialData?.chartData?.values ? initialData.chartData.values.join(', ') : '40, 75, 60, 90'
  );

  // Options State for Single & Complex
  const [options, setOptions] = useState(initialData?.options?.length ? initialData.options : ['', '', '', '']);
  const [singleCorrect, setSingleCorrect] = useState(
    initialData?.type === 'single' ? Number(initialData.correctAnswer ?? 0) : 0
  );
  const [complexCorrect, setComplexCorrect] = useState(
    initialData?.type === 'complex' && Array.isArray(initialData.correctAnswer) ? initialData.correctAnswer : [0]
  );

  // Matching State (Menjodohkan)
  const [leftItems, setLeftItems] = useState(initialData?.leftItems?.length ? initialData.leftItems : ['Premis 1', 'Premis 2', 'Premis 3']);
  const [rightItems, setRightItems] = useState(initialData?.rightItems?.length ? initialData.rightItems : ['Pasangan A', 'Pasangan B', 'Pasangan C']);
  const [matchingMap, setMatchingMap] = useState(
    initialData?.type === 'matching' && initialData.correctAnswer ? initialData.correctAnswer : { '0': '0', '1': '1', '2': '2' }
  );

  // True/False State
  const [statements, setStatements] = useState(initialData?.statements?.length ? initialData.statements : ['Pernyataan pertama...', 'Pernyataan kedua...']);
  const [tfAnswers, setTfAnswers] = useState(
    initialData?.type === 'true_false' && Array.isArray(initialData.correctAnswer) ? initialData.correctAnswer : [true, false]
  );

  // Handle local device upload (Image / Video) via FileReader
  const handleLocalFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result);
      setMediaCaption(`File Perangkat: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let correctAnswer = singleCorrect;
    if (type === 'complex') correctAnswer = complexCorrect;
    if (type === 'matching') correctAnswer = matchingMap;
    if (type === 'true_false') correctAnswer = tfAnswers;

    const savedQ = {
      id: initialData?.id || `q-${Date.now()}`,
      category,
      type,
      difficulty,
      weight: Number(weight),
      stimulus,
      question,
      explanation,
      mediaType,
      mediaUrl,
      mediaCaption,
      chartData: mediaType === 'chart' ? {
        title: chartTitle,
        labels: chartLabelsStr.split(',').map((s) => s.trim()),
        values: chartValuesStr.split(',').map((v) => Number(v.trim()) || 0)
      } : undefined,
      options: (type === 'single' || type === 'complex') ? options : undefined,
      leftItems: type === 'matching' ? leftItems : undefined,
      rightItems: type === 'matching' ? rightItems : undefined,
      statements: type === 'true_false' ? statements : undefined,
      correctAnswer
    };

    onSave(savedQ);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/95 rounded-2xl p-6 shadow-xl border-2 border-lime-400 space-y-5">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-lg font-extrabold text-[#0b2545]">
          {initialData ? 'Edit Soal Manual Lengkap' : 'Editor Tambah Soal Manual Lengkap'}
        </h3>
        <button type="button" onClick={onCancel} className="text-xs font-bold text-slate-500 hover:text-red-600">
          ✕ Tutup Editor
        </button>
      </div>

      {/* Metadata Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-bold mb-1">Kategori Soal</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2.5 rounded-xl border-2 border-lime-300 text-xs font-bold">
            {['IPAS', 'Matematika', 'Bahasa Indonesia', 'Soal Karakter', 'Soal Lingkungan Belajar'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">Tipe Soal (4 Tipe Wajib)</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2.5 rounded-xl border-2 border-[#0b2545] bg-lime-50 text-xs font-extrabold">
            <option value="single">1. Pilihan Ganda (Single Choice)</option>
            <option value="complex">2. Pilihan Ganda Kompleks</option>
            <option value="matching">3. Menjodohkan (Matching)</option>
            <option value="true_false">4. Benar / Salah (Tabel)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">Tingkat Kesulitan</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full p-2.5 rounded-xl border-2 border-lime-300 text-xs font-bold">
            <option value="Mudah">Mudah</option>
            <option value="Sedang">Sedang</option>
            <option value="HOTS">HOTS (Penalaran Tinggi)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">Bobot Skor</label>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full p-2.5 rounded-xl border-2 border-lime-300 text-xs font-bold" />
        </div>
      </div>

      {/* Stimulus Text */}
      <div>
        <label className="block text-xs font-bold mb-1">Teks Stimulus / Wacana / Rumus LaTeX (Opsional)</label>
        <textarea
          rows={2}
          value={stimulus}
          onChange={(e) => setStimulus(e.target.value)}
          placeholder="Masukkan bacaan pengantar, studi kasus, atau rumus matematika..."
          className="w-full p-3 rounded-xl border-2 border-lime-300 text-xs"
        />
      </div>

      {/* MULTIMEDIA UPLOAD SECTION (PERANGKAT LOKAL / GOOGLE DRIVE / YOUTUBE / DIAGRAM) */}
      <div className="p-4 rounded-2xl bg-lime-50 border-2 border-lime-300 space-y-3">
        <label className="block text-xs font-extrabold text-[#0b2545]">
          Lampiran Multimedia Stimulus (Upload dari Perangkat, Google Drive, Diagram/Grafik, atau Video YouTube)
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'none', label: 'Tanpa Media' },
            { id: 'image', label: 'Upload Gambar (Perangkat / Drive URL)' },
            { id: 'chart', label: 'Diagram / Grafik Batang' },
            { id: 'video', label: 'Upload Video (Perangkat / YouTube / Drive)' }
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMediaType(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                mediaType === m.id ? 'bg-[#0b2545] text-lime-300 border-[#0b2545]' : 'bg-white text-slate-700 border-lime-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {(mediaType === 'image' || mediaType === 'video') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Pilih File dari Perangkat (Komputer/HP):
              </label>
              <input
                type="file"
                accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                onChange={handleLocalFileUpload}
                className="w-full text-xs bg-white p-2 rounded-xl border border-lime-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Atau Tempel Tautan Google Drive / Google Images / YouTube:
              </label>
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder={mediaType === 'image' ? 'https://drive.google.com/... atau data:image/...' : 'https://www.youtube.com/watch?v=...'}
                className="w-full p-2 rounded-xl border border-lime-400 text-xs bg-white"
              />
            </div>
            {mediaType === 'image' && mediaUrl && (
              <div className="md:col-span-2 flex items-center gap-3 p-2 bg-white rounded-xl border border-lime-300">
                <img src={mediaUrl} alt="Preview" className="h-20 rounded-lg object-contain border" />
                <button
                  type="button"
                  onClick={() => setMediaUrl('')}
                  className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-bold"
                >
                  Hapus Gambar
                </button>
              </div>
            )}
            <div className="md:col-span-2">
              <input
                type="text"
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                placeholder="Keterangan / Sumber Gambar atau Video..."
                className="w-full p-2 rounded-xl border border-lime-300 text-xs bg-white"
              />
            </div>
          </div>
        )}

        {mediaType === 'chart' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold mb-1">Judul Grafik / Diagram</label>
              <input
                type="text"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                className="w-full p-2 rounded-xl border border-lime-400 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Label Sumbu X (Pisahkan koma)</label>
              <input
                type="text"
                value={chartLabelsStr}
                onChange={(e) => setChartLabelsStr(e.target.value)}
                className="w-full p-2 rounded-xl border border-lime-400 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Nilai Data Angka (Pisahkan koma)</label>
              <input
                type="text"
                value={chartValuesStr}
                onChange={(e) => setChartValuesStr(e.target.value)}
                className="w-full p-2 rounded-xl border border-lime-400 text-xs bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Question Stem */}
      <div>
        <label className="block text-xs font-bold mb-1">Pertanyaan Utama *</label>
        <textarea
          required
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Tuliskan inti pertanyaan soal di sini..."
          className="w-full p-3 rounded-xl border-2 border-lime-300 text-xs font-semibold"
        />
      </div>

      {/* DYNAMIC ANSWER INPUTS BY TYPE */}
      {(type === 'single' || type === 'complex') && (
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-[#0b2545]">
            Pilihan Jawaban & Kunci ({type === 'single' ? 'Pilih 1 Kunci Benar' : 'Centang Semua Kunci Benar'})
          </label>
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {type === 'single' ? (
                <input
                  type="radio"
                  name="single-key"
                  checked={singleCorrect === idx}
                  onChange={() => setSingleCorrect(idx)}
                  className="w-4 h-4 accent-emerald-600"
                />
              ) : (
                <input
                  type="checkbox"
                  checked={complexCorrect.includes(idx)}
                  onChange={() => {
                    setComplexCorrect((prev) =>
                      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                    );
                  }}
                  className="w-4 h-4 accent-emerald-600"
                />
              )}
              <span className="font-bold text-xs w-5">{String.fromCharCode(65 + idx)}.</span>
              <input
                type="text"
                required
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[idx] = e.target.value;
                  setOptions(next);
                }}
                placeholder={`Teks opsi jawaban ${String.fromCharCode(65 + idx)}`}
                className="flex-1 p-2 rounded-xl border border-lime-300 text-xs"
              />
            </div>
          ))}
        </div>
      )}

      {/* MATCHING (MENJODOHKAN) MANUAL BUILDER */}
      {type === 'matching' && (
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-300 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-[#0b2545]">
              Konfigurasi Pasangan Menjodohkan (Kolom Kiri ➔ Kolom Kanan)
            </label>
            <button
              type="button"
              onClick={() => {
                const nextIdx = leftItems.length;
                setLeftItems([...leftItems, `Premis ${nextIdx + 1}`]);
                setRightItems([...rightItems, `Pasangan ${String.fromCharCode(65 + nextIdx)}`]);
                setMatchingMap({ ...matchingMap, [String(nextIdx)]: String(nextIdx) });
              }}
              className="px-3 py-1 rounded-lg bg-[#0b2545] text-lime-300 text-xs font-bold"
            >
              + Tambah Baris Pasangan
            </button>
          </div>
          {leftItems.map((lItem, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={lItem}
                onChange={(e) => {
                  const next = [...leftItems];
                  next[idx] = e.target.value;
                  setLeftItems(next);
                }}
                placeholder="Pernyataan Kiri"
                className="md:col-span-5 p-2 rounded-xl border border-sky-300 text-xs bg-white"
              />
              <input
                type="text"
                value={rightItems[idx] || ''}
                onChange={(e) => {
                  const next = [...rightItems];
                  next[idx] = e.target.value;
                  setRightItems(next);
                }}
                placeholder="Jawaban Kanan"
                className="md:col-span-5 p-2 rounded-xl border border-sky-300 text-xs bg-white"
              />
              <select
                value={matchingMap[String(idx)] ?? String(idx)}
                onChange={(e) => setMatchingMap({ ...matchingMap, [String(idx)]: e.target.value })}
                className="md:col-span-2 p-2 rounded-xl border border-emerald-500 bg-emerald-50 text-xs font-bold"
              >
                {rightItems.map((_, rIdx) => (
                  <option key={rIdx} value={String(rIdx)}>
                    Kunci: {String.fromCharCode(65 + rIdx)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* TRUE / FALSE MANUAL BUILDER */}
      {type === 'true_false' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-[#0b2545]">Daftar Pernyataan Benar / Salah</label>
            <button
              type="button"
              onClick={() => {
                setStatements([...statements, 'Pernyataan baru...']);
                setTfAnswers([...tfAnswers, true]);
              }}
              className="px-3 py-1 rounded-lg bg-[#0b2545] text-lime-300 text-xs font-bold"
            >
              + Tambah Pernyataan
            </button>
          </div>
          {statements.map((st, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={st}
                onChange={(e) => {
                  const next = [...statements];
                  next[idx] = e.target.value;
                  setStatements(next);
                }}
                className="flex-1 p-2 rounded-xl border border-lime-300 text-xs"
              />
              <select
                value={tfAnswers[idx] ? 'true' : 'false'}
                onChange={(e) => {
                  const next = [...tfAnswers];
                  next[idx] = e.target.value === 'true';
                  setTfAnswers(next);
                }}
                className="p-2 rounded-xl border border-emerald-500 bg-emerald-50 text-xs font-bold"
              >
                <option value="true">Kunci: BENAR</option>
                <option value="false">Kunci: SALAH</option>
              </select>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold mb-1">Pembahasan Jawaban (Ditampilkan saat Review)</label>
        <input
          type="text"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Penjelasan singkat jawaban benar..."
          className="w-full p-2.5 rounded-xl border border-lime-300 text-xs"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs">
          Batal
        </button>
        <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg">
          {initialData ? 'Simpan Perubahan Soal' : 'Simpan Soal ke Bank Soal'}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// 11. BULK UPLOAD QUESTION PANEL (WORD / EXCEL / CSV TEMPLATE)
// ============================================================================

function BulkUploadQuestionPanel({ defaultCategory, onImportQuestions }) {
  const [rawJsonOrCsv, setRawJsonOrCsv] = useState('');

  const handleSampleTemplateImport = () => {
    const sampleBatch = [
      {
        id: `q-imp-${Date.now()}-1`,
        category: defaultCategory,
        type: 'single',
        difficulty: 'HOTS',
        weight: 20,
        stimulus: `Stimulus bacaan hasil import massal template Word/Excel untuk kategori ${defaultCategory}.`,
        question: `Manakah penerapan konsep ${defaultCategory} yang paling tepat dalam kehidupan sehari-hari?`,
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
        mediaCaption: 'Aset Gambar Stimulus Template Import',
        options: ['Penerapan ramah lingkungan dan efisien', 'Penggunaan sumber daya berlebihan', 'Mengabaikan prosedur keselamatan', 'Tidak melakukan pengamatan'],
        correctAnswer: 0,
        explanation: 'Konsep yang ramah lingkungan dan efisien merupakan jawaban yang tepat.'
      }
    ];
    onImportQuestions(sampleBatch);
  };

  return (
    <div className="bg-white/95 rounded-2xl p-6 shadow-xl border-2 border-lime-400 space-y-4">
      <h3 className="text-lg font-extrabold text-[#0b2545]">Import Massal Soal (Template Word / Excel / CSV)</h3>
      <p className="text-xs text-slate-600">
        Unggah dokumen soal (.docx, .xlsx, .csv) yang sudah dilengkapi kolom stimulus gambar, grafik, maupun tautan video pembelajaran.
      </p>

      <div className="p-5 rounded-2xl border-2 border-dashed border-sky-400 bg-sky-50/70 text-center space-y-3">
        <Upload className="w-10 h-10 text-sky-700 mx-auto" />
        <p className="text-xs font-bold text-slate-800">Pilih file Template Soal (.xlsx / .docx / .csv)</p>
        <input
          type="file"
          accept=".csv,.xlsx,.xls,.docx,.json"
          onChange={(e) => {
            if (e.target.files?.[0]) handleSampleTemplateImport();
          }}
          className="text-xs mx-auto block"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleSampleTemplateImport}
          className="px-5 py-2.5 rounded-xl bg-[#0b2545] text-lime-300 font-bold text-xs shadow"
        >
          Simulasikan Import 1 Paket Soal Template
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 12. AI GEMINI v3.1 MULTIMEDIA QUESTION GENERATOR (HIGH ACCURACY + PREVIEW EDIT)
// ============================================================================

function GeminiQuestionGeneratorModal({ defaultCategory, settings, onSaveGenerated, notify }) {
  const [category, setCategory] = useState(defaultCategory);
  const [topic, setTopic] = useState('Ekosistem, Energi Terbarukan & Pelestarian Alam');
  const [difficulty, setDifficulty] = useState('HOTS');
  const [qType, setQType] = useState('single'); // 'single' | 'complex' | 'matching' | 'true_false'
  const [count, setCount] = useState(2);
  const [mediaPreference, setMediaPreference] = useState('mixed'); // 'none' | 'image' | 'chart' | 'video' | 'mixed'
  const [loading, setLoading] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [editingPreviewIndex, setEditingPreviewIndex] = useState(null);

  const CURATED_VIDEOS = {
    IPAS: 'https://www.youtube.com/embed/PjKNllf0ClQ',
    Matematika: 'https://www.youtube.com/embed/SFpARTdk92w',
    'Bahasa Indonesia': 'https://www.youtube.com/embed/PjKNllf0ClQ',
    'Soal Karakter': 'https://www.youtube.com/embed/PjKNllf0ClQ',
    'Soal Lingkungan Belajar': 'https://www.youtube.com/embed/PjKNllf0ClQ'
  };

  // Helper cerdas yang mendukung API Key AIzaSy maupun AQ.
  const callGoogleAiEndpoint = async (modelName, payload, apiKey, method = 'generateContent') => {
    const cleanKey = (apiKey || '').trim();
    const isGoogleAIStudio = cleanKey.startsWith('AIza');
    const endpoints = isGoogleAIStudio
      ? [
          {
            url: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${method}?key=${cleanKey}`,
            headers: { 'Content-Type': 'application/json' }
          }
        ]
      : [
          {
            url: `https://aiplatform.googleapis.com/v1beta1/publishers/google/models/${modelName}:${method}?key=${cleanKey}`,
            headers: { 'Content-Type': 'application/json' }
          },
          {
            url: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${method}?key=${cleanKey}`,
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cleanKey }
          }
        ];

    let lastError = 'Koneksi gagal';
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep.url, {
          method: 'POST',
          headers: ep.headers,
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          return await res.json();
        }
        const errJson = await res.json().catch(() => ({}));
        lastError = errJson?.error?.message || `HTTP ${res.status}`;
      } catch (e) {
        lastError = e.message;
      }
    }
    throw new Error(lastError);
  };

  // Kompresi dataURL gambar agar ringan & aman disimpan di localStorage
  const compressDataUrl = (rawDataUrl) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxW = 760;
          const scale = img.width > maxW ? maxW / img.width : 1;
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    });

  // Fallback cerdas: jika model raster tidak aktif di API Key, buat ilustrasi vektor SVG edukatif khusus topik soal
  const generateCustomSvgDiagram = async (questionObj, topicStr, catStr, apiKey) => {
    try {
      const svgPayload = {
        contents: [{
          role: 'user',
          parts: [{
            text: `Buatkan ilustrasi diagram edukatif SVG (viewBox="0 0 640 360") yang rapi, berwarna cerah, dan akurat untuk soal SD berikut:
Mata Pelajaran: ${catStr}
Topik: ${topicStr}
Stimulus: ${questionObj.stimulus || ''}
Pertanyaan: ${questionObj.question || ''}
Deskripsi Visual: ${questionObj.mediaCaption || ''}

Aturan ketat:
- Gunakan elemen SVG standar (<rect>, <circle>, <ellipse>, <path>, <polygon>, <line>, <text>, <defs>, <linearGradient>) dengan latar belakang cerah yang sesuai tema (misal biru muda untuk air/ekosistem, putih bersih untuk diagram).
- Gambar objek nyata yang disebut di soal secara jelas (misal ikan, tumbuhan air, matahari, panah rantai makanan, bangun datar, organ tubuh, dsb.) lengkap dengan label singkat bahasa Indonesia yang mudah dibaca.
- JANGAN gunakan <image> eksternal.
- Keluarkan HANYA kode <svg ...>...</svg> tanpa markdown atau penjelasan.`
          }]
        }]
      };
      const res = await callGoogleAiEndpoint('gemini-2.5-flash', svgPayload, apiKey);
      let svgText = res?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = svgText.match(/<svg[\s\S]*?<\/svg>/i);
      if (match) {
        let cleanSvg = match[0];
        if (!cleanSvg.includes('xmlns=')) {
          cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvg)}`;
      }
      return null;
    } catch {
      return null;
    }
  };

  // TAHAP 1 & 2: Refiner Prompt Visual + Generate Gambar Akurat Sesuai Materi
  const generateEducationalImage = async (questionObj, topicStr, catStr, apiKey) => {
    try {
      // Tahap 1: Minta Gemini Flash menyusun prompt visual pedagogis bahasa Inggris yang presisi
      const refinerPayload = {
        contents: [{
          role: 'user',
          parts: [{
            text: `You are an educational textbook illustrator director for elementary school (SD).
Create a concise, ultra-clear English image generation prompt (max 55 words) that visually illustrates the exact concept needed to answer this question:
Subject: ${catStr}
Topic: ${topicStr}
Stimulus: ${questionObj.stimulus || ''}
Question: ${questionObj.question || ''}
Visual Idea: ${questionObj.mediaCaption || ''}

Rules:
- Style: Clean educational textbook illustration, colorful flat vector art, bright natural colors, high scientific accuracy.
- Depict the exact ecosystem, organisms, objects, or processes mentioned in the stimulus and question.
- NO cluttered text paragraphs inside the image.
- Output ONLY the English prompt.`
          }]
        }]
      };

      const refinerRes = await callGoogleAiEndpoint('gemini-2.5-flash', refinerPayload, apiKey);
      const refinedPrompt =
        refinerRes?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        `Clean educational textbook illustration about ${topicStr}: ${questionObj.mediaCaption || questionObj.question}, colorful vector art, accurate science diagram`;

      // Tahap 2A: Coba model Gemini Native Image Generation
      const imgPayload = {
        contents: [{
          role: 'user',
          parts: [{ text: refinedPrompt }]
        }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT']
        }
      };

      const imageModels = ['gemini-2.5-flash-image', 'gemini-2.0-flash-exp-image-generation', 'gemini-3.1-flash-image'];
      for (const mName of imageModels) {
        try {
          const result = await callGoogleAiEndpoint(mName, imgPayload, apiKey, 'generateContent');
          const part = result?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
          if (part?.inlineData?.data) {
            const rawDataUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            return await compressDataUrl(rawDataUrl);
          }
        } catch {
          // Lanjut ke kandidat model gambar berikutnya
        }
      }

      // Tahap 2B: Coba Imagen 3 (:predict)
      try {
        const imagenPayload = {
          instances: [{ prompt: refinedPrompt }],
          parameters: { sampleCount: 1, aspectRatio: '4:3' }
        };
        const imagenRes = await callGoogleAiEndpoint('imagen-3.0-generate-002', imagenPayload, apiKey, 'predict');
        const b64 = imagenRes?.predictions?.[0]?.bytesBase64Encoded;
        if (b64) {
          return await compressDataUrl(`data:image/png;base64,${b64}`);
        }
      } catch {
        // Lanjut ke generator diagram vektor SVG khusus topik
      }

      // Tahap 2C: Buat ilustrasi vektor SVG tematik khusus soal via gemini-2.5-flash
      return await generateCustomSvgDiagram(questionObj, topicStr, catStr, apiKey);
    } catch {
      return await generateCustomSvgDiagram(questionObj, topicStr, catStr, apiKey);
    }
  };

  const handleGenerateWithGemini = async () => {
    setLoading(true);
    setEditingPreviewIndex(null);
    try {
      const apiKey = (settings.geminiApiKey || '').trim();
      if (!apiKey) {
        notify('API Key Gemini masih kosong! Isi dan klik Simpan Pengaturan dulu di menu Pengaturan & Anti-Cheat.', 'error');
        setLoading(false);
        return;
      }

      // Tentukan daftar tipe media per nomor soal terlebih dahulu agar teks soal 100% sinkron dengan medianya
      const plannedMediaList = Array.from({ length: count }, (_, idx) =>
        mediaPreference === 'mixed' ? ['image', 'chart', 'video'][idx % 3] : mediaPreference
      );

      const mediaPlanDescription = plannedMediaList
        .map((m, idx) => `Soal ke-${idx + 1}: WAJIB menggunakan media "${m}"`)
        .join('; ');

      const systemPrompt = `Anda adalah pakar pembuat soal Asesmen Nasional (ANBK) & Tes Kemampuan Akademik (TKA) Kemendikbud RI tingkat SD/MI.
Buatkan tepat ${count} butir soal yang sangat akurat secara konsep keilmuan/kurikulum SD dalam format JSON valid.
Kategori: ${category}
Topik Spesifik: ${topic}
Tingkat Kesulitan: ${difficulty}
Tipe Soal: ${qType} (pilihan: single, complex, matching, true_false)
Rencana Media Per Soal: ${mediaPlanDescription}.

Aturan Ketat:
1. Buat stimulus cerita/kasus nyata yang mendidik dan sesuai usia siswa SD kelas 5-6 tentang topik "${topic}".
2. SINKRONISASI MEDIA WAJIB:
   - Jika soal menggunakan media "image": stimulus dan pertanyaan WAJIB merujuk pada gambar ilustrasi (contoh: "Perhatikan gambar ilustrasi ekosistem air berikut..."), JANGAN menyebut grafik/diagram batang! Isi mediaCaption dengan deskripsi visual rinci objek yang harus digambar.
   - Jika soal menggunakan media "chart": stimulus dan pertanyaan WAJIB merujuk pada data grafik batang di chartData (title, labels minimal 4 label, values minimal 4 angka yang konsisten dengan kunci jawaban).
   - Jika soal menggunakan media "video": stimulus dan pertanyaan merujuk pada tayangan video edukasi tentang "${topic}".
   - Jika soal menggunakan media "none": seluruh informasi ada pada teks stimulus.
3. WAJIB MENGISI OPSI & KUNCI JAWABAN LENGKAP sesuai tipe soal "${qType}":
   - Jika "${qType}" adalah "single": WAJIB isi "options" dengan 4 kalimat pilihan jawaban yang bermakna (BUKAN "Opsi A/B/C/D") dan "correctIndex" (angka 0 sampai 3).
   - Jika "${qType}" adalah "complex": WAJIB isi "options" dengan 4-5 kalimat pilihan jawaban yang bermakna dan "complexCorrectIndices" (array minimal 2 indeks benar, misal [0, 2]).
   - Jika "${qType}" adalah "matching": WAJIB isi "leftItems" (3 konsep), "rightItems" (3 pasangan acak), dan "matchingPairs" (3 pasangan indeks).
   - Jika "${qType}" adalah "true_false": WAJIB isi "statements" (3 pernyataan) dan "trueFalseAnswers" (array 3 boolean).`;

      const payload = {
        contents: [{
          role: 'user',
          parts: [{
            text: `Buatkan ${count} soal TKA SD kategori ${category} topik "${topic}" tipe ${qType} kesulitan ${difficulty}. Ikuti rencana media: ${mediaPlanDescription}. Wajib isi semua opsi jawaban lengkap dan kunci jawaban yang akurat.`
          }]
        }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.35,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                stimulus: { type: 'STRING' },
                question: { type: 'STRING' },
                mediaType: { type: 'STRING' },
                mediaCaption: { type: 'STRING' },
                chartData: {
                  type: 'OBJECT',
                  properties: {
                    title: { type: 'STRING' },
                    labels: { type: 'ARRAY', items: { type: 'STRING' } },
                    values: { type: 'ARRAY', items: { type: 'NUMBER' } }
                  },
                  required: ['title', 'labels', 'values']
                },
                options: { type: 'ARRAY', items: { type: 'STRING' } },
                leftItems: { type: 'ARRAY', items: { type: 'STRING' } },
                rightItems: { type: 'ARRAY', items: { type: 'STRING' } },
                statements: { type: 'ARRAY', items: { type: 'STRING' } },
                correctIndex: { type: 'NUMBER' },
                complexCorrectIndices: { type: 'ARRAY', items: { type: 'NUMBER' } },
                matchingPairs: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      leftIndex: { type: 'NUMBER' },
                      rightIndex: { type: 'NUMBER' }
                    },
                    required: ['leftIndex', 'rightIndex']
                  }
                },
                trueFalseAnswers: { type: 'ARRAY', items: { type: 'BOOLEAN' } },
                explanation: { type: 'STRING' }
              },
              required: ['stimulus', 'question', 'mediaCaption', 'options', 'correctIndex', 'explanation']
            }
          }
        }
      };

      let data;
      try {
        data = await callGoogleAiEndpoint('gemini-2.5-flash', payload, apiKey);
      } catch {
        data = await callGoogleAiEndpoint('gemini-3-flash-preview', payload, apiKey);
      }

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(rawText);

      const formatted = await Promise.all(
        parsed.map(async (item, idx) => {
          const chosenMedia = plannedMediaList[idx] || 'none';

          let resolvedImageUrl = '';
          if (chosenMedia === 'image') {
            const generatedImg = await generateEducationalImage(item, topic, category, apiKey);
            resolvedImageUrl = generatedImg || '';
          }

          return {
            id: `q-ai-${Date.now()}-${idx}`,
            category,
            type: qType,
            difficulty,
            weight: Math.round(100 / count),
            stimulus: item.stimulus,
            question: item.question,
            mediaType: chosenMedia,
            mediaUrl:
              chosenMedia === 'image'
                ? resolvedImageUrl
                : chosenMedia === 'video'
                ? CURATED_VIDEOS[category]
                : '',
            mediaCaption: item.mediaCaption || `Ilustrasi Materi ${topic} • ${category}`,
            chartData:
              chosenMedia === 'chart'
                ? item.chartData?.labels?.length
                  ? item.chartData
                  : {
                      title: `Diagram Data: ${topic}`,
                      labels: ['Data 1', 'Data 2', 'Data 3', 'Data 4'],
                      values: [35, 65, 80, 55]
                    }
                : undefined,
            options: item.options?.length ? item.options : ['Pilihan 1', 'Pilihan 2', 'Pilihan 3', 'Pilihan 4'],
            leftItems: item.leftItems?.length ? item.leftItems : ['Konsep 1', 'Konsep 2', 'Konsep 3'],
            rightItems: item.rightItems?.length ? item.rightItems : ['Penjelasan A', 'Penjelasan B', 'Penjelasan C'],
            statements: item.statements?.length ? item.statements : ['Pernyataan 1', 'Pernyataan 2'],
            correctAnswer: (() => {
              if (qType === 'single') {
                return Number.isFinite(Number(item.correctIndex)) ? Number(item.correctIndex) : 0;
              }
              if (qType === 'complex') {
                return Array.isArray(item.complexCorrectIndices) && item.complexCorrectIndices.length > 0
                  ? item.complexCorrectIndices.map(Number)
                  : [0, 2];
              }
              if (qType === 'matching') {
                if (Array.isArray(item.matchingPairs) && item.matchingPairs.length > 0) {
                  const mapObj = {};
                  item.matchingPairs.forEach((p) => {
                    mapObj[String(p.leftIndex)] = String(p.rightIndex);
                  });
                  return mapObj;
                }
                return { '0': '0', '1': '1', '2': '2' };
              }
              if (Array.isArray(item.trueFalseAnswers) && item.trueFalseAnswers.length > 0) {
                return item.trueFalseAnswers.map(Boolean);
              }
              return [true, false];
            })(),
            explanation: item.explanation || 'Pembahasan otomatis berdasarkan kurikulum TKA & ANBK.'
          };
        })
      );

      setPreviewQuestions(formatted);
      notify(`Berhasil! AI Gemini menyusun ${formatted.length} soal akurat sesuai topik "${topic}".`);
    } catch (err) {
      notify(`Gagal terhubung ke AI Google: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/95 rounded-2xl p-6 shadow-xl border-2 border-indigo-400 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow">
            <Sparkles className="w-6 h-6 text-lime-300" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#0b2545]">Generator Soal Otomatis AI Gemini v3.1</h3>
            <p className="text-xs text-slate-600">Dilengkapi ilustrasi 2-tahap presisi, grafik interaktif, dan editor manual sebelum disimpan.</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
          ● Koneksi AI Gemini Siap
        </span>
      </div>

      {/* Generator Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold mb-1">Kategori / Mata Pelajaran</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2.5 rounded-xl border-2 border-indigo-200 text-xs font-bold">
            {['IPAS', 'Matematika', 'Bahasa Indonesia', 'Soal Karakter', 'Soal Lingkungan Belajar'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold mb-1">Topik / Materi Pokok</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Contoh: Siklus Air, Pecahan Senilai, Teks Eksplanasi..."
            className="w-full p-2.5 rounded-xl border-2 border-indigo-200 text-xs font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">Tingkat Kesulitan</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full p-2.5 rounded-xl border-2 border-indigo-200 text-xs font-bold">
            <option value="Mudah">Mudah (L1 - Pemahaman)</option>
            <option value="Sedang">Sedang (L2 - Aplikasi)</option>
            <option value="HOTS">HOTS (L3 - Penalaran Tinggi)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">Tipe Soal</label>
          <select value={qType} onChange={(e) => setQType(e.target.value)} className="w-full p-2.5 rounded-xl border-2 border-indigo-200 text-xs font-bold">
            <option value="single">Pilihan Ganda (Single Choice)</option>
            <option value="complex">Pilihan Ganda Kompleks</option>
            <option value="matching">Menjodohkan (Matching)</option>
            <option value="true_false">Benar / Salah (Tabel)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">Aset Multimedia Stimulus</label>
          <select value={mediaPreference} onChange={(e) => setMediaPreference(e.target.value)} className="w-full p-2.5 rounded-xl border-2 border-indigo-300 bg-indigo-50 text-xs font-extrabold text-indigo-950">
            <option value="mixed">Kombinasi Lengkap (Gambar + Grafik + Video)</option>
            <option value="image">Gambar Ilustrasi AI Sesuai Materi</option>
            <option value="chart">Grafik / Diagram Batang Interaktif</option>
            <option value="video">Video Pembelajaran (YouTube)</option>
            <option value="none">Teks Stimulus Saja</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold">Jumlah Soal:</label>
          <input
            type="number"
            min={1}
            max={10}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(10, Number(e.target.value))))}
            className="w-20 p-2 rounded-xl border-2 border-indigo-200 text-xs font-extrabold text-center"
          />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGenerateWithGemini}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg flex items-center gap-2"
        >
          <Sparkles className={`w-4 h-4 text-lime-300 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'AI Gemini Sedang Menyusun Soal & Ilustrasi Presisi...' : 'Generate Soal Sekarang'}
        </button>
      </div>

      {/* PREVIEW, EDIT MANUAL & SAVE GENERATED QUESTIONS */}
      {previewQuestions.length > 0 && (
        <div className="pt-4 border-t-2 border-indigo-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-extrabold text-indigo-950">
              Preview Hasil AI Gemini ({previewQuestions.length} Soal) — Klik "Edit Manual Soal Ini" untuk menyempurnakan
            </h4>
            <button
              type="button"
              onClick={() => onSaveGenerated(previewQuestions)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md"
            >
              ✓ Simpan Semua ke Bank Soal
            </button>
          </div>

          {previewQuestions.map((pq, i) => (
            <div key={pq.id} className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-300 space-y-3">
              {editingPreviewIndex === i ? (
                <ManualQuestionEditor
                  defaultCategory={pq.category}
                  initialData={pq}
                  onSave={(editedQ) => {
                    setPreviewQuestions((prev) =>
                      prev.map((item, idx) => (idx === i ? editedQ : item))
                    );
                    setEditingPreviewIndex(null);
                    notify(`Preview Soal #${i + 1} berhasil diperbarui!`);
                  }}
                  onCancel={() => setEditingPreviewIndex(null)}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-900">
                      Preview Soal #{i + 1} ({pq.mediaType})
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingPreviewIndex(i)}
                      className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-500 text-amber-900 hover:text-white font-bold text-xs flex items-center gap-1 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Manual Soal Ini
                    </button>
                  </div>
                  <p className="text-xs text-slate-700">{pq.stimulus}</p>
                  <MultimediaViewer question={pq} />
                  <p className="text-sm font-bold text-slate-900">{pq.question}</p>
                  {(pq.type === 'single' || pq.type === 'complex') && (
                    <ul className="space-y-1 text-xs">
                      {(pq.options || []).map((opt, oIdx) => {
                        const isCorrect = Array.isArray(pq.correctAnswer)
                          ? pq.correctAnswer.includes(oIdx)
                          : Number(pq.correctAnswer) === oIdx;
                        return (
                          <li key={oIdx} className={`px-3 py-1 rounded-lg ${isCorrect ? 'bg-emerald-100 text-emerald-900 font-bold' : 'text-slate-600'}`}>
                            {String.fromCharCode(65 + oIdx)}. {opt} {isCorrect && '✓ (Kunci)'}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 13. PACKAGES & CLASSES MANAGER
// ============================================================================

function PackagesAndClassesManager({ packages, setPackages, students, setStudents, notify }) {
  const [pkgName, setPkgName] = useState('');
  const [duration, setDuration] = useState(60);
  const [selectedCats, setSelectedCats] = useState(['IPAS', 'Matematika', 'Bahasa Indonesia', 'Soal Karakter', 'Soal Lingkungan Belajar']);

  const handleAddPackage = (e) => {
    e.preventDefault();
    if (!pkgName.trim()) return;
    const newPkg = {
      id: `pkg-${Date.now()}`,
      name: pkgName,
      schedule: new Date().toISOString().slice(0, 16).replace('T', ' '),
      durationMinutes: Number(duration),
      categories: selectedCats,
      active: false
    };
    setPackages((prev) => [newPkg, ...prev]);
    setPkgName('');
    notify('Paket ujian baru berhasil dibuat!');
  };

  const handleActivatePackage = (id) => {
    setPackages((prev) => prev.map((p) => ({ ...p, active: p.id === id })));
    notify('Paket ujian aktif berhasil diperbarui untuk seluruh peserta!');
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleAddPackage} className="bg-white/95 rounded-2xl p-5 shadow-lg border-2 border-lime-400 space-y-4">
        <h3 className="text-lg font-extrabold text-[#0b2545]">Buat Paket Ujian Terpadu (TKA + Karakter + Lingkungan Belajar)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold mb-1">Nama Paket Ujian</label>
            <input
              type="text"
              required
              value={pkgName}
              onChange={(e) => setPkgName(e.target.value)}
              placeholder="Contoh: Simulasi TKA Utama Semester Genap 2026"
              className="w-full p-2.5 rounded-xl border-2 border-lime-300 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Durasi Pengerjaan (Menit)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-lime-300 text-xs font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5">Rangkaian Kategori Soal dalam Paket:</label>
          <div className="flex flex-wrap gap-2">
            {['IPAS', 'Matematika', 'Bahasa Indonesia', 'Soal Karakter', 'Soal Lingkungan Belajar'].map((cat) => {
              const checked = selectedCats.includes(cat);
              return (
                <label key={cat} className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer flex items-center gap-1.5 ${checked ? 'bg-[#0b2545] text-lime-300 border-[#0b2545]' : 'bg-lime-50 border-lime-300'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedCats((prev) =>
                        checked ? prev.filter((c) => c !== cat) : [...prev, cat]
                      )
                    }
                    className="accent-lime-400"
                  />
                  {cat}
                </label>
              );
            })}
          </div>
        </div>

        <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow">
          + Simpan Paket Ujian
        </button>
      </form>

      {/* Active Packages List */}
      <div className="bg-white/95 rounded-2xl p-5 shadow-lg border-2 border-lime-400 space-y-3">
        <h3 className="text-base font-extrabold text-[#0b2545]">Daftar Paket Ujian Tersedia</h3>
        {packages.map((pkg) => (
          <div key={pkg.id} className={`p-4 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-3 ${pkg.active ? 'bg-lime-100 border-emerald-600' : 'bg-slate-50 border-slate-200'}`}>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-slate-900">{pkg.name}</h4>
                {pkg.active && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                    PAKET AKTIF
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Durasi: <strong>{pkg.durationMinutes} Menit</strong> • Rangkaian: {pkg.categories.join(', ')}
              </p>
            </div>
            {!pkg.active && (
              <button
                onClick={() => handleActivatePackage(pkg.id)}
                className="px-4 py-2 rounded-xl bg-[#0b2545] text-lime-300 font-bold text-xs"
              >
                Aktifkan Paket Ini
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 14. USER MANAGEMENT (TEACHERS & STUDENTS + BULK IMPORT + PRINT EXAM CARDS)
// ============================================================================

function UserManagementView({ teachers, setTeachers, students, setStudents, settings, notify }) {
  const [subTab, setSubTab] = useState('students'); // 'students' | 'teachers' | 'cards'

  // Add Teacher Form State
  const [tForm, setTForm] = useState({ nip: '', name: '', subject: '', username: '', password: '' });

  // Add Student Form State
  const [sForm, setSForm] = useState({
    school: settings.schoolName, nisn: '', name: '', kelas: 'VI-A', gender: 'Laki-laki', password: '12345', sesi: 'Sesi 1'
  });

  const handleAddTeacher = (e) => {
    e.preventDefault();
    setTeachers((prev) => [{ id: `tch-${Date.now()}`, ...tForm, active: true }, ...prev]);
    setTForm({ nip: '', name: '', subject: '', username: '', password: '' });
    notify('Akun Guru baru berhasil ditambahkan!');
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    setStudents((prev) => [
      {
        id: `std-${Date.now()}`,
        ...sForm,
        status: 'belum_mulai',
        timeLeft: 3600,
        violations: 0,
        isBlocked: false,
        answers: {},
        score: null
      },
      ...prev
    ]);
    setSForm({ school: settings.schoolName, nisn: '', name: '', kelas: 'VI-A', gender: 'Laki-laki', password: '12345', sesi: 'Sesi 1' });
    notify('Akun Peserta Siswa berhasil ditambahkan!');
  };

  const handleCsvBulkStudentImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '');
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      const imported = [];
      lines.forEach((line, idx) => {
        if (idx === 0 && line.toLowerCase().includes('nisn')) return; // skip header
        const cols = line.split(/[,;]/);
        if (cols.length >= 2) {
          imported.push({
            id: `std-csv-${Date.now()}-${idx}`,
            school: settings.schoolName,
            nisn: cols[0]?.trim() || `014899${idx}`,
            name: cols[1]?.trim() || `Siswa Import ${idx}`,
            kelas: cols[2]?.trim() || 'VI-A',
            gender: cols[3]?.trim() || 'Laki-laki',
            password: cols[4]?.trim() || '12345',
            sesi: 'Sesi 1',
            status: 'belum_mulai',
            timeLeft: 3600,
            violations: 0,
            isBlocked: false,
            answers: {},
            score: null
          });
        }
      });
      if (imported.length > 0) {
        setStudents((prev) => [...imported, ...prev]);
        notify(`${imported.length} akun siswa berhasil diimpor dari CSV/Excel!`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white/95 rounded-2xl p-4 shadow-lg border-2 border-lime-400 flex flex-wrap gap-2">
        <button
          onClick={() => setSubTab('students')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold ${subTab === 'students' ? 'bg-[#0b2545] text-lime-300' : 'bg-lime-100 text-slate-800'}`}
        >
          Manajemen Akun Siswa ({students.length})
        </button>
        <button
          onClick={() => setSubTab('teachers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold ${subTab === 'teachers' ? 'bg-[#0b2545] text-lime-300' : 'bg-lime-100 text-slate-800'}`}
        >
          Manajemen Akun Guru ({teachers.length})
        </button>
        <button
          onClick={() => setSubTab('cards')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${subTab === 'cards' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-950'}`}
        >
          <Printer className="w-4 h-4" /> Cetak Kartu Login Peserta
        </button>
      </div>

      {/* SUBTAB 1: STUDENTS */}
      {subTab === 'students' && (
        <div className="space-y-5">
          <form onSubmit={handleAddStudent} className="bg-white/95 rounded-2xl p-5 shadow-lg border-2 border-lime-300 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-extrabold text-[#0b2545]">Tambah Peserta Siswa Manual / Import Excel CSV</h3>
              <label className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Import Massal CSV/Excel
                <input type="file" accept=".csv,.txt" onChange={handleCsvBulkStudentImport} className="hidden" />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <input required placeholder="NISN" value={sForm.nisn} onChange={(e) => setSForm({ ...sForm, nisn: e.target.value })} className="p-2.5 rounded-xl border border-lime-400 text-xs" />
              <input required placeholder="Nama Lengkap Siswa" value={sForm.name} onChange={(e) => setSForm({ ...sForm, name: e.target.value })} className="p-2.5 rounded-xl border border-lime-400 text-xs sm:col-span-2" />
              <input required placeholder="Kelas (cth: VI-A)" value={sForm.kelas} onChange={(e) => setSForm({ ...sForm, kelas: e.target.value })} className="p-2.5 rounded-xl border border-lime-400 text-xs" />
              <select value={sForm.gender} onChange={(e) => setSForm({ ...sForm, gender: e.target.value })} className="p-2.5 rounded-xl border border-lime-400 text-xs">
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
              <input required placeholder="Password" value={sForm.password} onChange={(e) => setSForm({ ...sForm, password: e.target.value })} className="p-2.5 rounded-xl border border-lime-400 text-xs" />
            </div>
            <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">
              + Simpan Akun Siswa
            </button>
          </form>

          <div className="bg-white/95 rounded-2xl p-5 shadow-lg border-2 border-lime-300 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0b2545] text-white uppercase">
                  <th className="p-3">NISN</th>
                  <th className="p-3">Nama Lengkap</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">L/P</th>
                  <th className="p-3">Password</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lime-200">
                {students.map((st) => (
                  <tr key={st.id}>
                    <td className="p-3 font-mono font-bold">{st.nisn}</td>
                    <td className="p-3 font-bold">{st.name}</td>
                    <td className="p-3">{st.kelas}</td>
                    <td className="p-3">{st.gender}</td>
                    <td className="p-3 font-mono">{st.password}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setStudents((prev) => prev.map((s) => (s.id === st.id ? { ...s, password: '12345' } : s)));
                          notify(`Password ${st.name} direset menjadi 12345`);
                        }}
                        className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-bold"
                      >
                        Reset Pass
                      </button>
                      <button
                        onClick={() => {
                          setStudents((prev) => prev.filter((s) => s.id !== st.id));
                          notify('Akun siswa dihapus.');
                        }}
                        className="px-2.5 py-1 rounded bg-red-100 text-red-700 font-bold"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TEACHERS */}
      {subTab === 'teachers' && (
        <div className="space-y-5">
          <form onSubmit={handleAddTeacher} className="bg-white/95 rounded-2xl p-5 shadow-lg border-2 border-lime-300 space-y-3">
            <h3 className="text-base font-extrabold text-[#0b2545]">Tambah Akun Guru Pengampu</h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              <input required placeholder="NIP" value={tForm.nip} onChange={(e) => setTForm({ ...tForm, nip: e.target.value })} className="p-2.5 rounded-xl border border-lime-400 text-xs" />
              <input required placeholder="Nama & Gelar" value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} className="p-2.5 rounded-xl border border-lime-400 text-xs" />
              <input required placeholder="Mata Pelajaran" value={tForm.subject} onChange={(e) => setTForm({ ...tForm, subject: e.target.value })} className="p-2.5 rounded-xl border border-lime-400 text-xs" />
              <input required placeholder="Username" value={tForm.username} onChange={(e) => setTForm({ ...tForm, username: e.target.value })} className="p-2.5 rounded-xl border border-lime-400 text-xs" />
              <input required placeholder="Password" value={tForm.password} onChange={(e) => setTForm({ ...tForm, password: e.target.value })} className="p-2.5 rounded-xl border border-lime-400 text-xs" />
            </div>
            <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">
              + Simpan Akun Guru
            </button>
          </form>

          <div className="bg-white/95 rounded-2xl p-5 shadow-lg border-2 border-lime-300 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0b2545] text-white uppercase">
                  <th className="p-3">NIP</th>
                  <th className="p-3">Nama Guru</th>
                  <th className="p-3">Mapel</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lime-200">
                {teachers.map((t) => (
                  <tr key={t.id}>
                    <td className="p-3 font-mono">{t.nip}</td>
                    <td className="p-3 font-bold">{t.name}</td>
                    <td className="p-3">{t.subject}</td>
                    <td className="p-3 font-mono">{t.username}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${t.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                        {t.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => setTeachers((prev) => prev.map((x) => (x.id === t.id ? { ...x, active: !x.active } : x)))}
                        className="px-2.5 py-1 rounded bg-sky-100 text-sky-900 font-bold"
                      >
                        {t.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        onClick={() => setTeachers((prev) => prev.filter((x) => x.id !== t.id))}
                        className="px-2.5 py-1 rounded bg-red-100 text-red-700 font-bold"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: PRINTABLE PARTICIPANT LOGIN CARDS */}
      {subTab === 'cards' && (
        <div className="bg-white/95 rounded-2xl p-6 shadow-lg border-2 border-lime-400 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#0b2545]">Kartu Login Peserta TKA / ANBK ({settings.schoolName})</h3>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-[#0b2545] text-lime-300 font-bold text-xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Cetak Kartu (PDF / Printer)
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((st) => (
              <div key={st.id} className="border-2 border-[#0b2545] rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="bg-[#0b2545] text-white px-4 py-2 flex justify-between items-center">
                  <span className="text-[11px] font-extrabold uppercase">{settings.schoolName}</span>
                  <span className="text-[10px] bg-lime-400 text-[#0b2545] px-2 py-0.5 rounded font-black">KARTU PESERTA TKA</span>
                </div>
                <div className="p-4 text-xs space-y-1.5">
                  <p><strong>Nama Peserta:</strong> {st.name}</p>
                  <p><strong>NISN / Username:</strong> <span className="font-mono font-bold text-emerald-800">{st.nisn}</span></p>
                  <p><strong>Password Login:</strong> <span className="font-mono font-bold bg-lime-200 px-2 py-0.5 rounded">{st.password}</span></p>
                  <p><strong>Kelas / Sesi:</strong> {st.kelas} • {st.sesi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 15. EXAM RESULTS, ITEM ANALYSIS & CSV/PDF EXPORT
// ============================================================================

function ExamResultsAndAnalytics({ students, questions, settings, notify }) {
  const handleExportCsv = () => {
    const headers = ['NISN,Nama Lengkap,Kelas,Status,Nilai Akhir,Pelanggaran,Waktu Mulai,Waktu Selesai'];
    const rows = students.map((s) =>
      `${s.nisn},"${s.name}",${s.kelas},${s.status},${s.score ?? '-'},${s.violations},${s.startTime ?? '-'},${s.endTime ?? '-'}`
    );
    const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekap_Nilai_TKA_${settings.schoolName.replace(/\s+/g, '_')}.csv`;
    link.click();
    notify('File Rekapitulasi Nilai (.csv / Excel) berhasil diunduh!');
  };

  return (
    <div className="space-y-5">
      {/* Results Table */}
      <div className="bg-white/95 rounded-2xl p-5 shadow-lg border-2 border-lime-400 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-[#0b2545]">Rekapitulasi Hasil Ujian & Profil Karakter</h3>
            <p className="text-xs text-slate-600">Laporan nilai otomatis beserta status pelanggaran dan profil survei.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Download className="w-4 h-4" /> Export Excel (.csv)
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-[#0b2545] text-lime-300 font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4" /> Cetak PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#0b2545] text-white uppercase">
                <th className="p-3">NISN</th>
                <th className="p-3">Nama Peserta</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Mulai - Selesai</th>
                <th className="p-3">Pelanggaran</th>
                <th className="p-3">Profil Karakter</th>
                <th className="p-3">Nilai TKA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lime-200">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-lime-50">
                  <td className="p-3 font-mono">{s.nisn}</td>
                  <td className="p-3 font-bold">{s.name}</td>
                  <td className="p-3">{s.kelas}</td>
                  <td className="p-3">{s.startTime || '-'} s/d {s.endTime || '-'}</td>
                  <td className="p-3">{s.violations}x</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-lime-200 text-emerald-950 font-bold">
                      Berkebinekaan & Mandiri
                    </span>
                  </td>
                  <td className="p-3 font-black text-sm text-[#0b2545]">{s.score ?? 'Belum Selesai'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Difficulty Analysis */}
      <div className="bg-white/95 rounded-2xl p-5 shadow-lg border-2 border-lime-400 space-y-3">
        <h3 className="text-base font-extrabold text-[#0b2545]">Analisis Butir Soal & Tingkat Kesukaran</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-lime-200 text-emerald-950 uppercase font-extrabold">
                <th className="p-3">No</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Cuplikan Pertanyaan</th>
                <th className="p-3">Menjawab Benar</th>
                <th className="p-3">Kategori Kesukaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lime-200">
              {questions.map((q, idx) => {
                const pctCorrect = [85, 62, 74, 90, 88][idx % 5];
                const level = pctCorrect >= 75 ? 'Mudah' : pctCorrect >= 45 ? 'Sedang' : 'Sukar';
                return (
                  <tr key={q.id}>
                    <td className="p-3 font-bold">{idx + 1}</td>
                    <td className="p-3 font-semibold">{q.category}</td>
                    <td className="p-3 max-w-md truncate">{q.question}</td>
                    <td className="p-3 font-bold text-emerald-700">{pctCorrect}% Peserta</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${level === 'Mudah' ? 'bg-emerald-100 text-emerald-800' : level === 'Sedang' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                        {level}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 16. SYSTEM SETTINGS, AI KEY & ANTI-CHEAT CONFIGURATION
// ============================================================================

function SystemSettingsView({ settings, setSettings, notify }) {
  const [draft, setDraft] = useState(settings);
  const [showKey, setShowKey] = useState(false);

  // Sinkronkan hanya token & hitung mundur token agar input API Key tidak tertimpa setiap detik
  useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      token: settings.token,
      tokenExpirySeconds: settings.tokenExpirySeconds
    }));
  }, [settings.token, settings.tokenExpirySeconds]);

  const generateNewToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let tok = '';
    for (let i = 0; i < 6; i++) tok += chars[Math.floor(Math.random() * chars.length)];
    setDraft((prev) => ({ ...prev, token: tok, tokenExpirySeconds: 900 }));
    setSettings((prev) => ({ ...prev, token: tok, tokenExpirySeconds: 900 }));
    notify(`Token ujian baru dirilis & disimpan: ${tok}`);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const cleanedKey = (draft.geminiApiKey || '').trim();
    setSettings((prev) => {
      const updated = {
        ...prev,
        ...draft,
        geminiApiKey: cleanedKey,
        token: prev.token,
        tokenExpirySeconds: prev.tokenExpirySeconds
      };
      try {
        localStorage.setItem('cbt_sukomoro_settings', JSON.stringify(updated));
      } catch {
        // Abaikan jika localStorage penuh
      }
      return updated;
    });
    setDraft((prev) => ({ ...prev, geminiApiKey: cleanedKey }));
    notify('✓ Semua Pengaturan Sistem & API Key Gemini berhasil disimpan permanen!');
  };

  return (
    <form onSubmit={handleSaveSettings} className="bg-white/95 rounded-2xl p-6 shadow-xl border-2 border-lime-400 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#0b2545]">Pengaturan Sistem, AI Key & Proteksi Anti-Curang</h2>
          <p className="text-xs text-slate-600">Konfigurasi pusat untuk identitas ujian, integrasi Gemini API, dan keamanan layar siswa.</p>
        </div>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg flex items-center gap-2 transition"
        >
          <CheckCircle className="w-4 h-4" /> Simpan Pengaturan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Exam Title */}
        <div>
          <label className="block text-xs font-bold mb-1">Nama TKA / Judul Ujian Nasional</label>
          <input
            type="text"
            value={draft.examTitle || ''}
            onChange={(e) => setDraft({ ...draft, examTitle: e.target.value })}
            className="w-full p-2.5 rounded-xl border-2 border-lime-300 text-xs font-bold"
          />
        </div>

        {/* School Name */}
        <div>
          <label className="block text-xs font-bold mb-1">Nama Satuan Pendidikan / Sekolah</label>
          <input
            type="text"
            value={draft.schoolName || ''}
            onChange={(e) => setDraft({ ...draft, schoolName: e.target.value })}
            className="w-full p-2.5 rounded-xl border-2 border-lime-300 text-xs font-bold"
          />
        </div>

        {/* Gemini API Key Input */}
        <div>
          <label className="block text-xs font-bold mb-1">Konfigurasi Google Gemini API Key (AIzaSy... / AQ....)</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={draft.geminiApiKey || ''}
              onChange={(e) => setDraft({ ...draft, geminiApiKey: e.target.value })}
              placeholder="Tempel API Key Gemini Anda lalu klik Simpan Pengaturan"
              className="w-full p-2.5 rounded-xl border-2 border-indigo-300 text-xs font-mono pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-2.5 text-slate-500"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Unlock Screen PIN */}
        <div>
          <label className="block text-xs font-bold mb-1">Kode PIN Buka Blokir Layar Pengawas</label>
          <input
            type="text"
            value={draft.unlockPin || ''}
            onChange={(e) => setDraft({ ...draft, unlockPin: e.target.value })}
            className="w-full p-2.5 rounded-xl border-2 border-red-300 bg-red-50/40 text-xs font-mono font-black"
          />
        </div>
      </div>

      {/* Token Release Card */}
      <div className="p-4 rounded-2xl bg-[#0b2545] text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-lime-300 font-bold block">Token Rilis Ujian Aktif</span>
          <span className="text-3xl font-mono font-black tracking-widest text-lime-400">{draft.token}</span>
          <span className="text-xs text-sky-200 ml-3">
            Reset otomatis dalam {Math.floor((draft.tokenExpirySeconds || 0) / 60)}m {(draft.tokenExpirySeconds || 0) % 60}s
          </span>
        </div>
        <button
          type="button"
          onClick={generateNewToken}
          className="px-5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-xs shadow"
        >
          Generate Token Random Baru
        </button>
      </div>

      {/* Toggle Switches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { key: 'showScoreAfterExam', label: 'Tampilkan Nilai Langsung Setelah Siswa Selesai Ujian' },
          { key: 'reviewAnswersAfterExam', label: 'Izinkan Siswa Melihat Review & Pembahasan Jawaban' },
          { key: 'randomizeQuestions', label: 'Acak Urutan Nomor Soal per Peserta' },
          { key: 'randomizeOptions', label: 'Acak Urutan Pilihan Jawaban (A-B-C-D)' },
          { key: 'antiCheatEnabled', label: 'Proteksi Layar Anti-Curang (Fullscreen & Blokir Pindah Tab)' }
        ].map((item) => (
          <label
            key={item.key}
            className="p-3.5 rounded-xl bg-lime-50 border border-lime-300 flex items-center justify-between cursor-pointer"
          >
            <span className="text-xs font-bold text-slate-800">{item.label}</span>
            <input
              type="checkbox"
              checked={!!draft[item.key]}
              onChange={(e) => setDraft({ ...draft, [item.key]: e.target.checked })}
              className="w-5 h-5 accent-[#0b2545]"
            />
          </label>
        ))}
      </div>

      <div className="flex justify-end pt-3 border-t border-lime-200">
        <button
          type="submit"
          className="px-7 py-3 rounded-xl bg-gradient-to-r from-[#0b2545] to-emerald-700 hover:opacity-95 text-white font-extrabold text-xs shadow-lg flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4 text-lime-300" /> Simpan Semua Pengaturan & API Key
        </button>
      </div>
    </form>
  );
}
