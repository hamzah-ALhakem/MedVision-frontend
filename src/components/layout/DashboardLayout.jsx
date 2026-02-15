import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, MessageSquare, FileText, 
  Settings, LogOut, FlaskConical, Menu, X, Shield 
} from 'lucide-react';
import Header from './Header';
import logo from '../../assets/logo.png';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // قراءة بيانات المستخدم
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role ? user.role.toLowerCase() : 'patient';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // --- تعريف القوائم بناءً على الدور ---
  const getNavLinks = () => {
    // 1. روابط الأدمن (فقط لوحة التحكم)
    if (role === 'admin') {
      return [
        { name: 'لوحة الإدارة', path: '/admin-dashboard', icon: Shield },
      ];
    }

    // 2. روابط الطبيب
    if (role === 'doctor') {
      return [
        { name: 'الرئيسية', path: '/doctor-dashboard', icon: LayoutDashboard },
        { name: 'المواعيد', path: '/appointments', icon: Calendar },
        { name: 'الرسائل', path: '/messages', icon: MessageSquare },
        { name: 'الإعدادات', path: '/settings', icon: Settings },
      ];
    }

    // 3. روابط المريض (الافتراضي)
    return [
      { name: 'الرئيسية', path: '/patient-dashboard', icon: LayoutDashboard },
      { name: 'الأطباء', path: '/patient-dashboard', icon: Calendar }, // يمكن توجيهها للبحث
      { name: 'الفحص الذكي', path: '/screening', icon: FileText },
      // { name: 'المعامل', path: '/labs', icon: FlaskConical },
      { name: 'حجوزاتي', path: '/appointments', icon: Calendar },
      { name: 'الرسائل', path: '/messages', icon: MessageSquare },
      { name: 'الإعدادات', path: '/settings', icon: Settings },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-surface flex" dir="rtl">
      
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-dark/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 right-0 h-screen w-72 bg-white border-l border-gray-100 shadow-xl md:shadow-none z-50 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="MedVision Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-primary">MedVision</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400">
            <X size={24} />
          </button>
        </div>

        <nav className="px-4 py-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium
                ${isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 translate-x-[-5px]' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-primary'}`}
              >
                <Icon size={20} />
                {link.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-8 right-0 left-0 px-6">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-bold"
          >
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}