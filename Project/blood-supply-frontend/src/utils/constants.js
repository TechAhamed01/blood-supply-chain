export const API_BASE_URL = 'http://localhost:8000/api/v1';

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  HOSPITAL: 'HOSPITAL',
  BLOOD_BANK: 'BLOOD_BANK',
};

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard', // Base dashboard redirect
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    SYSTEM_OVERVIEW: '/admin/system-overview',
  },
  HOSPITAL: {
    DASHBOARD: '/hospital/dashboard',
    REQUEST_BLOOD: '/hospital/request-blood',
    REQUESTS: '/hospital/requests',
    BLOOD_BANKS: '/hospital/blood-banks',
  },
  BLOOD_BANK: {
    DASHBOARD: '/bloodbank/dashboard',
    INVENTORY: '/bloodbank/inventory',
    ALERTS: '/bloodbank/alerts',
    EMERGENCY: '/bloodbank/emergency',
  },
};

// Role to default route mapping
export const ROLE_ROUTES = {
  [USER_ROLES.ADMIN]: ROUTES.ADMIN.DASHBOARD,
  [USER_ROLES.HOSPITAL]: ROUTES.HOSPITAL.DASHBOARD,
  [USER_ROLES.BLOOD_BANK]: ROUTES.BLOOD_BANK.DASHBOARD,
};