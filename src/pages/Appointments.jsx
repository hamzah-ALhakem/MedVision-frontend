import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, Loader2, Check, X, FileText, User } from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const translations = {
  ar: {
    title: 'مواعيدي ',
    subtitle: 'تتبع حالة حجوزاتك وزياراتك الطبية',
    bookBtn: 'حجز موعد جديد',
    alert: 'يرجى اختيار طبيب من الصفحة الرئيسية للحجز',
    tabs: { upcoming: 'المواعيد القادمة', past: 'السجل السابق' },
    status: { confirmed: 'مؤكد', pending: 'قيد الانتظار', cancelled: 'ملغي', completed: 'مكتمل' },
    reason: 'سبب الزيارة',
    actions: { accept: 'قبول', reject: 'رفض' },
    empty: { title: 'لا توجد مواعيد', desc: 'لم يتم العثور على حجوزات في هذه القائمة.' },
    error: 'فشل تحديث الحالة'
  },
  en: {
    title: 'My Appointments ',
    subtitle: 'Track your bookings and medical visits',
    bookBtn: 'Book New Appointment',
    alert: 'Please select a doctor from the home page to book.',
    tabs: { upcoming: 'Upcoming', past: 'History' },
    status: { confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled', completed: 'Completed' },
    reason: 'Visit Reason',
    actions: { accept: 'Accept', reject: 'Reject' },
    empty: { title: 'No Appointments', desc: 'No bookings found in this list.' },
    error: 'Failed to update status'
  }
};

export default function Appointments() {
  const { language } = useLanguage();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); 
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isPatient = user.role === 'patient';

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error("Failed to fetch appointments", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    setActionLoading(id);
    try {
        await api.put(`/appointments/${id}/status`, { status: newStatus });
        setAppointments(prev => prev.map(apt => 
            apt.id === id ? { ...apt, status: newStatus } : apt
        ));
    } catch (err) {
        alert(t.error);
    } finally {
        setActionLoading(null);
    }
  };

  const filtered = appointments.filter(apt => {
    const aptDate = new Date(apt.appointment_date);
    const today = new Date();
    today.setHours(0,0,0,0);
    aptDate.setHours(0,0,0,0);

    if (activeTab === 'upcoming') {
        if (apt.status === 'pending') return true;
        return aptDate >= today && apt.status !== 'cancelled' && apt.status !== 'completed';
    } else {
        return (aptDate < today && apt.status !== 'pending') || apt.status === 'cancelled' || apt.status === 'completed';
    }
  });

  const StatusBadge = ({ status }) => {
    const styles = {
      confirmed: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-orange-50 text-orange-700 border-orange-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
      completed: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.completed}`}>
        {t.status[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-dark">{t.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.subtitle}</p>
        </div>
        
        
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100/80 rounded-xl w-fit">
        <button 
            onClick={() => setActiveTab('upcoming')} 
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
            {t.tabs.upcoming}
        </button>
        <button 
            onClick={() => setActiveTab('past')} 
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'past' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
            {t.tabs.past}
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
        ) : filtered.length > 0 ? (
          filtered.map((apt) => (
            <div key={apt.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Date Ticket */}
                <div className="flex-shrink-0 flex lg:flex-col items-center justify-center gap-2 bg-blue-50/50 rounded-xl p-4 lg:w-24 border border-blue-100/50">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    {new Date(apt.appointment_date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' })}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {new Date(apt.appointment_date).getDate()}
                  </span>
                  <span className="text-xs text-blue-400 font-medium">
                    {new Date(apt.appointment_date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' })}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-dark flex items-center gap-2">
                           {isPatient 
                                ? (language === 'ar' ? `د. ${apt.first_name} ${apt.last_name}` : `Dr. ${apt.first_name} ${apt.last_name}`)
                                : `${apt.first_name} ${apt.last_name}`
                           }
                        </h3>
                        <p className="text-sm text-gray-400 font-medium flex items-center gap-1.5 mt-1">
                            <User size={14}/>
                            {isPatient ? apt.specialty : (apt.gender === 'Male' ? (language === 'ar' ? 'ذكر' : 'Male') : (language === 'ar' ? 'أنثى' : 'Female'))}
                        </p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                    <div className="flex items-center gap-2 font-medium">
                        <Clock size={16} className="text-primary"/> 
                        {apt.appointment_time.slice(0, 5)}
                    </div>
                    {apt.clinic_address && (
                        <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-primary"/> 
                            <span className="truncate max-w-[200px]">{apt.clinic_address}</span>
                        </div>
                    )}
                  </div>

                  {apt.reason && (
                      <div className="text-xs text-gray-500 flex items-start gap-2 px-1">
                          <FileText size={14} className="mt-0.5 text-gray-400"/>
                          <span><span className="font-bold">{t.reason}:</span> {apt.reason}</span>
                      </div>
                  )}
                </div>

                {/* Actions (Doctor Only) */}
                {!isPatient && apt.status === 'pending' && (
                    <div className="flex lg:flex-col gap-2 pt-4 lg:pt-0 lg:ltr:border-l lg:rtl:border-r border-gray-100 justify-center min-w-[140px]">
                        <button 
                          onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                          disabled={actionLoading === apt.id}
                          className="flex-1 py-2 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
                        >
                          {actionLoading === apt.id ? <Loader2 size={16} className="animate-spin"/> : <><Check size={16} /> {t.actions.accept}</>}
                        </button>
                        
                        <button 
                          onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                          disabled={actionLoading === apt.id}
                          className="flex-1 py-2 px-4 bg-white border-2 border-red-100 text-red-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200 transition-colors"
                        >
                          <X size={16} /> {t.actions.reject}
                        </button>
                    </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-dark">{t.empty.title}</h3>
            <p className="text-gray-400 text-sm">{t.empty.desc}</p>
          </div>
        )}
      </div>
    </div>
  );
}