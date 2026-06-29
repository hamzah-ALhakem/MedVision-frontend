import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../services/api';
import logo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';

export default function ForgotPassword() {
  const { language } = useLanguage(); 
  const isRTL = language === 'ar';

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    setIsSubmitted(false);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccess(response.data.message || (isRTL ? 'إذا كان الحساب موجوداً، فقد أرسلنا رابط الاستعادة.' : 'If an account with that email exists, we have sent a password reset link.'));
      setIsSubmitted(true);
    } catch (err) {
      setError(isRTL ? 'فشل إرسال طلب الاستعادة. حاول مرة أخرى.' : 'Failed to send reset request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen grid lg:grid-cols-2" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="col-span-1 flex items-center justify-center p-8 bg-surface relative">
        <div className={`w-full max-w-md space-y-8 animate-in fade-in duration-500 ${isRTL ? 'slide-in-from-left-8' : 'slide-in-from-right-8'}`}>
          <div className="text-center">
            <img src={logo} alt="MedVision" className="w-20 h-20 mx-auto mb-4 object-contain" />
            <h2 className="text-3xl font-bold text-primary">{isRTL ? 'نسيت كلمة المرور' : 'Forgot Password'}</h2>
            <p className="text-slate-500 mt-2">{isRTL ? 'أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين.' : 'Enter your email to receive a reset link.'}</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in zoom-in-95">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {isSubmitted && success && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-700 text-sm font-bold animate-in zoom-in-95">
              <CheckCircle2 size={18} />
              {success}
            </div>
          )}

          {!isSubmitted && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input 
                label={isRTL ? 'البريد الإلكتروني' : 'Email Address'} 
                type="email" 
                placeholder="name@example.com" 
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" isLoading={isLoading} className="w-full py-4 text-base">
                {isRTL ? 'إرسال رابط الاستعادة' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          <div className="text-center mt-6">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
              <ArrowIcon size={16} /> {isRTL ? 'العودة لتسجيل الدخول' : 'Back to Login'}
            </Link>
          </div>
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
