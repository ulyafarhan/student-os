import React, { useState } from 'react';
import { Plus, Receipt, CalendarPlus, FilePlus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ActionCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { icon: <Receipt size={20} />, label: 'Scan Dokumen', path: '/scanner', color: 'bg-purple-500' },
    { icon: <CalendarPlus size={20} />, label: 'Tambah Jadwal', path: '/schedule', color: 'bg-blue-500' },
    { icon: <FilePlus size={20} />, label: 'Upload File', path: '/vault', color: 'bg-pink-500' },
  ];

  return (
    <div className="fixed bottom-24 right-6 z-[90] flex flex-col items-end gap-3">
      {isOpen && actions.map((action, i) => (
        <div key={i} className="flex items-center gap-3 animate-in slide-in-from-bottom fade-in" 
             style={{ animationDelay: `${i * 50}ms` }}>
          <span className="bg-app-surface px-3 py-1 rounded-lg text-xs font-bold shadow-lg border border-app-border">
            {action.label}
          </span>
          <button onClick={() => { navigate(action.path); setIsOpen(false); }}
                  className={`${action.color} p-4 rounded-xl text-white shadow-xl`}>
            {action.icon}
          </button>
        </div>
      ))}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'bg-red-500' : 'bg-app-primary'} p-5 rounded-full text-white shadow-2xl transition-all active:scale-90`}
      >
        {isOpen ? <X size={28} /> : <Plus size={28} />}
      </button>
    </div>
  );
};