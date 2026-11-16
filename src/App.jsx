import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Users,
  ShieldAlert,
  Settings,
  Plus,
  Trash2,
  Play,
  CheckCircle,
  Clock,
  Sparkles,
  LogOut,
  Award,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Eye,
  Save,
  AlertTriangle,
  Upload,
  X
} from 'lucide-react';

// --- KONFIGURASI DEFAULT ---
const DEFAULT_ADMIN = {
  username: 'Sedarisua',
  password: 'sedarisua02!',
};

const INITIAL_SETTINGS = {
  schoolName: 'SD Negeri Unggulan Nusantara',
  geminiApiKey: '',
  antiCheatEnabled: true,
  maxTabSwitches: 3,
  autoSubmitOnViolation: true,
};

const SAMPLE_EXAMS = [
  {
    id: 'exam-ipas-1',
    title: 'Penilaian Harian IPAS - Sistem Pernapasan Manusia',
    subject: 'IPAS',
    grade: 'Kelas 5 SD',
    durationMinutes: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-1',
        text: 'Perhatikan gambar organ pernapasan manusia berikut! Bagian yang ditunjuk oleh label Alveolus berfungsi sebagai tempat...',
        svgDiagram: `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <rect width="400" height="260" rx="16" fill="#f0f9ff"/>
          <path d="M192 25 L208 25 L208 85 L245 115 L235 126 L200 96 L165 126 L155 115 L192 85 Z" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
          <path d="M165 100 C115 105, 95 165, 110 215 C135 225, 175 215, 185 190 L185 115 Z" fill="#fda4af" stroke="#e11d48" stroke-width="2.5"/>
          <path d="M235 100 C285 105, 305 165, 290 215 C265 225, 225 215, 215 190 L215 115 Z" fill="#fda4af" stroke="#e11d48" stroke-width="2.5"/>
          <circle cx="145" cy="175" r="14" fill="#ffe4e6" stroke="#be123c" stroke-width="2"/>
          <circle cx="135" cy="168" r="5" fill="#fb7185"/>
          <circle cx="152" cy="170" r="5" fill="#fb7185"/>
          <circle cx="144" cy="182" r="5" fill="#fb7185"/>
          <line x1="208" y1="50" x2="295" y2="50" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="3,3"/>
          <text x="300" y="54" font-size="12" font-weight="bold" fill="#0f172a">Trakea</text>
          <line x1="230" y1="112" x2="295" y2="95" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="3,3"/>
          <text x="300" y="99" font-size="12" font-weight="bold" fill="#0f172a">Bronkus</text>
          <line x1="131" y1="175" x2="72" y2="175" stroke="#be123c" stroke-width="2"/>
          <text x="14" y="179" font-size="12" font-weight="bold" fill="#be123c">Alveolus</text>
          <path d="M100 225 Q200 205 300 225" fill="none" stroke="#0284c7" stroke-width="4" stroke-linecap="round"/>
          <text x="168" y="246" font-size="12" font-weight="bold" fill="#0369a1">Diafragma</text>
        </svg>`,
        imageUrl: '',
        options: [
          'Menyaring debu dan kotoran yang masuk bersama udara',
          'Pertukaran gas oksigen (O2) dan karbon dioksida (CO2)',
          'Menyesuaikan suhu dan kelembapan udara pernapasan',
          'Menghubungkan rongga hidung dengan batang tenggorokan',
        ],
        correctIndex: 1,
        explanation: 'Alveolus adalah gelembung-gelembung halus di dalam paru-paru yang dikelilingi kapiler darah sebagai tempat pertukaran O2 dan CO2.',
      },
    ],
  },
];

// --- HELPER: SANITASI SVG DARI GEMINI ---
function sanitizeSvg(rawSvg) {
  if (!rawSvg || typeof rawSvg !== 'string') return '';
  const match = rawSvg.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) return '';
  let clean = match[0]
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
  if (!clean.includes('viewBox')) {
    clean = clean.replace('<svg', '<svg viewBox="0 0 400 260"');
  }
  return clean;
}

