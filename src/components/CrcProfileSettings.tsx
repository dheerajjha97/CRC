import React, { useState } from 'react';
import { CrcProfile } from '../types';
import { BiharEducationLogo } from './BiharEducationLogo';
import { 
  Building2, 
  Save, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  UserCheck, 
  FileText,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface CrcProfileSettingsProps {
  profile: CrcProfile;
  onSaveProfile: (updatedProfile: CrcProfile) => Promise<void>;
}

export const CrcProfileSettings: React.FC<CrcProfileSettingsProps> = ({
  profile,
  onSaveProfile
}) => {
  const [formData, setFormData] = useState<CrcProfile>({ ...profile });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = <K extends keyof CrcProfile>(field: K, value: CrcProfile[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveProfile(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BiharEducationLogo size={60} customUrl={formData.logoUrl} />
          <div>
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              शिक्षा विभाग • बिहार सरकार
            </span>
            <h2 className="text-xl font-bold text-white">
              संकुल संसाधन केंद्र (CRC) प्रोफ़ाइल एवं लेटरहेड सेटिंग्स
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              सभी शासकीय आदेशों के शीर्ष (Letterhead) एवं हस्ताक्षरकर्ता की अधिकृत जानकारी
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400 text-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            सेटिंग्स सुरक्षित हो गई!
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: CRC Center Identity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-indigo-600" />
            संकुल एवं प्रशासनिक विवरण (CRC Details)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                कार्यालय का पद / शीर्षक (Office Title in Header) *
              </label>
              <input
                type="text"
                required
                value={formData.officeTitle || 'कार्यालय संकुल समन्वयक / प्राचार्य'}
                onChange={(e) => handleChange('officeTitle', e.target.value)}
                placeholder="उदा. कार्यालय संकुल समन्वयक / प्राचार्य या कार्यालय प्रधानाध्यापक"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {['कार्यालय संकुल समन्वयक / प्राचार्य', 'कार्यालय प्रधानाध्यापक', 'कार्यालय प्रभारी प्रधानाध्यापक', 'कार्यालय प्रखंड शिक्षा पदाधिकारी'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleChange('officeTitle', preset)}
                    className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                संकुल / विद्यालय का नाम (CRC / School Name) *
              </label>
              <input
                type="text"
                required
                value={formData.clusterName}
                onChange={(e) => handleChange('clusterName', e.target.value)}
                placeholder="उदा. संकुल संसाधन केंद्र, उ.मा.वि. सरैया"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                प्रखंड / विकासखंड (Block) *
              </label>
              <input
                type="text"
                required
                value={formData.blockName}
                onChange={(e) => handleChange('blockName', e.target.value)}
                placeholder="उदा. गायघाट / सरैया"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                जिला (District) *
              </label>
              <input
                type="text"
                required
                value={formData.districtName}
                onChange={(e) => handleChange('districtName', e.target.value)}
                placeholder="उदा. मुजफ्फरपुर / पटना"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                राज्य (State)
              </label>
              <input
                type="text"
                value={formData.stateName || 'बिहार'}
                onChange={(e) => handleChange('stateName', e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                कार्यालय का पता (Office Address)
              </label>
              <input
                type="text"
                value={formData.officeAddress || ''}
                onChange={(e) => handleChange('officeAddress', e.target.value)}
                placeholder="उदा. संकुल संसाधन केंद्र, मध्य विद्यालय प्रांगण"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Default Signatory Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            अधिकृत हस्ताक्षरकर्ता (Signatory Officer)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                संकुल प्राचार्य / समन्वयक का नाम
              </label>
              <input
                type="text"
                value={formData.centerHead || ''}
                onChange={(e) => {
                  handleChange('centerHead', e.target.value);
                  handleChange('defaultSignatory', e.target.value);
                }}
                placeholder="उदा. श्री आनंद कुमार"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                पदनाम (Designation)
              </label>
              <input
                type="text"
                value={formData.headDesignation || ''}
                onChange={(e) => {
                  handleChange('headDesignation', e.target.value);
                  handleChange('defaultDesignation', e.target.value);
                }}
                placeholder="उदा. प्राचार्य / संकुल समन्वयक"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Letterhead Dispatch Prefix & Contact */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-amber-600" />
            पत्र क्रमांक प्रीफ़िक्स एवं संपर्क सूत्र
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                डिफ़ॉल्ट पत्र क्रमांक प्रीफ़िक्स
              </label>
              <input
                type="text"
                value={formData.letterPrefix}
                onChange={(e) => handleChange('letterPrefix', e.target.value)}
                placeholder="क्र./सं.सं.के./2026/"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                जावक पंजी के अनुसार स्वचालित संख्या जुड़ेगी (जैसे .../01, .../02)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                दूरभाष / मोबाइल
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+91 9XXXXXXXXX"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                कार्यालयीन ईमेल
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="crc.office@gmail.com"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Letterhead Logo / Emblem */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            शासकीय सील / लोगो चयन (Letterhead Emblem)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                मानक सील प्रारूप
              </label>
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <BiharEducationLogo size={56} customUrl={formData.logoUrl} />
                <div className="text-xs text-slate-600">
                  <div className="font-bold text-slate-900">शिक्षा विभाग • बिहार सरकार सील</div>
                  <div className="text-[11px] text-slate-500">बोधिवृक्ष एवं स्वास्तिक सहित शासकीय प्रतीक</div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                कस्टम लोगो इमेज URL (वैकल्पिक)
              </label>
              <input
                type="url"
                value={formData.logoUrl || ''}
                onChange={(e) => handleChange('logoUrl', e.target.value)}
                placeholder="https://example.com/custom-logo.png"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                रिक्त रखने पर स्वतः बिहार सरकार का मानक शिक्षा विभाग लोगो प्रयुक्त होगा।
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl text-sm flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'सुरक्षित हो रहा है...' : 'सभी सेटिंग्स सुरक्षित करें'}
          </button>
        </div>
      </form>
    </div>
  );
};
