import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle expired token or 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't redirect if already on login or public verification page
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/verify')) {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication
export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
  },
};

// Dashboard
export const dashboardService = {
  getStats: async () => {
    const res = await api.get('/dashboard/stats');
    return res.data;
  },
};

// Students
export const studentService = {
  getAll: async (params = {}) => {
    const res = await api.get('/students', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/students/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/students', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/students/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/students/${id}`);
    return res.data;
  },
  getDepartments: async () => {
    const res = await api.get('/students/departments');
    return res.data;
  },
  getYears: async () => {
    const res = await api.get('/students/years');
    return res.data;
  },
};

// Events
export const eventService = {
  getAll: async () => {
    const res = await api.get('/events');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/events/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/events', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/events/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/events/${id}`);
    return res.data;
  },
};

// Templates
export const templateService = {
  getAll: async () => {
    const res = await api.get('/templates');
    return res.data;
  },
  getByIdOrKey: async (identifier) => {
    const res = await api.get(`/templates/${identifier}`);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/templates/${id}`, data);
    return res.data;
  },
  uploadAsset: async (formData) => {
    const res = await api.post('/templates/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

// Certificates
export const certificateService = {
  generateSingle: async (data) => {
    const res = await api.post('/certificates/generate', data);
    return res.data;
  },
  generateBulk: async (formData) => {
    const res = await api.post('/certificates/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getHistory: async (params = {}) => {
    const res = await api.get('/certificates/history', { params });
    return res.data;
  },
  revoke: async (certId) => {
    const res = await api.post(`/certificates/${certId}/revoke`);
    return res.data;
  },
  getDownloadUrl: (certId) => `${API_BASE_URL}/certificates/${certId}/download`,
  getBulkZipUrl: (filename) => `${API_BASE_URL}/certificates/bulk-zip/${filename}`,
  getSampleTemplateUrl: () => `${API_BASE_URL}/certificates/sample-template`,
  getQrUrl: (qrFilename) => `${API_BASE_URL}/certificates/qr/${qrFilename}`,
  getUploadUrl: (filename) => `${API_BASE_URL}/certificates/uploads/${filename}`,
};

// Public Verification (no auth)
export const verifyService = {
  verify: async (certId) => {
    const res = await api.get(`/verify/${certId}`);
    return res.data;
  },
};

export default api;
