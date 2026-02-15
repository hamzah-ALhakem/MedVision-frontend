import React, { useState } from 'react';
import { predictTumor } from '../services/aiService'; // استيراد الخدمة
import { Activity, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';

export default function Screening() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // null, 0 (Benign), 1 (Malignant)
  const [error, setError] = useState('');

  // تعريف الـ 30 خاصية بالترتيب الصحيح (مهم جداً للنموذج)
  const featuresList = [
    "Mean Radius", "Mean Texture", "Mean Perimeter", "Mean Area", "Mean Smoothness",
    "Mean Compactness", "Mean Concavity", "Mean Concave Points", "Mean Symmetry", "Mean Fractal Dim",
    "SE Radius", "SE Texture", "SE Perimeter", "SE Area", "SE Smoothness",
    "SE Compactness", "SE Concavity", "SE Concave Points", "SE Symmetry", "SE Fractal Dim",
    "Worst Radius", "Worst Texture", "Worst Perimeter", "Worst Area", "Worst Smoothness",
    "Worst Compactness", "Worst Concavity", "Worst Concave Points", "Worst Symmetry", "Worst Fractal Dim"
  ];

  // حالة لتخزين القيم الـ 30
  // نملؤها مبدئياً بقيم فارغة أو أصفار
  const [formData, setFormData] = useState(Array(30).fill(''));

  // دالة لتحديث قيمة حقل معين
  const handleChange = (index, value) => {
    const newFormData = [...formData];
    newFormData[index] = value;
    setFormData(newFormData);
  };

  // تعبئة بيانات تجريبية (لتسهيل الاختبار عليك)
  const fillTestData = () => {
    const testData = [
      17.99, 10.38, 122.8, 1001.0, 0.1184, 0.2776, 0.3001, 0.1471, 0.2419, 0.07871,
      1.095, 0.9053, 8.589, 153.4, 0.006399, 0.04904, 0.05373, 0.01587, 0.03003, 0.006193,
      25.38, 17.33, 184.6, 2019.0, 0.1622, 0.6656, 0.7119, 0.2654, 0.4601, 0.1189
    ];
    setFormData(testData);
  };

 // دالة الإرسال (محدثة لتتوافق مع رد السيرفر الحقيقي)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 1. تحويل المدخلات من نصوص إلى أرقام
      const featuresArray = formData.map(val => parseFloat(val));

      // 2. التحقق من صحة البيانات
      if (featuresArray.some(isNaN)) {
        throw new Error("يرجى ملء جميع الحقول بأرقام صحيحة.");
      }

      // 3. استدعاء الموديل
      const response = await predictTumor(featuresArray);
      
      console.log("Server Response in Component:", response); // للتأكد

      // 4. معالجة الرد الجديد 🟢
      // الرد هو: { diagnosis: "Malignant", prediction_label: 0, confidence: 100 }
      
      if (response.diagnosis) {
        // نعتمد على النص "Malignant" لتحديد النتيجة
        // إذا كان النص Malignant نضع 1 (أحمر)، وإلا نضع 0 (أخضر)
        const isMalignant = response.diagnosis.toLowerCase() === 'malignant';
        setResult(isMalignant ? 1 : 0);
        
        // (اختياري) يمكنك أيضاً استخدام نسبة الثقة confidence إذا أردت عرضها
        // console.log("Confidence:", response.confidence);
        
      } else if (response.prediction_label !== undefined) {
          // حل احتياطي: استخدام الرقم إذا لم يوجد النص
          // تنبيه: في ردك السابق كان 0 يعني Malignant، وهذا غريب، لذا الاعتماد على النص أضمن
          setResult(response.prediction_label === 0 ? 1 : 0); 
      } else {
        throw new Error("تنسيق استجابة غير متوقع من السيرفر (لا يوجد diagnosis)");
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "فشل الاتصال بالنموذج");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-dark">نظام الفحص الذكي للأورام (AI Screening)</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          أدخل القيم الخلوية المستخرجة من الفحص المجهري (FNA). سيقوم نموذج الذكاء الاصطناعي بتحليل 30 خاصية للتنبؤ بالتشخيص بدقة عالية.
        </p>
        <button 
          onClick={fillTestData}
          className="text-sm text-primary underline hover:text-blue-700"
        >
          تعبئة بيانات تجريبية (Malignant Test)
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Form Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {featuresList.map((feature, index) => (
                <div key={index} className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 truncate block" title={feature}>
                    {index + 1}. {feature}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData[index]}
                    onChange={(e) => handleChange(index, e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                    placeholder="0.0"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? (
                <>جاري التحليل...</>
              ) : (
                <>
                  <Activity size={20} /> تحليل البيانات
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-bold animate-in fade-in">
              <AlertCircle size={18} /> {error}
            </div>
          )}
        </div>

        {/* Result Section */}
        <div className="lg:col-span-1">
          <div className={`h-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition-all duration-500
            ${result !== null ? (result === 1 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200') : ''}
          `}>
            
            {result === null ? (
              <div className="opacity-50 space-y-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Activity size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-400">في انتظار البيانات...</h3>
                <p className="text-sm text-gray-400">أدخل البيانات واضغط على تحليل لإظهار النتيجة هنا.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in zoom-in duration-300">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg
                  ${result === 1 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                  {result === 1 ? <AlertCircle size={48} /> : <CheckCircle size={48} />}
                </div>
                
                <div>
                  <h2 className={`text-3xl font-black mb-2 ${result === 1 ? 'text-red-600' : 'text-green-600'}`}>
                    {result === 1 ? 'Malignant' : 'Benign'}
                  </h2>
                  <p className={`text-lg font-bold ${result === 1 ? 'text-red-400' : 'text-green-500'}`}>
                    {result === 1 ? 'ورم خبيث (يتطلب تدخل فوري)' : 'ورم حميد (آمن)'}
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-200/50 w-full">
                  <p className="text-xs text-gray-500 mb-4">
                    ملاحظة: هذه النتيجة تعتمد على خوارزميات الذكاء الاصطناعي وتعتبر أداة مساعدة للتشخيص وليست بديلاً عن الرأي الطبي المختص.
                  </p>
                  <button 
                    onClick={() => { setResult(null); setFormData(Array(30).fill('')); }}
                    className="flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-dark mx-auto transition-colors"
                  >
                    <RotateCcw size={16} /> فحص جديد
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}