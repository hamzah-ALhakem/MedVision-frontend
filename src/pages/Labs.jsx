import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, FlaskConical, Plus, Edit2, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function Labs() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [labs, setLabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLab, setSelectedLab] = useState(null); // For Booking
  const [expandedLab, setExpandedLab] = useState(null); // For Services
  
  // Admin Modal States
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingLab, setEditingLab] = useState(null);
  const [formData, setFormData] = useState({
    name: '', address: '', phone: '', rating: 0, image: '', services: []
  });

  const fetchLabs = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/labs');
      setLabs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm(t('labsPage.deleteConfirm'))) {
      try {
        await api.delete(`/labs/${id}`);
        setLabs(labs.filter(l => l.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLab) {
        const res = await api.put(`/labs/${editingLab.id}`, formData);
        setLabs(labs.map(l => l.id === editingLab.id ? res.data : l));
      } else {
        const res = await api.post('/labs', formData);
        setLabs([...labs, res.data]);
      }
      closeAdminModal();
    } catch (err) {
      console.error(err);
    }
  };

  const openAdminModal = (lab = null) => {
    if (lab) {
      setEditingLab(lab);
      setFormData({
        name: lab.name, address: lab.address, phone: lab.phone || '',
        rating: lab.rating, image: lab.image || '',
        services: lab.services || []
      });
    } else {
      setEditingLab(null);
      setFormData({
        name: '', address: '', phone: '', rating: 0, image: '', services: []
      });
    }
    setShowAdminModal(true);
  };

  const closeAdminModal = () => {
    setShowAdminModal(false);
    setEditingLab(null);
  };

  const updateService = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index][field] = value;
    setFormData({ ...formData, services: newServices });
  };

  const addServiceRow = () => {
    setFormData({ ...formData, services: [...formData.services, { name: '', price: 0 }] });
  };

  const removeServiceRow = (index) => {
    const newServices = [...formData.services];
    newServices.splice(index, 1);
    setFormData({ ...formData, services: newServices });
  };

  const filteredLabs = labs.filter(lab => 
    lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lab.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Header & Search */}
      <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative overflow-hidden">
        {/* Decorative background blur */}
        <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 pointer-events-none`}></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-dark mb-4 flex items-center gap-3 tracking-tight">
            <div className="p-3 bg-blue-50 text-primary rounded-2xl"><FlaskConical size={28}/></div>
            {t('labsPage.title')}
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl leading-relaxed">
            {t('labsPage.subtitle')}
          </p>
        </div>
        
        {isAdmin && (
          <div className="relative z-10 shrink-0 self-start md:self-auto">
            <Button onClick={() => openAdminModal()} className="flex items-center gap-2 px-8 py-4 text-base font-bold rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30 transition-all">
              <Plus size={20} strokeWidth={2.5} /> {t('labsPage.addLab')}
            </Button>
          </div>
        )}
      </div>

      <div className="relative max-w-3xl">
        <input 
          type="text" 
          placeholder={t('labsPage.searchPlaceholder')}
          className={`w-full py-4 md:py-5 bg-white rounded-2xl border-2 border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base md:text-lg font-medium shadow-sm hover:border-gray-200 ${isRTL ? 'pr-14 pl-6' : 'pl-14 pr-6'}`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-5' : 'left-5'}`} size={24} />
      </div>

      {/* Labs Grid */}
      {isLoading ? (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredLabs.length === 0 ? (
        <div className="text-center p-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
          <p className="text-gray-400 font-medium text-lg">{t('labsPage.noLabs')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {filteredLabs.map(lab => (
            <div key={lab.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group flex flex-col h-full">
              
              {/* Image Section */}
              <div className="relative h-56 w-full shrink-0 bg-gray-100 overflow-hidden">
                <img 
                  src={lab.image || 'https://images.unsplash.com/photo-1582719471384-bc4d33919de9?auto=format&fit=crop&q=80&w=600'} 
                  alt={lab.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                
                {/* Rating Badge */}
                <div className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-sm font-bold text-dark flex items-center gap-1.5 shadow-sm`}>
                  <span className="text-yellow-400 text-lg leading-none">★</span> {lab.rating}
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                  <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} flex items-center gap-2 z-10`}>
                    <button onClick={() => openAdminModal(lab)} className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center shadow-sm transition-colors duration-200">
                      <Edit2 size={18} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => handleDelete(lab.id)} className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center shadow-sm transition-colors duration-200">
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-6 md:p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-dark group-hover:text-primary transition-colors mb-3 line-clamp-1">{lab.name}</h3>
                
                <div className="flex items-start gap-2.5 text-gray-500 text-sm mb-6">
                  <MapPin size={18} className="shrink-0 mt-0.5 text-gray-400" /> 
                  <span className="line-clamp-2 leading-relaxed font-medium">{lab.address}</span>
                </div>
                
                {/* Services Accordion */}
                <div className="mt-auto mb-8">
                  <button 
                    onClick={() => setExpandedLab(expandedLab === lab.id ? null : lab.id)}
                    className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors mb-3 bg-blue-50/50 px-4 py-2.5 rounded-xl w-full justify-between"
                  >
                    <span>{expandedLab === lab.id ? t('labsPage.hidePrices') : t('labsPage.showPrices')}</span>
                    {expandedLab === lab.id ? <ChevronUp size={16} strokeWidth={2.5}/> : <ChevronDown size={16} strokeWidth={2.5}/>}
                  </button>
                  
                  {expandedLab === lab.id && (
                    <div className="bg-gray-50 rounded-2xl p-4 text-sm space-y-3 animate-in slide-in-from-top-2 border border-gray-100">
                      {lab.services?.length > 0 ? lab.services.map((svc, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                          <span className="text-gray-600 font-medium">{svc.name}</span>
                          <span className="font-bold text-primary bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-100">{svc.price} {t('labsPage.currency')}</span>
                        </div>
                      )) : <div className="text-sm font-medium text-gray-400 text-center py-2">No services listed.</div>}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-gray-100 flex gap-4 mt-auto">
                  <Button onClick={() => setSelectedLab(lab)} className="flex-1 py-3.5 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                    {t('labsPage.book')}
                  </Button>
                  <a href={`tel:${lab.phone}`} className="w-14 h-14 rounded-2xl bg-white border-2 border-gray-100 text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-center shrink-0 shadow-sm">
                    <Phone size={22} strokeWidth={2.5} />
                  </a>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Booking Modal (Mock) */}
      {selectedLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-dark">{t('labsPage.bookTitle').replace('{{name}}', selectedLab.name)}</h3>
              <button onClick={() => setSelectedLab(null)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); alert('Booking successful (Mock)'); setSelectedLab(null); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('labsPage.visitDate')}</label>
                <input type="date" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary text-sm font-medium" />
              </div>
              <Button type="submit" className="w-full py-3">{t('labsPage.confirmBook')}</Button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Add/Edit Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in zoom-in-95">
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10">
              <h3 className="font-bold text-dark text-lg">{editingLab ? t('labsPage.editLabTitle') : t('labsPage.addLabTitle')}</h3>
              <button type="button" onClick={closeAdminModal} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <form onSubmit={handleAdminSubmit} className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <Input label={t('labsPage.labName')} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                <Input label={t('labsPage.labPhone')} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <Input label={t('labsPage.labAddress')} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required />
              <div className="grid md:grid-cols-2 gap-4">
                <Input label={t('labsPage.labRating')} type="number" step="0.1" max="5" value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} />
                <Input label={t('labsPage.labImage')} value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} placeholder="https://..." />
              </div>
              
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-sm text-dark">{t('labsPage.services')}</h4>
                  <button type="button" onClick={addServiceRow} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    <Plus size={14}/> {t('labsPage.addService')}
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.services.map((svc, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <input type="text" placeholder={t('labsPage.serviceName')} value={svc.name} onChange={e => updateService(i, 'name', e.target.value)} required className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                      <input type="number" placeholder={t('labsPage.servicePrice')} value={svc.price} onChange={e => updateService(i, 'price', e.target.value)} required className="w-24 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                      <button type="button" onClick={() => removeServiceRow(i)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                    </div>
                  ))}
                  {formData.services.length === 0 && <p className="text-xs text-gray-400 text-center">No services added yet.</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={closeAdminModal} className="flex-1">{t('labsPage.cancel')}</Button>
                <Button type="submit" className="flex-1">{t('labsPage.save')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}