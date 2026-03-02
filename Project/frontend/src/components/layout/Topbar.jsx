// src/components/layout/Topbar.jsx
import React from 'react';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';

const Topbar = ({ toggleSidebar, title }) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="ml-4 text-xl font-semibold text-gray-900">{title}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md">
            <BellIcon className="w-6 h-6" />
          </button>
          <div className="h-8 w-px bg-gray-200" />
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;