import React from 'react';
import { LayoutGrid, Droplets, BarChart3, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/lib/store';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, logout, theme, toggleTheme } = useUserStore();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-app-surface border-r border-app-border transition-colors duration-300 z-50">
      <div className="p-8 border-b border-app-border">
        <h1 className="text-2xl font-extrabold text-app-primary tracking-tighter">Student<span className="text-app-text-main">OS</span></h1>
        <p className="text-[10px] text-app-text-muted uppercase font-bold tracking-widest mt-1">Desktop Environment</p>
      </div>

      <div className="flex-1 py-8 px-4 space-y-2">
        <SidebarItem 
          icon={<LayoutGrid size={22} />} 
          label="Library" 
          active={location.pathname === '/'} 
          onClick={() => navigate('/')}
        />
        <SidebarItem 
          icon={<Droplets size={22} />} 
          label="Ponds" 
          active={location.pathname === '/schedule' || location.pathname === '/krs-scanner'} 
          onClick={() => navigate('/schedule')}
        />
        <SidebarItem 
          icon={<BarChart3 size={22} />} 
          label="Stats" 
          active={location.pathname === '/vault' || location.pathname === '/scanner'} 
          onClick={() => navigate('/vault')}
        />
        <SidebarItem 
          icon={<Settings size={22} />} 
          label="Settings" 
          active={location.pathname === '/settings'} 
          onClick={() => navigate('/settings')}
        />
      </div>

      <div className="p-6 border-t border-app-border bg-app-bg/30">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-xl bg-app-primary flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-app-primary/20">
            {username ? username[0].toUpperCase() : 'G'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-app-text-main truncate">{username || 'Guest'}</span>
            <span className="text-[10px] text-app-text-muted uppercase font-black tracking-tighter opacity-70">Mahasiswa</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-app-border/40 hover:bg-app-border text-app-text-main transition-all active:scale-95"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
          <button 
            onClick={logout}
            className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all active:scale-95"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={clsx(
      "flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all duration-300 group relative",
      active 
        ? "bg-app-primary/10 text-app-primary font-bold" 
        : "text-slate-400 hover:bg-app-border/30 hover:text-app-text-main"
    )}
  >
    <div className={clsx(
      "transition-all duration-300",
      active && "scale-110"
    )}>
      {icon}
    </div>
    <span className={clsx(
      "text-sm transition-all",
      active ? "font-bold" : "font-medium opacity-80"
    )}>
      {label}
    </span>
  </div>
);