import React, { useState, useEffect, useRef } from 'react';
import { Bell, Menu, Check, MessageSquare, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 1. استيراد الترجمة
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';

export default function Header({ user, onMenuClick }) {
  const navigate = useNavigate();
  const socket = useSocket();
  
  // 2. تفعيل هوك الترجمة
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const firstName = user?.firstName || 'Guest';

  // دالة الصوت (رابط خارجي)
  const playSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log("Audio interaction blocked"));
    } catch (e) { console.error("Audio Play Error", e); }
  };

  // 3. جلب الإشعارات والاستماع
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        const unreadOnly = res.data.filter(n => !n.isRead);
        setNotifications(unreadOnly);
      } catch (err) { console.error("Notif Error", err); }
    };
    fetchNotifications();

    if (socket) {
      socket.on("receive_notification", (newNotif) => {
        // التحقق: هل الشات مفتوح؟
        if (newNotif.type === 'message') {
          const currentChatId = sessionStorage.getItem('activeChatId');
          if (currentChatId && parseInt(currentChatId) === parseInt(newNotif.relatedId)) {
            return; // تجاهل الإشعار
          }
        }

        console.log("🔔 Notification:", newNotif);
        playSound();
        setNotifications((prev) => [newNotif, ...prev]);
      });

      socket.on("refresh_notifications", () => {
        fetchNotifications(); // إعادة تحميل القائمة
      });
    }

    return () => {
      if (socket) {
        socket.off("receive_notification");
        socket.off("refresh_notifications");
      }
    };
  }, [socket]);

  // Click Outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Handle Click
  const handleNotificationClick = async (notif) => {
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    setShowDropdown(false);

    if (notif.type === 'message' && notif.relatedId) {
      navigate('/messages', {
        state: { openChatWithId: notif.relatedId }
      });
    }
    else if (notif.type === 'appointment') {
      navigate('/appointments');
    }

    try {
      await api.put(`/notifications/${notif.id}/read`);
    } catch (e) { console.error(e); }
  };

  const handleMarkAllRead = async () => {
    setNotifications([]);
    setShowDropdown(false);
    try { await api.put('/notifications/read'); } catch (e) { }
  };

  // ترجمة الدور الوظيفي
  const getUserRole = () => {
    if (!user?.role) return '';
    const roleKey = user.role.toLowerCase(); // patient, doctor, admin
    // نستخدم المفاتيح الموجودة في ملف الترجمة (t('roles.patient'))
    // إذا لم تكن موجودة في الترجمة، نعرضها كما هي
    return t(`roles.${roleKey}`) || roleKey; 
  };

  return (
    <header className="bg-white sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b border-gray-100 shadow-sm h-20">

      {/* Left */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden text-gray-500 hover:text-primary transition-colors p-2 bg-gray-50 rounded-xl">
          <Menu size={24} />
        </button>
        <div className="hidden md:block">
          {/* ترجمة الترحيب */}
          <h2 className="text-lg font-bold text-dark flex items-center gap-2">
            {t('header.welcome')}، <span className="text-primary">{firstName}</span>
          </h2>
          {/* تاريخ ديناميكي حسب اللغة */}
          <p className="text-xs text-gray-400 font-medium">
            {new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`relative w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300
            ${showDropdown ? 'bg-primary text-white border-primary shadow-lg scale-110' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'}`}
          >
            <Bell size={20} className={notifications.length > 0 ? "animate-swing" : ""} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                {notifications.length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className={`absolute mt-4 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 z-50 ${isRTL ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}`}>
              <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                {/* ترجمة عنوان الإشعارات */}
                <h3 className="font-bold text-dark text-sm">{t('header.notifications')} ({notifications.length})</h3>
                {notifications.length > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                    <Check size={14} /> {t('header.markAllRead')}
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className="p-4 border-b border-gray-50 cursor-pointer transition-all hover:bg-blue-50/50 flex gap-3 items-start bg-white hover:pl-6"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100
                                ${notif.type === 'message' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>
                        {notif.type === 'message' ? <MessageSquare size={18} /> : <Calendar size={18} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-dark leading-snug">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1.5 flex justify-between items-center">
                          <span>{new Date(notif.created_at).toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-primary font-bold text-[9px] bg-primary/5 px-2 py-0.5 rounded-full">{t('header.new')}</span>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                    <Bell size={24} className="opacity-30 mb-2" />
                    <p className="text-sm font-medium">{t('header.noNotifications')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 ps-4 border-s border-gray-100 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/settings')}>
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold border-2 border-white shadow-sm">
            {firstName[0]}
          </div>
          <div className="hidden lg:block text-start">
            <p className="text-xs font-bold text-dark">{firstName}</p>
            {/* ترجمة الدور الوظيفي */}
            <p className="text-[10px] text-gray-400 font-medium capitalize">
              {getUserRole()}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}