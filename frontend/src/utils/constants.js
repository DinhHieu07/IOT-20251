export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  },
  DEVICES: {
    BASE: '/devices',
    BY_ID: (id) => `/devices/${id}`,
  },
  SENSORS: {
    BASE: '/sensors',
    BY_ID: (id) => `/sensors/${id}`,
  },
};

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  DEVICES: '/devices',
  LOGIN: '/login',
};

