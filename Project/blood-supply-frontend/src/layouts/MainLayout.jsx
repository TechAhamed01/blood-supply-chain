import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 py-8">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <Outlet />
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <p className="text-sm text-gray-500 text-center">
              © 2024 BloodFlow AI - Blood Supply Chain Optimization System
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;