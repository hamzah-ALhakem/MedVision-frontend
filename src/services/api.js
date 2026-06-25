// src/services/api.js
import axios from 'axios';
import { API_URL } from '../config/env';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Interceptors (لتمرير التوكن تلقائياً) ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- التعامل مع الأخطاء (مثل انتهاء الجلسة) ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // إذا انتهت صلاحية التوكن، نخرج المستخدم
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;