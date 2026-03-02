// src/styles/colors.js
export const colors = {
  // Primary - Calm and trustworthy (Healthcare appropriate)
  primary: {
    50: '#eff8ff',
    100: '#daf0ff',
    200: '#b8e0ff',
    300: '#75c7ff',
    400: '#2aa8ff',
    500: '#0088ff',  // Main primary - Medical blue
    600: '#0066cc',
    700: '#004c99',
    800: '#003366',
    900: '#001f4d',
  },
  
  // Secondary - Warm and caring
  secondary: {
    50: '#fef6e7',
    100: '#fce8c3',
    200: '#f9d191',
    300: '#f5b55c',
    400: '#f19e33',
    500: '#e5821a',  // Warm orange - Care/attention
    600: '#cc6913',
    700: '#a34f0f',
    800: '#7a3b0b',
    900: '#522707',
  },

  // Status colors (Healthcare appropriate)
  success: {
    light: '#dcfce7',
    main: '#22c55e',  // Healthy green
    dark: '#16a34a',
  },
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',  // Caution amber
    dark: '#d97706',
  },
  danger: {
    light: '#fee2e2',
    main: '#ef4444',  // Emergency red
    dark: '#dc2626',
  },
  info: {
    light: '#dbeafe',
    main: '#3b82f6',  // Informational blue
    dark: '#2563eb',
  },

  // Blood type specific colors
  bloodTypes: {
    'A+': '#3b82f6',    // Blue
    'A-': '#93c5fd',
    'B+': '#f59e0b',    // Orange
    'B-': '#fcd34d',
    'AB+': '#8b5cf6',   // Purple
    'AB-': '#c4b5fd',
    'O+': '#ef4444',    // Red (Universal donor)
    'O-': '#f87171',
  },

  // Neutrals - Clean, clinical, professional
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Backgrounds
  background: {
    main: '#f8fafc',    // Light, clean background
    paper: '#ffffff',
    card: '#ffffff',
    sidebar: '#ffffff',
  },

  // Text
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    disabled: '#94a3b8',
    inverse: '#ffffff',
  },
};