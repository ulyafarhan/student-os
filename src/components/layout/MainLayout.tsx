import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Outlet } from 'react-router-dom';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-app-bg text-app-text-main overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 md:ml-64 relative">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-0">
          <Outlet />
        </div>
        
        <Navbar />
      </main>
    </div>
  );
};