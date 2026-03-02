// src/routes/index.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import RoleBasedRoute from './RoleBasedRoute';

// Layouts
import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/layout/AuthLayout';

// Pages
import Login from '../pages/Login';
import HospitalDashboard from '../pages/HospitalDashboard';
import BloodBankDashboard from '../pages/BloodBankDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import EmergencyRequest from '../pages/EmergencyRequest';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" />,
  },
  {
    path: '/login',
    element: (
      <AuthLayout>
        <Login />
      </AuthLayout>
    ),
  },
  {
    path: '/hospital',
    element: (
      <PrivateRoute>
        <MainLayout>
          <RoleBasedRoute allowedRoles={['HOSPITAL']}>
            <HospitalDashboard />
          </RoleBasedRoute>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/hospital/emergency-request',
    element: (
      <PrivateRoute>
        <MainLayout>
          <RoleBasedRoute allowedRoles={['HOSPITAL']}>
            <EmergencyRequest />
          </RoleBasedRoute>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/blood-bank',
    element: (
      <PrivateRoute>
        <MainLayout>
          <RoleBasedRoute allowedRoles={['BLOOD_BANK']}>
            <BloodBankDashboard />
          </RoleBasedRoute>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <PrivateRoute>
        <MainLayout>
          <RoleBasedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </RoleBasedRoute>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <PrivateRoute>
        <MainLayout>
          <Profile />
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/unauthorized',
    element: <div>Unauthorized Access</div>,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);