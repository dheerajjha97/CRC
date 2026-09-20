import React, { useState, useMemo } from 'react';
import { Teacher, OfficeOrder, SelectedTeacherInOrder, CrcProfile, ClusterSchool } from '../types';
import { ORDER_TEMPLATES } from '../utils/orderTemplates';
import { INITIAL_SCHOOLS } from '../services/dbService';
import { OfficialLetterView } from './OfficialLetterView';
import { downloadElementAsPdf, printLetterElement } from '../utils/pdfGenerator';
import { 
  FileText, 
  Users, 
  Check, 
  Sparkles, 
  Download, 
  Printer, 
  Save, 
  Eye, 
  Calendar, 
  MapPin, 
  Clock, 
  FileCheck2,
  Trash2,
  Search,
  School,
  Plus,
  ArrowRight,
  GraduationCap,
  Building2,
  CheckSquare,
  Square,
  Filter,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';

interface OrderGeneratorProps {
  teachers: Teacher[];
  schools?: ClusterSchool[];
  profile: CrcProfile;
  onSaveOrder: (order: Omit<OfficeOrder, 'id'>) => Promise<string>;
  editingOrder?: OfficeOrder | null;
  onCancelEdit?: () => void;
  onOpenAiChat?: () => void;
}

export const OrderGenerator: React.FC<OrderGeneratorProps> = ({
  teachers,
  schools = [],
  profile,
  onSaveOrder,
  editingOrder,
  onCancelEdit,
  onOpenAiChat
}) => {
  // Form State
  const [orderNumber, setOrderNumber] = useState(
    editingOrder?.orderNumber || `${profile.letterPrefix || 'क्र./सं.सं.के./2026/'}${Math.floor(100 + Math.random() * 900)}`
  );
  const [orderDate, setOrderDate] = useState(
    editingOrder?.orderDate || new Date().toISOString().split('T')[0]
  );
  const [subject, setSubject] = useState(
    editingOrder?.subject || ORDER_TEMPLATES[0].subject
  );
  const [reference, setReference] = useState(
    editingOrder?.reference || 'कार्यालय विकासखंड शिक्षा अधिकारी / जिला शिक्षा अधिकारी पत्र क्रमांक... दिनांक...'
  );
  const [content, setContent] = useState(
    editingOrder?.content || ORDER_TEMPLATES[0].defaultContent
  );
  const [orderType, setOrderType] = useState<OfficeOrder['orderType']>(
    editingOrder?.orderType || 'meeting'
  );

  // Meeting specific details
  const [meetingDate, setMeetingDate] = useState(editingOrder?.meetingDate || '');
  const [meetingTime, setMeetingTime] = useState(editingOrder?.meetingTime || 'प्रातः 11:00 बजे');
  const [meetingVenue, setMeetingVenue] = useState(
    editingOrder?.meetingVenue || 'संकुल संसाधन केंद्र (CRC) सभागार'
  );

  // Selected Teachers State
  const [selectedTeachers, setSelectedTeachers] = useState<SelectedTeacherInOrder[]>(
    editingOrder?.selectedTeachers || []
  );

  // Deputed / Exam School Mode
  const [includeDeputedSchool, setIncludeDeputedSchool] = useState<boolean>(
    editingOrder?.includeDeputedSchool ?? 
    (editingOrder?.selectedTeachers?.some(t => Boolean(t.deputedSchool && t.deputedSchool.trim())) || false)
  );
  const [batchDeputedSchool, setBatchDeputedSchool] = useState('');

  // Update state whenever editingOrder prop updates (e.g. from AI assistant draft)
  React.useEffect(() => {
    if (editingOrder) {
      if (editingOrder.orderNumber) setOrderNumber(editingOrder.orderNumber);
      if (editingOrder.orderDate) setOrderDate(editingOrder.orderDate);
      if (editingOrder.subject) setSubject(editingOrder.subject);
      if (editingOrder.reference !== undefined) setReference(editingOrder.reference);
      if (editingOrder.content) setContent(editingOrder.content);
      if (editingOrder.orderType) setOrderType(editingOrder.orderType);
      if (editingOrder.meetingDate !== undefined) setMeetingDate(editingOrder.meetingDate);
      if (editingOrder.meetingTime !== undefined) setMeetingTime(editingOrder.meetingTime);
      if (editingOrder.meetingVenue !== undefined) setMeetingVenue(editingOrder.meetingVenue);
      if (editingOrder.selectedTeachers) setSelectedTeachers(editingOrder.selectedTeachers);
      if (editingOrder.includeDeputedSchool !== undefined) {
        setIncludeDeputedSchool(editingOrder.includeDeputedSchool);
      } else if (editingOrder.selectedTeachers?.some(t => Boolean(t.deputedSchool && t.deputedSchool.trim()))) {
        setIncludeDeputedSchool(true);
      }
    }
  }, [editingOrder]);

  // Teacher selection view mode: 'by_school' (grouped by school) vs 'flat_list'
  const [teacherSelectionMode, setTeacherSelectionMode] = useState<'by_school' | 'flat_list'>('by_school');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('');
  const [expandedSchools, setExpandedSchools] = useState<Record<string, boolean>>({});

  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Signatory details
  const [signatoryName, setSignatoryName] = useState(
    editingOrder?.signatoryName || profile.defaultSignatory || profile.centerHead
  );
  const [signatoryDesignation, setSignatoryDesignation] = useState(
    editingOrder?.signatoryDesignation || profile.defaultDesignation || profile.headDesignation
  );

  // Distinct list of cluster schools for dropdowns and auto-suggestions
  const availableSchools = useMemo(() => {
    const schoolSet = new Set<string>();
    if (schools && schools.length > 0) {
      schools.forEach(s => {
        if (s.name?.trim()) schoolSet.add(s.name.trim());
      });
    }
    teachers.forEach(t => {
      if (t.schoolName?.trim()) schoolSet.add(t.schoolName.trim());
    });
    INITIAL_SCHOOLS.forEach(s => {
      if (s.name?.trim()) schoolSet.add(s.name.trim());
    });
    if (profile.clusterName?.trim()) {
      schoolSet.add(profile.clusterName.trim());
    }
    return Array.from(schoolSet).sort();
  }, [schools, teachers, profile.clusterName]);

  // Group teachers by their posted school
  const schoolTeacherGroups = useMemo(() => {
    const map: { [schoolName: string]: Teacher[] } = {};

    // First ensure all available registered schools have an entry
    availableSchools.forEach(sch => {
      map[sch] = [];
    });

    teachers.forEach(t => {
      const sch = t.schoolName?.trim() || 'अन्य विद्यालय';
      if (!map[sch]) map[sch] = [];
      map[sch].push(t);
    });

    // Remove empty schools only if search is active or filter is applied
    const result: { schoolName: string; teachers: Teacher[] }[] = [];
    Object.keys(map).forEach(schoolName => {
      let groupTeachers = map[schoolName];
      if (selectedSchoolFilter && schoolName !== selectedSchoolFilter) {
        return;
      }
      if (teacherSearch.trim()) {
        const q = teacherSearch.toLowerCase();
        groupTeachers = groupTeachers.filter(
          t => t.name.toLowerCase().includes(q) || t.designation.toLowerCase().includes(q) || schoolName.toLowerCase().includes(q)
        );
        if (groupTeachers.length === 0) return;
      }
      result.push({ schoolName, teachers: groupTeachers });
    });

    return result.sort((a, b) => a.schoolName.localeCompare(b.schoolName, 'hi'));
  }, [availableSchools, teachers, selectedSchoolFilter, teacherSearch]);

  // Toggle school card accordion collapse
  const toggleSchoolAccordion = (schoolName: string) => {
    setExpandedSchools(prev => ({
      ...prev,
      [schoolName]: prev[schoolName] === undefined ? true : !prev[schoolName]
    }));
  };

  // Select all teachers from a specific school
  const handleSelectAllFromSchool = (schoolName: string, schoolTeachers: Teacher[]) => {
    const currentSelectedIds = new Set(selectedTeachers.map(t => t.id));
    const newAdditions: SelectedTeacherInOrder[] = [];

    schoolTeachers.forEach(t => {
      if (!currentSelectedIds.has(t.id)) {
        newAdditions.push({
          id: t.id,
          name: t.name,
          designation: t.designation,
          schoolName: t.schoolName,
          deputedSchool: includeDeputedSchool ? (batchDeputedSchool || '') : undefined,
          assignedDutyRole: 'उपस्थिति / दायित्व निर्वहन'
        });
      }
    });

    if (newAdditions.length > 0) {
      setSelectedTeachers(prev => [...prev, ...newAdditions]);
    }
  };

  // Deselect all teachers belonging to a specific school
  const handleDeselectAllFromSchool = (schoolTeachers: Teacher[]) => {
    const schoolTeacherIds = new Set(schoolTeachers.map(t => t.id));
    setSelectedTeachers(prev => prev.filter(t => !schoolTeacherIds.has(t.id)));
  };

  // Apply template
  const handleApplyTemplate = (templateId: string) => {
    const tmpl = ORDER_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return;
    setSubject(tmpl.subject);
    setContent(tmpl.defaultContent);
    setOrderType(tmpl.category);
    // If exam duty template, automatically enable deputed school mode
    if (tmpl.id === 'exam_duty' || templateId.includes('exam') || tmpl.category === 'duty') {
      setIncludeDeputedSchool(true);
    }
  };

  // Toggle teacher selection individually
  const handleToggleTeacher = (teacher: Teacher) => {
    const existingIndex = selectedTeachers.findIndex(t => t.id === teacher.id);
    if (existingIndex >= 0) {
      setSelectedTeachers(selectedTeachers.filter(t => t.id !== teacher.id));
    } else {
      setSelectedTeachers([
        ...selectedTeachers,
        {
          id: teacher.id,
          name: teacher.name,
          designation: teacher.designation,
          schoolName: teacher.schoolName,
          deputedSchool: includeDeputedSchool ? (batchDeputedSchool || '') : undefined,
          assignedDutyRole: 'उपस्थिति / दायित्व निर्वहन'
        }
      ]);
    }
  };

  const handleUpdateTeacherRole = (teacherId: string, role: string) => {
    setSelectedTeachers(prev =>
      prev.map(t => (t.id === teacherId ? { ...t, assignedDutyRole: role } : t))
    );
  };

  const handleUpdateTeacherDeputedSchool = (teacherId: string, deputedSchool: string) => {
    setSelectedTeachers(prev =>
      prev.map(t => (t.id === teacherId ? { ...t, deputedSchool } : t))
    );
  };

  // Apply batch deputed school to all selected teachers
  const handleApplyBatchDeputedSchool = () => {
    if (!batchDeputedSchool.trim()) return;
    setSelectedTeachers(prev =>
      prev.map(t => ({ ...t, deputedSchool: batchDeputedSchool.trim() }))
    );
  };

  // Apply batch deputed school only to teachers from a specific source school
  const handleApplyBatchDeputedSchoolToSource = (sourceSchool: string, targetSchool: string) => {
    if (!targetSchool.trim()) return;
    setSelectedTeachers(prev =>
      prev.map(t => t.schoolName === sourceSchool ? { ...t, deputedSchool: targetSchool.trim() } : t)
    );
  };

  const handleRemoveSelectedTeacher = (teacherId: string) => {
    setSelectedTeachers(prev => prev.filter(t => t.id !== teacherId));
  };

  // Construct current Order object for live preview and save
  const currentOrder: OfficeOrder = {
    id: editingOrder?.id || 'live-preview-order',
    orderNumber,
    orderDate,
    subject,
    reference,
    content,
    orderType,
    includeDeputedSchool,
    selectedTeachers,
    meetingDate,
    meetingTime,
    meetingVenue,
    signatoryName,
    signatoryDesignation,
    officeName: profile.clusterName,
    officeAddress: profile.officeAddress,
    copyTo: [],
    createdAt: editingOrder?.createdAt || new Date().toISOString()
  };

  const handleSaveToFirestore = async () => {
    if (!orderNumber.trim() || !subject.trim() || !content.trim()) {
      alert('कृपया आदेश क्रमांक, विषय एवं आदेश का विवरण अनिवार्य रूप से भरें।');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMessage('');
    try {
      await onSaveOrder({
        orderNumber,
        orderDate,
        subject,
        reference,
        content,
        orderType,
        includeDeputedSchool,
        selectedTeachers,
        meetingDate,
        meetingTime,
        meetingVenue,
        signatoryName,
        signatoryDesignation,
        officeName: profile.clusterName,
        officeAddress: profile.officeAddress,
        copyTo: [],
        createdAt: editingOrder?.createdAt || new Date().toISOString()
      });

      setSaveSuccessMessage('आदेश सफलतापूर्वक Firestore डेटाबेस में सुरक्षित हो गया है!');
      setTimeout(() => setSaveSuccessMessage(''), 5000);
    } catch (err) {
      console.error(err);
      alert('ऑर्डर सहेजने में त्रुटि हुई, कृपया पुनः प्रयास करें।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      // Clean file name
      const safeNum = orderNumber.replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_');
      await downloadElementAsPdf('official-letter-document', `Aadesh_${safeNum}_${orderDate}`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('पीडीएफ निर्यात में त्रुटि हुई। कृपया प्रिंट (Ctrl+P) विकल्प का उपयोग करके PDF सेव करें।');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    printLetterElement('official-letter-document');
  };

  const filteredAvailableTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.schoolName.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    (t.designation && t.designation.toLowerCase().includes(teacherSearch.toLowerCase()))
  );

  return (
    <div id="order-generator-workspace" className="space-y-6">
      {/* Workspace Header & Tabs */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              कार्यालयीन आदेश एवं पत्र निर्माण (Order Generator)
            </h2>
            {editingOrder && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                संशोधन मोड
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">
            शिक्षक चुनें, आदेश प्रारूप तैयार करें और 1-क्लिक में Firestore में सेव व PDF डाउनलोड करें
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {editingOrder && onCancelEdit && (
            <button
              onClick={onCancelEdit}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              रद्द करें
            </button>
          )}

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              id="tab-btn-edit-mode"
              onClick={() => setPreviewTab('edit')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                previewTab === 'edit'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              आदेश संपादक
            </button>
            <button
              id="tab-btn-preview-mode"
              onClick={() => setPreviewTab('preview')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                previewTab === 'preview'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              लेटर प्रीव्यू (Print View)
            </button>
          </div>

          <button
            id="btn-save-order-firestore"
            onClick={handleSaveToFirestore}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'सेव हो रहा है...' : 'Firestore में सुरक्षित करें'}
          </button>

          <button
            id="btn-download-order-pdf"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {isDownloadingPdf ? 'PDF बन रहा है...' : 'PDF डाउनलोड'}
          </button>

          <button
            id="btn-print-order"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            प्रिंट
          </button>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-emerald-600" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Main Form + Side Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Teacher Selector (visible on edit or dual) */}
        <div className={`space-y-6 ${previewTab === 'edit' ? 'lg:col-span-7' : 'hidden lg:block lg:col-span-5'}`}>
          {/* AI Drafting Banner */}
          {onOpenAiChat && (
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 rounded-xl p-4 text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-1.5">
                    <span>AI चैट सहायक से सरकारी आदेश लिखवाएं</span>
                    <span className="bg-amber-400/20 text-amber-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      शुद्ध हिंदी
                    </span>
                  </h4>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    अपनी जरूरत टाइप करें, AI पूरी सरकारी शब्दावली व शिक्षक सूची सहित आदेश तैयार करेगा
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenAiChat}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-transform hover:scale-105 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI चैट खोलें</span>
              </button>
            </div>
          )}

          {/* Quick Order Template Chips */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              त्वरित आदेश प्रारूप चुनें (Templates) :
            </label>
            <div className="flex flex-wrap gap-2">
              {ORDER_TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl.id)}
                  className="text-xs bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg font-medium transition-all text-left cursor-pointer"
                >
                  {tmpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Letter Metadata Fields */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
              १. आदेश का प्राथमिक विवरण
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  पत्र क्रमांक / आदेश क्रमांक <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-order-number"
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500"
                  placeholder="उदा. क्र./सं.सं.के./2026/142"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  जारी दिनांक <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-order-date"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  पत्र का विषय (Subject) <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-order-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500"
                  placeholder="उदा. मासिक समीक्षा बैठक में अनिवार्य उपस्थिति बाबत।"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  संदर्भ (Reference)
                </label>
                <input
                  id="input-order-reference"
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  placeholder="उदा. बी.ई.ओ. पत्र क्र. 450 दिनांक 15/02/2026"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  आदेश का मुख्य विवरण / निर्देश <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="textarea-order-content"
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  placeholder="आदेश का विस्तृत विवरण यहाँ टाइप करें..."
                />
              </div>
            </div>

            {/* Optional Meeting / Schedule Parameters */}
            <div className="border-t border-slate-200 pt-3">
              <span className="text-xs font-semibold text-slate-600 block mb-2">
                अतिरिक्त कार्यक्रम विवरण (यदि बैठक या शिविर हो) :
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    नियत तिथि
                  </label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    नियत समय
                  </label>
                  <input
                    type="text"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800"
                    placeholder="उदा. 11:00 AM"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    स्थान
                  </label>
                  <input
                    type="text"
                    value={meetingVenue}
                    onChange={(e) => setMeetingVenue(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800"
                    placeholder="उदा. संकुल भवन"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Selection Section (THE MAIN AUTOMATION COMPONENT) */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    २. शाला अनुसार शिक्षकों का चयन एवं प्रतिनियुक्ति
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedTeachers.length} शिक्षक चयनित • कुल {teachers.length} शिक्षक उपलब्ध
                  </p>
                </div>
              </div>

              {/* View Mode Toggle: School-wise vs All Teachers */}
              <div className="flex items-center gap-2">
                <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setTeacherSelectionMode('by_school')}
                    className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      teacherSelectionMode === 'by_school'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>शाला-वार समूह</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeacherSelectionMode('flat_list')}
                    className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      teacherSelectionMode === 'flat_list'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>समग्र सूची</span>
                  </button>
                </div>

                {selectedTeachers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTeachers([])}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
                  >
                    सभी हटाएं ({selectedTeachers.length})
                  </button>
                )}
              </div>
            </div>

            {/* Examination & Deputation Duty Mode Toggle */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-lg mt-0.5 shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-950 block">
                    परीक्षा ड्यूटी / शाला प्रतिनियुक्ति मोड (Deputed to School List)
                  </span>
                  <span className="text-[11px] text-indigo-800 leading-relaxed">
                    शिक्षकों को उनकी मूल शाला से चयनित कर आवश्यकतानुसार संकुल की अन्य शालाओं या परीक्षा केंद्रों में प्रतिनियुक्त करें। आदेश पत्र में &quot;मूल पदस्थापना शाला&quot; व &quot;प्रतिनियुक्त शाला&quot; दोनों कॉलम मुद्रित होंगे।
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  id="toggle-deputed-school-mode"
                  type="checkbox"
                  checked={includeDeputedSchool}
                  onChange={(e) => setIncludeDeputedSchool(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-2 text-xs font-semibold text-slate-800">
                  {includeDeputedSchool ? 'चालू (ON)' : 'बंद (OFF)'}
                </span>
              </label>
            </div>

            {/* Datalist for available cluster schools */}
            <datalist id="cluster-schools-datalist">
              {availableSchools.map((sch) => (
                <option key={sch} value={sch} />
              ))}
            </datalist>

            {/* Filters Row: School Filter + Search */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-7 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="input-filter-order-teachers"
                  type="text"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder="शिक्षक के नाम, पदनाम या शाला से खोजें..."
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="sm:col-span-5 relative">
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <select
                  id="filter-order-by-school"
                  value={selectedSchoolFilter}
                  onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white truncate"
                >
                  <option value="">सभी शालाएं ({availableSchools.length} शालाएं)</option>
                  {availableSchools.map(sch => (
                    <option key={sch} value={sch}>
                      {sch}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 1. School-Wise Grouped Teacher Selector View */}
            {teacherSelectionMode === 'by_school' ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                {schoolTeacherGroups.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    कोई शिक्षक या शाला नहीं मिली। कृपया खोज शब्द बदलें।
                  </div>
                ) : (
                  schoolTeacherGroups.map(group => {
                    const schoolTeachers = group.teachers;
                    const selectedCountInSchool = schoolTeachers.filter(st =>
                      selectedTeachers.some(sel => sel.id === st.id)
                    ).length;
                    const isAllSelectedInSchool =
                      schoolTeachers.length > 0 && selectedCountInSchool === schoolTeachers.length;
                    const isExpanded = expandedSchools[group.schoolName] !== false; // expanded by default

                    return (
                      <div
                        key={group.schoolName}
                        className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs"
                      >
                        {/* School Header Bar */}
                        <div className="px-3 py-2 bg-slate-100/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSchoolAccordion(group.schoolName)}
                            className="flex items-center gap-2 text-left cursor-pointer flex-1 min-w-0"
                          >
                            <School className="w-4 h-4 text-indigo-700 shrink-0" />
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {group.schoolName}
                            </span>
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold shrink-0">
                              {schoolTeachers.length} शिक्षक
                            </span>
                            {selectedCountInSchool > 0 && (
                              <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold shrink-0">
                                {selectedCountInSchool} चयनित
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-auto shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-auto shrink-0" />
                            )}
                          </button>

                          {/* Quick Actions for this School */}
                          {schoolTeachers.length > 0 && (
                            <div className="flex items-center gap-1.5 shrink-0 pl-6 sm:pl-0">
                              {isAllSelectedInSchool ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeselectAllFromSchool(schoolTeachers)}
                                  className="text-[11px] px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Square className="w-3 h-3" />
                                  <span>सभी हटाएं</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSelectAllFromSchool(group.schoolName, schoolTeachers)}
                                  className="text-[11px] px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <CheckSquare className="w-3 h-3" />
                                  <span>सभी चुनें ({schoolTeachers.length})</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* School Teachers List */}
                        {isExpanded && (
                          <div className="divide-y divide-slate-100">
                            {schoolTeachers.length === 0 ? (
                              <div className="p-3 text-xs text-slate-400 italic">
                                इस शाला में वर्तमान में कोई शिक्षक पंजीकृत नहीं है।
                              </div>
                            ) : (
                              schoolTeachers.map(t => {
                                const isSelected = selectedTeachers.some(st => st.id === t.id);
                                return (
                                  <div
                                    key={t.id}
                                    onClick={() => handleToggleTeacher(t)}
                                    className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                      isSelected ? 'bg-indigo-50/70 hover:bg-indigo-50' : 'hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div
                                        className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                                          isSelected
                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                            : 'border-slate-400 bg-white'
                                        }`}
                                      >
                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                      </div>
                                      <div>
                                        <div className="text-xs font-bold text-slate-900 truncate">
                                          {t.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          {t.designation}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-1">
                                      {isSelected ? (
                                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                                          आदेशित ✓
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-400">
                                          चुनने हेतु क्लिक करें
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* 2. Flat Searchable List View */
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {filteredAvailableTeachers.map(t => {
                  const isSelected = selectedTeachers.some(st => st.id === t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTeacher(t)}
                      className={`p-2.5 flex items-start gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/80 hover:bg-indigo-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="pt-0.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-400 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {t.name}
                          </span>
                          <span className="text-[11px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-medium shrink-0">
                            {t.designation}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <School className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{t.schoolName}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected Teachers Table & Role / Deputed School Assignment */}
            {selectedTeachers.length > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    चयनित शिक्षक ({selectedTeachers.length}) एवं प्रतिनियुक्ति शाला आवंटन :
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    आवश्यकतानुसार प्रतिनियुक्त शाला चुनें
                  </span>
                </div>

                {/* Batch apply deputed school tool from registered school list */}
                {includeDeputedSchool && (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                    <span className="font-bold text-amber-950 shrink-0 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      एक साथ सभी चयनितों के लिए प्रतिनियुक्त शाला / केंद्र चुनें:
                    </span>
                    <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <select
                        value={batchDeputedSchool}
                        onChange={(e) => setBatchDeputedSchool(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-amber-300 rounded-lg bg-white text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">-- शाला सूची से प्रतिनियुक्त शाला चुनें --</option>
                        {availableSchools.map(sch => (
                          <option key={sch} value={sch}>
                            {sch}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleApplyBatchDeputedSchool}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs whitespace-nowrap cursor-pointer transition-colors shadow-xs"
                      >
                        सभी {selectedTeachers.length} पर लागू करें
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  {selectedTeachers.map((st, i) => (
                    <div
                      key={st.id}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs shadow-xs"
                    >
                      {includeDeputedSchool ? (
                        /* Full Exam / Deputation Duty Layout */
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-[11px]">
                                {i + 1}
                              </span>
                              <span className="font-bold text-slate-900 text-xs">
                                {st.name}
                              </span>
                              <span className="text-[11px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                                {st.designation}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSelectedTeacher(st.id)}
                              className="text-slate-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                              title="हटाएं"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-0.5">
                            {/* 1. मूल पदस्थापना विद्यालय */}
                            <div className="md:col-span-4">
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5 flex items-center gap-1">
                                <School className="w-3 h-3 text-slate-400" />
                                मूल पदस्थापना शाला (Source):
                              </label>
                              <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-bold text-xs truncate">
                                {st.schoolName}
                              </div>
                            </div>

                            {/* 2. प्रतिनियुक्त विद्यालय / परीक्षा केंद्र (School List Dropdown) */}
                            <div className="md:col-span-5">
                              <label className="block text-[11px] font-bold text-indigo-700 mb-0.5 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3 text-indigo-600" />
                                प्रतिनियुक्त शाला / परीक्षा केंद्र (Deputed To):
                              </label>
                              <div className="space-y-1">
                                <select
                                  value={st.deputedSchool || ''}
                                  onChange={(e) => handleUpdateTeacherDeputedSchool(st.id, e.target.value)}
                                  className="w-full px-2.5 py-1.5 border border-indigo-300 rounded-lg bg-white text-xs font-semibold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                                >
                                  <option value="">-- शाला सूची से चुनें --</option>
                                  {availableSchools.map(sch => (
                                    <option key={sch} value={sch}>
                                      {sch} {sch === st.schoolName ? '(मूल शाला)' : ''}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  list="cluster-schools-datalist"
                                  type="text"
                                  value={st.deputedSchool || ''}
                                  onChange={(e) => handleUpdateTeacherDeputedSchool(st.id, e.target.value)}
                                  placeholder="अथवा यहाँ सीधे शाला / परीक्षा केंद्र लिखें..."
                                  className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] text-slate-700 bg-white"
                                />
                              </div>
                            </div>

                            {/* 3. आवंटित दायित्व */}
                            <div className="md:col-span-3">
                              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                आवंटित दायित्व (Role):
                              </label>
                              <input
                                type="text"
                                value={st.assignedDutyRole || ''}
                                onChange={(e) => handleUpdateTeacherRole(st.id, e.target.value)}
                                placeholder="उदा. वीक्षक / पर्यवेक्षक"
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                              />
                              <div className="flex flex-wrap gap-1 mt-1">
                                {['वीक्षक', 'केंद्राध्यक्ष', 'मूल्यांकनकर्ता'].map((role) => (
                                  <button
                                    key={role}
                                    type="button"
                                    onClick={() => handleUpdateTeacherRole(st.id, role)}
                                    className="text-[10px] bg-slate-200 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                  >
                                    +{role}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Standard Single-School Layout */
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-slate-900 mr-2">{i + 1}. {st.name}</span>
                            <span className="text-slate-600 font-medium text-[11px]">({st.schoolName} - {st.designation})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={st.assignedDutyRole || ''}
                              onChange={(e) => handleUpdateTeacherRole(st.id, e.target.value)}
                              placeholder="आवंटित दायित्व / टिप्पणी"
                              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 w-44"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSelectedTeacher(st.id)}
                              className="text-slate-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                              title="हटाएं"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Signatory Settings in Order */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                हस्ताक्षरकर्ता का नाम
              </label>
              <input
                type="text"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                हस्ताक्षरकर्ता का पदनाम
              </label>
              <input
                type="text"
                value={signatoryDesignation}
                onChange={(e) => setSignatoryDesignation(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Letterhead & Official Document Preview */}
        <div className={`space-y-4 ${previewTab === 'preview' ? 'lg:col-span-12' : 'hidden lg:block lg:col-span-7'}`}>
          <div className="bg-slate-100 rounded-xl p-3 border border-slate-300 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>आधिकारिक पत्र प्रारूप (A4 पूर्वावलोकन)</span>
            <span className="text-slate-500">प्रिंट एवं पीडीएफ में ठीक ऐसा ही निकलेगा</span>
          </div>

          <div className="overflow-x-auto pb-4">
            <OfficialLetterView
              order={currentOrder}
              profile={profile}
              id="official-letter-document"
              isPrintPreview={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
