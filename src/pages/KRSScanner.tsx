import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { parseKRS } from '@/lib/krs-parser';
import { academicService, type Course } from '@/services/academic.service';
import { useUserStore } from '@/lib/store';
import { ArrowLeft, Scan, Loader2, CheckCircle2 } from 'lucide-react';

export const KRSScanner: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Course[] | null>(null);
  const { semester } = useUserStore();
  const navigate = useNavigate();

  const handleCapture = async () => {
    const image = webcamRef.current?.getScreenshot();
    if (!image) return;

    setLoading(true);
    try {
      const data = await parseKRS(image);
      setPreview(data.map(d => ({ ...d, semester })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveSchedule = async () => {
    if (!preview) return;
    try {
      await academicService.clearSchedule(semester);
      await academicService.saveCourses(preview);
      navigate('/schedule');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-app-bg text-app-text-main">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="text-app-text-main"><ArrowLeft /></button>
        <h1 className="text-xl font-bold">Import KRS (OCR)</h1>
      </header>

      {!preview ? (
        <div className="space-y-6">
          <div className="rounded-xl overflow-hidden border-2 border-app-primary/30 aspect-video relative bg-black">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={{ facingMode: 'environment' }}
            />
          </div>
          <button
            onClick={handleCapture}
            disabled={loading}
            className="w-full py-4 bg-app-primary text-white rounded-xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Scan />}
            {loading ? 'Menganalisis Teks...' : 'Ambil Foto KRS'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-semibold text-mint-500 flex items-center gap-2">
            <CheckCircle2 size={20} /> Jadwal Terdeteksi:
          </h2>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {preview.map((c, i) => (
              <div key={i} className="p-4 bg-app-surface border border-app-border rounded-xl shadow-sm">
                <p className="font-bold text-sm text-app-text-main">{c.name}</p>
                <p className="text-xs text-app-text-muted mt-1">{c.day} | {c.time}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={saveSchedule}
              className="w-full py-4 bg-app-primary text-white rounded-xl font-bold shadow-lg shadow-app-primary/20 active:scale-95 transition-transform"
            >
              Simpan Jadwal
            </button>
            <button 
              onClick={() => setPreview(null)} 
              className="w-full py-3 text-app-text-muted text-sm font-medium hover:text-app-text-main transition-colors"
            >
              Foto Ulang
            </button>
          </div>
        </div>
      )}
    </div>
  );
};