// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  BeakerIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const getNavigation = () => {
    const common = [
      { name: 'Dashboard', href: `/${user?.role.toLowerCase()}`, icon: HomeIcon },
    ];

    switch (user?.role) {
      case 'HOSPITAL':
        return [
          ...common,
          { name: 'Emergency Request', href: '/hospital/emergency-request', icon: BeakerIcon },
          { name: 'Request History', href: '/hospital/history', icon: ClockIcon },
        ];
      case 'BLOOD_BANK':
        return [
          ...common,
          { name: 'Inventory', href: '/blood-bank/inventory', icon: BeakerIcon },
          { name: 'Expiry Alerts', href: '/blood-bank/expiry', icon: ClockIcon },
          { name: 'Transfer Suggestions', href: '/blood-bank/transfers', icon: ChartBarIcon },
        ];
      case 'ADMIN':
        return [
          ...common,
          { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
          { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
          { name: 'System Health', href: '/admin/health', icon: ClockIcon },
        ];
      default:
        return common;
    }
  };

  const navigation = getNavigation();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b">
          <h1 className="text-xl font-bold text-primary-600">BloodChain</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;