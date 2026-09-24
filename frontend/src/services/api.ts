import axios from 'axios';

// Environment variable for backend FastAPI endpoint
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000/api';

// Default to live backend FastAPI + MongoDB integration unless VITE_USE_MOCK is explicitly true
export const isMockMode = import.meta.env.VITE_USE_MOCK === 'true';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

// Interceptor for JWT authentication tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sih_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('[FastAPI Connection Note]:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Helper API methods connecting to FastAPI backend endpoints
export const getWards = async (regionId?: string) =>
  (await apiClient.get('/wards', { params: { regionId } })).data;

export const getCurrentRisk = async (regionId?: string) =>
  (await apiClient.get('/risk', { params: { regionId } })).data;

export const getForecast = async (regionId?: string) =>
  (await apiClient.get('/forecast', { params: { regionId } })).data;

export const getAlerts = async (regionId?: string) =>
  (await apiClient.get('/alerts', { params: { regionId } })).data;

export const getResources = async (regionId?: string) =>
  (await apiClient.get('/resources', { params: { regionId } })).data;

export const checkBackendHealth = async () => {
  try {
    const res = await apiClient.get('/health');
    return res.data;
  } catch {
    return { status: 'offline', database: 'disconnected' };
  }
};
