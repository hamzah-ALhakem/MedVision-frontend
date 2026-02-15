// src/services/api.js
import axios from 'axios';

// 🟢 التغيير هنا: نقرأ الرابط من متغيرات البيئة
// في Vercel سيأخذ الرابط الحقيقي، وفي جهازك سيأخذ localhost
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
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