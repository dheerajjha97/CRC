import React, { useState, useEffect } from 'react';
import { Teacher, ClusterSchool } from '../types';
import { 
  UserPlus, 
  Search, 
  School, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  X, 
  Filter,
  GraduationCap,
  Sparkles,
  Plus,
  Tag,
  Settings2
} from 'lucide-react';

interface TeacherManagementProps {
  teachers: Teacher[];
  schools: ClusterSchool[];
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>;
  onUpdateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>;
  onDeleteTeacher: (id: string) => Promise<void>;
}

// Initial clean, standard designations
export const DEFAULT_DESIGNATIONS = [
  'सहायक शिक्षक (LB)',
  'शिक्षक (LB)',
  'व्याख्याता (LB)',
  'प्रधान पाठक (प्रा.शा.)',
  'प्रधान पाठक (मा.शा.)',
  'व्याख्याता',
  'सहायक शिक्षक',
  'शिक्षक',
  'अतिथि शिक्षक'
];

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  teachers,
  schools,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('');
  const [selectedDesignationFilter, setSelectedDesignationFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDesignationManagerOpen, setIsDesignationManagerOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

  // Dynamic & Custom Designations List (persisted in localStorage)
  const [designations, setDesignations] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('crc_designations_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_DESIGNATIONS;
  });

  const [newCustomDesignation, setNewCustomDesignation] = useState('');

  // Save designations to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('crc_designations_list', JSON.stringify(designations));
    } catch {
      // ignore
    }
  }, [designations]);

  // Merge any existing teacher designations into the available list
  useEffect(() => {
    if (teachers.length > 0) {
      const teacherDesigs = teachers.map(t => t.designation.trim()).filter(Boolean);
      const unique = Array.from(new Set([...designations, ...teacherDesigs]));
      if (unique.length !== designations.length) {
        setDesignations(unique);
      }
    }
  }, [teachers]);

  const handleAddCustomDesignation = (desigToAdd?: string) => {
    const val = (desigToAdd || newCustomDesignation).trim();
    if (!val) return;
    if (!designations.includes(val)) {
      setDesignations(prev => [...prev, val]);
    }
    setNewCustomDesignation('');
  };

  const handleRemoveDesignation = (desigToRemove: string) => {
    setDesignations(prev => prev.filter(d => d !== desigToRemove));
    if (formData.designation === desigToRemove) {
      setFormData(prev => ({ ...prev, designation: '' }));
    }
  };

  // Form State - strictly Teacher Name, Designation, and Posted School
  const [formData, setFormData] = useState<{
    name: string;
    designation: string;
    schoolName: string;
  }>({
    name: '',
    designation: designations[0] || 'सहायक शिक्षक (LB)',
    schoolName: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.schoolName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSchool = !selectedSchoolFilter || t.schoolName === selectedSchoolFilter;
    const matchesDesignation = !selectedDesignationFilter || t.designation === selectedDesignationFilter;

    return matchesSearch && matchesSchool && matchesDesignation;
  });

  const handleOpenAddModal = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      designation: designations[0] || 'सहायक शिक्षक (LB)',
      schoolName: schools.length > 0 ? schools[0].name : ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      designation: teacher.designation,
      schoolName: teacher.schoolName
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.designation.trim() || !formData.schoolName.trim()) {
      return;
    }

    // Also ensure this designation is in the custom designations list
    if (!designations.includes(formData.designation.trim())) {
      handleAddCustomDesignation(formData.designation.trim());
    }

    setIsSaving(true);
    try {
      if (editingTeacher) {
        await onUpdateTeacher(editingTeacher.id, {
          name: formData.name.trim(),
          designation: formData.designation.trim(),
          schoolName: formData.schoolName.trim()
        });
      } else {
        await onAddTeacher({
          name: formData.name.trim(),
          designation: formData.designation.trim(),
          schoolName: formData.schoolName.trim()
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!teacherToDelete) return;
    setIsDeleting(true);
    try {
      const deletedName = teacherToDelete.name;
      await onDeleteTeacher(teacherToDelete.id);
      setTeacherToDelete(null);
      setDeleteSuccessMessage(`शिक्षक "${deletedName}" को संकुल रिकॉर्ड से हटा दिया गया है।`);
      setTimeout(() => setDeleteSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error deleting teacher:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="teacher-management-dashboard" className="space-y-6">
      {/* Top Header & Action Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            संकुल शिक्षक प्रोफाइल प्रबंधन
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            संकुल अंतर्गत पदस्थ शिक्षकों का विवरण: शिक्षक का नाम, पदनाम एवं पदस्थ शाला
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-open-designation-manager"
            type="button"
            onClick={() => setIsDesignationManagerOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <Tag className="w-4 h-4 text-indigo-600" />
            <span>पदनाम सूची ({designations.length})</span>
          </button>

          <button
            id="btn-add-new-teacher"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>नया शिक्षक जोड़ें</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="relative md:col-span-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            id="input-search-teachers"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="शिक्षक का नाम, पदनाम या पदस्थ शाला से खोजें..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="relative md:col-span-3">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <select
            id="select-filter-school"
            value={selectedSchoolFilter}
            onChange={(e) => setSelectedSchoolFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white truncate"
          >
            <option value="">सभी शालाएं ({schools.length} शालाएं)</option>
            {schools.map(s => (
              <option key={s.id || s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative md:col-span-3">
          <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <select
            id="select-filter-designation"
            value={selectedDesignationFilter}
            onChange={(e) => setSelectedDesignationFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white truncate"
          >
            <option value="">सभी पदनाम ({designations.length} पदनाम)</option>
            {designations.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teacher Table List - Strictly Name, Designation, School */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            कुल शिक्षक रिकॉर्ड : {filteredTeachers.length}
          </span>
          <span className="text-xs text-slate-500">
            Firestore डेटाबेस से स्वचालित रूप से सिंक
          </span>
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">कोई शिक्षक रिकॉर्ड नहीं मिला</p>
            <p className="text-xs text-slate-500 mt-1">कृपया खोज शब्द बदलें या "नया शिक्षक जोड़ें" बटन दबाकर प्रविष्टि करें।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-xs font-semibold">
                  <th className="py-3.5 px-4 w-14 text-center">क्र.</th>
                  <th className="py-3.5 px-4">शिक्षक का नाम (Teacher Name)</th>
                  <th className="py-3.5 px-4">पदनाम (Designation)</th>
                  <th className="py-3.5 px-4">पदस्थ शाला (Posted School)</th>
                  <th className="py-3.5 px-4 text-center w-28">कार्रवाई</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center font-medium text-slate-500 text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-[15px]">{t.name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {t.designation}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 text-slate-800">
                        <School className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-sm">{t.schoolName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`btn-edit-teacher-${t.id}`}
                          onClick={() => handleOpenEditModal(t)}
                          title="संशोधित करें"
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-teacher-${t.id}`}
                          onClick={() => setTeacherToDelete(t)}
                          title="हटाएं"
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Success Toast Banner */}
      {deleteSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{deleteSuccessMessage}</span>
        </div>
      )}

      {/* Confirmation Modal for Deleting Teacher */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  शिक्षक प्रोफाइल हटाएं?
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  क्या आप संकुल रिकॉर्ड से शिक्षक <strong className="text-slate-900">"{teacherToDelete.name}"</strong> ({teacherToDelete.designation}, {teacherToDelete.schoolName}) को हटाना चाहते हैं?
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setTeacherToDelete(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium cursor-pointer transition-colors"
                >
                  रद्द करें
                </button>
                <button
                  id="btn-confirm-delete-teacher"
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'हटाया जा रहा है...' : 'हाँ, हटाएं'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog for Add / Edit - STRICTLY 3 FIELDS: Name, Designation, Posted School */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                {editingTeacher ? 'शिक्षक प्रोफाइल संशोधित करें' : 'नया शिक्षक विवरण दर्ज करें'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* 1. Teacher Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  शिक्षक का नाम (Teacher Name) <span className="text-red-500">*</span>
                </label>
                <input
                  id="modal-teacher-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="उदा. श्री सुनील कुमार शर्मा"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* 2. Designation with Custom Addition & Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    पदनाम (Designation) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsDesignationManagerOpen(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>पदनाम सूची प्रबंधित करें</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {/* Direct Input with Datalist for autocomplete */}
                  <div className="relative">
                    <input
                      id="modal-teacher-designation-input"
                      type="text"
                      required
                      list="designation-datalist"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="पदनाम लिखें या नीचे से चुनें (उदा. सहायक शिक्षक (LB))..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    />
                    <datalist id="designation-datalist">
                      {designations.map(d => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  </div>

                  {/* Quick Select Chips */}
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1.5 font-medium">
                      त्वरित चयन हेतु पदनाम सूची (क्लिक करें):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                      {designations.map(d => {
                        const isSelected = formData.designation === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setFormData({ ...formData, designation: d })}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Posted School */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  पदस्थ शाला / विद्यालय (Posted School) <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <select
                    id="modal-teacher-school-select"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- संकुल अंतर्गत विद्यालय चुनें --</option>
                    {schools.map(s => (
                      <option key={s.id || s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    id="modal-teacher-school-custom"
                    type="text"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    placeholder="अथवा विद्यालय का नाम सीधे टाइप करें..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  id="modal-submit-teacher-btn"
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSaving ? 'सहेजा जा रहा है...' : 'सुरक्षित करें (Save)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Designation Manager Modal Dialog */}
      {isDesignationManagerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    पदनाम सूची प्रबंधन (Designations)
                  </h3>
                  <p className="text-xs text-slate-500">
                    पुराने पदनाम हटाएं अथवा नए कस्टम पदनाम जोड़ें
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDesignationManagerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Add New Custom Designation Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  नया कस्टम पदनाम जोड़ें (Add Custom Designation)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="input-new-custom-designation"
                    type="text"
                    value={newCustomDesignation}
                    onChange={(e) => setNewCustomDesignation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomDesignation();
                      }
                    }}
                    placeholder="उदा. प्रयोगशाला शिक्षक, सहायक ग्रेड-3, भृत्य..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    id="btn-add-custom-designation"
                    type="button"
                    onClick={() => handleAddCustomDesignation()}
                    disabled={!newCustomDesignation.trim()}
                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>जोड़ें</span>
                  </button>
                </div>
              </div>

              {/* List of Active Designations with Delete Buttons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">
                    उपलब्ध पदनाम सूची ({designations.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setDesignations(DEFAULT_DESIGNATIONS)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium underline cursor-pointer"
                  >
                    डिफ़ॉल्ट सूची रीसेट करें
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {designations.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      कोई पदनाम उपलब्ध नहीं है। ऊपर से नया पदनाम जोड़ें।
                    </div>
                  ) : (
                    designations.map((desig, idx) => (
                      <div
                        key={desig}
                        className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400 w-5">
                            {idx + 1}.
                          </span>
                          <span className="text-sm font-medium text-slate-800">
                            {desig}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDesignation(desig)}
                          title="इस पदनाम को सूची से हटाएं"
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsDesignationManagerOpen(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  पूर्ण हुआ (Done)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
