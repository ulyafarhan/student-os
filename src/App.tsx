import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Schedule } from '@/pages/Schedule';
import { KRSScanner } from '@/pages/KRSScanner';
import { Scanner } from '@/pages/Scanner';
import { Vault } from '@/pages/Vault';
import { CourseDetail } from '@/pages/CourseDetail';
import { useUserStore } from '@/lib/store';
import { Settings } from '@/pages/Settings';

const App: React.FC = () => {
  const { username, theme } = useUserStore();

  useEffect(() => {
    // Terapkan tema ke dokumen root
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Jika user belum setup (Fajar/Guest), arahkan ke setup atau berikan nilai default
  // Untuk sementara, kita biarkan masuk ke Dashboard

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/krs-scanner" element={<KRSScanner />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        {/* Fallback jika route tidak ketemu */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;