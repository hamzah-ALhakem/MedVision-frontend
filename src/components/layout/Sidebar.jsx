import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Stethoscope, Calendar, MessageSquare, 
  LogOut, Settings, X, FlaskConical, ShieldCheck, Languages
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export default function Sidebar({ role, isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const toggleLanguage = () => {
    const newLang = isRTL ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  // ✅ تم التعديل: استخدام screening.label
  const patientLinks = [
    { name: t('home'), path: '/patient-dashboard', icon: LayoutDashboard },
    { name: t('screening.label'), path: '/screening', icon: Stethoscope }, 
    { name: t('messages'), path: '/messages', icon: MessageSquare },
    { name: t('settings'), path: '/settings', icon: Settings },
  ];

  // ✅ تم التعديل: إضافة الفحص الذكي للطبيب
  const doctorLinks = [
    { name: t('dashboard'), path: '/doctor-dashboard', icon: LayoutDashboard },
    { name: t('appointments'), path: '/appointments', icon: Calendar },
    { name: t('screening.label'), path: '/screening', icon: Stethoscope }, // تمت الإضافة هنا
    { name: t('messages'), path: '/messages', icon: MessageSquare },
    { name: t('settings'), path: '/settings', icon: Settings },
  ];

  const adminLinks = [
    { name: t('dashboard'), path: '/admin-dashboard', icon: ShieldCheck },
    { name: t('manageLabs'), path: '/labs', icon: FlaskConical },
    { name: t('settings'), path: '/settings', icon: Settings },
  ];

  const links = role === 'admin' ? adminLinks : (role === 'doctor' ? doctorLinks : patientLinks);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-dark/50 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300
        ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside className={twMerge(`
        fixed top-0 bottom-0 z-50 w-72 bg-white text-dark shadow-2xl md:shadow-none border-e border-gray-100 flex flex-col transition-transform duration-300 ease-in-out
        ${isRTL ? 'right-0' : 'left-0'} 
        ${isOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')} 
        md:translate-x-0 
      `)}>
        
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Stethoscope size={24} />
            </div>
            <span className="text-xl font-bold text-primary tracking-tight">MedVision</span>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group font-bold text-sm
                ${isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-primary'}`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary transition-colors'} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-50 space-y-2 bg-gray-50/50">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-dark hover:bg-white border border-transparent hover:border-gray-200 transition-all font-bold text-sm"
          >
            <Languages size={18} className="text-blue-500"/>
            <span>{isRTL ? 'English' : 'العربية'}</span>
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
          >
            <LogOut size={18} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}