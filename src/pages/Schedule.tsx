import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { academicService, type Course } from '@/services/academic.service';
import { useUserStore } from '@/lib/store';
import { Plus, ArrowLeft, X, Clock, MapPin, User, Save } from 'lucide-react';

export const Schedule: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const { semester } = useUserStore();
  const navigate = useNavigate();

  const [showAddManual, setShowAddManual] = useState(false);
  const [newCourse, setNewCourse] = useState({ 
    name: '', 
    day: 'Senin', 
    time: '', 
    room: '', 
    lecturer: '' 
  });

  const loadSchedule = () => {
    academicService.getSchedule(semester).then(setCourses);
  };

  useEffect(() => {
    loadSchedule();
  }, [semester]);

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const saveManualCourse = async () => {
    if (!newCourse.name || !newCourse.time) return alert("Isi nama matkul dan jam.");
    await academicService.addSingleCourse({ 
      ...newCourse, 
      semester: Number(semester) 
    });
    setShowAddManual(false);
    setNewCourse({ name: '', day: 'Senin', time: '', room: '', lecturer: '' });
    loadSchedule();
  };

  return (
    <div className="p-6 pb-32 min-h-screen bg-app-bg text-app-text-main">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-app-surface rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Jadwal Kuliah</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/krs-scanner')}
            className="p-3 bg-app-surface border border-app-border rounded-xl text-app-primary shadow-sm active:scale-95 transition-all"
          >
            <Plus size={20} />
          </button>
          <button 
            onClick={() => setShowAddManual(true)}
            className="p-3 bg-app-primary rounded-xl text-white shadow-lg shadow-app-primary/20 active:scale-95 transition-all"
          >
            <Save size={20} />
          </button>
        </div>
      </header>

      <div className="space-y-8">
        {days.map(day => (
          <section key={day}>
            <h2 className="text-app-primary font-bold text-xs uppercase tracking-[0.2em] mb-4 border-b border-app-border pb-2 px-1">
              {day}
            </h2>
            <div className="space-y-3">
              {courses.filter(c => c.day === day).length === 0 ? (
                <div className="p-4 border border-dashed border-app-border rounded-xl">
                  <p className="text-[10px] text-app-text-muted uppercase font-bold text-center">Tidak ada kelas</p>
                </div>
              ) : (
                courses.filter(c => c.day === day).map((c) => (
                  <div 
                    key={c.id} 
                    onClick={() => navigate(`/course/${c.id}`)}
                    className="bg-app-surface p-5 rounded-xl border border-app-border flex items-center gap-4 hover:border-app-primary/50 transition-all cursor-pointer group"
                  >
                    <div className="text-[10px] font-black text-app-text-muted w-16 shrink-0 group-hover:text-app-primary transition-colors">
                      {c.time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate uppercase tracking-tight">{c.name}</p>
                      <p className="text-[10px] text-app-text-muted font-bold uppercase mt-1">
                        {c.room} {c.lecturer && `• ${c.lecturer}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      {showAddManual && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end">
          <div className="w-full bg-app-surface rounded-t-2xl p-8 animate-in slide-in-from-bottom duration-300 shadow-2xl border-t border-app-border">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold uppercase tracking-tighter">Tambah Jadwal</h2>
              <button onClick={() => setShowAddManual(false)} className="p-2 text-app-text-muted hover:text-red-500">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-5">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted">
                  <Plus size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Nama Mata Kuliah" 
                  value={newCourse.name}
                  className="w-full pl-12 pr-4 py-4 bg-app-bg rounded-xl border border-app-border outline-none focus:border-app-primary text-sm font-semibold"
                  onChange={e => setNewCourse({...newCourse, name: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-app-text-muted uppercase px-1">Hari</label>
                  <select 
                    className="w-full p-4 bg-app-bg rounded-xl border border-app-border text-app-text-main outline-none focus:border-app-primary text-sm font-semibold appearance-none"
                    value={newCourse.day}
                    onChange={e => setNewCourse({...newCourse, day: e.target.value})}
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-app-text-muted uppercase px-1">Waktu</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted">
                      <Clock size={16} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="08:00 - 10:00" 
                      value={newCourse.time}
                      className="w-full pl-10 pr-4 py-4 bg-app-bg rounded-xl border border-app-border outline-none focus:border-app-primary text-sm font-semibold"
                      onChange={e => setNewCourse({...newCourse, time: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted">
                    <MapPin size={16} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Ruangan" 
                    value={newCourse.room}
                    className="w-full pl-10 pr-4 py-4 bg-app-bg rounded-xl border border-app-border outline-none focus:border-app-primary text-sm font-semibold"
                    onChange={e => setNewCourse({...newCourse, room: e.target.value})} 
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted">
                    <User size={16} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Dosen" 
                    value={newCourse.lecturer}
                    className="w-full pl-10 pr-4 py-4 bg-app-bg rounded-xl border border-app-border outline-none focus:border-app-primary text-sm font-semibold"
                    onChange={e => setNewCourse({...newCourse, lecturer: e.target.value})} 
                  />
                </div>
              </div>

              <button 
                onClick={saveManualCourse} 
                className="w-full py-4 bg-app-primary text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-app-primary/20 active:scale-[0.98] transition-all mt-4"
              >
                Simpan Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;