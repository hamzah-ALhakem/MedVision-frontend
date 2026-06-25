import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 1. استيراد هوك الترجمة
import Sidebar from './Sidebar'; // 2. استيراد مكون السايدبار المنفصل
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth(); // Read from AuthContext
  
  // 3. معرفة اللغة والاتجاه الحالي
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // توحيد صيغة الدور (lowercase) لتجنب مشاكل الأحرف الكبيرة
  const role = user?.role ? user.role.toLowerCase() : 'patient';

  return (
    // 4. ضبط اتجاه الصفحة ديناميكياً بناءً على اللغة
    <div 
      className={`min-h-screen bg-gray-50 flex text-dark ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} 
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      
      {/* 5. استدعاء السايدبار المترجم 
          key={i18n.language} -> يجبر المكون على إعادة البناء عند تغيير اللغة
      */}
      <Sidebar 
        key={i18n.language} 
        role={role} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content */}
      {/* 6. ضبط الهوامش (Margins) لتناسب السايدبار الثابت 
          إذا عربي: نترك مسافة يمين، إذا إنجليزي: نترك مسافة يسار
      */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isRTL ? 'md:mr-72' : 'md:ml-72'}`}>
        
        <Header 
          user={user} 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}