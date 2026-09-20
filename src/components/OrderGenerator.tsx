import React, { useState, useEffect } from 'react';
import { 
  OfficeOrder, 
  CrcProfile, 
  Teacher, 
  SelectedTeacherInOrder, 
  ClusterSchool 
} from '../types';
import { ORDER_TEMPLATES } from '../utils/orderTemplates';
import { generateNextOrderNumber } from '../utils/orderNumberUtils';
import { downloadOrderAsPdf, printOrderDirectly } from '../utils/pdfGenerator';
import { OfficialLetterView } from './OfficialLetterView';
import { 
  FileText, 
  Printer, 
  Download, 
  Save, 
  RotateCcw, 
  Users, 
  Plus, 
  Trash2, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  CheckSquare, 
  Square,
  CheckCircle2,
  Share2,
  ChevronDown,
  LayoutTemplate
} from 'lucide-react';

interface OrderGeneratorProps {
  profile: CrcProfile;
  teachers: Teacher[];
  schools: ClusterSchool[];
  savedOrders: OfficeOrder[];
  initialOrder?: OfficeOrder | null;
  onSaveOrder: (order: Omit<OfficeOrder, 'id'>, existingId?: string) => Promise<void>;
  onNavigateToHistory?: () => void;
}

export const OrderGenerator: React.FC<OrderGeneratorProps> = ({
  profile,
  teachers,
  schools,
  savedOrders,
  initialOrder,
  onSaveOrder,
  onNavigateToHistory
}) => {
  // Form States
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('');
  const [reference, setReference] = useState('');
  const [content, setContent] = useState('');
  const [orderType, setOrderType] = useState<OfficeOrder['orderType']>('meeting');
  
  // Meeting details
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingVenue, setMeetingVenue] = useState('');

  // Selected Teachers
  const [selectedTeachers, setSelectedTeachers] = useState<SelectedTeacherInOrder[]>([]);

  // Signatory
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryDesignation, setSignatoryDesignation] = useState('');

  // Endorsement Copy To
  const [copyTo, setCopyTo] = useState<string[]>([]);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('');
  const [bulkDeputedSchool, setBulkDeputedSchool] = useState('');
  const [bulkDutyRole, setBulkDutyRole] = useState('');

  // Auto initialize default values or populate initialOrder
  useEffect(() => {
    if (initialOrder) {
      setOrderNumber(initialOrder.orderNumber);
      setOrderDate(initialOrder.orderDate || new Date().toISOString().split('T')[0]);
      setSubject(initialOrder.subject || '');
      setReference(initialOrder.reference || '');
      setContent(initialOrder.content || '');
      setOrderType(initialOrder.orderType || 'meeting');
      setMeetingDate(initialOrder.meetingDate || '');
      setMeetingTime(initialOrder.meetingTime || '');
      setMeetingVenue(initialOrder.meetingVenue || '');
      setSelectedTeachers(initialOrder.selectedTeachers || []);
      setSignatoryName(initialOrder.signatoryName || profile.defaultSignatory || profile.centerHead);
      setSignatoryDesignation(initialOrder.signatoryDesignation || profile.defaultDesignation || profile.headDesignation);
      setCopyTo(initialOrder.copyTo || []);
    } else {
      // Auto sequential order number from saved history
      const nextNum = generateNextOrderNumber(profile.letterPrefix || 'क्र./सं.सं.के./2026/', savedOrders);
      setOrderNumber(nextNum);
      setSignatoryName(profile.defaultSignatory || profile.centerHead || '');
      setSignatoryDesignation(profile.defaultDesignation || profile.headDesignation || 'प्राचार्य / संकुल समन्वयक');
      
      // Default to Monthly meeting template if brand new
      if (!subject && !content) {
        handleApplyTemplate('monthly_meeting');
      }
    }
  }, [initialOrder, profile]);

  const handleApplyTemplate = (templateId: string) => {
    const tmpl = ORDER_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return;

    setSubject(tmpl.subject);
    setReference(tmpl.reference);
    setContent(tmpl.content);
    setOrderType(tmpl.category);
    setCopyTo([...tmpl.copyTo]);
  };

  const handleToggleTeacher = (t: Teacher) => {
    const exists = selectedTeachers.some(st => st.id === t.id);
    if (exists) {
      setSelectedTeachers(prev => prev.filter(st => st.id !== t.id));
    } else {
      setSelectedTeachers(prev => [
        ...prev,
        {
          id: t.id,
          name: t.name,
          designation: t.designation,
          schoolName: t.schoolName,
          deputedSchool: bulkDeputedSchool || '',
          assignedDutyRole: bulkDutyRole || ''
        }
      ]);
    }
  };

  const handleSelectAllInSchool = (schoolName: string) => {
    const schoolTeachers = teachers.filter(t => t.schoolName === schoolName);
    const existingIds = new Set(selectedTeachers.map(t => t.id));
    const newToAdd: SelectedTeacherInOrder[] = [];

    for (const t of schoolTeachers) {
      if (!existingIds.has(t.id)) {
        newToAdd.push({
          id: t.id,
          name: t.name,
          designation: t.designation,
          schoolName: t.schoolName,
          deputedSchool: bulkDeputedSchool || '',
          assignedDutyRole: bulkDutyRole || ''
        });
      }
    }

    setSelectedTeachers(prev => [...prev, ...newToAdd]);
  };

  const handleDeselectAllInSchool = (schoolName: string) => {
    const schoolTeacherIds = new Set(teachers.filter(t => t.schoolName === schoolName).map(t => t.id));
    setSelectedTeachers(prev => prev.filter(t => !schoolTeacherIds.has(t.id)));
  };

  const handleApplyBulkToAllSelected = () => {
    setSelectedTeachers(prev => prev.map(t => ({
      ...t,
      deputedSchool: bulkDeputedSchool || t.deputedSchool,
      assignedDutyRole: bulkDutyRole || t.assignedDutyRole
    })));
  };

  // Sync state when order is edited directly inside the official letter view
  const handleUpdateOrderFromInline = (updated: OfficeOrder) => {
    if (updated.subject !== undefined) setSubject(updated.subject);
    if (updated.reference !== undefined) setReference(updated.reference);
    if (updated.content !== undefined) setContent(updated.content);
    if (updated.orderNumber !== undefined) setOrderNumber(updated.orderNumber);
    if (updated.orderDate !== undefined) setOrderDate(updated.orderDate);
    if (updated.meetingDate !== undefined) setMeetingDate(updated.meetingDate);
    if (updated.meetingTime !== undefined) setMeetingTime(updated.meetingTime);
    if (updated.meetingVenue !== undefined) setMeetingVenue(updated.meetingVenue);
    if (updated.signatoryName !== undefined) setSignatoryName(updated.signatoryName);
    if (updated.signatoryDesignation !== undefined) setSignatoryDesignation(updated.signatoryDesignation);
    if (updated.selectedTeachers !== undefined) setSelectedTeachers(updated.selectedTeachers);
    if (updated.copyTo !== undefined) setCopyTo(updated.copyTo);
  };

  // Save order to Firestore / local history
  const handleSave = async (silent: boolean = false): Promise<void> => {
    if (!subject.trim() || !content.trim()) return;

    setIsSaving(true);
    try {
      const orderPayload: Omit<OfficeOrder, 'id'> = {
        orderNumber: orderNumber || generateNextOrderNumber(profile.letterPrefix, savedOrders),
        orderDate,
        subject,
        reference,
        content,
        orderType,
        meetingDate,
        meetingTime,
        meetingVenue,
        selectedTeachers,
        signatoryName: signatoryName || profile.defaultSignatory || profile.centerHead,
        signatoryDesignation: signatoryDesignation || profile.defaultDesignation || profile.headDesignation,
        copyTo
      };

      await onSaveOrder(orderPayload, initialOrder?.id);
      if (!silent) {
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 4000);
      }
    } catch (err) {
      console.error('Error saving order:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      // Auto-save to ensure letter is logged in Jawak Panji
      await handleSave(true);
      const cleanName = subject ? subject.substring(0, 30).replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_') : 'Aadesh';
      await downloadOrderAsPdf('official-letter-document', `${orderNumber || 'CRC_Order'}_${cleanName}.pdf`);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 4000);
    } catch (err) {
      console.error('PDF error:', err);
    }
  };

  const handlePrint = async () => {
    try {
      // Auto-save to ensure letter is logged in Jawak Panji
      await handleSave(true);
      printOrderDirectly('official-letter-document');
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 4000);
    } catch (err) {
      console.error('Print error:', err);
    }
  };

  const currentConstructedOrder: OfficeOrder = {
    id: initialOrder?.id,
    orderNumber,
    orderDate,
    subject,
    reference,
    content,
    orderType,
    meetingDate,
    meetingTime,
    meetingVenue,
    selectedTeachers,
    signatoryName,
    signatoryDesignation,
    copyTo
  };

  // Filter teachers list in sidebar selector
  const filteredTeacherList = teachers.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.schoolName.toLowerCase().includes(teacherSearch.toLowerCase());
    const matchesSchool = selectedSchoolFilter ? t.schoolName === selectedSchoolFilter : true;
    return matchesSearch && matchesSchool;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
            <FileText className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {initialOrder ? 'आदेश संशोधन (Edit Office Order)' : 'कार्यालयीन आदेश जनरेटर (Create Order)'}
            </h2>
            <p className="text-[11px] text-slate-500">
              बिहार शिक्षा विभाग के मानक प्रारूप अनुसार आदेश पत्र तैयार एवं डाउनलोड करें
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveToast && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-semibold animate-in fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>जावक पंजी में सुरक्षित!</span>
              {onNavigateToHistory && (
                <button
                  type="button"
                  onClick={onNavigateToHistory}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg ml-1 cursor-pointer transition-colors"
                >
                  पंजी देखें →
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'सुरक्षित हो रहा है...' : 'जावक पंजी में सेव करें'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF डाउनलोड</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>प्रिंट (A4)</span>
          </button>
        </div>
      </div>

      {/* Main Split: Left Form Controls | Right Official Letter Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Selections (5 cols) */}
        <div className="xl:col-span-5 space-y-5 print:hidden">
          {/* 1. Standard Official Templates */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <LayoutTemplate className="w-4 h-4 text-indigo-600" />
                शासकीय आदेश टेम्पलेट्स (Templates)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ORDER_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl.id)}
                  className={`text-left p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    orderType === tmpl.category && subject === tmpl.subject
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="line-clamp-2 text-[11.5px] leading-tight">{tmpl.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Dispatch Metadata & Body Form */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              आदेश विवरण एवं पत्र क्रमांक
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">पत्र क्रमांक *</label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="क्र./CRC/2026/01"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">दिनांक *</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">आदेश का विषय (Subject) *</label>
              <textarea
                rows={2}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="उदा. संकुल मासिक समीक्षा बैठक में अनिवार्य उपस्थिति बाबत..."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">संदर्भ / प्रसंग (Reference)</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="प्रखंड शिक्षा पदाधिकारी पत्र क्रमांक... दिनांक..."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">मुख्य शासकीय आदेश विवरण (Body) *</label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="मुख्य आदेश का विवरण लिखें..."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs leading-relaxed"
              />
            </div>

            {/* Meeting Schedule Inputs */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-800 block">
                नियत तिथि, समय एवं स्थान (बैठक / प्रशिक्षण हेतु)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  placeholder="तिथि (25/09/2026)"
                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-[11px] bg-white"
                />
                <input
                  type="text"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  placeholder="समय (11:00 AM)"
                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-[11px] bg-white"
                />
                <input
                  type="text"
                  value={meetingVenue}
                  onChange={(e) => setMeetingVenue(e.target.value)}
                  placeholder="स्थान (CRC सभागार)"
                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-[11px] bg-white"
                />
              </div>
            </div>
          </div>

          {/* 3. Teacher Selection & Duty Allocation Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                आदेशित शिक्षकों का चयन ({selectedTeachers.length} चयनित)
              </span>

              {selectedTeachers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTeachers([])}
                  className="text-[11px] text-red-600 hover:underline cursor-pointer font-medium"
                >
                  सभी हटाएं
                </button>
              )}
            </div>

            {/* Bulk Allocation Inputs */}
            <div className="bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100 space-y-2">
              <span className="text-[11px] font-bold text-indigo-950 block">
                एकमुश्त आवंटन (Bulk Deputation / Duty Assignment):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={bulkDeputedSchool}
                  onChange={(e) => setBulkDeputedSchool(e.target.value)}
                  placeholder="प्रतिनियुक्त शाला / केंद्र"
                  className="w-full px-2 py-1 border border-indigo-200 rounded-md text-[11px] bg-white"
                />
                <input
                  type="text"
                  value={bulkDutyRole}
                  onChange={(e) => setBulkDutyRole(e.target.value)}
                  placeholder="आवंटित दायित्व (उदा. वीक्षक)"
                  className="w-full px-2 py-1 border border-indigo-200 rounded-md text-[11px] bg-white"
                />
              </div>
              {selectedTeachers.length > 0 && (bulkDeputedSchool || bulkDutyRole) && (
                <button
                  type="button"
                  onClick={handleApplyBulkToAllSelected}
                  className="text-[10.5px] bg-indigo-600 text-white font-bold px-2.5 py-1 rounded-md cursor-pointer hover:bg-indigo-700"
                >
                  चयनित सभी ({selectedTeachers.length}) शिक्षकों पर लागू करें
                </button>
              )}
            </div>

            {/* Search and School Filter */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="शिक्षक नाम खोजें..."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <select
                value={selectedSchoolFilter}
                onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">सभी शालाएं</option>
                {schools.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Quick School Action Buttons */}
            {selectedSchoolFilter && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllInSchool(selectedSchoolFilter)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2 py-1 rounded cursor-pointer"
                >
                  + इस विद्यालय के सभी शिक्षक चुनें
                </button>
                <button
                  type="button"
                  onClick={() => handleDeselectAllInSchool(selectedSchoolFilter)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-red-700 font-semibold px-2 py-1 rounded cursor-pointer"
                >
                  - इस विद्यालय के हटाएं
                </button>
              </div>
            )}

            {/* Teacher Selection Checklist */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-1 bg-slate-50/50">
              {filteredTeacherList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  कोई शिक्षक नहीं मिला।
                </div>
              ) : (
                filteredTeacherList.map((t) => {
                  const isChecked = selectedTeachers.some(st => st.id === t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTeacher(t)}
                      className={`p-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        isChecked ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{t.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{t.designation} • {t.schoolName}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Official Letter Live Preview with Inline Editing (7 cols) */}
        <div className="xl:col-span-7">
          <div className="sticky top-4">
            <OfficialLetterView
              order={currentConstructedOrder}
              profile={profile}
              id="official-letter-document"
              isPrintPreview={true}
              allowInlineEdit={true}
              onUpdateOrder={handleUpdateOrderFromInline}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
