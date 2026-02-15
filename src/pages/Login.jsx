import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, ArrowRight, AlertCircle, Globe } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../services/api';
import logo from '../assets/logo.png'; 
import { useLanguage } from '../context/LanguageContext'; // 1. استيراد السياق

// 2. قاموس الترجمة
const translations = {
  ar: {
    welcome: 'مرحباً بعودتك ',
    subtitle: 'يرجى إدخال بياناتك لتسجيل الدخول.',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'name@example.com',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'نسيت كلمة المرور؟',
    loginBtn: 'تسجيل الدخول',
    noAccount: 'ليس لديك حساب؟',
    signupLink: 'أنشئ حساباً مجاناً',
    errors: {
      invalid: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      pending: 'حسابك قيد المراجعة من قبل الإدارة. يرجى الانتظار.',
      rejected: 'نأسف، تم رفض طلب انضمامك.'
    }
  },
  en: {
    welcome: 'Welcome Back ',
    subtitle: 'Please enter your details to sign in.',
    emailLabel: 'Email Address',
    emailPlaceholder: 'name@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'Forgot Password?',
    loginBtn: 'Sign In',
    noAccount: 'Don\'t have an account?',
    signupLink: 'Sign up for free',
    errors: {
      invalid: 'Invalid email or password',
      pending: 'Your account is under review. Please wait.',
      rejected: 'Sorry, your request has been rejected.'
    }
  }
};

export default function Login() {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage(); // 3. استخدام الهوك
  const t = translations[language]; // النصوص الحالية

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', formData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const role = response.data.user.role.toLowerCase();
      
      if (role === 'admin') navigate('/admin-dashboard');
      else if (role === 'doctor') navigate('/doctor-dashboard');
      else navigate('/patient-dashboard');

    } catch (err) {
      const msg = err.response?.data?.message;
      // محاولة ترجمة رسائل الخطأ القادمة من الباك إند إذا تطابقت
      if (msg === 'حسابك قيد المراجعة من قبل الإدارة. يرجى الانتظار.') {
          setError(t.errors.pending);
      } else if (msg === 'نأسف، تم رفض طلب انضمامك.') {
          setError(t.errors.rejected);
      } else {
          setError(t.errors.invalid);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen grid lg:grid-cols-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* 1. الجانب الأيمن (النموذج) */}
      <div className="col-span-1 flex items-center justify-center p-8 bg-surface relative">
        
        {/* زر تغيير اللغة في الزاوية */}
        <button 
            onClick={toggleLanguage} 
            className="absolute top-6 right-6 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
            <Globe size={20} />
            <span className="text-sm font-bold">{language === 'ar' ? 'English' : 'عربي'}</span>
        </button>

        <div className={`w-full max-w-md space-y-8 animate-in fade-in duration-500 ${language === 'ar' ? 'slide-in-from-left-8' : 'slide-in-from-right-8'}`}>
          
          <div className="text-center">
            <img src={logo} alt="MedVision" className="w-20 h-20 mx-auto mb-4 object-contain" />
            
            <h2 className="text-3xl font-bold text-primary">{t.welcome}</h2>
            <p className="text-slate-500 mt-2">{t.subtitle}</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in zoom-in-95">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              label={t.emailLabel} 
              type="email" 
              placeholder={t.emailPlaceholder} 
              icon={Mail}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            
            <div className="space-y-2">
               <Input 
                label={t.passwordLabel} 
                type="password" 
                placeholder={t.passwordPlaceholder} 
                icon={Lock}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              <div className="flex justify-end">
                <Link to="/forgot-password" class="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                  {t.forgotPassword}
                </Link>
              </div>
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full py-4 text-base">
              {t.loginBtn} <ArrowIcon size={18} className={language === 'ar' ? "mr-2" : "ml-2"} />
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 font-medium">
            {t.noAccount}{' '}
            <Link to="/signup" className="font-bold text-primary hover:underline">
              {t.signupLink}
            </Link>
          </p>
        </div>
      </div>

      {/* 2. الجانب الأيسر (صورة جمالية) */}
      <div className="hidden lg:flex col-span-1 bg-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>
        
       
      </div>

    </div>
  );
}