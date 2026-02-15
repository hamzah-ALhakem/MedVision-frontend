import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Sidebar Items
      home: "Home",
      dashboard: "Dashboard",
      screening: "AI Screening",
      labs: "Labs",
      manageLabs: "Manage Labs",
      appointments: "Appointments",
      messages: "Messages",
      settings: "Settings",
      logout: "Logout",
      
      // Header Items
      welcome: "Welcome",
      search: "Search..."
    }
  },
  ar: {
    translation: {
      // عناصر القائمة الجانبية
      home: "الرئيسية",
      dashboard: "لوحة التحكم",
      screening: "الفحص الذكي",
      labs: "المعامل",
      manageLabs: "إدارة المعامل",
      appointments: "المواعيد",
      messages: "الرسائل",
      settings: "الإعدادات",
      logout: "تسجيل خروج",

      // عناصر الهيدر
      welcome: "مرحباً",
      search: "بحث..."
    }
  }
};

i18n
  .use(LanguageDetector) // 1. تفعيل الكاشف لحفظ اللغة
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "ar", // اللغة البديلة
    detection: {
      order: ['localStorage', 'htmlTag'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;