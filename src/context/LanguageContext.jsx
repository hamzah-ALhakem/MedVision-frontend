import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // قراءة اللغة المحفوظة أو الافتراضي "ar"
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'ar');

  // دالة تغيير اللغة
  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  // تغيير اتجاه الصفحة (dir) تلقائياً عند تغيير اللغة
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook مخصص لسهولة الاستخدام
export const useLanguage = () => useContext(LanguageContext);