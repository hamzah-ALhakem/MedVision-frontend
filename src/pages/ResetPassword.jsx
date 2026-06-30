import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../services/api';
import logo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage(); 
  const isRTL = language === 'ar';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
        setError(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
        return;
    }
    if (formData.newPassword.length < 8) {
        setError(isRTL ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
        return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post(`/auth/reset-password/${token}`, { newPassword: formData.newPassword });
      setSuccess(isRTL ? 'تم إعادة تعيين كلمة المرور بنجاح.' : 'Password has been reset successfully.');
    } catch (err) {
      setError(err.response?.data?.message || (isRTL ? 'الرابط غير صالح أو منتهي الصلاحية.' : 'Invalid or expired reset link.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="col-span-1 flex items-center justify-center p-8 bg-surface relative">
        <div className={`w-full max-w-md space-y-8 animate-in fade-in duration-500 ${isRTL ? 'slide-in-from-left-8' : 'slide-in-from-right-8'}`}>
          <div className="text-center">
            <img src={logo} alt="MedVision" className="w-20 h-20 mx-auto mb-4 object-contain" />
            <h2 className="text-3xl font-bold text-primary">{isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}</h2>
            <p className="text-slate-500 mt-2">{isRTL ? 'أدخل كلمة المرور الجديدة.' : 'Enter your new password below.'}</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in zoom-in-95">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center space-y-6">
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center gap-3 text-green-700 text-sm font-bold animate-in zoom-in-95">
                <CheckCircle2 size={18} />
                {success}
                </div>
                <Button onClick={() => navigate('/login')} className="w-full py-4 text-base">
                    {isRTL ? 'تسجيل الدخول' : 'Go to Login'}
                </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input 
                label={isRTL ? 'كلمة المرور الجديدة' : 'New Password'} 
                type="password" 
                placeholder="••••••••" 
                icon={Lock}
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                required
              />
              <Input 
                label={isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'} 
                type="password" 
                placeholder="••••••••" 
                icon={Lock}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
              <Button type="submit" isLoading={isLoading} className="w-full py-4 text-base">
                {isRTL ? 'حفظ كلمة المرور' : 'Save Password'}
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="hidden lg:flex col-span-1 bg-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>
      </div>
    </div>
  );
}
