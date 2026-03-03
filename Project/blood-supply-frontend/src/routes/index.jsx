import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES, USER_ROLES } from '../utils/constants';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import HospitalLayout from '../layouts/HospitalLayout';
import BloodBankLayout from '../layouts/BloodBankLayout';

// Auth Pages
import Login from '../pages/auth/Login';

// Common Pages
import Unauthorized from '../pages/common/Unauthorized';
import NotFound from '../pages/common/NotFound';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import ManageUsers from '../pages/admin/ManageUsers';
import SystemOverview from '../pages/admin/SystemOverview';

// Hospital Pages
import HospitalDashboard from '../pages/hospital/Dashboard';
import RequestBlood from '../pages/hospital/RequestBlood';
import HospitalRequests from '../pages/hospital/Requests';
import NearbyBloodBanks from '../pages/hospital/NearbyBloodBanks';

// Blood Bank Pages
import BloodBankDashboard from '../pages/bloodbank/Dashboard';
import ManageInventory from '../pages/bloodbank/ManageInventory';
import Alerts from '../pages/bloodbank/Alerts';
import EmergencyRequests from '../pages/bloodbank/EmergencyRequests';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },
    ],
  },
  // Admin Routes
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: 'dashboard',
            element: <AdminDashboard />,
          },
          {
            path: 'users',
            element: <ManageUsers />,
          },
          {
            path: 'system-overview',
            element: <SystemOverview />,
          },
        ],
      },
    ],
  },
  // Hospital Routes
  {
    path: '/hospital',
    element: <ProtectedRoute allowedRoles={[USER_ROLES.HOSPITAL]} />,
    children: [
      {
        element: <HospitalLayout />,
        children: [
          {
            path: 'dashboard',
            element: <HospitalDashboard />,
          },
          {
            path: 'request-blood',
            element: <RequestBlood />,
          },
          {
            path: 'requests',
            element: <HospitalRequests />,
          },
          {
            path: 'blood-banks',
            element: <NearbyBloodBanks />,
          },
        ],
      },
    ],
  },
  // Blood Bank Routes
  {
    path: '/bloodbank',
    element: <ProtectedRoute allowedRoles={[USER_ROLES.BLOOD_BANK]} />,
    children: [
      {
        element: <BloodBankLayout />,
        children: [
          {
            path: 'dashboard',
            element: <BloodBankDashboard />,
          },
          {
            path: 'inventory',
            element: <ManageInventory />,
          },
          {
            path: 'alerts',
            element: <Alerts />,
          },
          {
            path: 'emergency',
            element: <EmergencyRequests />,
          },
        ],
      },
    ],
  },
  // 404 Route
  {
    path: '*',
    element: <NotFound />,
  },
]);