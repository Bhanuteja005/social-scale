import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout: React.FC = () => {
  
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />

      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 h-20 md:pl-80 bg-white border-b border-gray-200 z-40 app-topbar">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
        </div>
      </header>

      {/* Main content */}
      <div className="md:pl-80 md:ml-80 app-main">
        <main className="pt-20 min-h-screen bg-white">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
