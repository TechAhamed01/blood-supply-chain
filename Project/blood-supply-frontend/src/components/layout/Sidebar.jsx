import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  LayoutDashboard, 
  Users, 
  Activity, 
  Droplet,
  Hospital,
  AlertTriangle,
  BarChart3,
  Package,
  FileText,
  Settings,
  LogOut
} from 'lucide-react';
import { ROUTES, USER_ROLES } from '../../utils/constants';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout, isAdmin, isHospital, isBloodBank } = useAuth();

  const getNavigation = () => {
    if (isAdmin) {
      return [
        { name: 'Dashboard', href: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
        { name: 'Manage Users', href: ROUTES.ADMIN.USERS, icon: Users },
        { name: 'System Overview', href: ROUTES.ADMIN.SYSTEM_OVERVIEW, icon: Activity },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
      ];
    }
    
    if (isHospital) {
      return [
        { name: 'Dashboard', href: ROUTES.HOSPITAL.DASHBOARD, icon: LayoutDashboard },
        { name: 'Request Blood', href: ROUTES.HOSPITAL.REQUEST_BLOOD, icon: Droplet },
        { name: 'My Requests', href: ROUTES.HOSPITAL.REQUESTS, icon: FileText },
        { name: 'Blood Banks', href: ROUTES.HOSPITAL.BLOOD_BANKS, icon: Hospital },
        { name: 'Analytics', href: '/hospital/analytics', icon: BarChart3 },
      ];
    }
    
    if (isBloodBank) {
      return [
        { name: 'Dashboard', href: ROUTES.BLOOD_BANK.DASHBOARD, icon: LayoutDashboard },
        { name: 'Inventory', href: ROUTES.BLOOD_BANK.INVENTORY, icon: Package },
        { name: 'Alerts', href: ROUTES.BLOOD_BANK.ALERTS, icon: AlertTriangle },
        { name: 'Emergency', href: ROUTES.BLOOD_BANK.EMERGENCY, icon: Activity },
        { name: 'Analytics', href: '/bloodbank/analytics', icon: BarChart3 },
      ];
    }
    
    return [];
  };

  const navigation = getNavigation();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity z-40 lg:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="bg-primary-600 p-2 rounded-xl">
              <Droplet className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">BloodFlow AI</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                  end={item.href === ROUTES.ADMIN.DASHBOARD || 
                        item.href === ROUTES.HOSPITAL.DASHBOARD || 
                        item.href === ROUTES.BLOOD_BANK.DASHBOARD}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${
                    item.href === window.location.pathname ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User profile */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-medium">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role?.toLowerCase().replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-gray-500"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;