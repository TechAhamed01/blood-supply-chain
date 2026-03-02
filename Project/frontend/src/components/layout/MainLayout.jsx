// src/components/layout/MainLayout.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'HOSPITAL':
        return 'Hospital Dashboard';
      case 'BLOOD_BANK':
        return 'Blood Bank Dashboard';
      case 'ADMIN':
        return 'Admin Dashboard';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          title={getDashboardTitle()}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;