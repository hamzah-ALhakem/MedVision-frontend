import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Loader2, Clock, X, MessageCircle, MapPin, AlertCircle } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext'; // 1. استيراد السياق

// 2. قاموس الترجمة
const translations = {
  ar: {
    hero: {
      title: 'ابحث عن أفضل الأطباء 🩺',
      desc: 'احجز موعدك الآن بكل سهولة.'
    },
    list: {
      title: 'الأطباء المتاحون',
      empty: 'لا يوجد أطباء متاحين حالياً.'
    },
    card: {
      defaultSpecialty: 'تخصص عام',
      noAddress: 'العنوان غير محدد',
      shiftsTitle: 'المواعيد المتاحة',
      noShifts: 'لا توجد مواعيد متاحة',
      more: 'عرض المزيد +',
      status: { confirmed: 'تم تأكيد الحجز ✅', pending: 'بانتظار الموافقة' },
      btn: { chat: 'مراسلة الطبيب', book: 'حجز موعد', pending: 'قيد الانتظار' }
    },
    modal: {
      title: 'حجز موعد جديد',
      slotsLabel: 'المواعيد المتاحة',
      noSlots: 'هذا الطبيب لم يحدد مواعيد عمل بعد.',
      reasonLabel: 'سبب الزيارة',
      reasonPlaceholder: 'اكتب باختصار سبب الحجز...',
      btnConfirm: 'تأكيد الحجز',
      btnSelectFirst: 'اختر موعداً أولاً',
      alerts: {
        selectSlot: 'يرجى اختيار موعد',
        success: 'تم إرسال طلب الحجز بنجاح!',
        error: 'فشل الحجز، حاول مرة أخرى'
      }
    }
  },
  en: {
    hero: {
      title: 'Find Best Doctors 🩺',
      desc: 'Book your appointment now with elite consultants in various medical specialties easily.'
    },
    list: {
      title: 'Available Doctors',
      empty: 'No doctors available at the moment.'
    },
    card: {
      defaultSpecialty: 'General Specialty',
      noAddress: 'Address not specified',
      shiftsTitle: 'Available Shifts',
      noShifts: 'No shifts available',
      more: 'Show more +',
      status: { confirmed: 'Booking Confirmed ✅', pending: 'Pending Approval' },
      btn: { chat: 'Message Doctor', book: 'Book Appointment', pending: 'Pending' }
    },
    modal: {
      title: 'Book New Appointment',
      slotsLabel: 'Available Slots',
      noSlots: 'This doctor has not set working hours yet.',
      reasonLabel: 'Visit Reason',
      reasonPlaceholder: 'Briefly describe reason for visit...',
      btnConfirm: 'Confirm Booking',
      btnSelectFirst: 'Select a slot first',
      alerts: {
        selectSlot: 'Please select a slot',
        success: 'Booking request sent successfully!',
        error: 'Booking failed, please try again'
      }
    }
  }
};

