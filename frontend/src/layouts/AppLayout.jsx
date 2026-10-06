import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar.jsx';
import { Sidebar } from '../components/layout/Sidebar.jsx';

export const AppLayout = ({ showSidebar = true }) => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-950 text-slate-100">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {showSidebar && <Sidebar />}
        <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