// --- HELPER: PENCARIAN GAMBAR AKURAT DI WIKIMEDIA COMMONS ---
async function fetchWikimediaImage(englishQuery) {
  if (!englishQuery || englishQuery.trim().length < 3) return '';
  try {
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      `filetype:bitmap|drawing ${englishQuery}`
    )}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|mime&iiurlwidth=640&format=json&origin=*`;

    const res = await fetch(endpoint);
    if (!res.ok) return '';
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return '';

    const pageList = Object.values(pages);
    for (const page of pageList) {
      const info = page?.imageinfo?.[0];
      const titleLower = (page?.title || '').toLowerCase();
      // Tolak file ikon/bendera/logo tidak relevan
      if (
        titleLower.includes('icon') ||
        titleLower.includes('logo') ||
        titleLower.includes('flag') ||
        titleLower.includes('symbol')
      ) {
        continue;
      }
      if (info?.thumburl) return info.thumburl;
      if (info?.url && /\.(jpg|jpeg|png|svg)$/i.test(info.url)) return info.url;
    }
    return '';
  } catch {
    return '';
  }
}

export default function App() {
  // --- STATE UTAMA ---
  const [role, setRole] = useState('landing'); // 'landing' | 'admin-login' | 'admin' | 'student-exam' | 'student-result'
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('cbt_settings_v5');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });
  const [exams, setExams] = useState(() => {
    const saved = localStorage.getItem('cbt_exams_v5');
    return saved ? JSON.parse(saved) : SAMPLE_EXAMS;
  });
  const [results, setResults] = useState(() => {
    const saved = localStorage.getItem('cbt_results_v5');
    return saved ? JSON.parse(saved) : [];
  });

  // Simpan otomatis ke localStorage
  useEffect(() => {
    localStorage.setItem('cbt_settings_v5', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('cbt_exams_v5', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('cbt_results_v5', JSON.stringify(results));
  }, [results]);

  // --- STATE LOGIN ADMIN ---
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- STATE ADMIN PANEL ---
  const [adminTab, setAdminTab] = useState('generator'); // 'generator' | 'bank' | 'results' | 'settings'
  const [aiTopic, setAiTopic] = useState('Sistem Pernapasan Manusia');
  const [aiSubject, setAiSubject] = useState('IPAS');
  const [aiGrade, setAiGrade] = useState('Kelas 5 SD');
  const [aiCount, setAiCount] = useState(5);
  const [aiImageMode, setAiImageMode] = useState('svg-diagram'); // 'svg-diagram' | 'wikimedia' | 'none'
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDuration, setDraftDuration] = useState(30);
  const [draftQuestions, setDraftQuestions] = useState([]);

  // --- STATE SISWA ---
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [activeExam, setActiveExam] = useState(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [lastResult, setLastResult] = useState(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  // --- HANDLER LOGIN ADMIN ---
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminUser === DEFAULT_ADMIN.username && adminPass === DEFAULT_ADMIN.password) {
      setLoginError('');
      setRole('admin');
    } else {
      setLoginError('Username atau password Administrator salah.');
    }
  };

  // --- GENERATOR SOAL & DIAGRAM PRESISI DENGAN GEMINI ---
  const handleGenerateQuestions = async (e) => {
    e.preventDefault();
    if (!settings.geminiApiKey.trim()) {
      alert('Masukkan API Key Gemini terlebih dahulu di menu Pengaturan & Anti-Cheat.');
      setAdminTab('settings');
      return;
    }

    setIsGenerating(true);
    setGenStatus('Menyusun soal tervalidasi dan ilustrasi materi dengan Gemini...');

    const prompt = `Kamu adalah guru SD profesional pembuat soal CBT. Buatlah tepat ${aiCount} soal pilihan ganda untuk:
- Mata Pelajaran: ${aiSubject}
- Jenjang: ${aiGrade}
- Topik/Materi: ${aiTopic}

