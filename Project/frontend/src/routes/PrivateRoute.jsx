// src/routes/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;