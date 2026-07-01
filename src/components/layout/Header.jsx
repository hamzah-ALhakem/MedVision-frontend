import React, { useState, useEffect, useRef } from 'react';
import { Bell, Menu, Check, MessageSquare, Calendar, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePusher } from '../../context/PusherContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Header({ user, onMenuClick }) {
  const navigate = useNavigate();
  const { channel } = usePusher();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false); // قائمة المستخدم المصغرة
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  const firstName = isRTL ? (user?.firstNameAr || 'Guest') : (user?.firstNameEn || 'Guest');

  // دالة الصوت
  const playSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => {});
    } catch (e) { }
  };

  // جلب الإشعارات
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      // نفترض أن الباك إند يعيد الإشعارات مرتبة، سنعيد ترتيبها للتأكيد
      const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const unreadOnly = sorted.filter(n => !n.isRead);
      setNotifications(unreadOnly);
    } catch (err) { console.error("Notif Error", err); }
  };

  useEffect(() => {
    fetchNotifications();

    if (channel) {
      channel.bind("receive_notification", (newNotif) => {
        if (newNotif.type === 'message') {
          const currentChatId = sessionStorage.getItem('activeChatId');
          if (currentChatId && parseInt(currentChatId) === parseInt(newNotif.relatedId)) return;
        }
        playSound();
        setNotifications((prev) => [newNotif, ...prev]);
      });

      channel.bind("refresh_notifications", fetchNotifications);
    }

    return () => {
      if (channel) {
        channel.unbind("receive_notification");
        channel.unbind("refresh_notifications");
      }
    };
  }, [channel]);

  // Click Outside hooks
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Actions
  const handleNotificationClick = async (notif) => {
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    setShowDropdown(false);

    if (notif.type === 'message' && notif.relatedId) {
      navigate('/messages', { state: { openChatWithId: notif.relatedId } });
    } else if (notif.type === 'appointment') {
      navigate('/appointments');
    }

    try { await api.put(`/notifications/${notif.id}/read`); } catch (e) { }
  };

  const handleMarkAllRead = async () => {
    setNotifications([]);
    setShowDropdown(false);
    try { await api.put('/notifications/read'); } catch (e) { }
  };

  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  };

  // --- Helper: Group Notifications ---
  const groupedNotifications = notifications.reduce((acc, notif) => {
    const isToday = new Date(notif.created_at).toDateString() === new Date().toDateString();
    if (isToday) acc.today.push(notif);
    else acc.earlier.push(notif);
    return acc;
  }, { today: [], earlier: [] });

  return (
    // 1. Glass Effect Header
    <header className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b border-gray-100/50 bg-white/80 backdrop-blur-md transition-all duration-300">

      {/* Left: Mobile Menu & Greeting */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick} 
          className="md:hidden w-10 h-10 flex items-center justify-center text-gray-500 hover:text-primary transition-all bg-white border border-gray-200 hover:border-primary/30 rounded-xl active:scale-95"
        >
          <Menu size={22} />
        </button>

        <div className="hidden md:block">
          {/* 9. Dynamic Greeting Typography */}
          <h2 className="text-xl flex items-center gap-2 tracking-tight">
            <span className="font-light text-gray-400">{t('welcome')},</span>
            <span className="font-bold text-dark">{firstName}</span>
          </h2>
          {/* 10. Unified Micro-type */}
          <p className="text-xs text-gray-400 font-medium mt-0.5 opacity-80">
            {new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 md:gap-5">
        
        {/* --- Notifications --- */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95
            ${showDropdown 
              ? 'bg-primary text-white shadow-lg shadow-primary/20' 
              : 'bg-white text-gray-500 border border-gray-100 hover:border-primary/20 hover:text-primary'}`}
          >
            <Bell size={20} className={notifications.length > 0 ? "animate-swing" : ""} />
            {notifications.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className={`absolute top-14 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 z-50 ${isRTL ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}`}>
              <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30 backdrop-blur-sm">
                <h3 className="font-bold text-dark text-sm">{t('header.notifications')} <span className="text-gray-400 text-xs font-normal">({notifications.length})</span></h3>
                {notifications.length > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                    <Check size={14} /> {t('header.markAllRead')}
                  </button>
                )}
              </div>

              <div className="max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar p-2">
                {notifications.length > 0 ? (
                  <>
                    {/* 4. Section Dividers */}
                    {groupedNotifications.today.length > 0 && (
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-2 mb-1">{isRTL ? 'اليوم' : 'Today'}</p>
                    )}
                    {groupedNotifications.today.map((notif) => (
                      <NotificationItem key={notif.id} notif={notif} onClick={handleNotificationClick} isRTL={isRTL} t={t} />
                    ))}

                    {groupedNotifications.earlier.length > 0 && (
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-2 mt-2 mb-1">{isRTL ? 'سابقاً' : 'Earlier'}</p>
                    )}
                    {groupedNotifications.earlier.map((notif) => (
                      <NotificationItem key={notif.id} notif={notif} onClick={handleNotificationClick} isRTL={isRTL} t={t} />
                    ))}
                  </>
                ) : (
                  <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                    <Bell size={24} className="opacity-20 mb-3" />
                    <p className="text-sm font-medium opacity-60">{t('header.noNotifications')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- User Profile --- */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 ps-4 border-s border-gray-200 cursor-pointer group hover:opacity-80 transition-all"
          >
            {/* 7. Improved Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-secondary to-blue-100 flex items-center justify-center text-primary font-bold border-2 border-white shadow-sm ring-1 ring-gray-100 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                {user?.image ? (
                   <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   firstName[0]?.toUpperCase()
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            
            <div className="hidden lg:block text-start">
              <p className="text-xs font-bold text-dark group-hover:text-primary transition-colors">{firstName}</p>
              <p className="text-[10px] text-gray-400 font-medium capitalize">{user?.role}</p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 hidden lg:block ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* 8. User Mini Menu */}
          {showUserMenu && (
            <div className={`absolute top-14 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 z-50 ${isRTL ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}`}>
              <div className="p-1">
                <button onClick={() => { navigate('/settings'); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600 hover:text-dark transition-colors">
                  <Settings size={16} /> {t('settings')}
                </button>
                <div className="h-px bg-gray-50 my-1"></div>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm font-medium text-red-500 transition-colors">
                  <LogOut size={16} /> {t('logout')}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

// Sub-component for notification item to keep main code clean
const NotificationItem = ({ notif, onClick, isRTL, t }) => (
  <div
    onClick={() => onClick(notif)}
    className="relative p-3 mb-1 rounded-xl cursor-pointer transition-all hover:bg-blue-50/50 flex gap-3 items-start group"
  >
    {/* 5. Unread Indicator Bar */}
    {!notif.isRead && (
      <div className={`absolute top-3 bottom-3 w-1 bg-primary rounded-full ${isRTL ? 'right-0' : 'left-0'}`}></div>
    )}

    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100 transition-colors group-hover:bg-white
      ${notif.type === 'message' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>
      {notif.type === 'message' ? <MessageSquare size={18} /> : <Calendar size={18} />}
    </div>
    
    <div className={`flex-1 ${isRTL ? 'pr-2' : 'pl-2'}`}>
      <p className={`text-xs font-bold leading-snug ${!notif.isRead ? 'text-dark' : 'text-gray-500'}`}>
        {notif.message}
      </p>
      <div className="flex justify-between items-center mt-1.5">
        <span className="text-[10px] text-gray-400 font-medium">
          {new Date(notif.created_at).toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
        {!notif.isRead && (
          <span className="text-[9px] font-extrabold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
            {t('header.new') || 'NEW'}
          </span>
        )}
      </div>
    </div>
  </div>
);