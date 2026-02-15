import React, { useEffect, useState } from 'react';
import { Users, Calendar, Clock, Check, X, Loader2, Activity } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const translations = {
  ar: {
    title: 'لوحة التحكم',
    stats: { today: 'مواعيد اليوم', total: 'إجمالي المرضى', confirmed: 'مواعيد مؤكدة' },
    table: {
      title: 'طلبات المواعيد الأخيرة',
      headers: { patient: 'المريض', datetime: 'التاريخ والوقت', status: 'الحالة', reason: 'سبب الزيارة', actions: 'الإجراءات' }
    },
    status: { confirmed: 'مؤكد', pending: 'قيد الانتظار', cancelled: 'ملغي' },
    error: 'فشل تحديث الحالة'
  },
  en: {
    title: 'Dashboard',
    stats: { today: 'Today\'s Appointments', total: 'Total Patients', confirmed: 'Confirmed Visits' },
    table: {
      title: 'Recent Appointment Requests',
      headers: { patient: 'Patient', datetime: 'Date & Time', status: 'Status', reason: 'Visit Reason', actions: 'Actions' }
    },
    status: { confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled' },
    error: 'Failed to update status'
  }
};

export default function DoctorDashboard() {
  const { language } = useLanguage();
  const t = translations[language];
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get('/appointments');
        setAppointments(res.data);
      } catch (err) {
        console.error("Failed to load appointments", err);
      } finally {
        setIsLoading(false);
      }
    };
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

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: "bg-orange-50 text-orange-600 ring-orange-500/20",
      confirmed: "bg-green-50 text-green-600 ring-green-500/20",
      cancelled: "bg-red-50 text-red-600 ring-red-500/20",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${styles[status] || 'bg-gray-50 text-gray-600'}`}>
        {t.status[status] || status}
      </span>
    );
  };

  const stats = [
    { label: t.stats.today, value: appointments.filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString()).length, icon: Calendar, color: 'text-primary bg-primary/10' },
    { label: t.stats.total, value: new Set(appointments.map(a => a.patient_id)).size, icon: Users, color: 'text-purple-600 bg-purple-100' },
    { label: t.stats.confirmed, value: appointments.filter(a => a.status === 'confirmed').length, icon: Check, color: 'text-green-600 bg-green-100' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Stats */}
      <div>
        <h1 className="text-2xl font-bold text-dark mb-6">{t.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-dark">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <h3 className="text-lg font-bold text-dark flex items-center gap-2">
            <Activity size={20} className="text-primary" /> {t.table.title}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'} border-collapse`}>
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className={`px-6 py-4 ${language === 'ar' ? 'rounded-tr-xl' : 'rounded-tl-xl'}`}>{t.table.headers.patient}</th>
                <th className="px-6 py-4">{t.table.headers.datetime}</th>
                <th className="px-6 py-4">{t.table.headers.status}</th>
                <th className="px-6 py-4">{t.table.headers.reason}</th>
                <th className={`px-6 py-4 text-center ${language === 'ar' ? 'rounded-tl-xl' : 'rounded-tr-xl'}`}>{t.table.headers.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan="5" className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={32}/></td></tr>
              ) : appointments.length > 0 ? (
                appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary text-primary font-bold flex items-center justify-center text-sm">
                          {apt.first_name?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-dark text-sm">{apt.first_name} {apt.last_name}</p>
                          <p className="text-xs text-gray-400 font-medium font-sans" dir="ltr">{apt.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                                <Calendar size={14} className="text-primary"/> 
                                {new Date(apt.appointment_date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                <Clock size={14}/> 
                                {apt.appointment_time.slice(0, 5)}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={apt.status} />
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                        <p className="text-sm text-gray-600 truncate" title={apt.reason}>
                          {apt.reason || (language === 'ar' ? 'لا يوجد' : 'None')}
                        </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {apt.status === 'pending' ? (
                          <>
                            <button 
                              onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                              disabled={actionLoading === apt.id}
                              className="w-8 h-8 flex items-center justify-center bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                              title={language === 'ar' ? "قبول" : "Accept"}
                            >
                              {actionLoading === apt.id ? <Loader2 size={16} className="animate-spin"/> : <Check size={16} />}
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                              disabled={actionLoading === apt.id}
                              className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                              title={language === 'ar' ? "رفض" : "Reject"}
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-300 font-medium">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Calendar size={48} className="mb-3 opacity-20" />
                      <p>{language === 'ar' ? 'لا توجد طلبات مواعيد' : 'No appointment requests'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}