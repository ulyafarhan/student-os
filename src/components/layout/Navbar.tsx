import React from 'react';
import { Home, Calendar, Layers, Settings, LayoutGrid, Droplets, BarChart3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-app-surface border-t border-app-border z-50 pb-safe shadow-2xl">
      <div className="flex justify-around items-center h-20 px-4">
        <NavIcon 
          icon={<LayoutGrid size={24} weight={location.pathname === '/' ? "fill" : "regular"} />} 
          label="Library" 
          active={location.pathname === '/'} 
          onClick={() => navigate('/')}
        />
        <NavIcon 
          icon={<Droplets size={24} />} 
          label="Ponds" 
          active={location.pathname === '/schedule' || location.pathname === '/krs-scanner'} 
          onClick={() => navigate('/schedule')}
        />
        <NavIcon 
          icon={<BarChart3 size={24} />} 
          label="Stats" 
          active={location.pathname === '/vault' || location.pathname === '/scanner'} 
          onClick={() => navigate('/vault')}
        />
        <NavIcon 
          icon={<Settings size={24} />} 
          label="Settings" 
          active={location.pathname === '/settings'} 
          onClick={() => navigate('/settings')}
        />
      </div>
    </nav>
  );
};

interface NavIconProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavIcon: React.FC<NavIconProps> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={clsx(
      "flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300",
      active ? "text-app-primary" : "text-slate-400"
    )}
  >
    <div className={clsx(
      "transition-all duration-300 p-1",
      active && "scale-110"
    )}>
      {icon}
    </div>
    <span className={clsx(
      "text-[11px] font-bold transition-all",
      active ? "opacity-100" : "opacity-60"
    )}>
      {label}
    </span>
  </button>
);