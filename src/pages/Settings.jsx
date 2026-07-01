import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Bell, Save, Mail, Phone, MapPin, Shield, Calendar, Globe, Languages, Camera } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

// 2. قاموس الترجمة (تم التحديث)
const translations = {
  ar: {
    tabs: { general: 'البيانات الشخصية', schedule: 'مواعيد العمل' },
    role: { doctor: 'طبيب', patient: 'مريض', admin: 'مسؤول' },
    labels: {
      fullName: 'الاسم الكامل',
      phone: 'رقم الهاتف',
      address: 'العنوان',
      clinicAddress: 'عنوان العيادة',
      specialty: 'التخصص',
      email: 'البريد الإلكتروني',
      currentPass: 'كلمة المرور الحالية',
      newPass: 'كلمة المرور الجديدة',
      confirmPass: 'تأكيد كلمة المرور',
      languageSettings: 'إعدادات اللغة', // جديد
      appLanguage: 'لغة التطبيق' // جديد
    },
    schedule: {
      hintTitle: 'تعليمات الجدول:',
      hintDesc: 'اضغط على الساعة لتحديد الوقت بدقة.',
      start: 'بداية العمل',
      end: 'نهاية العمل'
    },
    buttons: {
      saveProfile: 'حفظ التغييرات',
      updatePass: 'تحديث كلمة المرور',
      saveSchedule: 'حفظ الجدول'
    },
    alerts: {
      passMismatch: '❌ كلمة المرور الجديدة غير متطابقة',
      profileSuccess: '✅ تم حفظ البيانات بنجاح!',
      profileError: '❌ فشل الحفظ، تأكد من الاتصال.',
      passSuccess: '✅ تم تغيير كلمة المرور بنجاح',
      passError: '❌ فشل تغيير كلمة المرور',
      scheduleSuccess: '✅ تم تحديث جدول العيادة بنجاح!',
      scheduleError: '❌ فشل تحديث الجدول'
    },
    placeholders: {
      pass: '••••••••'
    }
  },
  en: {
    tabs: { general: 'Profile Settings', schedule: 'Work Schedule' },
    role: { doctor: 'Doctor', patient: 'Patient', admin: 'Admin' },
    labels: {
      fullName: 'Full Name',
      phone: 'Phone Number',
      address: 'Address',
      clinicAddress: 'Clinic Address',
      specialty: 'Specialty',
      email: 'Email Address',
      currentPass: 'Current Password',
      newPass: 'New Password',
      confirmPass: 'Confirm Password',
      languageSettings: 'Language Settings', // New
      appLanguage: 'App Language' // New
    },
    schedule: {
      hintTitle: 'Schedule Instructions:',
      hintDesc: 'Click on the time to select specific hours.',
      start: 'Start Time',
      end: 'End Time'
    },
    buttons: {
      saveProfile: 'Save Changes',
      updatePass: 'Update Password',
      saveSchedule: 'Save Schedule'
    },
    alerts: {
      passMismatch: '❌ New passwords do not match',
      profileSuccess: '✅ Profile saved successfully!',
      profileError: '❌ Save failed, check connection.',
      passSuccess: '✅ Password changed successfully',
      passError: '❌ Password change failed',
      scheduleSuccess: '✅ Clinic schedule updated successfully!',
      scheduleError: '❌ Failed to update schedule'
    },
    placeholders: {
      pass: '••••••••'
    }
  }
};

const daysMap = {
  ar: { 'Saturday': 'السبت', 'Sunday': 'الأحد', 'Monday': 'الاثنين', 'Tuesday': 'الثلاثاء', 'Wednesday': 'الأربعاء', 'Thursday': 'الخميس', 'Friday': 'الجمعة' },
  en: { 'Saturday': 'Saturday', 'Sunday': 'Sunday', 'Monday': 'Monday', 'Tuesday': 'Tuesday', 'Wednesday': 'Wednesday', 'Thursday': 'Thursday', 'Friday': 'Friday' }
};

