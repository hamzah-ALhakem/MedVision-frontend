import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle, XCircle, AlertCircle, Trash2, Search, UserCheck 
} from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext'; // 1. استيراد السياق

const translations = {
  ar: {
    title: 'لوحة الإدارة 🛡️',
    stats: { active: 'الأطباء النشطين', pending: 'طلبات الانتظار', patients: 'إجمالي المرضى' },
    tabs: { pending: 'طلبات التسجيل', active: 'إدارة الأطباء' },
    searchPlaceholder: 'بحث...',
    table: { doctor: 'الطبيب', specialty: 'التخصص', license: 'الترخيص', date: 'التاريخ', action: 'الإجراء' },
    alerts: {
      approve: 'هل أنت متأكد من قبول هذا الطبيب؟',
      reject: 'هل أنت متأكد من رفض هذا الطلب؟',
      delete: '⚠️ تحذير: هل أنت متأكد من حذف هذا الطبيب نهائياً من النظام؟',
      successApprove: '✅ تم تفعيل حساب الطبيب',
      successReject: '🚫 تم رفض الطلب',
      successDelete: '🗑️ تم حذف الطبيب',
      error: '❌ فشل العملية'
    },
    empty: 'لا توجد بيانات'
  },
  en: {
    title: 'Admin Dashboard 🛡️',
    stats: { active: 'Active Doctors', pending: 'Pending Requests', patients: 'Total Patients' },
    tabs: { pending: 'Registration Requests', active: 'Manage Doctors' },
    searchPlaceholder: 'Search...',
    table: { doctor: 'Doctor', specialty: 'Specialty', license: 'License', date: 'Date', action: 'Action' },
    alerts: {
      approve: 'Are you sure you want to approve this doctor?',
      reject: 'Are you sure you want to reject this request?',
      delete: '⚠️ Warning: Are you sure you want to delete this doctor permanently?',
      successApprove: '✅ Doctor account activated',
      successReject: '🚫 Request rejected',
      successDelete: '🗑️ Doctor deleted',
      error: '❌ Operation failed'
    },
    empty: 'No data available'
  }
};

export default function AdminDashboard() {
  const { language } = useLanguage();
  const t = translations[language];

  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({ doctors: 0, patients: 0, pending: 0 });
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [activeDoctors, setActiveDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Fetch Data ---
  const fetchAdminData = async () => {
    try {
      const [statsRes, pendingRes, activeRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/doctors/pending'),
          api.get('/admin/doctors/active')
      ]);

      setStats(statsRes.data);
      setPendingDoctors(pendingRes.data);
      setActiveDoctors(activeRes.data);
      
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- Actions ---
  const handleApproveDoctor = async (id) => {
    if(!window.confirm(t.alerts.approve)) return;
    try {
        await api.put(`/admin/doctors/${id}/approve`);
        alert(t.alerts.successApprove);
        fetchAdminData();
    } catch (error) { alert(t.alerts.error); }
  };

  const handleRejectDoctor = async (id) => {
    if(!window.confirm(t.alerts.reject)) return;
    try {
        await api.put(`/admin/doctors/${id}/reject`);
        alert(t.alerts.successReject);
        fetchAdminData();
    } catch (error) { alert(t.alerts.error); }
  };

  const handleDeleteUser = async (id) => {
      if(!window.confirm(t.alerts.delete)) return;
      try {
          await api.delete(`/admin/users/${id}`);
          alert(t.alerts.successDelete);
          fetchAdminData();
      } catch (error) { alert(t.alerts.error); }
  };

  const getInitials = (first, last) => `${first?.[0] || ''}${last?.[0] || ''}`;

  // Shared Table Component
  const DoctorTable = ({ data, type }) => (
    <div className="overflow-x-auto">
        <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead className="text-xs text-gray-400 font-bold uppercase border-b border-gray-50">
                <tr>
                    <th className="pb-3 px-4">{t.table.doctor}</th>
                    <th className="pb-3">{t.table.specialty}</th>
                    <th className="pb-3">{t.table.license}</th>
                    <th className="pb-3">{t.table.date}</th>
                    <th className="pb-3 text-center">{t.table.action}</th>
                </tr>
            </thead>
            <tbody className="text-sm">
                {data.length > 0 ? data.map(doc => (
                    <tr key={doc.id} className="group hover:bg-gray-50/50 border-b border-gray-50 last:border-0 transition-colors">
                        <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs 
                                    ${type === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {getInitials(doc.firstName, doc.lastName)}
                                </div>
                                <div>
                                    <span className="font-bold text-dark block">{doc.firstName} {doc.lastName}</span>
                                    <span className="text-xs text-gray-400" dir="ltr">{doc.phone}</span>
                                </div>
                            </div>
                        </td>
                        <td className="py-4 text-gray-600">{doc.specialty}</td>
                        <td className="py-4 font-mono text-gray-500 bg-gray-50 w-fit px-2 rounded">{doc.licenseNumber}</td>
                        <td className="py-4 text-gray-400">{new Date(doc.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                        <td className="py-4">
                            <div className="flex items-center justify-center gap-2">
                                {type === 'pending' ? (
                                    <>
                                        <button onClick={() => handleApproveDoctor(doc.id)} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="Approve">
                                            <CheckCircle size={18} />
                                        </button>
                                        <button onClick={() => handleRejectDoctor(doc.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Reject">
                                            <XCircle size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => handleDeleteUser(doc.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                )) : (
                    <tr>
                        <td colSpan="5" className="py-10 text-center text-gray-400">{t.empty}</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in pb-10">
      
      {/* 1. Header & Stats */}
      <div>
        <h1 className="text-2xl font-bold text-dark mb-6">{t.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label={t.stats.active} value={stats.doctors} icon={UserCheck} color="bg-blue-50 text-blue-600" />
            <StatCard label={t.stats.pending} value={stats.pending} icon={AlertCircle} color="bg-orange-50 text-orange-600" />
            <StatCard label={t.stats.patients} value={stats.patients} icon={Users} color="bg-green-50 text-green-600" />
        </div>
      </div>

      {/* 2. Tabs */}
      <div className="flex gap-2 border-b border-gray-100 pb-1">
        <TabButton id="pending" label={`${t.tabs.pending} (${pendingDoctors.length})`} icon={AlertCircle} active={activeTab} onClick={setActiveTab} />
        <TabButton id="active" label={t.tabs.active} icon={Users} active={activeTab} onClick={setActiveTab} />
      </div>

      {/* 3. Content */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm min-h-[400px] p-6">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-dark text-lg">
                {activeTab === 'pending' ? t.tabs.pending : t.tabs.active}
            </h3>
            <div className="relative w-64">
                <input type="text" placeholder={t.searchPlaceholder} className="w-full bg-gray-50 border-none rounded-xl py-2 px-4 rtl:pr-10 ltr:pl-10 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                <Search className="absolute rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
        </div>

        {activeTab === 'pending' ? (
            <DoctorTable data={pendingDoctors} type="pending" />
        ) : (
            <DoctorTable data={activeDoctors} type="active" />
        )}
      </div>
    </div>
  );
}

// Sub Components
const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div><p className="text-gray-500 text-xs font-bold mb-1">{label}</p><h3 className="text-2xl font-bold text-dark">{value}</h3></div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon size={20} /></div>
    </div>
);

const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
    <button onClick={() => onClick(id)} className={`flex items-center gap-2 px-6 py-3 rounded-t-xl text-sm font-bold transition-all border-b-2 ${active === id ? 'border-primary text-primary bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
        <Icon size={18} /> {label}
    </button>
);