import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, BookOpen, Bell } from 'lucide-react';
import { clsx } from 'clsx';

interface Exam {
  id?: number;
  courseName: string;
  date: string;
  type: 'UTS' | 'UAS' | 'Kuis';
}

export const ExamCountdown: React.FC<Exam> = ({ courseName, date, type }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }>({
    days: 0,
    priority: 'LOW'
  });

  useEffect(() => {
    const calculatePriority = () => {
      const diff = new Date(date).getTime() - new Date().getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      
      let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (days <= 2) priority = 'CRITICAL';
      else if (days <= 7) priority = 'HIGH';
      else if (days <= 14) priority = 'MEDIUM';

      setTimeLeft({ days, priority });

      if (priority === 'CRITICAL' || priority === 'HIGH') {
        sendPriorityNotification(courseName, days, priority);
      }
    };

    calculatePriority();
  }, [date, courseName]);

  const sendPriorityNotification = (name: string, days: number, level: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`PRIORITAS BELAJAR: ${level}`, {
        body: `${name} tinggal ${days} hari lagi. Fokus pada materi ini sekarang!`,
        icon: '/vite.svg'
      });
    }
  };

  const getPriorityStyles = () => {
    switch (timeLeft.priority) {
      case 'CRITICAL': return "bg-red-500/10 border-red-500 text-red-600";
      case 'HIGH': return "bg-orange-500/10 border-orange-500 text-orange-600";
      case 'MEDIUM': return "bg-blue-500/10 border-blue-500 text-blue-600";
      default: return "bg-app-surface border-app-border text-app-text-muted";
    }
  };

  return (
    <div className={clsx(
      "p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-right-4",
      getPriorityStyles()
    )}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {timeLeft.priority === 'CRITICAL' ? <AlertTriangle size={16} /> : <Clock size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{type} Radar</span>
        </div>
        <div className={clsx(
          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
          timeLeft.priority === 'CRITICAL' ? "bg-red-500 text-white" : "bg-app-primary/10 text-app-primary"
        )}>
          {timeLeft.priority} Priority
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-bold truncate text-app-text-main">{courseName}</h4>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium opacity-70">
            Target: {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xl font-black tracking-tighter">{timeLeft.days}</span>
            <span className="text-[10px] font-bold uppercase">Hari Lagi</span>
          </div>
        </div>
      </div>

      {timeLeft.priority === 'CRITICAL' && (
        <div className="mt-3 pt-3 border-t border-red-500/20 flex items-center gap-2 text-[9px] font-bold uppercase animate-pulse">
          <Bell size={12} />
          Waktunya Review Intensif Materi!
        </div>
      )}
    </div>
  );
};