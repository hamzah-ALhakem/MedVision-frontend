import React, { createContext, useState, useContext, useEffect } from 'react';
import i18n from '../i18n';

const LanguageContext = createContext();

export { LanguageContext };

export const LanguageProvider = ({ children }) => {
  // قراءة اللغة المحفوظة أو الافتراضي "ar"
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'ar');

  // دالة تغيير اللغة
  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    localStorage.setItem('lang', newLang);
    i18n.changeLanguage(newLang);
  };

  // تغيير اتجاه الصفحة (dir) تلقائياً عند تغيير اللغة
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    if (i18n.language !== language) {
        i18n.changeLanguage(language);
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook مخصص لسهولة الاستخدام
export const useLanguage = () => useContext(LanguageContext);