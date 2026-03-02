// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authApi.login(email, password);
      
      // Store tokens
      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      
      // Set user
      setUser(response.data.user);
      setIsAuthenticated(true);
      
      toast.success('Login successful!');
      return { success: true, role: response.data.user.role };
    } catch (error) {
      const message = error.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    }
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') {
      return user.role === roles;
    }
    return roles.includes(user.role);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};