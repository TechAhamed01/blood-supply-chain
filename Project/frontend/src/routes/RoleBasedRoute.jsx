// src/routes/RoleBasedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { hasRole, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!hasRole(allowedRoles)) {
    // Redirect to appropriate dashboard based on role
    if (hasRole('ADMIN')) return <Navigate to="/admin" />;
    if (hasRole('HOSPITAL')) return <Navigate to="/hospital" />;
    if (hasRole('BLOOD_BANK')) return <Navigate to="/blood-bank" />;
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default RoleBasedRoute;