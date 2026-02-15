/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0070CD', // Vezeeta Blue
          hover: '#005bb5',
          light: '#EBF5FF'
        },
        secondary: '#EBF5FF',
        accent: '#FF3B30',
        dark: '#1A1A1A',
        grey: {
          50: '#F7F8FA',
          100: '#EDEEF0',
          200: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      },
      // هنا الحل السحري: إعدادات الحاوية الموحدة
      container: {
        center: true, // توسيط المحتوى دائماً
        padding: {
          DEFAULT: '1rem', // مسافة داخلية 16px للموبايل
          sm: '2rem',      // مسافة أكبر للتابلت
          lg: '4rem',      // مسافة أكبر للشاشات الكبيرة
          xl: '5rem',      // مسافة مريحة للشاشات الضخمة
        },
        screens: {
          '2xl': '1400px', // أقصى عرض للموقع لا يتجاوزه أبداً
        },
      },
    },
  },
  plugins: [],
}