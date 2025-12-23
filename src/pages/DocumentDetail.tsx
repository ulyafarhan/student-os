import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Scan, 
  Copy, 
  CheckCircle2, 
  Loader2, 
  Download,
  Trash2,
  Wallet, 
  Quote, 
  BrainCircuit, 
  Layers,
  Calendar,
  Send
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { vaultService } from '@/services/vault.service';
import { extractAmountFromText } from '@/lib/finance-parser';
import { dbService } from '@/services/db.service';
import { extractScheduleFromText } from '@/lib/academic-parser';
import { googleService } from '@/services/google.service';
import { aiAcademicService, type Flashcard } from '@/services/ai-academic.service';
import { aiHybridService } from '@/services/ai-hybrid.service';

export const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [fileData, setFileData] = useState<any>(null);
  const [isReading, setIsReading] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [citation, setCitation] = useState<string>("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      if (id) {
        const file = await vaultService.getFileById(id);
        setFileData(file);
      }
    };
    fetchFile();
  }, [id]);

  const handleOCR = async () => {
    if (!fileData?.blob) return;
    
    setIsReading(true);
    setExtractedText("");
    
    try {
      const worker = await createWorker('ind+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });

      const imageUrl = URL.createObjectURL(fileData.blob);
      const { data: { text } } = await worker.recognize(imageUrl);
      
      setExtractedText(text);
      await worker.terminate();
      URL.revokeObjectURL(imageUrl);
    } catch (err) {
      console.error("OCR Error:", err);
    } finally {
      setIsReading(false);
      setProgress(0);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSendToFinance = async () => {
    const detectedAmount = extractAmountFromText(extractedText);
    if (!detectedAmount) return alert("Tidak ada nominal uang yang terdeteksi.");

    try {
      const gapi = (window as any).gapi;
      if (gapi?.auth2?.getAuthInstance()?.isSignedIn?.get()) {
        await googleService.syncToSheets({
          date: new Date(),
          title: `Scan: ${fileData.name}`,
          amount: detectedAmount,
          type: 'EXPENSE',
          category: 'Lainnya'
        });
      }

      await dbService.addTransaction({
        title: `Scan: ${fileData.name}`,
        amount: detectedAmount,
        type: 'EXPENSE',
        category: 'Lainnya',
        date: new Date().toISOString(),
        synced: false
      });
      alert(`Berhasil mencatat pengeluaran sebesar Rp ${detectedAmount.toLocaleString('id-ID')}`);
      navigate('/finance');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiAsk = async () => {
    if (!aiQuery.trim() || !extractedText) return;
    setIsAiLoading(true);
    try {
      const response = await aiHybridService.analyzeText(extractedText, aiQuery);
      setAiResponse(response);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveToSchedule = async () => {
    const detectedSchedules = extractScheduleFromText(extractedText);
    if (detectedSchedules.length === 0) return alert("Jadwal kuliah tidak terdeteksi.");

    try {
      for (const item of detectedSchedules) {
        await dbService.addSchedule({
          ...item,
          semester: fileData.semester,
          active: true
        });
      }
      alert(`${detectedSchedules.length} Jadwal berhasil ditambahkan ke kalender.`);
      navigate('/calendar');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcademicAI = () => {
    if (!extractedText) return;
    setCitation(aiAcademicService.generateCitation(extractedText));
    setFlashcards(aiAcademicService.generateFlashcards(extractedText));
  };

  if (!fileData) return (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <header className="p-4 bg-slate-900 flex items-center gap-4 sticky top-0 z-10 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full text-white">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold truncate text-white">{fileData.name}</h1>
          <p className="text-xs text-slate-400">Semester {fileData.semester} • {fileData.category}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <div className="aspect-[3/4] w-full bg-slate-900 rounded-xl border border-white/10 overflow-hidden relative group">
          <img 
            src={URL.createObjectURL(fileData.blob)} 
            className="w-full h-full object-contain" 
            alt="document preview" 
          />
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
              <Download size={20} />
            </button>
            <button className="p-3 bg-red-500/20 backdrop-blur-md rounded-full text-red-400 hover:bg-red-500/30">
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
              <Scan size={18} />
              AI Text Extractor
            </h2>
            {extractedText && (
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                {copySuccess ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                {copySuccess ? "Tersalin" : "Salin Teks"}
              </button>
            )}
          </div>

          {!extractedText && !isReading && (
            <button 
              onClick={handleOCR}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <FileText size={20} />
              Ekstrak Teks dari Gambar
            </button>
          )}

          {extractedText && extractAmountFromText(extractedText) !== null && (
            <button 
              onClick={handleSendToFinance}
              className="w-full mt-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all animate-in zoom-in"
            >
              <Wallet size={20} />
              Catat sebagai Pengeluaran
            </button>
          )}

          {extractedText && extractScheduleFromText(extractedText).length > 0 && (
            <button 
              onClick={handleSaveToSchedule}
              className="w-full mt-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all animate-in zoom-in"
            >
              <Calendar size={20} />
              Masukkan ke Jadwal Kuliah
            </button>
          )}

          {isReading && (
            <div className="w-full p-8 bg-slate-900 rounded-xl border border-dashed border-blue-500/50 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <div className="text-center">
                <p className="text-sm font-medium">Menganalisis Dokumen...</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">{progress}% Selesai</p>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          )}

          {extractedText && (
            <>
              <div className="bg-slate-900 rounded-xl p-4 border border-white/5 space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase text-app-text-muted tracking-widest">Koreksi Teks (Editable)</span>
                </div>
                <textarea 
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="w-full bg-transparent text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-300 outline-none border-none resize-none min-h-[200px]"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <button 
                  onClick={handleAcademicAI}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all animate-in slide-in-from-bottom"
                >
                  <BrainCircuit size={20} />
                  Generate Smart Study Assets
                </button>

                {citation && (
                  <div className="p-4 bg-slate-900 border border-white/10 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-purple-400">
                      <Quote size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Sitasi Otomatis (APA)</span>
                    </div>
                    <p className="text-xs text-slate-200">{citation}</p>
                  </div>
                )}

                {flashcards.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1 text-slate-400">
                      <Layers size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Flashcards AI ({flashcards.length})</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {flashcards.map((card, idx) => (
                        <div key={idx} className="min-w-[240px] p-4 bg-slate-900 border border-white/10 rounded-xl flex flex-col gap-2 shadow-xl">
                          <input 
                            value={card.question} 
                            onChange={(e) => {
                              const newCards = [...flashcards];
                              newCards[idx].question = e.target.value;
                              setFlashcards(newCards);
                            }}
                            className="bg-transparent text-xs font-bold text-blue-400 border-b border-white/5 outline-none pb-1"
                            placeholder="Pertanyaan"
                          />
                          <textarea 
                            value={card.answer}
                            onChange={(e) => {
                              const newCards = [...flashcards];
                              newCards[idx].answer = e.target.value;
                              setFlashcards(newCards);
                            }}
                            className="bg-transparent text-xs text-slate-200 outline-none resize-none h-16 leading-relaxed"
                            placeholder="Jawaban"
                          />
                          <button 
                            onClick={() => setFlashcards(flashcards.filter((_, i) => i !== idx))}
                            className="text-[9px] text-red-500 font-bold uppercase mt-2 self-end px-2 py-1 bg-red-500/10 rounded-lg"
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <section className="mt-8 p-6 bg-slate-900 border border-white/5 rounded-xl space-y-4 shadow-inner">
                  <div className="flex items-center gap-3 text-blue-400">
                    <BrainCircuit size={20} />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Ask Document AI</h3>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder="Tanyakan sesuatu tentang dokumen ini..."
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-blue-500 transition-all min-h-[100px] resize-none text-slate-200"
                    />
                    <button 
                      onClick={handleAiAsk}
                      disabled={isAiLoading || !aiQuery}
                      className="absolute bottom-3 right-3 p-3 bg-blue-600 text-white rounded-xl disabled:opacity-30 active:scale-95 transition-all"
                    >
                      {isAiLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>

                  {aiResponse && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/20 animate-in fade-in zoom-in duration-300">
                      <p className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap font-medium">
                        {aiResponse}
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DocumentDetail;