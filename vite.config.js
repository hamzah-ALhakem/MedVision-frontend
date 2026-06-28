import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // أي رابط يبدأ بـ /api-ai سيتم تحويله لسيرفر الذكاء الاصطناعي
      '/api-ai': {
        target: 'https://breast-api-deploy.onrender.com', // رابط سيرفر صديقك
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-ai/, ''), // نحذف البادئة قبل الإرسال
      },
    },
  },
  // ─── Vitest configuration ───────────────────────────────────────────────────
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    css: false,
    // Don't try to transform node_modules except specific packages
    server: {
      deps: {
        inline: ['@testing-library/user-event'],
      },
    },
  },
})