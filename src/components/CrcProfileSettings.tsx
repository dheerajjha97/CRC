import React, { useState } from 'react';
import { CrcProfile, ClusterSchool } from '../types';
import { 
  Building2, 
  Save, 
  CheckCircle2, 
  School, 
  Plus, 
  Trash2, 
  UserCheck, 
  MapPin, 
  Mail, 
  Phone 
} from 'lucide-react';

interface CrcProfileSettingsProps {
  profile: CrcProfile;
  schools: ClusterSchool[];
  onSaveProfile: (profile: CrcProfile) => Promise<void>;
  onAddSchool: (school: Omit<ClusterSchool, 'id'>) => Promise<void>;
  onDeleteSchool: (id: string) => Promise<void>;
}

export const CrcProfileSettings: React.FC<CrcProfileSettingsProps> = ({
  profile,
  schools,
  onSaveProfile,
  onAddSchool,
  onDeleteSchool
}) => {
  const [formData, setFormData] = useState<CrcProfile>({ ...profile });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New School Form
  const [newSchool, setNewSchool] = useState({
    name: '',
    udiseCode: '',
    category: 'प्राथमिक शाला',
    village: ''
  });
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<ClusterSchool | null>(null);
  const [isDeletingSchool, setIsDeletingSchool] = useState(false);
  const [deleteSchoolMessage, setDeleteSchoolMessage] = useState<string | null>(null);

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onSaveProfile(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.name.trim()) return;
    setIsAddingSchool(true);
    try {
      await onAddSchool(newSchool);
      setNewSchool({
        name: '',
        udiseCode: '',
        category: 'प्राथमिक शाला',
        village: ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingSchool(false);
    }
  };

  const handleConfirmDeleteSchool = async () => {
    if (!schoolToDelete) return;
    setIsDeletingSchool(true);
    try {
      const schName = schoolToDelete.name;
      await onDeleteSchool(schoolToDelete.id);
      setSchoolToDelete(null);
      setDeleteSchoolMessage(`शाला "${schName}" को सूची से हटा दिया गया है।`);
      setTimeout(() => setDeleteSchoolMessage(null), 3500);
    } catch (err) {
      console.error('Error deleting school:', err);
    } finally {
      setIsDeletingSchool(false);
    }
  };

  return (
    <div id="crc-settings-section" className="space-y-8">
      {/* Office Profile & Official Letterhead Config */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              संकुल संसाधन केंद्र (CRC) कार्यालयीन प्रोफाइल एवं लेटरहेड
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              यह जानकारी सभी आदेशों, पत्रों एवं PDF के शीर्ष लेटरहेड और हस्ताक्षर मुहर में स्वतः मुद्रित होगी
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-lg font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              सफलतापूर्वक सहेजा गया!
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitProfile} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                संकुल का पूरा नाम (लेटरहेड शीर्षक) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.clusterName}
                onChange={(e) => setFormData({ ...formData, clusterName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500"
                placeholder="उदा. संकुल संसाधन केंद्र (CRC) - शासकीय उच्चतर माध्यमिक विद्यालय..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                विकासखंड (Block) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.blockName}
                onChange={(e) => setFormData({ ...formData, blockName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                placeholder="उदा. सदर"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                जिला <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.districtName}
                onChange={(e) => setFormData({ ...formData, districtName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                placeholder="उदा. रायपुर"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                संकुल प्राचार्य / समन्वयक का नाम <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.centerHead}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  centerHead: e.target.value,
                  defaultSignatory: e.target.value 
                })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                placeholder="उदा. डॉ. रमेश कुमार वर्मा"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                पदनाम <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.headDesignation}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  headDesignation: e.target.value,
                  defaultDesignation: e.target.value 
                })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                placeholder="उदा. प्राचार्य / संकुल समन्वयक"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                कार्यालयीन पत्र क्रमांक पूर्वपद (Letter Prefix)
              </label>
              <input
                type="text"
                value={formData.letterPrefix}
                onChange={(e) => setFormData({ ...formData, letterPrefix: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500"
                placeholder="उदा. क्र./सं.सं.के./2026/"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                कार्यालय फोन / मोबाइल
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                placeholder="उदा. +91 98765 43210"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              id="btn-save-crc-profile"
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'सहेजा जा रहा है...' : 'प्रोफ़ाइल अपडेट करें (Save)'}
            </button>
          </div>
        </form>
      </div>

      {/* Cluster Schools Management */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <School className="w-6 h-6 text-indigo-600" />
            संकुल के अधीन विद्यालय (Cluster Schools Directory)
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            यहाँ वे सभी प्राथमिक, माध्यमिक व हाई स्कूल सूचीबद्ध हैं जो इस संकुल संसाधन केंद्र के अंतर्गत आते हैं
          </p>
        </div>

        {/* Add School Mini Form */}
        <form onSubmit={handleCreateSchool} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
            नया विद्यालय जोड़ें :
          </span>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <input
                type="text"
                required
                value={newSchool.name}
                onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                placeholder="विद्यालय का नाम (उदा. शा. प्राथमिक शाला...)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white"
              />
            </div>
            <div>
              <input
                type="text"
                value={newSchool.udiseCode}
                onChange={(e) => setNewSchool({ ...newSchool, udiseCode: e.target.value })}
                placeholder="UDISE कोड (उदा. 221004...)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isAddingSchool}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                {isAddingSchool ? 'जोड़ा जा रहा है...' : 'विद्यालय जोड़ें'}
              </button>
            </div>
          </div>
        </form>

        {/* Existing Schools Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4 w-12 text-center">क्र.</th>
                <th className="py-2.5 px-4">विद्यालय का नाम</th>
                <th className="py-2.5 px-4">यू-डाइस (UDISE) कोड</th>
                <th className="py-2.5 px-4">श्रेणी</th>
                <th className="py-2.5 px-4 text-center w-20">कार्रवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-center text-slate-500 text-xs font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    {s.name}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-600">
                    {s.udiseCode || '-'}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">
                    {s.category || 'विद्यालय'}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => setSchoolToDelete(s)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="हटाएं"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete School Success Toast Banner */}
      {deleteSchoolMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{deleteSchoolMessage}</span>
        </div>
      )}

      {/* Confirmation Modal for Deleting School */}
      {schoolToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  शाला रिकॉर्ड हटाएं?
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  क्या आप संकुल विद्यालय सूची से <strong className="text-slate-900">"{schoolToDelete.name}"</strong> {schoolToDelete.udiseCode ? `(UDISE: ${schoolToDelete.udiseCode})` : ''} को हटाना चाहते हैं?
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isDeletingSchool}
                  onClick={() => setSchoolToDelete(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium cursor-pointer transition-colors"
                >
                  रद्द करें
                </button>
                <button
                  id="btn-confirm-delete-school"
                  type="button"
                  disabled={isDeletingSchool}
                  onClick={handleConfirmDeleteSchool}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeletingSchool ? 'हटाया जा रहा है...' : 'हाँ, शाला हटाएं'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
