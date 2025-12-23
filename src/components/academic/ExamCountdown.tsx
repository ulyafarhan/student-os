import React, { useEffect, useState } from 'react';
import { academicService, type Exam } from '@/services/academic.service';
import { Timer, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';

export const ExamCountdown: React.FC = () => {
  const [nextExam, setNextExam] = useState<Exam | null>(null);

  useEffect(() => {
    academicService.getUpcomingExams()
      .then(exams => {
        if (exams && exams.length > 0) {
          setNextExam(exams[0]);
        }
      })
      .catch(() => {});
  }, []);

  if (!nextExam) return null;

  const calculateDaysLeft = () => {
    const diff = new Date(nextExam.date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysLeft();
  const isUrgent = daysLeft <= 3;

  return (
    <div className={`p-4 rounded-xl border ${isUrgent ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-900 border-white/5'} flex items-center gap-4 mb-6`}>
      <div className={`p-3 rounded-xl ${isUrgent ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white'}`}>
        {isUrgent ? <AlertCircle size={24} /> : <Timer size={24} />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-sm truncate pr-2 uppercase text-app-text-main">{nextExam.courseName}</h4>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/10 text-app-text-main shrink-0">{nextExam.type}</span>
        </div>
        <p className="text-xs text-app-text-muted mt-1 uppercase tracking-widest font-bold">Ujian Terdekat</p>
      </div>

      <div className="text-right">
        <p className={`text-2xl font-black ${isUrgent ? 'text-red-500' : 'text-blue-500'}`}>
          {daysLeft < 0 ? 0 : daysLeft}
        </p>
        <p className="text-[10px] text-app-text-muted uppercase font-bold">Hari Lagi</p>
      </div>
    </div>
  );
};