// خريطة أيام الأسبوع للترجمة
const daysMap = {
  'Saturday': 'السبت', 'Sunday': 'الأحد', 'Monday': 'الاثنين',
  'Tuesday': 'الثلاثاء', 'Wednesday': 'الأربعاء', 'Thursday': 'الخميس', 'Friday': 'الجمعة'
};

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage(); // 3. استخدام الهوك
  const t = translations[language];

  const [doctors, setDoctors] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Booking Modal State ---
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingReason, setBookingReason] = useState('');
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  // 1. Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, apptsRes] = await Promise.all([
          api.get('/users/doctors'),
          api.get('/appointments')
        ]);
        setDoctors(docsRes.data);
        setMyAppointments(apptsRes.data);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Date Calculation
  const getNextDateForDay = (dayName) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetIndex = days.indexOf(dayName);
    const today = new Date();
    const currentDayIndex = today.getDay();

    let daysUntilTarget = targetIndex - currentDayIndex;
    if (daysUntilTarget <= 0) daysUntilTarget += 7;

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    return targetDate.toISOString().split('T')[0];
  };

  // 3. Submit Booking
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return alert(t.modal.alerts.selectSlot);

    setIsBookingLoading(true);
    try {
      const calculatedDate = getNextDateForDay(selectedSlot.day_of_week);
      const shiftTime = selectedSlot.start_time;

      await api.post('/appointments', {
        doctorId: selectedDoctor.id,
        date: calculatedDate,
        time: shiftTime,
        reason: bookingReason
      });

      // Refresh locally
      const res = await api.get('/appointments');
      setMyAppointments(res.data);

      setSelectedDoctor(null);
      setBookingReason('');
      setSelectedSlot(null);
      alert(t.modal.alerts.success);
    } catch (error) {
      alert(t.modal.alerts.error);
    } finally {
      setIsBookingLoading(false);
    }
  };

  // 4. Start Chat
  const startChat = (doctor) => {
    navigate('/messages', {
      state: {
        startChatWith: {
          id: doctor.id,
          name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          specialty: doctor.specialty
        }
      }
    });
  };

  // Helpers
  const getDocName = (doc) => language === 'ar' ? `د. ${doc.firstName || ''} ${doc.lastName || ''}` : `Dr. ${doc.firstName || ''} ${doc.lastName || ''}`;
  const getDocInitials = (doc) => `${(doc.firstName || '')[0] || '?'}${(doc.lastName || '')[0] || ''}`;
  
  // دالة لعرض اليوم مترجم أو كما هو
  const displayDay = (day) => language === 'ar' ? (daysMap[day] || day) : day;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

      {/* Hero Section */}
      <div className="relative bg-primary rounded-[2rem] p-8 md:p-10 text-white overflow-hidden shadow-lg shadow-blue-200">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-2xl translate-y-1/3 translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="max-w-xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{t.hero.title}</h1>
                <p className="text-blue-100 text-lg opacity-90 leading-relaxed">
                    {t.hero.desc}
                </p>
            </div>
        </div>
      </div>

      {/* Doctors List */}
      <div>
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-dark flex items-center gap-2">
                {t.list.title} <span className="bg-blue-50 text-primary text-xs px-2 py-1 rounded-full">{doctors.length}</span>
            </h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
        ) : doctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map((doc) => {
              const relevantAppt = myAppointments.find(a => a.doctor_id === doc.id);
              const status = relevantAppt ? relevantAppt.status : null;
              
              return (
                <div key={doc.id} className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-card-hover transition-all group flex flex-col h-full relative overflow-hidden">
                  
                  {/* Status Strip */}
                  {status === 'confirmed' && <div className="absolute top-0 left-0 right-0 h-1.5 bg-green-500"></div>}
                  {status === 'pending' && <div className="absolute top-0 left-0 right-0 h-1.5 bg-orange-400"></div>}

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-xl font-bold text-primary border border-gray-100 shadow-inner">
                            {getDocInitials(doc)}
                        </div>
                        <div>
                            <h4 className="font-bold text-dark text-lg group-hover:text-primary transition-colors">{getDocName(doc)}</h4>
                            <p className="text-sm text-gray-500 font-medium mb-1">{doc.specialty || t.card.defaultSpecialty}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <MapPin size={12} /> <span>{doc.clinicAddress || t.card.noAddress}</span>
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Shifts Preview */}
                  <div className="mb-6 mt-auto">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{t.card.shiftsTitle}</p>
                    <div className="flex flex-col gap-1.5">
                      {doc.schedule && doc.schedule.filter(s => s.is_active).length > 0 ? (
                          doc.schedule.filter(s => s.is_active).slice(0, 3).map((s, i) => (
                            <div key={i} className="flex justify-between items-center text-[11px] bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-100 font-medium">
                              <span>{displayDay(s.day_of_week)}</span>
                              <span className="text-primary font-bold">{s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}</span>
                            </div>
                          ))
                      ) : (
                          <div className="text-[10px] text-red-400 flex items-center gap-1 bg-red-50 px-2 py-1 rounded">
                              <AlertCircle size={10}/> {t.card.noShifts}
                          </div>
                      )}
                      {(doc.schedule?.filter(s => s.is_active).length || 0) > 3 && (
                          <span className="text-[10px] text-center bg-gray-50 text-gray-400 px-2 py-1 rounded-lg border border-gray-100">{t.card.more}</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-2">
                    {status === 'confirmed' ? (
                      <div className="space-y-2">
                          <div className="bg-green-50 text-green-700 text-xs font-bold py-2 rounded-xl text-center border border-green-100">
                              {t.card.status.confirmed}
                          </div>
                          <button
                            onClick={() => startChat(doc)}
                            className="w-full py-3 rounded-xl bg-white border-2 border-primary text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            <MessageCircle size={18} /> {t.card.btn.chat}
                          </button>
                      </div>
                    ) : status === 'pending' ? (
                      <button disabled className="w-full py-3 rounded-xl bg-orange-50 text-orange-600 font-bold text-sm border border-orange-100 flex items-center justify-center gap-2 cursor-default">
                        <Clock size={18} /> {t.card.btn.pending}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedDoctor(doc);
                          setSelectedSlot(null);
                        }}
                        className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover shadow-lg shadow-primary/20 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Calendar size={18} /> {t.card.btn.book}
                      </button>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">{t.list.empty}</p>
          </div>
        )}
      </div>

      {/* --- Booking Modal --- */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 relative">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-dark">{t.modal.title}</h2>
                <p className="text-sm text-gray-500 font-medium mt-0.5">{getDocName(selectedDoctor)}</p>
              </div>
              <button 
                onClick={() => setSelectedDoctor(null)}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-8 space-y-6">
              
              {/* Slot Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-dark block">{t.modal.slotsLabel}</label>
                <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {selectedDoctor.schedule?.filter(s => s.is_active).length > 0 ? (
                    selectedDoctor.schedule.filter(s => s.is_active).map((s, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedSlot(s)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center group
                        ${selectedSlot === s
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-100 hover:border-primary/30 hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                            ${selectedSlot === s ? 'border-primary' : 'border-gray-300 group-hover:border-primary/50'}`}>
                            {selectedSlot === s && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                          </div>
                          <span className={`font-bold text-sm ${selectedSlot === s ? 'text-primary' : 'text-gray-600'}`}>{displayDay(s.day_of_week)}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded border border-gray-100">
                          {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-red-400 py-6 border-2 border-dashed border-red-50 rounded-xl bg-red-50/10 text-sm font-medium">
                      {t.modal.noSlots}
                    </div>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-dark block">{t.modal.reasonLabel}</label>
                <textarea
                  placeholder={t.modal.reasonPlaceholder}
                  rows="2"
                  className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-primary outline-none transition-all text-sm resize-none font-medium placeholder:text-gray-400"
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  required
                ></textarea>
              </div>

              {/* Submit */}
              <Button type="submit" isLoading={isBookingLoading} disabled={!selectedSlot} className="w-full py-4 text-base shadow-xl shadow-primary/20">
                {selectedSlot
                  ? `${t.modal.btnConfirm} (${displayDay(selectedSlot.day_of_week)})`
                  : t.modal.btnSelectFirst}
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}