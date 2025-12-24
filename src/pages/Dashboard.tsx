import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/lib/store';
import { dbService } from '@/services/db.service';
import { academicService, type Course } from '@/services/academic.service';
import { ExamCountdown } from '@/components/academic/ExamCountdown';
import { parseFinanceInput, type ParsedTransaction } from '@/lib/finance-parser';
import { smartCategorizer } from '@/services/smart-categorizer.service';
import { syncEngine } from '@/services/sync-engine.service';

import { 
  Scan, BookOpen, Mic, Sun, Moon, 
  ArrowUpRight, ArrowDownRight, ChevronRight, 
  Send, X, AlertCircle 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { username, theme, toggleTheme, semester } = useUserStore();
  
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<ParsedTransaction | null>(null);
  const [balance, setBalance] = useState({ income: 0, expense: 0, total: 0 });
  const [todayCourses, setTodayCourses] = useState<Course[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      await dbService.init();
      
      const currentSemester = Number(semester) || 1;
      const bal = await dbService.getBalance();
      const allCourses = await academicService.getSchedule(currentSemester);
      const exams = await academicService.getUpcomingExams();
      
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const today = dayNames[new Date().getDay()];
      const filtered = allCourses.filter(c => c.day === today);
      
      setBalance(bal || { income: 0, expense: 0, total: 0 });
      setTodayCourses(filtered || []);
      setUpcomingExams(exams || []);

      syncEngine.performSync();
      
    } catch (e) {
      console.error("Dashboard Load Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [semester]);

  useEffect(() => {
    const updatePreview = async () => {
      if (input.length > 2) {
        const result = parseFinanceInput(input);
        if (result.amount > 0) {
          if (result.category === 'Umum') {
            const suggested = await smartCategorizer.predictCategory(result.title);
            result.category = suggested;
          }
          setPreview(result);
        } else {
          setPreview(null);
        }
      } else {
        setPreview(null);
      }
    };
    updatePreview();
  }, [input]);

  const handleSaveTransaction = async () => {
    if (!preview) return;
    try {
      await dbService.addTransaction({
        title: preview.title,
        amount: preview.amount,
        type: preview.type,
        category: preview.category,
        date: new Date().toISOString(),
        synced: false
      });
      setInput('');
      setPreview(null);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const startVoiceInput = () => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) return alert("Browser tidak mendukung Speech Recognition");

    const recognition = new Recognition();
    recognition.lang = 'id-ID';
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    
    recognition.start();
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(num);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-app-bg animate-pulse" />;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-app-text-main tracking-tight">Halo, {username}!</h1>
          <p className="text-app-text-muted text-sm">Semester {semester} • Overview</p>
        </div>
        <button onClick={toggleTheme} className="p-3 rounded-xl bg-app-surface border border-app-border text-app-text-main active:scale-95 transition-all">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div 
            onClick={() => navigate('/finance')}
            className="rounded-xl p-8 bg-gradient-to-br from-blue-600 to-blue-500 shadow-xl text-white cursor-pointer hover:scale-[1.01] transition-transform relative overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <span className="relative z-10 text-blue-50/80 text-sm font-medium uppercase tracking-wider">Total Saldo</span>
            <h2 className="relative z-10 text-5xl font-bold mt-2">{formatRupiah(balance.total)}</h2>
            <div className="relative z-10 mt-8 grid grid-cols-2 gap-4">
              <div className="bg-black/10 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center gap-3">
                <ArrowUpRight className="text-red-300" />
                <div>
                  <p className="text-[10px] text-white/60 uppercase font-bold">Pengeluaran</p>
                  <p className="font-semibold">{formatRupiah(balance.expense)}</p>
                </div>
              </div>
              <div className="bg-black/10 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center gap-3">
                <ArrowDownRight className="text-green-300" />
                <div>
                  <p className="text-[10px] text-white/60 uppercase font-bold">Pemasukan</p>
                  <p className="font-semibold">{formatRupiah(balance.income)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <ShortcutBtn icon={<Scan className="text-purple-500" />} label="Scanner" onClick={() => navigate('/scanner')} />
            <ShortcutBtn icon={<BookOpen className="text-pink-500" />} label="Vault" onClick={() => navigate('/vault')} />
            <ShortcutBtn icon={<Mic className="text-blue-500" />} label="Catat" onClick={startVoiceInput} />
          </div>

          <section className="bg-app-surface border border-app-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-app-text-main mb-4">Catat Transaksi Cepat</h3>
            <div className={`bg-app-bg border ${preview ? 'border-app-primary ring-1 ring-app-primary/20' : 'border-app-border'} rounded-xl p-2 transition-all`}>
              <div className="flex items-center gap-2 px-3">
                <input 
                  ref={inputRef}
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTransaction()}
                  placeholder="Contoh: Kopi 15k"
                  className="flex-1 bg-transparent py-4 outline-none text-app-text-main placeholder:text-app-text-muted font-medium"
                />
                {input && <button onClick={() => setInput('')} className="p-2 text-app-text-muted"><X size={18} /></button>}
                <button 
                  onClick={handleSaveTransaction}
                  disabled={!preview}
                  className="p-4 bg-app-primary text-white rounded-xl disabled:opacity-30 disabled:scale-95 transition-all shadow-lg shadow-app-primary/20"
                >
                  <Send size={20} />
                </button>
              </div>

              {preview && (
                <div className="mx-2 mb-2 p-4 bg-app-surface rounded-xl border border-app-border animate-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-app-text-muted uppercase font-black">Preview</p>
                      <p className="text-sm font-bold text-app-text-main">{preview.title}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black ${preview.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                        {preview.type === 'INCOME' ? '+' : '-'} {formatRupiah(preview.amount)}
                      </p>
                      <span className="text-[10px] bg-app-primary/10 text-app-primary px-2 py-0.5 rounded-full font-bold uppercase">{preview.category}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!preview && input.length > 0 && (
              <p className="text-[10px] text-app-text-muted mt-3 ml-2 flex items-center gap-1.5">
                <AlertCircle size={12} className="text-orange-500" /> Gunakan format nominal: 15k, 50rb, atau 10000
              </p>
            )}
          </section>

          <section className="bg-app-surface border border-app-border rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 px-2">Exam Radar</h3>
            <div className="grid gap-3">
              {upcomingExams.length > 0 ? (
                upcomingExams.map(exam => (
                  <ExamCountdown 
                    key={exam.id} 
                    examName={exam.courseName} 
                    examDate={exam.date} 
                    type={exam.type} 
                  />
                ))
              ) : (
                <p className="text-xs text-slate-600 px-2">Belum ada jadwal ujian yang terdeteksi.</p>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-bold text-app-text-main">Jadwal Hari Ini</h3>
            <button onClick={() => navigate('/schedule')} className="text-app-primary text-xs font-bold hover:underline flex items-center gap-1">
              SEMUA <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="space-y-3">
            {todayCourses.length === 0 ? (
              <div className="p-8 bg-app-surface/50 border border-dashed border-app-border rounded-xl text-center">
                <p className="text-app-text-muted text-sm">Tidak ada kuliah hari ini.</p>
              </div>
            ) : (
              todayCourses.map((course) => (
                <div 
                  key={course.id}
                  onClick={() => navigate(`/course/${course.id}`)}
                  className="p-5 bg-app-surface border border-app-border rounded-xl flex items-center gap-4 hover:border-app-primary/50 transition-all cursor-pointer group"
                >
                  <div className="w-1.5 h-10 rounded-full bg-app-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-app-text-main text-sm truncate">{course.name}</p>
                    <p className="text-[10px] text-app-text-muted font-bold uppercase tracking-tight mt-1">
                      {course.time} • {course.room}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-app-text-muted group-hover:text-app-primary transition-colors" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ShortcutBtn = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2 p-5 bg-app-surface border border-app-border rounded-xl hover:bg-app-bg transition-all active:scale-95 group shadow-sm"
  >
    <div className="p-2.5 bg-app-bg rounded-xl group-hover:bg-app-primary/10 transition-colors">{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-widest text-app-text-main">{label}</span>
  </button>
);

export default Dashboard;