export default function Settings() {
  // 3. استخراج دالة التبديل من السياق
  const { t: i18nT, i18n } = useTranslation();
  const language = i18n.language || 'ar';
  const isRTL = language === 'ar';
  const t = translations[language] || translations.ar;

  const [activeTab, setActiveTab] = useState('general');
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  
  const [fullNameEn, setFullNameEn] = useState(''); 
  const [fullNameAr, setFullNameAr] = useState(''); 
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    email: '',
    phone: '',
    address: '',
    specialtyEn: '',
    specialtyAr: '',
    image: null
  });



  const daysOfWeek = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  const [schedule, setSchedule] = useState(
    daysOfWeek.map(day => ({ day, startTime: '09:00', endTime: '17:00', isActive: false }))
  );

  // --- 1. Load Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/users/profile');
        const data = res.data;

        const fNameEn = data.firstNameEn || '';
        const lNameEn = data.lastNameEn || '';
        setFullNameEn(`${fNameEn} ${lNameEn}`.trim());

        const fNameAr = data.firstNameAr || '';
        const lNameAr = data.lastNameAr || '';
        setFullNameAr(`${fNameAr} ${lNameAr}`.trim());
        
        const role = data.role ? data.role.toLowerCase() : 'patient';
        setUserRole(role);

        setProfile({
            email: data.email,
            phone: data.phone || '',
            address: data.clinicAddress || '', 
            specialtyEn: data.specialtyEn || '',
            specialtyAr: data.specialtyAr || '',
            image: data.image || null
        });

        if (role === 'doctor') {
            const scheduleRes = await api.get('/schedule/my-schedule');
            
            if (scheduleRes.data && scheduleRes.data.length > 0) {
                setSchedule(prev => prev.map(item => {
                    const dbItem = scheduleRes.data.find(d => d.day === item.day);
                    if (dbItem) {
                        return { 
                            ...item, 
                            startTime: (dbItem.startTime || '09:00').slice(0,5), 
                            endTime: (dbItem.endTime || '17:00').slice(0,5),     
                            isActive: dbItem.isActive 
                        };
                    }
                    return item;
                }));
            }
        }
      } catch (err) { console.error("Profile Load Error", err); }
    };
    fetchData();
  }, []);

  // --- 2. Save Profile ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const namePartsEn = fullNameEn.trim().split(' ');
        const firstNameEn = namePartsEn[0];
        const lastNameEn = namePartsEn.slice(1).join(' ') || '';

        const namePartsAr = fullNameAr.trim().split(' ');
        const firstNameAr = namePartsAr[0];
        const lastNameAr = namePartsAr.slice(1).join(' ') || '';

        await api.put('/users/profile', {
            firstNameEn,
            firstNameAr,
            lastNameEn,
            lastNameAr,
            phone: profile.phone,
            address: profile.address,
            specialtyEn: profile.specialtyEn,
            specialtyAr: profile.specialtyAr,
            image: profile.image
        });
        setAlert({ type: 'success', message: t.alerts.profileSuccess });
    } catch (error) {
        setAlert({ type: 'error', message: t.alerts.profileError });
    } finally {
        setIsLoading(false);
    }
  };

  // --- 2.5 Image Change ---
  const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setProfile({ ...profile, image: reader.result });
          };
          reader.readAsDataURL(file);
      }
  };



  // --- 4. Save Schedule ---
  const handleSaveSchedule = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          await api.post('/schedule', { schedule });
          setAlert({ type: 'success', message: t.alerts.scheduleSuccess });
      } catch (err) { 
          console.error(err);
          setAlert({ type: 'error', message: t.alerts.scheduleError }); 
      }
      finally { setIsLoading(false); }
  };

  const toggleDay = (index) => {
      const newSchedule = [...schedule];
      newSchedule[index].isActive = !newSchedule[index].isActive;
      setSchedule(newSchedule);
  };

  const updateTime = (index, field, value) => {
      const newSchedule = [...schedule];
      newSchedule[index][field] = value;
      setSchedule(newSchedule);
  };

  // دالة مساعدة لتغيير اللغة فقط إذا لزم الأمر
  const handleLanguageSwitch = (targetLang) => {
      if (language !== targetLang) {
          i18n.changeLanguage(targetLang);
          localStorage.setItem('lang', targetLang);
          document.documentElement.dir = targetLang === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = targetLang;
      }
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button 
        type="button" 
        onClick={() => { setActiveTab(id); setAlert({ type: '', message: '' }); }} 
        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all w-full md:w-auto
        ${activeTab === id 
            ? 'bg-primary text-white shadow-lg shadow-primary/30' 
            : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-primary'}`}
    >
        <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary to-blue-600 opacity-10"></div>
        <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 pt-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-28 h-28 rounded-3xl bg-white border-4 border-white shadow-md flex items-center justify-center text-4xl font-bold text-primary uppercase overflow-hidden relative">
                    {profile.image ? (
                        <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        (isRTL ? fullNameAr : fullNameEn) ? (isRTL ? fullNameAr : fullNameEn)[0]?.toUpperCase() : <User size={40} />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                    </div>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/png, image/jpeg"
                    className="hidden"
                    onChange={handleImageChange}
                />
            </div>
            <div className={`flex-1 text-center pb-2 ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
                <h1 className="text-2xl font-bold text-dark">{isRTL ? fullNameAr : fullNameEn || '...'}</h1>
                <p className="text-gray-500 font-medium capitalize mt-1 flex items-center justify-center md:justify-start gap-1">
                    {userRole === 'doctor' 
                        ? <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-bold">{t.role.doctor}</span> 
                        : <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-xs font-bold">{t.role.patient}</span>
                    }
                </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <TabButton id="general" label={t.tabs.general} icon={User} />
                {userRole === 'doctor' && <TabButton id="schedule" label={t.tabs.schedule} icon={Calendar} />}
            </div>
        </div>
      </div>

      {/* Forms */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[400px]">
        
        {alert.message && (
          <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-bold mb-4 animate-in zoom-in-95
            ${alert.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {alert.message}
          </div>
        )}

        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-8 animate-in fade-in">
            <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                <Input label={t.labels.fullName} value={isRTL ? fullNameAr : fullNameEn} onChange={(e) => isRTL ? setFullNameAr(e.target.value) : setFullNameEn(e.target.value)} icon={User} />
                <Input label={t.labels.phone} value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} icon={Phone} />
                </div>
                <Input label={userRole === 'doctor' ? t.labels.clinicAddress : t.labels.address} value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} icon={MapPin} />
                {userRole === 'doctor' && (<Input label={t.labels.specialty} value={isRTL ? profile.specialtyAr : profile.specialtyEn} onChange={(e) => isRTL ? setProfile({...profile, specialtyAr: e.target.value}) : setProfile({...profile, specialtyEn: e.target.value})} icon={Shield} />)}
                <div className="flex justify-end pt-4"><Button type="submit" isLoading={isLoading} className="w-full md:w-auto px-8"><Save size={18} className={isRTL ? 'ml-2' : 'mr-2'} /> {t.buttons.saveProfile}</Button></div>
            </form>

            {/* 🔥 قسم إعدادات اللغة الجديد */}
            <div className="border-t border-gray-100 pt-8">
                <h3 className="text-lg font-bold text-dark mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-primary"/>
                    {t.labels.languageSettings}
                </h3>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-gray-50 p-6 rounded-2xl">
                    <div className="flex-1">
                        <p className="font-bold text-dark text-sm mb-1">{t.labels.appLanguage}</p>
                        <p className="text-xs text-gray-500">اختر اللغة المفضلة لواجهة التطبيق / Choose your preferred interface language</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
                        <button
                            type="button"
                            onClick={() => handleLanguageSwitch('ar')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300
                            ${language === 'ar' 
                                ? 'bg-primary text-white shadow-md' 
                                : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <span>العربية</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleLanguageSwitch('en')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300
                            ${language === 'en' 
                                ? 'bg-primary text-white shadow-md' 
                                : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <span>English</span>
                        </button>
                    </div>
                </div>
            </div>
          </div>
        )}



        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && userRole === 'doctor' && (
            <form onSubmit={handleSaveSchedule} className="space-y-6 animate-in fade-in">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-sm text-blue-700 mb-4 flex items-start gap-2">
                    <Bell size={16} className="mt-0.5 shrink-0"/>
                    <div>
                        <p className="font-bold mb-1">{t.schedule.hintTitle}</p>
                        <p>{t.schedule.hintDesc}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {schedule.map((day, index) => (
                        <div key={day.day} className={`flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border transition-all 
                            ${day.isActive ? 'border-primary/30 bg-primary/5 shadow-sm' : 'border-gray-100 bg-white opacity-60 hover:opacity-100'}`}>
                            
                            <label className="flex items-center gap-3 w-40 cursor-pointer">
                                <input type="checkbox" checked={day.isActive} onChange={() => toggleDay(index)} className="w-5 h-5 accent-primary cursor-pointer" />
                                <span className={`font-bold ${day.isActive ? 'text-primary' : 'text-gray-400'}`}>
                                    {daysMap[language][day.day] || day.day}
                                </span>
                            </label>
                            
                            <div className="flex items-center gap-3 flex-1">
                                <div className="relative flex-1">
                                    <input 
                                        type="time" 
                                        value={day.startTime} 
                                        onChange={(e) => updateTime(index, 'startTime', e.target.value)}
                                        disabled={!day.isActive}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-lg font-bold outline-none focus:border-primary disabled:bg-gray-50 text-center cursor-pointer"
                                    />
                                    <span className="text-[10px] text-gray-400 text-center block mt-1">{t.schedule.start}</span>
                                </div>
                                <span className="text-gray-300 font-bold mt-[-15px]">:</span>
                                <div className="relative flex-1">
                                    <input 
                                        type="time" 
                                        value={day.endTime} 
                                        onChange={(e) => updateTime(index, 'endTime', e.target.value)}
                                        disabled={!day.isActive}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-lg font-bold outline-none focus:border-primary disabled:bg-gray-50 text-center cursor-pointer"
                                    />
                                    <span className="text-[10px] text-gray-400 text-center block mt-1">{t.schedule.end}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-50">
                    <Button type="submit" isLoading={isLoading} className="w-full md:w-auto px-8">{t.buttons.saveSchedule}</Button>
                </div>
            </form>
        )}

      </div>
    </div>
  );
}