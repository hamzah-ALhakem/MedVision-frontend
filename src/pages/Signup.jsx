import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Stethoscope, ArrowRight, ArrowLeft, CheckCircle2,
  AlertCircle, Mail, Lock, MapPin, Clock, Globe
} from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import logo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';

const translations = {
  ar: {
    header: 'إنشاء حساب جديد ',
    steps: { 1: 'خطوة 1: اختر نوع الحساب', 2: 'خطوة 2: البيانات الشخصية', 3: 'خطوة 3: مواعيد العيادة' },
    roles: { patient: 'مريض', patientDesc: 'احجز مواعيد وافحص صحتك', doctor: 'طبيب', doctorDesc: 'أدر مرضاك ومواعيدك' },
    labels: {
      fullName: 'الاسم الكامل', fullNamePH: 'مثال: أحمد محمد',
      email: 'البريد الإلكتروني', emailPH: 'name@example.com',
      phone: 'رقم الهاتف', phonePH: '10xxxxxxxx', phoneHint: 'أدخل الرقم بدون الصفر الأول (مثال: 1012345678)',
      gender: 'النوع', male: 'ذكر', female: 'أنثى',
      pass: 'كلمة المرور', confirmPass: 'تأكيد كلمة المرور',
      specialty: 'التخصص الطبي', specialtyPH: 'مثال: باطنة',
      license: 'رقم الترخيص', licensePH: 'MD-12345',
      clinic: 'عنوان العيادة / المستشفى', clinicPH: 'القاهرة، التجمع الخامس...',
      docSection: 'التحقق المهني'
    },
    schedule: {
      title: 'حدد مواعيد عمل العيادة',
      desc: 'اضغط على المربع بجانب اليوم لتفعيله، ثم حدد الوقت.'
    },
    buttons: {
      back: 'رجوع', next: 'التالي: المواعيد', create: 'إنشاء الحساب', finish: 'إتمام التسجيل',
      returnLogin: 'العودة لصفحة الدخول'
    },
    success: {
      title: 'تم استلام طلبك بنجاح! 🎉',
      desc: 'شكراً لانضمامك د. {name}. بياناتك ومواعيد العيادة قيد المراجعة. سيتم تفعيل حسابك قريباً.'
    },
    footer: { text: 'لديك حساب بالفعل؟', link: 'تسجيل الدخول' },
    errors: {
      fullName: 'يرجى كتابة الاسم الثنائي على الأقل',
      email: 'بريد إلكتروني غير صحيح',
      phoneReq: 'رقم الهاتف مطلوب',
      phoneInv: 'رقم غير صحيح (10 أرقام تبدأ بـ 10, 11, 12, 15)',
      passLen: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      passMatch: 'كلمات المرور غير متطابقة',
      specialty: 'التخصص مطلوب',
      license: 'رقم الترخيص مطلوب',
      clinic: 'العنوان مطلوب',
      schedule: '⚠️ يجب تحديد يوم عمل واحد على الأقل للعيادة.',
      global: 'فشل إنشاء الحساب، يرجى المحاولة مرة أخرى'
    }
  },
  en: {
    header: 'Create New Account ',
    steps: { 1: 'Step 1: Choose Role', 2: 'Step 2: Personal Info', 3: 'Step 3: Work Schedule' },
    roles: { patient: 'Patient', patientDesc: 'Book appointments & Check health', doctor: 'Doctor', doctorDesc: 'Manage patients & Appointments' },
    labels: {
      fullName: 'Full Name', fullNamePH: 'Ex: Ahmed Mohamed',
      email: 'Email Address', emailPH: 'name@example.com',
      phone: 'Phone Number', phonePH: '10xxxxxxxx', phoneHint: 'Enter 10 digits without leading zero',
      gender: 'Gender', male: 'Male', female: 'Female',
      pass: 'Password', confirmPass: 'Confirm Password',
      specialty: 'Medical Specialty', specialtyPH: 'Ex: Internal Medicine',
      license: 'License Number', licensePH: 'MD-12345',
      clinic: 'Clinic / Hospital Address', clinicPH: 'Cairo, 5th Settlement...',
      docSection: 'Professional Verification'
    },
    schedule: {
      title: 'Set Clinic Schedule',
      desc: 'Check the box to activate the day, then set hours.'
    },
    buttons: {
      back: 'Back', next: 'Next: Schedule', create: 'Create Account', finish: 'Finish Registration',
      returnLogin: 'Return to Login'
    },
    success: {
      title: 'Request Received Successfully! 🎉',
      desc: 'Thank you for joining Dr. {name}. Your data and schedule are under review. Your account will be activated soon.'
    },
    footer: { text: 'Already have an account?', link: 'Sign In' },
    errors: {
      fullName: 'Please enter at least two names',
      email: 'Invalid email address',
      phoneReq: 'Phone number required',
      phoneInv: 'Invalid number (10 digits starting with 10, 11, 12, 15)',
      passLen: 'Password must be at least 6 characters',
      passMatch: 'Passwords do not match',
      specialty: 'Specialty required',
      license: 'License number required',
      clinic: 'Address required',
      schedule: '⚠️ You must select at least one working day.',
      global: 'Account creation failed, please try again'
    }
  }
};