ATURAN KETAT PEMBUATAN SOAL & GAMBAR:
1. Bahasa Indonesia yang baku, jelas, ramah siswa SD, tidak ambigu, dan tepat memiliki 1 jawaban paling benar.
2. Mode Gambar diminta: "${aiImageMode}".
   - Jika mode = "svg-diagram": Buat kode ilustrasi edukasi SVG yang sangat jelas, rapi, dan relevan langsung dengan pertanyaan pada field "svgDiagram" (gunakan viewBox="0 0 400 260", bentuk geometris jelas seperti paru-paru/organ/rangkaian/bangun datar/planet dengan warna cerah dan label teks bahasa Indonesia singkat yang mudah dibaca, tanpa tag <script>). Jika soal berupa teks murni yang tidak butuh ilustrasi, isi "svgDiagram": "".
   - Jika mode = "wikimedia": Isi "svgDiagram": "", dan isi "wikimediaSearchQuery" dengan 2-4 kata kunci ilmiah bahasa Inggris yang sangat spesifik untuk mencari diagram/foto ensiklopedia di Wikimedia Commons (contoh: "Human respiratory system diagram" atau "Photosynthesis diagram", JANGAN kata umum tunggal).
   - Jika mode = "none": Isi "svgDiagram": "" dan "wikimediaSearchQuery": "".
