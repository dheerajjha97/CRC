import React, { useState } from 'react';
import { Teacher, ClusterSchool } from '../types';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  School, 
  Search, 
  UserPlus, 
  Check, 
  Sparkles,
  Phone,
  Mail,
  BookOpen
} from 'lucide-react';

interface TeacherManagementProps {
  teachers: Teacher[];
  schools: ClusterSchool[];
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>;
  onUpdateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>;
  onDeleteTeacher: (id: string) => Promise<void>;
  onAddSchool: (school: Omit<ClusterSchool, 'id'>) => Promise<void>;
  onDeleteSchool: (id: string) => Promise<void>;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  teachers,
  schools,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onAddSchool,
  onDeleteSchool
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'teachers' | 'schools'>('teachers');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSchool, setFilterSchool] = useState('');

  // Teacher Form State
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('सहायक शिक्षक');
  const [schoolName, setSchoolName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // School Form State
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newUdiseCode, setNewUdiseCode] = useState('');
  const [newCategory, setNewCategory] = useState('प्राथमिक विद्यालय (कक्षा 1-5)');

  // Quick designations
  const DESIGNATIONS = [
    'सहायक शिक्षक',
    'शिक्षक (प्रशिक्षित स्नातक)',
    'प्रधानाध्यापक / प्रधान शिक्षक',
    'प्रभारी प्रधानाध्यापक',
    'व्याख्याता / उच्च माध्यमिक शिक्षक',
    'शारीरिक शिक्षक (PET)',
    'विशिष्ट शिक्षक (सक्षमता उत्तीर्ण)',
    'अतिथि शिक्षक'
  ];

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedSchool = schoolName || (schools.length > 0 ? schools[0].name : 'संकुल प्राथमिक विद्यालय');
      if (editingTeacherId) {
        await onUpdateTeacher(editingTeacherId, {
          name: name.trim(),
          designation,
          schoolName: selectedSchool,
          phone: phone.trim(),
          email: email.trim(),
          subject: subject.trim()
        });
        setEditingTeacherId(null);
      } else {
        await onAddTeacher({
          name: name.trim(),
          designation,
          schoolName: selectedSchool,
          phone: phone.trim(),
          email: email.trim(),
          subject: subject.trim()
        });
      }
      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setSubject('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (t: Teacher) => {
    setEditingTeacherId(t.id);
    setName(t.name);
    setDesignation(t.designation);
    setSchoolName(t.schoolName);
    setPhone(t.phone || '');
    setEmail(t.email || '');
    setSubject(t.subject || '');
  };

  const handleCancelEdit = () => {
    setEditingTeacherId(null);
    setName('');
    setPhone('');
    setEmail('');
    setSubject('');
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddSchool({
        name: newSchoolName.trim(),
        udiseCode: newUdiseCode.trim(),
        category: newCategory
      });
      setNewSchoolName('');
      setNewUdiseCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter teachers
  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.subject && t.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSchool = filterSchool ? t.schoolName === filterSchool : true;
    return matchesSearch && matchesSchool;
  });

  return (
    <div className="space-y-6">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            संकुल शिक्षक एवं विद्यालय प्रबंधन
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            संकुल अंतर्गत पदस्थ समस्त शिक्षकों एवं संबद्ध शालाओं की मास्टर डायरेक्टरी
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('teachers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'teachers'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            शिक्षक सूची ({teachers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('schools')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'schools'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            संबद्ध विद्यालय ({schools.length})
          </button>
        </div>
      </div>

      {/* SUB TAB: TEACHERS */}
      {activeSubTab === 'teachers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add / Edit Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-1 h-fit">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              {editingTeacherId ? (
                <>
                  <Edit2 className="w-4 h-4 text-amber-600" />
                  शिक्षक विवरण संशोधित करें
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  नया शिक्षक जोड़ें
                </>
              )}
            </h3>

            <form onSubmit={handleSaveTeacher} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  शिक्षक / शिक्षिका का पूरा नाम *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा. श्री सुनील कुमार"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  पदनाम (Designation) *
                </label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {DESIGNATIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  पदस्थ विद्यालय (School) *
                </label>
                <select
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {schools.length === 0 && (
                    <option value="संकुल प्राथमिक शाला">संकुल प्राथमिक शाला</option>
                  )}
                  {schools.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    अध्यापन विषय (ऐच्छिक)
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="उदा. गणित / विज्ञान"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    मोबाइल नंबर
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765XXXXX"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  ईमेल पता (ऐच्छिक)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@example.com"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {editingTeacherId ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      अपडेट करें
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      शिक्षक सुरक्षित करें
                    </>
                  )}
                </button>

                {editingTeacherId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-3 rounded-xl text-xs cursor-pointer"
                  >
                    रद्द करें
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Teacher Directory List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="शिक्षक नाम, विद्यालय या विषय से खोजें..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700"
              >
                <option value="">सभी विद्यालय ({teachers.length})</option>
                {schools.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* List */}
            {filteredTeachers.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                कोई शिक्षक रिकॉर्ड नहीं मिला।
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto pr-1">
                {filteredTeachers.map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {t.designation}
                        </span>
                        {t.subject && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                            <BookOpen className="w-2.5 h-2.5" />
                            {t.subject}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <School className="w-3 h-3 text-slate-400" />
                          {t.schoolName}
                        </span>
                        {t.phone && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {t.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditClick(t)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="संशोधित करें"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTeacher(t.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="हटाएं"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB: SCHOOLS */}
      {activeSubTab === 'schools' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add School Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-1 h-fit">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <School className="w-4 h-4 text-indigo-600" />
              नया संबद्ध विद्यालय जोड़ें
            </h3>

            <form onSubmit={handleSaveSchool} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  विद्यालय का पूरा नाम *
                </label>
                <input
                  type="text"
                  required
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  placeholder="उदा. राजकीय प्राथमिक विद्यालय, नया टोला"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  UDISE कोड (11 अंक)
                </label>
                <input
                  type="text"
                  value={newUdiseCode}
                  onChange={(e) => setNewUdiseCode(e.target.value)}
                  placeholder="उदा. 10030501201"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  श्रेणी / स्तर
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                >
                  <option value="प्राथमिक विद्यालय (कक्षा 1-5)">प्राथमिक विद्यालय (कक्षा 1-5)</option>
                  <option value="मध्य विद्यालय (कक्षा 1-8)">मध्य विद्यालय (कक्षा 1-8)</option>
                  <option value="उच्च माध्यमिक विद्यालय (कक्षा 9-12)">उच्च माध्यमिक विद्यालय (कक्षा 9-12)</option>
                  <option value="उत्क्रमित माध्यमिक विद्यालय">उत्क्रमित माध्यमिक विद्यालय</option>
                  <option value="कस्तूरबा गांधी बालिका विद्यालय">कस्तूरबा गांधी बालिका विद्यालय (KGBV)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                विद्यालय सुरक्षित करें
              </button>
            </form>
          </div>

          {/* Schools List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              संकुल अंतर्गत संबद्ध विद्यालयों की सूची ({schools.length})
            </h3>

            {schools.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                कोई विद्यालय नहीं जोड़ा गया है।
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                {schools.map((s) => {
                  const count = teachers.filter(t => t.schoolName === s.name).length;
                  return (
                    <div key={s.id} className="p-3.5 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors bg-slate-50/50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-900 text-xs leading-snug">{s.name}</h4>
                          <button
                            type="button"
                            onClick={() => onDeleteSchool(s.id)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded cursor-pointer"
                            title="हटाएं"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {s.category && (
                          <span className="inline-block text-[10px] text-slate-500 font-medium mt-1">
                            {s.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 mt-2">
                        <span className="font-mono text-slate-600">
                          {s.udiseCode ? `UDISE: ${s.udiseCode}` : 'UDISE: —'}
                        </span>
                        <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {count} शिक्षक पदस्थ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
