import React from 'react';
import { useUserStore } from '@/lib/store';

export const Calendar: React.FC = () => {
  const { semester } = useUserStore();

  return (
    <div className="min-h-screen bg-app-bg p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-black  ">JADWAL KULIAH</h1>
        <p className="text-app-text-muted text-xs uppercase tracking-widest font-bold">Semester {semester}</p>
      </div>

      <div className="space-y-6">
        {DAYS.map(day => (
          <section key={day} className="space-y-3">
            <h2 className="text-sm font-black uppercase text-app-primary border-l-4 border-app-primary pl-3">
              {day}
            </h2>
            <div className="grid gap-3">
              {/* Mapping jadwal berdasarkan hari di sini */}
              <div className="p-4 bg-app-surface border border-app-border rounded-xl flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm">ALGORITMA PEMROGRAMAN</h3>
                  <p className="text-[10px] text-app-text-muted font-medium uppercase mt-1">R. 302 • 08:00 - 10:30</p>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};