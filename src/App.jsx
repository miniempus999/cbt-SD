// ============================================================================
// 12. AI GEMINI v3.1 MULTIMEDIA QUESTION GENERATOR (HIGH ACCURACY + PREVIEW EDIT)
// ============================================================================

function GeminiQuestionGeneratorModal({ defaultCategory, settings, onSaveGenerated, notify }) {
  const [category, setCategory] = useState(defaultCategory);
  const [topic, setTopic] = useState('Sistem Pernapasan Manusia');
  const [difficulty, setDifficulty] = useState('HOTS');
  const [qType, setQType] = useState('single'); // 'single' | 'complex' | 'matching' | 'true_false'
  const [count, setCount] = useState(2);
  const [mediaPreference, setMediaPreference] = useState('image'); // 'none' | 'image' | 'chart' | 'video' | 'mixed'
  const [loading, setLoading] = useState(false);
  const [regeneratingImgIdx, setRegeneratingImgIdx] = useState(null);
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

  // Pencarian Gambar Ensiklopedia Akurat dari Wikimedia Commons
  const searchWikimediaEducationalImage = async (englishSearchTerms = [], skipIndex = 0) => {
    for (const term of englishSearchTerms) {
      if (!term || term.trim().length < 3) continue;
      try {
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
          `filetype:bitmap|drawing ${term.trim()}`
        )}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=720&format=json&origin=*`;

        const res = await fetch(apiUrl);
        if (!res.ok) continue;
        const data = await res.json();
        const pages = data?.query?.pages;
        if (!pages) continue;

        const validCandidates = Object.values(pages)
          .filter((page) => {
            const title = (page?.title || '').toLowerCase();
            const info = page?.imageinfo?.[0];
            if (!info) return false;
            // Filter ketat agar tidak mengambil ikon, bendera, foto orang acak, atau buah yang tidak relevan
            const blockedWords = ['icon', 'logo', 'flag', 'symbol', 'portrait', 'headshot', 'button', 'arrow'];
            if (blockedWords.some((w) => title.includes(w))) return false;
            if ((info.width || 0) < 200 || (info.height || 0) < 150) return false;
            return Boolean(info.thumburl || info.url);
          })
          .sort((a, b) => (a.index || 0) - (b.index || 0));

        if (validCandidates.length > 0) {
          const picked = validCandidates[skipIndex % validCandidates.length];
          const info = picked.imageinfo[0];
          return info.thumburl || info.url;
        }
      } catch {
        // Lanjut ke kata kunci cadangan berikutnya
      }
    }
    return null;
  };

  // Generator Diagram Vektor SVG Edukatif Berlabel Bahasa Indonesia
  const generateCustomSvgDiagram = async (questionObj, topicStr, catStr, apiKey) => {
    try {
      const svgPayload = {
        contents: [{
          role: 'user',
          parts: [{
            text: `Buatkan ilustrasi diagram edukatif SVG yang sangat jelas, rapi, berwarna cerah, dan akurat secara ilmiah untuk soal SD berikut:
Mata Pelajaran: ${catStr}
Topik Utama: ${topicStr}
Stimulus Soal: ${questionObj.stimulus || ''}
Pertanyaan: ${questionObj.question || ''}
Deskripsi Visual: ${questionObj.mediaCaption || ''}

ATURAN WAJIB SVG:
1. Tag pembuka WAJIB persis: <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
2. Buat latar belakang <rect width="640" height="360" rx="16" fill="#f8fafc"/>.
3. Gambar diagram konsep/organ/objek yang persis diminta topik "${topicStr}" menggunakan bentuk geometris (<path>, <ellipse>, <circle>, <rect>, <polygon>, <line>) yang jelas dan proporsional.
   - Jika topik Sistem Pernapasan Manusia: gambar batang trakea di tengah atas, cabang bronkus kiri & kanan, dua lobus paru-paru merah muda di kiri & kanan, gelembung alveolus, dan lengkungan otot diafragma di bawahnya, lengkap dengan garis penunjuk dan label teks Bahasa Indonesia (Hidung/Trakea, Bronkus, Paru-paru, Alveolus, Diafragma).
4. Gunakan font-family="Arial, sans-serif" dengan ukuran huruf 13px-15px bold berwarna gelap (#0f172a) agar terbaca tajam oleh siswa SD.
5. DILARANG memakai tag <image>, <script>, atau karakter & mentah (tulis "dan", bukan "&").
6. Keluarkan HANYA kode <svg ...>...</svg> tanpa teks pembuka/penutup.`
          }]
        }],
        generationConfig: {
          temperature: 0.2
        }
      };

      const res = await callGoogleAiEndpoint('gemini-2.5-flash', svgPayload, apiKey);
      let svgText = res?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = svgText.match(/<svg[\s\S]*?<\/svg>/i);
      if (match) {
        let cleanSvg = match[0]
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, 'dan');
        if (!cleanSvg.includes('xmlns=')) {
          cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!cleanSvg.includes('width=')) {
          cleanSvg = cleanSvg.replace('<svg', '<svg width="640" height="360"');
        }
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvg)}`;
      }
      return null;
    } catch {
      return null;
    }
  };

  // PIPELINE GAMBAR AKURAT: Wikimedia Commons Ensiklopedia -> Fallback Diagram SVG Kustom
  const generateEducationalImage = async (questionObj, topicStr, catStr, apiKey, variantOffset = 0) => {
    try {
      // Minta Gemini menerjemahkan topik & isi soal menjadi 3 frasa pencarian ilmiah Wikimedia Commons
      const queryPayload = {
        contents: [{
          role: 'user',
          parts: [{
            text: `Translate the exact scientific/educational visual subject of this Indonesian elementary school (SD) question into 3 precise English Wikimedia Commons search phrases.

Subject: ${catStr}
Main Topic: ${topicStr}
Question Stimulus: ${questionObj.stimulus || ''}
Question Text: ${questionObj.question || ''}
Visual Description: ${questionObj.mediaCaption || ''}

Rules:
- Focus strictly on the main scientific/educational subject (e.g. for "Sistem Pernapasan Manusia", output ["Human respiratory system diagram", "Respiratory system anatomy", "Lungs trachea bronchi diagram"]).
- NEVER output generic single words like "apple", "fruit", "food", "nature", or unrelated objects.
- Output ONLY a valid JSON array of 3 English strings.`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      };

      let searchPhrases = [];
      try {
        const qRes = await callGoogleAiEndpoint('gemini-2.5-flash', queryPayload, apiKey);
        const qText = qRes?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        const parsedPhrases = JSON.parse(qText.replace(/```json|```/gi, '').trim());
        if (Array.isArray(parsedPhrases)) searchPhrases = parsedPhrases;
      } catch {
        searchPhrases = [`${topicStr} diagram`, topicStr];
      }

      // Jika variantOffset ganjil, prioritaskan Diagram SVG buatan AI; jika genap, cari foto/diagram Wikimedia dulu
      if (variantOffset % 2 === 0) {
        const wikiImg = await searchWikimediaEducationalImage(searchPhrases, Math.floor(variantOffset / 2));
        if (wikiImg) return wikiImg;
      }

      // Fallback atau mode SVG kustom berlabel Bahasa Indonesia
      const svgImg = await generateCustomSvgDiagram(questionObj, topicStr, catStr, apiKey);
      if (svgImg) return svgImg;

      // Cadangan terakhir jika SVG gagal
      return await searchWikimediaEducationalImage(searchPhrases, variantOffset + 1);
    } catch {
      return await generateCustomSvgDiagram(questionObj, topicStr, catStr, apiKey);
    }
  };

  // Regenerate gambar hanya untuk 1 butir soal di Preview
  const handleRegenerateSingleImage = async (index) => {
    const apiKey = (settings.geminiApiKey || '').trim();
    if (!apiKey) {
      notify('API Key Gemini belum diisi di menu Pengaturan.', 'error');
      return;
    }
    const targetQ = previewQuestions[index];
    if (!targetQ) return;

    setRegeneratingImgIdx(index);
    try {
      const nextVariant = (targetQ._imgVariant || 0) + 1;
      const newUrl = await generateEducationalImage(targetQ, topic, category, apiKey, nextVariant);
      if (newUrl) {
        setPreviewQuestions((prev) =>
          prev.map((item, idx) =>
            idx === index ? { ...item, mediaType: 'image', mediaUrl: newUrl, _imgVariant: nextVariant } : item
          )
        );
        notify(`Gambar ilustrasi Soal #${index + 1} berhasil diperbarui!`);
      } else {
        notify('Tidak ditemukan gambar alternatif, silakan coba klik lagi atau upload manual.', 'error');
      }
    } finally {
      setRegeneratingImgIdx(null);
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
   - Jika soal menggunakan media "image": stimulus dan pertanyaan WAJIB merujuk pada gambar ilustrasi materi "${topic}" (contoh: "Perhatikan gambar organ pernapasan manusia berikut..."), JANGAN menyebut grafik batang! Isi mediaCaption dengan keterangan gambar yang akurat sesuai "${topic}".
   - Jika soal menggunakan media "chart": stimulus dan pertanyaan WAJIB merujuk pada data grafik batang di chartData (title, labels minimal 4 label, values minimal 4 angka yang konsisten dengan kunci jawaban).
   - Jika soal menggunakan media "video": stimulus dan pertanyaan merujuk pada tayangan video edukasi tentang "${topic}".
   - Jika soal menggunakan media "none": seluruh informasi ada pada teks stimulus.
3. WAJIB MENGISI OPSI & KUNCI JAWABAN LENGKAP sesuai tipe soal "${qType}":
   - Jika "${qType}" adalah "single": WAJIB isi "options" dengan 4 kalimat pilihan jawaban yang bermakna dan "correctIndex" (angka 0 sampai 3).
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
          temperature: 0.3,
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
            const generatedImg = await generateEducationalImage(item, topic, category, apiKey, idx * 2);
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
            _imgVariant: idx * 2,
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
            <p className="text-xs text-slate-600">Dilengkapi gambar ensiklopedia Wikimedia & diagram SVG edukasi presisi sesuai materi.</p>
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
            placeholder="Contoh: Sistem Pernapasan Manusia, Siklus Air, Pecahan Senilai..."
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
            <option value="image">Gambar / Diagram Edukasi Sesuai Materi</option>
            <option value="mixed">Kombinasi Lengkap (Gambar + Grafik + Video)</option>
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
          {loading ? 'AI Gemini Sedang Menyusun Soal & Gambar Materi...' : 'Generate Soal Sekarang'}
        </button>
      </div>

      {/* PREVIEW, EDIT MANUAL & SAVE GENERATED QUESTIONS */}
      {previewQuestions.length > 0 && (
        <div className="pt-4 border-t-2 border-indigo-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-extrabold text-indigo-950">
              Preview Hasil AI Gemini ({previewQuestions.length} Soal)
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
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-indigo-900">
                      Preview Soal #{i + 1} ({pq.mediaType})
                    </span>
                    <div className="flex items-center gap-2">
                      {pq.mediaType === 'image' && (
                        <button
                          type="button"
                          disabled={regeneratingImgIdx === i}
                          onClick={() => handleRegenerateSingleImage(i)}
                          className="px-3 py-1.5 rounded-lg bg-sky-100 hover:bg-sky-600 text-sky-900 hover:text-white font-bold text-xs flex items-center gap-1 transition"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${regeneratingImgIdx === i ? 'animate-spin' : ''}`} />
                          {regeneratingImgIdx === i ? 'Mencari Gambar...' : 'Ganti Gambar AI / SVG'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditingPreviewIndex(i)}
                        className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-500 text-amber-900 hover:text-white font-bold text-xs flex items-center gap-1 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Manual Soal Ini
                      </button>
                    </div>
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
