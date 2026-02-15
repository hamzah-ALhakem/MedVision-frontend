import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, FlaskConical, Clock, Upload, Check, X, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../services/api';

export default function Labs() {
  const [labs, setLabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLab, setSelectedLab] = useState(null); // For Booking Modal
  const [expandedLab, setExpandedLab] = useState(null); // For viewing prices

  // --- Booking State ---
  const [bookingDate, setBookingDate] = useState('');

  // --- Fetch Data ---
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        // const res = await api.get('/labs'); 
        // setLabs(res.data);
        
        // Mock Data for Demo
        setLabs([
            {
                id: 1, 
                name: 'مختبرات البرج (Al-Borg Labs)', 
                address: 'القاهرة, مدينة نصر, شارع الطيران', 
                rating: 4.8,
                image: 'https://images.unsplash.com/photo-1582719471384-bc4d33919de9?auto=format&fit=crop&q=80&w=300',
                services: [
                    { name: 'صورة دم كاملة (CBC)', price: 250 },
                    { name: 'وظائف كبد (Liver Function)', price: 400 },
                    { name: 'سكر تراكمي (HbA1c)', price: 150 },
                ]
            },
            {
                id: 2, 
                name: 'معمل المختبر (Al-Mokhtabar)', 
                address: 'الجيزة, الدقي, شارع التحرير', 
                rating: 4.7,
                image: 'https://images.unsplash.com/photo-1579165466741-7f35a4755657?auto=format&fit=crop&q=80&w=300',
                services: [
                    { name: 'فيتامين د (Vitamin D)', price: 600 },
                    { name: 'وظائف كلى (Kidney Function)', price: 350 },
                    { name: 'تحليل بول (Urine Analysis)', price: 100 },
                ]
            },
            {
                id: 3, 
                name: 'رويال لاب (Royal Lab)', 
                address: 'الاسكندرية, سموحة', 
                rating: 4.5,
                image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&q=80&w=300',
                services: [
                    { name: 'PCR كورونا', price: 900 },
                    { name: 'غدة درقية (TSH)', price: 220 },
                ]
            }
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLabs();
  }, []);

  // --- Handlers ---
  const handleBooking = (e) => {
      e.preventDefault();
      alert(`تم إرسال طلب الحجز لمعمل "${selectedLab.name}" بنجاح!`);
      setSelectedLab(null);
      setBookingDate('');
  };

  const toggleServices = (id) => {
      if (expandedLab === id) setExpandedLab(null);
      else setExpandedLab(id);
  };

  const filteredLabs = labs.filter(lab => 
      lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lab.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10" dir="rtl">
      
      {/* 1. Header & Search */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-dark mb-4 flex items-center gap-3">
            <FlaskConical className="text-primary" size={32}/> المعامل الطبية
        </h1>
        <p className="text-gray-500 mb-6 max-w-2xl">
            ابحث عن أقرب المعامل الطبية، قارن أسعار التحاليل، واحجز موعدك أو ارفع الروشتة مباشرة.
        </p>

        <div className="relative max-w-xl">
            <input 
                type="text" 
                placeholder="ابحث باسم المعمل أو المنطقة..." 
                className="w-full pl-4 pr-12 py-3.5 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </div>

      {/* 2. Labs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredLabs.map(lab => (
            <div key={lab.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                <div className="flex flex-col sm:flex-row h-full">
                    {/* Image */}
                    <div className="sm:w-40 h-48 sm:h-auto bg-gray-100 relative">
                        <img src={lab.image} alt={lab.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-dark flex items-center gap-1">
                            ⭐ {lab.rating}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-xl font-bold text-dark group-hover:text-primary transition-colors">{lab.name}</h3>
                                <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                                    <MapPin size={12} /> {lab.address}
                                </div>
                            </div>
                        </div>

                        {/* Expandable Services */}
                        <div className="mt-4 mb-4">
                            <button 
                                onClick={() => toggleServices(lab.id)}
                                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline mb-2"
                            >
                                {expandedLab === lab.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                {expandedLab === lab.id ? 'إخفاء الأسعار' : 'عرض قائمة الأسعار'}
                            </button>
                            
                            {expandedLab === lab.id && (
                                <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-2 animate-in slide-in-from-top-2">
                                    {lab.services.map((svc, i) => (
                                        <div key={i} className="flex justify-between border-b border-gray-200 last:border-0 pb-1 last:pb-0">
                                            <span className="text-gray-600">{svc.name}</span>
                                            <span className="font-bold text-primary">{svc.price} ج.م</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-50 flex gap-3">
                            <Button onClick={() => setSelectedLab(lab)} className="flex-1 py-2 text-sm">
                                حجز موعد
                            </Button>
                            <button className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:text-primary hover:border-primary transition-colors">
                                <Phone size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* 3. Booking Modal */}
      {selectedLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-dark">حجز تحليل في {selectedLab.name}</h3>
                    <button onClick={() => setSelectedLab(null)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
                </div>

                <form onSubmit={handleBooking} className="p-6 space-y-4">
                    
                    {/* Date Picker */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الزيارة</label>
                        <div className="relative">
                            <input 
                                type="date" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary text-sm font-medium"
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    

                    <div className="pt-2">
                        <Button type="submit" className="w-full py-3 shadow-lg shadow-primary/20">
                            تأكيد الحجز
                        </Button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}