const daysMap = {
  ar: { 'Saturday': 'السبت', 'Sunday': 'الأحد', 'Monday': 'الاثنين', 'Tuesday': 'الثلاثاء', 'Wednesday': 'الأربعاء', 'Thursday': 'الخميس', 'Friday': 'الجمعة' },
  en: { 'Saturday': 'Saturday', 'Sunday': 'Sunday', 'Monday': 'Monday', 'Tuesday': 'Tuesday', 'Wednesday': 'Wednesday', 'Thursday': 'Thursday', 'Friday': 'Friday' }
};

export default function Signup() {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    role: '', fullName: '', email: '', phone: '', gender: 'Male',
    password: '', confirmPassword: '', clinicAddress: '', licenseNumber: '', specialty: '',
  });

  const daysOfWeek = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const [schedule, setSchedule] = useState(
    daysOfWeek.map(day => ({ day, startTime: '09:00', endTime: '17:00', isActive: false }))
  );

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' && !/^\d*$/.test(value)) return;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const toggleDay = (index) => {
    const newSchedule = [...schedule];
    newSchedule[index].isActive = !newSchedule[index].isActive;
    setSchedule(newSchedule);
    if (errors.global) setErrors({ ...errors, global: '' });
  };

  const updateTime = (index, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[index][field] = value;
    setSchedule(newSchedule);
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.fullName.trim().includes(' ')) newErrors.fullName = t.errors.fullName;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) newErrors.email = t.errors.email;
    const egyptPhoneRegex = /^1[0-2,5]{1}[0-9]{8}$/;
    if (!formData.phone) newErrors.phone = t.errors.phoneReq;
    else if (!egyptPhoneRegex.test(formData.phone)) newErrors.phone = t.errors.phoneInv;
    if (formData.password.length < 6) newErrors.password = t.errors.passLen;
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t.errors.passMatch;

    if (formData.role === 'doctor') {
      if (!formData.specialty) newErrors.specialty = t.errors.specialty;
      if (!formData.licenseNumber) newErrors.licenseNumber = t.errors.license;
      if (!formData.clinicAddress) newErrors.clinicAddress = t.errors.clinic;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const activeDays = schedule.filter(s => s.isActive);
    if (activeDays.length === 0) {
      setErrors({ global: t.errors.schedule });
      return false;
    }
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 2) {
      if (!validateStep2()) return;
      if (formData.role === 'doctor') setStep(3);
      else handleSubmit();
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (formData.role === 'doctor' && !validateStep3()) return;

    setIsLoading(true);
    try {
      const submissionData = {
        ...formData,
        phone: `+20${formData.phone}`,
        schedule: formData.role === 'doctor' ? schedule.filter(s => s.isActive) : []
      };

      await api.post('/auth/register', submissionData);

      if (formData.role === 'doctor') setIsSuccess(true);
      else navigate('/login');

    } catch (err) {
      setErrors({ global: t.errors.global });
    } finally {
      setIsLoading(false);
    }
  };

  const RoleCard = ({ role, icon: Icon, title, desc }) => (
    <div
      onClick={() => { setFormData({ ...formData, role }); setStep(2); setErrors({}); }}
      className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-4 group hover:shadow-lg
      ${formData.role === role ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-gray-100 bg-white hover:border-primary/30'}`}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors text-3xl ${formData.role === role ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
        <Icon size={32} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-dark group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
      </div>
    </div>
  );

  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;
  const BackIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>

      <div className="flex flex-col justify-center items-center p-6 sm:p-12 overflow-y-auto relative">

        {/* Lang Switcher */}
        <button onClick={toggleLanguage} className="absolute top-6 right-6 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
          <Globe size={20} />
          <span className="text-sm font-bold">{language === 'ar' ? 'English' : 'عربي'}</span>
        </button>

        <div className="w-full max-w-lg space-y-8">

          {isSuccess ? (
            <div className="text-center animate-in zoom-in duration-300">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-dark mb-3">{t.success.title}</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                {t.success.desc.replace('{name}', formData.fullName)}
              </p>
              <Button onClick={() => navigate('/login')} className="w-full">
                {t.buttons.returnLogin}
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <img src={logo} alt="MedVision" className="w-16 h-16 mx-auto mb-4 object-contain" />
                <h1 className="text-3xl font-bold text-dark mb-2">{t.header}</h1>
                <p className="text-gray-500">
                  {step === 1 && t.steps[1]}
                  {step === 2 && t.steps[2]}
                  {step === 3 && t.steps[3]}
                </p>
                <div className="w-full h-1.5 bg-gray-100 mt-6 rounded-full overflow-hidden" dir="ltr">
                  <div className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }} />
                </div>
              </div>

              {errors.global && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in fade-in">
                  <AlertCircle size={20} /> {errors.global}
                </div>
              )}

              {step === 1 && (
                <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                  <RoleCard role="patient" icon={User} title={t.roles.patient} desc={t.roles.patientDesc} />
                  <RoleCard role="doctor" icon={Stethoscope} title={t.roles.doctor} desc={t.roles.doctorDesc} />
                </div>
              )}

              {step === 2 && (
                <form onSubmit={handleNext} className="space-y-5 animate-in fade-in slide-in-from-right-4">
                  <Input label={t.labels.fullName} name="fullName" placeholder={t.labels.fullNamePH} value={formData.fullName} onChange={handleChange} error={errors.fullName} icon={User} />
                  <Input label={t.labels.email} name="email" type="email" placeholder={t.labels.emailPH} value={formData.email} onChange={handleChange} error={errors.email} icon={Mail} />

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 mx-1">{t.labels.phone}</label>
                    <div className="flex gap-2" dir="ltr">
                      <div className="w-[80px] bg-gray-50 border-2 border-gray-100 rounded-xl flex items-center justify-center font-bold text-dark text-sm select-none">🇪🇬 +20</div>
                      <input name="phone" type="tel" placeholder={t.labels.phonePH} value={formData.phone} onChange={handleChange} maxLength={10} className={`flex-1 bg-white border-2 rounded-xl py-3 px-4 outline-none transition-all font-medium text-dark placeholder:text-gray-300 ${errors.phone ? 'border-red-300 bg-red-50/10' : 'border-gray-100 focus:border-primary'}`} />
                    </div>
                    {errors.phone && <p className="text-xs font-bold text-red-500 mx-1 text-right">{errors.phone}</p>}
                    <p className="text-[10px] text-gray-400 mx-1 text-right">{t.labels.phoneHint}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 mx-1">{t.labels.gender}</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['Male', 'Female'].map((g) => (
                        <button key={g} type="button" onClick={() => setFormData({ ...formData, gender: g })} className={`py-3 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 text-sm ${formData.gender === g ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}>
                          {g === 'Male' ? t.labels.male : t.labels.female}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.role === 'doctor' && (
                    <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4 animate-in fade-in">
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2"><CheckCircle2 size={16} /> {t.labels.docSection}</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Input label={t.labels.specialty} name="specialty" placeholder={t.labels.specialtyPH} value={formData.specialty} onChange={handleChange} error={errors.specialty} icon={Stethoscope} />
                        <Input label={t.labels.license} name="licenseNumber" placeholder={t.labels.licensePH} value={formData.licenseNumber} onChange={handleChange} error={errors.licenseNumber} icon={CheckCircle2} />
                      </div>
                      <Input label={t.labels.clinic} name="clinicAddress" placeholder={t.labels.clinicPH} value={formData.clinicAddress} onChange={handleChange} error={errors.clinicAddress} icon={MapPin} />
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input label={t.labels.pass} name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} icon={Lock} />
                    <Input label={t.labels.confirmPass} name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} icon={Lock} />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" className="w-1/3" onClick={() => { setStep(1); setErrors({}); }}>
                      <BackIcon size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} /> {t.buttons.back}
                    </Button>
                    <Button type="submit" isLoading={isLoading} className="flex-1">
                      {formData.role === 'doctor' ? t.buttons.next : t.buttons.create} <ArrowIcon size={18} className={language === 'ar' ? 'mr-2' : 'ml-2'} />
                    </Button>
                  </div>
                </form>
              )}

              {step === 3 && formData.role === 'doctor' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                    <Clock className="text-blue-600 shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="font-bold text-blue-800 text-sm">{t.schedule.title}</h4>
                      <p className="text-xs text-blue-600 mt-1">{t.schedule.desc}</p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {schedule.map((day, index) => (
                      <div key={day.day} className={`flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl border transition-all 
                                ${day.isActive ? 'border-primary/40 bg-primary/5' : 'border-gray-100 bg-white opacity-70'}`}>
                        <label className="flex items-center gap-2 w-32 cursor-pointer">
                          <input type="checkbox" checked={day.isActive} onChange={() => toggleDay(index)} className="w-4 h-4 accent-primary cursor-pointer" />
                          <span className={`font-bold text-sm ${day.isActive ? 'text-primary' : 'text-gray-500'}`}>
                            {daysMap[language][day.day] || day.day}
                          </span>
                        </label>
                        <div className="flex items-center gap-2 flex-1">
                          <input type="time" value={day.startTime} onChange={(e) => updateTime(index, 'startTime', e.target.value)} disabled={!day.isActive} className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-bold outline-none focus:border-primary disabled:bg-gray-50" />
                          <span className="text-gray-300 text-xs">-</span>
                          <input type="time" value={day.endTime} onChange={(e) => updateTime(index, 'endTime', e.target.value)} disabled={!day.isActive} className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-bold outline-none focus:border-primary disabled:bg-gray-50" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-2">
                    <Button type="button" variant="outline" className="w-1/3" onClick={() => setStep(2)}>
                      <BackIcon size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} /> {t.buttons.back}
                    </Button>
                    <Button onClick={handleSubmit} isLoading={isLoading} className="flex-1">
                      {t.buttons.finish} <CheckCircle2 size={18} className={language === 'ar' ? 'mr-2' : 'ml-2'} />
                    </Button>
                  </div>
                </div>
              )}

              {!isSuccess && (
                <div className="mt-8 text-center text-sm text-gray-500 font-medium">
                  {t.footer.text} <Link to="/login" className="text-primary font-bold hover:underline">{t.footer.link}</Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="hidden lg:flex relative bg-primary items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2068&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 p-12 text-white max-w-lg text-center">
          <h2 className="text-4xl font-bold mb-6">MedVision</h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            {language === 'ar'
              ? 'سواء كنت مريضاً تبحث عن رعاية أو طبيباً يقدمها، نحن هنا لنسهل رحلتك العلاجية باستخدام تقنيات الذكاء الاصطناعي.'
              : 'Whether you are a patient seeking care or a doctor providing it, we are here to facilitate your journey using AI technologies.'}
          </p>
        </div>
      </div>

    </div>
  );
}