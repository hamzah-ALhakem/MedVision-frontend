import React, { useState } from 'react';
import { predictTumor } from '../services/aiService';
import { 
  Activity, AlertCircle, CheckCircle, RotateCcw, 
  FileText, Trash2, Info, ChevronRight, BarChart3, UploadCloud
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { extractFeaturesFromImage, FEATURE_ORDER } from '../utils/wdbcOcr.js';

export default function Screening() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); 
  const [error, setError] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [valuesConfirmed, setValuesConfirmed] = useState(false);

  const featuresList = [
    "Radius", "Texture", "Perimeter", "Area", "Smoothness",
    "Compactness", "Concavity", "Concave Points", "Symmetry", "Fractal Dim"
  ];

  const groups = [
    { title: "Mean Values", prefix: "Mean", range: [0, 10], color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Standard Error", prefix: "SE", range: [10, 20], color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Worst Values", prefix: "Worst", range: [20, 30], color: "text-purple-600", bg: "bg-purple-50" }
  ];

  const [formData, setFormData] = useState(Array(30).fill(''));
  const hasData = formData.some(val => val !== '');

  const handleChange = (index, value) => {
    const newFormData = [...formData];
    newFormData[index] = value;
    setFormData(newFormData);
  };

  const fillTestData = () => {
    const testData = [
      17.99, 10.38, 122.8, 1001.0, 0.1184, 0.2776, 0.3001, 0.1471, 0.2419, 0.07871,
      1.095, 0.9053, 8.589, 153.4, 0.006399, 0.04904, 0.05373, 0.01587, 0.03003, 0.006193,
      25.38, 17.33, 184.6, 2019.0, 0.1622, 0.6656, 0.7119, 0.2654, 0.4601, 0.1189
    ];
    setFormData(testData);
    setResult(null);
    setError('');
    setValuesConfirmed(true);
  };

  const clearForm = () => {
    setFormData(Array(30).fill(''));
    setResult(null);
    setError('');
    setValuesConfirmed(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrProgress(0);
    setError('');
    setResult(null);
    setValuesConfirmed(false);

    try {
      const result = await extractFeaturesFromImage(file, (progress) => {
        setOcrProgress(progress);
      });

      const newFormData = FEATURE_ORDER.map(feature => 
        result.features[feature] !== undefined ? result.features[feature] : ''
      );
      setFormData(newFormData);
      
      if (!result.allFeaturesDetected) {
        setError(isRTL ? `تحذير: لم يتم اكتشاف جميع الخصائص.` : `Warning: Could not detect all features. Missing: ${result.missingFeatures.join(', ')}`);
      }
    } catch (err) {
      setError(err.message || (isRTL ? 'فشل استخراج البيانات من الصورة.' : 'Failed to extract features from image.'));
    } finally {
      setOcrLoading(false);
      e.target.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const featuresArray = formData.map(val => parseFloat(val));
      if (featuresArray.some(isNaN)) throw new Error(isRTL ? "يرجى ملء كافة الحقول بأرقام صحيحة" : "Please enter valid numbers for all fields");

      const res = await fetch('https://medvision-ocr-api.onrender.com/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: featuresArray })
      });
      if (!res.ok) throw new Error('Prediction request failed');
      const response = await res.json();
      
      let diagnosisVal = 0;
      // ما زلنا نستقبل القيمة ولكن لا نعرضها
      let confidenceVal = response.confidence || 0;

      if (response.diagnosis) {
        diagnosisVal = response.diagnosis.toLowerCase() === 'malignant' ? 1 : 0;
      } else if (response.prediction_label !== undefined) {
        diagnosisVal = response.prediction_label === 0 ? 1 : 0; 
      }

      setResult({
        isMalignant: diagnosisVal === 1,
        confidence: confidenceVal
      });

    } catch (err) {
      setError(err.message || (isRTL ? "فشل الاتصال بالنموذج" : "Connection failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-dark tracking-tight">{t('screening.title')}</h1>
          <p className="text-gray-500 max-w-xl text-sm leading-relaxed">
            {t('screening.subtitle')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasData && (
            <button 
              type="button"
              onClick={clearForm}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors border border-gray-200 animate-in fade-in zoom-in"
            >
              <Trash2 size={16} /> {t('screening.clear')}
            </button>
          )}
          
          <button 
            type="button"
            onClick={fillTestData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/20"
          >
            <FileText size={16} /> {t('screening.demoData')}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start relative">
        
        {/* Form Section */}
        <div className="lg:col-span-8 space-y-6">
          <form id="screening-form" onSubmit={handleSubmit}>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col items-center justify-center border-dashed border-2 hover:border-primary/50 transition-colors">
              <input type="file" id="ocr-upload" accept="image/png,image/jpeg" className="hidden" onChange={handleFileUpload} disabled={ocrLoading} />
              <label htmlFor="ocr-upload" className={`cursor-pointer flex flex-col items-center justify-center space-y-2 ${ocrLoading ? 'text-gray-400' : 'text-gray-500 hover:text-primary'} transition-colors`}>
                <UploadCloud size={32} />
                <span className="font-bold text-sm">{isRTL ? 'تحميل التقرير الطبي (PNG, JPG)' : 'Upload Medical Report (PNG, JPG)'}</span>
              </label>
              {ocrLoading && (
                <div className="mt-4 w-full max-w-xs">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${ocrProgress}%` }}></div>
                  </div>
                  <p className="text-xs text-center mt-2 text-gray-500 font-bold">{isRTL ? `جاري المسح... ${ocrProgress}%` : `Scanning... ${ocrProgress}%`}</p>
                </div>
              )}
            </div>

            {hasData && (
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 flex items-center gap-3 shadow-sm transition-all">
                <input 
                  type="checkbox" 
                  id="confirm-values" 
                  checked={valuesConfirmed}
                  onChange={(e) => setValuesConfirmed(e.target.checked)}
                  className="w-5 h-5 rounded text-primary focus:ring-primary/20 cursor-pointer" 
                />
                <label htmlFor="confirm-values" className="text-sm font-bold text-blue-900 cursor-pointer select-none">
                  {isRTL ? 'لقد قمت بمراجعة وتأكيد القيم المستخرجة.' : 'I reviewed and confirmed the extracted values.'}
                </label>
              </div>
            )}

            {groups.map((group, groupIdx) => (
              <div key={groupIdx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className={`px-6 py-4 border-b border-gray-50 flex items-center gap-3 ${group.bg}`}>
                  <h3 className={`font-bold ${group.color} text-sm uppercase tracking-wide`}>
                    {group.title}
                  </h3>
                </div>
                
                <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4" dir="ltr">
                  {featuresList.map((featureName, i) => {
                    const actualIndex = group.range[0] + i; 
                    return (
                      <div key={actualIndex} className="space-y-1.5 group/input text-left">
                        <label className="text-[10px] font-bold text-gray-400 group-hover/input:text-primary transition-colors truncate block" title={`${group.prefix} ${featureName}`}>
                          {featureName}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData[actualIndex]}
                          onChange={(e) => handleChange(actualIndex, e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-lg text-sm font-mono text-dark 
                          focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-gray-300"
                          placeholder="0.00"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </form>
        </div>

        {/* Result Section */}
        <div className="lg:col-span-4 sticky top-6 space-y-6">
          
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative">
            
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-3 animate-in fade-in">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-primary animate-pulse">{t('screening.analyzing')}</p>
              </div>
            )}

            <div className="p-6 min-h-[300px] flex flex-col">
              
              {!result && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center rotate-3 transition-transform hover:rotate-6">
                    <BarChart3 size={32} className="text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-dark text-lg">{t('screening.ready')}</h3>
                    <p className="text-xs text-gray-400 mt-2 max-w-[200px] mx-auto">
                      {t('screening.readyDesc')}
                    </p>
                  </div>
                </div>
              )}

              {result && !loading && (
                <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
                  
                  {/* Status Badge */}
                  <div className={`flex items-center gap-3 p-4 rounded-2xl border-l-4 shadow-sm
                    ${result.isMalignant 
                      ? 'bg-red-50 border-red-500 text-red-900' 
                      : 'bg-green-50 border-green-500 text-green-900'}`}>
                    <div className={`p-2 rounded-full ${result.isMalignant ? 'bg-red-200' : 'bg-green-200'}`}>
                      {result.isMalignant ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold opacity-70 uppercase tracking-wider">{t('screening.diagnosisTitle')}</p>
                      <h2 className="text-2xl font-black tracking-tight">
                        {result.isMalignant ? t('screening.malignant') : t('screening.benign')}
                      </h2>
                    </div>
                  </div>


                  {/* Next Steps List */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                      <Info size={12} /> {t('screening.nextSteps')}
                    </p>
                    <ul className="space-y-2">
                      {result.isMalignant ? (
                        <>
                          <li className="text-xs text-gray-600 flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                             <ChevronRight size={12} className={`text-red-500 ${isRTL ? 'rotate-180' : ''}`}/> {t('screening.stepConsult')}
                          </li>
                          <li className="text-xs text-gray-600 flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                             <ChevronRight size={12} className={`text-red-500 ${isRTL ? 'rotate-180' : ''}`}/> {t('screening.stepBiopsy')}
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="text-xs text-gray-600 flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                             <ChevronRight size={12} className={`text-green-500 ${isRTL ? 'rotate-180' : ''}`}/> {t('screening.stepFollowUp')}
                          </li>
                          <li className="text-xs text-gray-600 flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                             <ChevronRight size={12} className={`text-green-500 ${isRTL ? 'rotate-180' : ''}`}/> {t('screening.stepRecord')}
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6">
                {!result ? (
                  <button
                    form="screening-form"
                    type="submit"
                    disabled={loading || !valuesConfirmed || formData.some(val => val === '' || isNaN(parseFloat(val)))}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    <Activity size={20} /> {t('screening.analyze')}
                  </button>
                ) : (
                  <button
                    onClick={() => { setResult(null); clearForm(); }}
                    className="w-full py-3 bg-white border-2 border-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:text-dark transition-all flex justify-center items-center gap-2"
                  >
                    <RotateCcw size={18} /> {t('screening.newScan')}
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold text-center animate-in fade-in">
                   {error}
                </div>
              )}
              
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 leading-relaxed">
            <p className="font-bold mb-1 flex items-center gap-1"><Info size={14}/> {t('screening.disclaimerTitle')}</p>
            {t('screening.disclaimerText')}
          </div>

        </div>
      </div>
    </div>
  );
}