3. Keluarkan HANYA JSON valid berbentuk array objek tanpa markdown backticks, dengan struktur persis:
[
  {
    "text": "Teks pertanyaan lengkap...",
    "svgDiagram": "<svg viewBox=\\"0 0 400 260\\" xmlns=\\"http://www.w3.org/2000/svg\\">...</svg>",
    "wikimediaSearchQuery": "Human respiratory system",
    "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
    "correctIndex": 0,
    "explanation": "Pembahasan singkat mengapa jawaban tersebut benar."
  }
]`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          settings.geminiApiKey.trim()
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.35,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `HTTP Error ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const cleanedJson = rawText.replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(cleanedJson);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Format soal yang dikembalikan AI kosong.');
      }

      setGenStatus('Memvalidasi dan memuat visualisasi gambar tiap soal...');

      const processedQuestions = await Promise.all(
        parsed.map(async (item, index) => {
          let svgDiagram = '';
          let imageUrl = '';

          if (aiImageMode === 'svg-diagram' && item.svgDiagram) {
            svgDiagram = sanitizeSvg(item.svgDiagram);
          } else if (aiImageMode === 'wikimedia' && item.wikimediaSearchQuery) {
            imageUrl = await fetchWikimediaImage(item.wikimediaSearchQuery);
          }

          return {
            id: `q-${Date.now()}-${index}`,
            text: item.text || `Pertanyaan nomor ${index + 1}`,
            svgDiagram,
            imageUrl,
            options:
              Array.isArray(item.options) && item.options.length === 4
                ? item.options
                : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
            correctIndex:
              typeof item.correctIndex === 'number' && item.correctIndex >= 0 && item.correctIndex <= 3
                ? item.correctIndex
                : 0,
            explanation: item.explanation || '',
          };
        })
      );

      setDraftTitle(`Ujian ${aiSubject} - ${aiTopic}`);
      setDraftQuestions(processedQuestions);
      setGenStatus('');
    } catch (err) {
      alert(`Gagal membuat soal AI: ${err.message}`);
      setGenStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- UPLOAD GAMBAR MANUAL PER SOAL ---
  const handleManualImageUpload = (qId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDraftQuestions((prev) =>
        prev.map((q) =>
          q.id === qId ? { ...q, imageUrl: ev.target.result, svgDiagram: '' } : q
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQuestionMedia = (qId) => {
    setDraftQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, imageUrl: '', svgDiagram: '' } : q))
    );
  };

  const handleSaveExamPackage = () => {
    if (!draftTitle.trim() || draftQuestions.length === 0) {
      alert('Judul ujian dan minimal 1 soal harus tersedia.');
      return;
    }

    const newExam = {
      id: `exam-${Date.now()}`,
      title: draftTitle.trim(),
      subject: aiSubject,
      grade: aiGrade,
      durationMinutes: Number(draftDuration) || 30,
      isActive: true,
      createdAt: new Date().toISOString(),
      questions: draftQuestions,
    };

    setExams((prev) => [newExam, ...prev]);
    setDraftQuestions([]);
    setDraftTitle('');
    setAdminTab('bank');
    alert('Paket soal berhasil disimpan dan langsung aktif untuk siswa!');
  };

  // --- LOGIKA UJIAN SISWA & ANTI-CHEAT ---
  const startStudentExam = (e) => {
    e.preventDefault();
    const chosen = exams.find((ex) => ex.id === selectedExamId && ex.isActive);
    if (!chosen) {
      alert('Pilih paket ujian yang tersedia terlebih dahulu.');
      return;
    }
    setActiveExam(chosen);
    setCurrentQIdx(0);
    setAnswers({});
    setTabWarnings(0);
    setTimeLeft(chosen.durationMinutes * 60);
    setRole('student-exam');
  };

  const finishStudentExam = (reason = 'Selesai dikerjakan') => {
    if (!activeExam) return;
    const currentAnswers = answersRef.current;
    let correctCount = 0;

    activeExam.questions.forEach((q) => {
      if (currentAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const total = activeExam.questions.length;
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    const record = {
      id: `res-${Date.now()}`,
      studentName: studentName.trim(),
      studentClass: studentClass.trim(),
      examTitle: activeExam.title,
      subject: activeExam.subject,
      score,
      correctCount,
      totalQuestions: total,
      status: reason,
      submittedAt: new Date().toLocaleString('id-ID'),
    };

    setResults((prev) => [record, ...prev]);
    setLastResult(record);
    setActiveExam(null);
    setRole('student-result');
  };

  // Timer Ujian
  useEffect(() => {
    if (role !== 'student-exam' || !activeExam) return;
    if (timeLeft <= 0) {
      finishStudentExam('Waktu Habis');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [role, activeExam, timeLeft]);

  // Anti-Cheat Deteksi Pindah Tab
  useEffect(() => {
    if (role !== 'student-exam' || !settings.antiCheatEnabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabWarnings((prev) => {
          const next = prev + 1;
          if (settings.autoSubmitOnViolation && next >= settings.maxTabSwitches) {
            finishStudentExam(`Diskualifikasi Otomatis (${next}x pindah tab)`);
          }
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [role, settings]);

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // =========================================================================
  // RENDER 1: HALAMAN DEPAN (MASUK SISWA & AKSES ADMIN)
  // =========================================================================
  if (role === 'landing') {
    const activeExams = exams.filter((ex) => ex.isActive);
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 flex flex-col">
        <header className="bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight">{settings.schoolName}</h1>
              <p className="text-xs text-slate-500">Sistem Ujian Berbasis Komputer (CBT) SD</p>
            </div>
          </div>
          <button
            onClick={() => setRole('admin-login')}
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition flex items-center gap-1.5"
          >
            <ShieldAlert className="w-4 h-4" />
            Portal Guru / Admin
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
                RUANG UJIAN SISWA
              </span>
              <h2 className="text-2xl font-bold text-slate-800">Mulai Mengerjakan Ujian</h2>
              <p className="text-sm text-slate-500 mt-1">Isi biodata dan pilih mata pelajaran yang diujikan</p>
            </div>

            <form onSubmit={startStudentExam} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Rizki Pratama"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Kelas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 5A"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Pilih Paket Ujian</label>
                <select
                  required
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Pilih Mata Pelajaran / Paket Soal --</option>
                  {activeExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.questions.length} Soal • {ex.durationMinutes} Menit)
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition flex items-center justify-center gap-2 mt-2"
              >
                <Play className="w-5 h-5" />
                Masuk & Mulai Ujian
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // RENDER 2: LOGIN ADMIN
  // =========================================================================
  if (role === 'admin-login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-800 text-center">Login Administrator</h2>
          <p className="text-xs text-slate-500 text-center mt-1 mb-6">Kelola bank soal AI, pengaturan ujian, & nilai siswa</p>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Username</label>
              <input
                type="text"
                required
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password</label>
              <input
                type="password"
                required
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
            >
              Masuk Dashboard
            </button>
            <button
              type="button"
              onClick={() => setRole('landing')}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-800"
            >
              ← Kembali ke Halaman Siswa
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER 3: DASHBOARD ADMIN
  // =========================================================================
  if (role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <div>
              <h1 className="font-bold text-base sm:text-lg">Dashboard Admin CBT • {settings.schoolName}</h1>
              <p className="text-xs text-slate-400">Generator Soal AI dengan Diagram Edukasi Presisi</p>
            </div>
          </div>
          <button
            onClick={() => setRole('landing')}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Keluar ke Ruang Siswa
          </button>
        </header>

        {/* Navigasi Tab Admin */}
        <div className="bg-white border-b border-slate-200 px-6 flex gap-2 overflow-x-auto">
          {[
            { id: 'generator', label: 'Buat Soal AI (Presisi)', icon: Sparkles },
            { id: 'bank', label: `Bank Paket Ujian (${exams.length})`, icon: FileText },
            { id: 'results', label: `Rekap Nilai (${results.length})`, icon: Award },
            { id: 'settings', label: 'Pengaturan & Anti-Cheat', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`py-3.5 px-4 text-sm font-semibold border-b-2 whitespace-nowrap flex items-center gap-2 transition ${
                  adminTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
          {/* TAB 1: GENERATOR SOAL AI */}
          {adminTab === 'generator' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-1">Generator Soal & Visual Materi Otomatis</h2>
                <p className="text-xs text-slate-500 mb-5">
                  Pilih mode <strong>Diagram Edukasi SVG</strong> untuk materi sains/anatomi/matematika agar ilustrasi digambar langsung sesuai organ atau konsep soal.
                </p>

                <form onSubmit={handleGenerateQuestions} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
                    <input
                      type="text"
                      required
                      value={aiSubject}
                      onChange={(e) => setAiSubject(e.target.value)}
                      placeholder="Contoh: IPAS, Matematika, Bahasa Indonesia"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas / Jenjang</label>
                    <input
                      type="text"
                      required
                      value={aiGrade}
                      onChange={(e) => setAiGrade(e.target.value)}
                      placeholder="Contoh: Kelas 5 SD"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Topik / Materi Spesifik</label>
                    <input
                      type="text"
                      required
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="Contoh: Sistem Pernapasan Manusia, Rantai Makanan, Bangun Ruang"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Soal</label>
                    <select
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      {[3, 5, 10, 15, 20].map((n) => (
                        <option key={n} value={n}>
                          {n} Butir Soal
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mode Gambar / Ilustrasi Soal</label>
                    <select
                      value={aiImageMode}
                      onChange={(e) => setAiImageMode(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="svg-diagram">Diagram Edukasi SVG (Akurat untuk IPAS/IPA/MTK)</option>
                      <option value="wikimedia">Foto/Diagram Ensiklopedia (Wikimedia Commons)</option>
                      <option value="none">Tanpa Gambar (Teks Saja)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          {genStatus || 'Memproses...'}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Soal & Gambar Materi
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* PREVIEW & EDIT HASIL GENERATE SEBELUM SIMPAN */}
              {draftQuestions.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-indigo-200 p-6 space-y-5">
                  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex-1 min-w-[240px]">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Judul Paket Ujian</label>
                      <input
                        type="text"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800"
                      />
                    </div>
                    <div className="w-36">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Durasi (Menit)</label>
                      <input
                        type="number"
                        min={5}
                        max={180}
                        value={draftDuration}
                        onChange={(e) => setDraftDuration(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <button
                      onClick={handleSaveExamPackage}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center gap-2 shadow"
                    >
                      <Save className="w-4 h-4" />
                      Simpan ke Bank Ujian
                    </button>
                  </div>

                  <div className="space-y-4">
                    {draftQuestions.map((q, idx) => (
                      <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold">
                            Soal #{idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                              <Upload className="w-3.5 h-3.5" />
                              Ganti Foto Manual
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleManualImageUpload(q.id, e.target.files?.[0])}
                              />
                            </label>
                            {(q.svgDiagram || q.imageUrl) && (
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestionMedia(q.id)}
                                className="text-xs text-rose-600 hover:text-rose-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                Hapus Gambar
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Tampilan Diagram SVG atau Gambar Wikimedia/Manual */}
                        {q.svgDiagram && (
                          <div className="max-w-md mx-auto bg-white p-3 rounded-xl border border-slate-200 shadow-inner">
                            <div
                              className="w-full max-h-60 flex items-center justify-center"
                              dangerouslySetInnerHTML={{ __html: q.svgDiagram }}
                            />
                            <p className="text-[11px] text-center text-slate-400 mt-1">
                              Diagram Edukasi SVG Otomatis
                            </p>
                          </div>
                        )}

                        {!q.svgDiagram && q.imageUrl && (
                          <div className="max-w-md mx-auto bg-white p-3 rounded-xl border border-slate-200">
                            <img
                              src={q.imageUrl}
                              alt={`Ilustrasi soal ${idx + 1}`}
                              className="max-h-56 mx-auto rounded-lg object-contain"
                            />
                          </div>
                        )}

                        <textarea
                          rows={2}
                          value={q.text}
                          onChange={(e) =>
                            setDraftQuestions((prev) =>
                              prev.map((item) =>
                                item.id === q.id ? { ...item, text: e.target.value } : item
                              )
                            )
                          }
                          className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${
                                q.correctIndex === optIdx
                                  ? 'bg-emerald-50 border-emerald-400 font-medium'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correctIndex === optIdx}
                                onChange={() =>
                                  setDraftQuestions((prev) =>
                                    prev.map((item) =>
                                      item.id === q.id ? { ...item, correctIndex: optIdx } : item
                                    )
                                  )
                                }
                              />
                              <span className="font-bold text-slate-500">{String.fromCharCode(65 + optIdx)}.</span>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) =>
                                  setDraftQuestions((prev) =>
                                    prev.map((item) => {
                                      if (item.id !== q.id) return item;
                                      const nextOpts = [...item.options];
                                      nextOpts[optIdx] = e.target.value;
                                      return { ...item, options: nextOpts };
                                    })
                                  )
                                }
                                className="flex-1 bg-transparent outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BANK PAKET UJIAN */}
          {adminTab === 'bank' && (
            <div className="space-y-4">
              {exams.map((ex) => (
                <div
                  key={ex.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                        {ex.subject} • {ex.grade}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          ex.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {ex.isActive ? 'Aktif (Publik untuk Siswa)' : 'Nonaktif'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mt-1">{ex.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ex.questions.length} Soal • Durasi {ex.durationMinutes} Menit
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setExams((prev) =>
                          prev.map((item) =>
                            item.id === ex.id ? { ...item, isActive: !item.isActive } : item
                          )
                        )
                      }
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50"
                    >
                      {ex.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Hapus paket ujian ini?')) {
                          setExams((prev) => prev.filter((item) => item.id !== ex.id));
                        }
                      }}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: REKAP NILAI */}
          {adminTab === 'results' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-bold text-slate-800">Hasil Pengerjaan Siswa</h2>
                {results.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Hapus seluruh riwayat nilai?')) setResults([]);
                    }}
                    className="text-xs text-rose-600 font-semibold hover:underline"
                  >
                    Bersihkan Data
                  </button>
                )}
              </div>
              {results.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">Belum ada siswa yang menyelesaikan ujian.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3">Nama Siswa</th>
                        <th className="px-4 py-3">Kelas</th>
                        <th className="px-4 py-3">Paket Ujian</th>
                        <th className="px-4 py-3">Benar</th>
                        <th className="px-4 py-3">Nilai</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-3 font-semibold text-slate-800">{r.studentName}</td>
                          <td className="px-4 py-3">{r.studentClass}</td>
                          <td className="px-4 py-3 text-xs">{r.examTitle}</td>
                          <td className="px-4 py-3">
                            {r.correctCount}/{r.totalQuestions}
                          </td>
                          <td className="px-4 py-3 font-bold text-indigo-600">{r.score}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PENGATURAN & ANTI-CHEAT */}
          {adminTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-xl space-y-4">
              <h2 className="font-bold text-slate-800 text-lg">Pengaturan Aplikasi & API Key</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Sekolah</label>
                <input
                  type="text"
                  value={settings.schoolName}
                  onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">API Key Google Gemini</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={settings.geminiApiKey}
                  onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Digunakan untuk membuat soal pilihan ganda tervalidasi dan diagram SVG materi.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.antiCheatEnabled}
                    onChange={(e) => setSettings({ ...settings, antiCheatEnabled: e.target.checked })}
                  />
                  Aktifkan Pengawas Anti-Cheat (Deteksi Pindah Tab/Aplikasi)
                </label>

                {settings.antiCheatEnabled && (
                  <div className="pl-6 space-y-2">
                    <label className="block text-xs font-semibold text-slate-600">
                      Batas Maksimal Peringatan Pindah Tab
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={settings.maxTabSwitches}
                      onChange={(e) =>
                        setSettings({ ...settings, maxTabSwitches: Number(e.target.value) || 3 })
                      }
                      className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  Pengaturan tersimpan otomatis di browser ini
                </span>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // =========================================================================
  // RENDER 4: RUANG PENGERJAAN UJIAN SISWA
  // =========================================================================
  if (role === 'student-exam' && activeExam) {
    const q = activeExam.questions[currentQIdx];
    const totalQ = activeExam.questions.length;

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col select-none">
        {/* Bar Atas Ujian */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="font-bold text-slate-800 text-sm sm:text-base line-clamp-1">{activeExam.title}</h1>
            <p className="text-xs text-slate-500">
              Siswa: <strong>{studentName}</strong> ({studentClass})
            </p>
          </div>

          <div className="flex items-center gap-3">
            {settings.antiCheatEnabled && tabWarnings > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Peringatan: {tabWarnings}/{settings.maxTabSwitches}
              </span>
            )}
            <div className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-mono font-bold text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {formatSeconds(timeLeft)}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Area Soal */}
          <div className="md:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                  Soal Nomor {currentQIdx + 1} dari {totalQ}
                </span>
              </div>

              {/* Render Diagram SVG atau Foto Soal */}
              {q.svgDiagram && (
                <div className="max-w-md mx-auto bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div
                    className="w-full max-h-64 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: q.svgDiagram }}
                  />
                </div>
              )}

              {!q.svgDiagram && q.imageUrl && (
                <div className="max-w-md mx-auto bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <img
                    src={q.imageUrl}
                    alt={`Gambar soal ${currentQIdx + 1}`}
                    className="max-h-60 mx-auto rounded-lg object-contain"
                  />
                </div>
              )}

              <p className="text-slate-800 text-base sm:text-lg font-medium leading-relaxed">{q.text}</p>

              <div className="space-y-2.5 pt-2">
                {q.options.map((opt, idx) => {
                  const isSelected = answers[q.id] === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                      className={`w-full text-left p-3.5 rounded-xl border-2 transition flex items-center gap-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold'
                          : 'border-slate-200 hover:border-indigo-300 bg-white text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm sm:text-base">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigasi Sebelumnya / Berikutnya */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
              <button
                type="button"
                disabled={currentQIdx === 0}
                onClick={() => setCurrentQIdx((prev) => prev - 1)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 disabled:opacity-40"
              >
                ← Sebelumnya
              </button>

              {currentQIdx < totalQ - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQIdx((prev) => prev + 1)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                >
                  Selanjutnya →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Kumpulkan seluruh jawaban ujian sekarang?')) {
                      finishStudentExam('Selesai dikerjakan');
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow"
                >
                  Kumpulkan Ujian
                </button>
              )}
            </div>
          </div>

          {/* Navigasi Nomor Soal */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 h-fit">
            <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">Navigasi Nomor</h3>
            <div className="grid grid-cols-5 gap-2">
              {activeExam.questions.map((item, idx) => {
                const answered = answers[item.id] !== undefined;
                const current = idx === currentQIdx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentQIdx(idx)}
                    className={`h-9 rounded-lg text-xs font-bold transition ${
                      current
                        ? 'ring-2 ring-indigo-600 bg-indigo-50 text-indigo-700'
                        : answered
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // RENDER 5: HASIL UJIAN SISWA
  // =========================================================================
  if (role === 'student-result' && lastResult) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Award className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Ujian Selesai!</h2>
          <p className="text-sm text-slate-500 mt-1">
            Terima kasih telah mengerjakan, <strong>{lastResult.studentName}</strong> ({lastResult.studentClass})
          </p>

          <div className="my-6 p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
            <p className="text-xs font-semibold uppercase text-indigo-600">Nilai Akhir Anda</p>
            <p className="text-5xl font-extrabold text-indigo-700 my-1">{lastResult.score}</p>
            <p className="text-xs text-slate-600">
              Jawaban Benar: <strong>{lastResult.correctCount}</strong> dari <strong>{lastResult.totalQuestions}</strong> soal
            </p>
          </div>

          <button
            onClick={() => setRole('landing')}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
          >
            Kembali ke Halaman Utama
          </button>
        </div>
      </div>
    );
  }

  return null;
}
