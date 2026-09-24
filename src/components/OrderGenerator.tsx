import React, { useState, useEffect } from 'react';
import { 
  OfficeOrder, 
  CrcProfile, 
  Teacher, 
  SelectedTeacherInOrder, 
  ClusterSchool,
  CustomTableData
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
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  CheckSquare, 
  Square,
  CheckCircle2,
  Table as TableIcon,
  Layers,
  Sparkles,
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
  const [tableMode, setTableMode] = useState<OfficeOrder['tableMode']>('teachers');
  
  // Custom Table State
  const [customTable, setCustomTable] = useState<CustomTableData | undefined>({
    title: 'संकुल परीक्षा समय-सारणी / विवरणी',
    columns: ['क्र.', 'कक्षा', 'विषय', 'दिनांक', 'समय', 'रिमार्क'],
    rows: [
      ['1', 'कक्षा 5', 'हिंदी (भाषा)', '28/09/2026', '10:00 AM - 12:30 PM', 'प्रथम पाली'],
      ['2', 'कक्षा 5', 'गणित', '29/09/2026', '10:00 AM - 12:30 PM', 'प्रथम पाली'],
      ['3', 'कक्षा 8', 'विज्ञान', '28/09/2026', '01:30 PM - 04:00 PM', 'द्वितीय पाली']
    ]
  });

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
      setTableMode(initialOrder.tableMode || (initialOrder.customTable ? 'custom' : (initialOrder.selectedTeachers && initialOrder.selectedTeachers.length > 0 ? 'teachers' : 'none')));
      if (initialOrder.customTable) {
        setCustomTable(initialOrder.customTable);
      }
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
    if (tmpl.tableMode) {
      setTableMode(tmpl.tableMode);
    }
    if (tmpl.customTable) {
      setCustomTable(JSON.parse(JSON.stringify(tmpl.customTable)));
    }
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

  // Custom Table Helpers
  const handleLoadCustomTablePreset = (preset: 'exam' | 'material' | 'agenda' | 'target' | 'blank') => {
    setTableMode('custom');
    if (preset === 'exam') {
      setCustomTable({
        title: 'संकुल परीक्षा समय-सारणी',
        columns: ['क्र.', 'कक्षा', 'विषय', 'परीक्षा दिनांक', 'समय', 'रिमार्क'],
        rows: [
          ['1', 'कक्षा 5', 'हिंदी (भाषा)', '28/09/2026', '10:00 AM - 12:30 PM', 'प्रथम पाली'],
          ['2', 'कक्षा 5', 'गणित', '29/09/2026', '10:00 AM - 12:30 PM', 'प्रथम पाली'],
          ['3', 'कक्षा 8', 'विज्ञान', '28/09/2026', '01:30 PM - 04:00 PM', 'द्वितीय पाली']
        ]
      });
    } else if (preset === 'material') {
      setCustomTable({
        title: 'विद्यालयवार सामग्री / पाठ्यपुस्तक वितरण विवरणी',
        columns: ['क्र.', 'विद्यालय का नाम', 'UDISE कोड', 'सामग्री / किट नाम', 'आवंटित संख्या', 'प्राप्ति दिनांक'],
        rows: [
          ['1', 'प्राथमिक शाला, नयापारा', '22100401201', 'FLN किट व पाठ्यपुस्तक', '45 सेट', '30/09/2026'],
          ['2', 'पूर्व माध्यमिक शाला, रामपुर', '22100401203', 'विज्ञान किट', '25 सेट', '30/09/2026']
        ]
      });
    } else if (preset === 'agenda') {
      setCustomTable({
        title: 'बैठक कार्यसूची / एजेंडा विवरणी',
        columns: ['क्र.', 'समीक्षा बिंदु / एजेंडा', 'प्रस्तुतकर्ता', 'आवश्यक अभिलेख', 'अपेक्षित निर्णय'],
        rows: [
          ['1', 'FLN / निपुण भारत लक्ष्य प्रगति', 'संकुल समन्वयक', 'FLN ट्रैकर पंजी', '100% लक्ष्य'],
          ['2', 'MDM भोजन गुणवत्ता व स्वच्छता', 'MDM प्रभारी', 'दैनिक पंजी', 'मेन्यू पालन']
        ]
      });
    } else if (preset === 'target') {
      setCustomTable({
        title: 'शालावार लक्ष्य एवं प्रगति समीक्षा',
        columns: ['क्र.', 'विद्यालय का नाम', 'छात्र संख्या', 'लक्ष्य', 'वर्तमान प्रगति', 'टिप्पणी'],
        rows: [
          ['1', 'प्राथमिक शाला, पटेलपारा', '110', 'निपुण भारत', '85%', 'उत्कृष्ट'],
          ['2', 'कन्या पूर्व माध्यमिक शाला', '145', '100% उपस्थिति', '92%', 'संतोषजनक']
        ]
      });
    } else {
      setCustomTable({
        title: 'कस्टम विवरणी तालिका',
        columns: ['क्र.', 'विवरण 1', 'विवरण 2', 'विवरण 3'],
        rows: [
          ['1', '', '', ''],
          ['2', '', '', '']
        ]
      });
    }
  };

  const handleAddCustomColumn = () => {
    if (!customTable) {
      handleLoadCustomTablePreset('blank');
      return;
    }
    const newColName = `कॉलम ${customTable.columns.length + 1}`;
    setCustomTable({
      ...customTable,
      columns: [...customTable.columns, newColName],
      rows: customTable.rows.map(row => [...row, ''])
    });
  };

  const handleDeleteCustomColumn = (colIdx: number) => {
    if (!customTable || customTable.columns.length <= 1) return;
    setCustomTable({
      ...customTable,
      columns: customTable.columns.filter((_, i) => i !== colIdx),
      rows: customTable.rows.map(row => row.filter((_, i) => i !== colIdx))
    });
  };

  const handleAddCustomRow = () => {
    if (!customTable) {
      handleLoadCustomTablePreset('blank');
      return;
    }
    const newRow = customTable.columns.map((_, i) => (i === 0 ? `${customTable.rows.length + 1}` : ''));
    setCustomTable({
      ...customTable,
      rows: [...customTable.rows, newRow]
    });
  };

  const handleDeleteCustomRow = (rowIdx: number) => {
    if (!customTable) return;
    const newRows = customTable.rows.filter((_, i) => i !== rowIdx);
    // Auto renumber
    newRows.forEach((row, i) => {
      if (/^\d+$/.test(row[0] || '')) {
        row[0] = `${i + 1}`;
      }
    });
    setCustomTable({
      ...customTable,
      rows: newRows
    });
  };

  const handleCustomCellChange = (rowIdx: number, colIdx: number, val: string) => {
    if (!customTable) return;
    const updatedRows = [...customTable.rows];
    if (!updatedRows[rowIdx]) updatedRows[rowIdx] = [];
    updatedRows[rowIdx][colIdx] = val;
    setCustomTable({
      ...customTable,
      rows: updatedRows
    });
  };

  // Sync state when order is edited directly inside the official letter view
  const handleUpdateOrderFromInline = (updated: OfficeOrder) => {
    if (updated.subject !== undefined) setSubject(updated.subject);
    if (updated.reference !== undefined) setReference(updated.reference);
    if (updated.content !== undefined) setContent(updated.content);
    if (updated.orderNumber !== undefined) setOrderNumber(updated.orderNumber);
    if (updated.orderDate !== undefined) setOrderDate(updated.orderDate);
    if (updated.tableMode !== undefined) setTableMode(updated.tableMode);
    if (updated.customTable !== undefined) setCustomTable(updated.customTable);
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
        tableMode,
        customTable: tableMode === 'custom' || tableMode === 'both' ? customTable : undefined,
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
    tableMode,
    customTable: tableMode === 'custom' || tableMode === 'both' ? customTable : undefined,
    meetingDate,
    meetingTime,
    meetingVenue,
    selectedTeachers,
    signatoryName: signatoryName || profile.defaultSignatory || profile.centerHead,
    signatoryDesignation: signatoryDesignation || profile.defaultDesignation || profile.headDesignation,
    copyTo
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = !teacherSearch || 
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.schoolName.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.designation.toLowerCase().includes(teacherSearch.toLowerCase());
    
    const matchesSchool = !selectedSchoolFilter || t.schoolName === selectedSchoolFilter;
    return matchesSearch && matchesSchool;
  });

  // Group teachers by school for quick bulk selection
  const uniqueSchools = Array.from(new Set(teachers.map(t => t.schoolName))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {initialOrder ? 'कार्यालयीन आदेश संपादन (Edit Order)' : 'नया कार्यालयीन आदेश निर्माण (New Order Generator)'}
            </h2>
            <p className="text-xs text-slate-500">
              आदेश पत्र तैयार करें, सारणी बनाएं, PDF डाउनलोड करें या सीधे प्रिंट लें।
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
            <span>{isSaving ? 'सेव हो रहा है...' : 'जावक पंजी में सेव करें'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
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

      {/* Grid Layout: Controls Sidebar + Document Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Table Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quick Template Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <LayoutTemplate className="w-4 h-4 text-indigo-600" />
                रेडीमेड शासकीय टेम्पलेट चुनें
              </span>
              <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                1-क्लिक ऑटो-फिल
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ORDER_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl.id)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-xs transition-all cursor-pointer group"
                >
                  <div className="font-bold text-slate-900 group-hover:text-indigo-700">
                    {tmpl.name}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {tmpl.subject}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Core Order Metadata Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900">
                आदेश की मूल जानकारी (Letter Metadata)
              </span>
              <button
                type="button"
                onClick={() => {
                  setOrderNumber(generateNextOrderNumber(profile.letterPrefix, savedOrders));
                }}
                className="text-[11px] text-indigo-600 hover:underline cursor-pointer flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                अगला क्रमांक लें
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  पत्र क्रमांक <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="क्र./सं.सं.के./2026/01"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  आदेश दिनांक <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                विषय (Subject) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                rows={2}
                placeholder="आदेश का आधिकारिक विषय दर्ज करें..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                प्रसंग / संदर्भ पत्र (Reference - Optional)
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="उदा. जिला शिक्षा पदाधिकारी पत्र क्रमांक 452 दिनांक 12.03.2026"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                मुख्य आदेश विवरण (Content Body) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder="शासकीय भाषा में आदेश का संपूर्ण विवरण लिखें..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* TABLE MODE SELECTOR TABS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <TableIcon className="w-4 h-4 text-indigo-600" />
                पत्र में सारणी (Table) का चयन
              </span>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setTableMode('teachers')}
                className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
                  tableMode === 'teachers' 
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👥 शिक्षक सूची
              </button>
              <button
                type="button"
                onClick={() => {
                  setTableMode('custom');
                  if (!customTable) handleLoadCustomTablePreset('exam');
                }}
                className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
                  tableMode === 'custom' 
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 कस्टम सारणी
              </button>
              <button
                type="button"
                onClick={() => setTableMode('both')}
                className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
                  tableMode === 'both' 
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔀 दोनों सारणियाँ
              </button>
              <button
                type="button"
                onClick={() => setTableMode('none')}
                className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
                  tableMode === 'none' 
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ❌ कोई नहीं
              </button>
            </div>

            {/* 1. CUSTOM TABLE BUILDER UI */}
            {(tableMode === 'custom' || tableMode === 'both') && (
              <div className="space-y-3 bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    रेडीमेड सारणी टेम्पलेट्स :
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleLoadCustomTablePreset('exam')}
                    className="text-[11px] font-semibold bg-white hover:bg-indigo-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
                  >
                    📅 परीक्षा समय-सारणी
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadCustomTablePreset('material')}
                    className="text-[11px] font-semibold bg-white hover:bg-indigo-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
                  >
                    📦 सामग्री / पाठ्यपुस्तक वितरण
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadCustomTablePreset('agenda')}
                    className="text-[11px] font-semibold bg-white hover:bg-indigo-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
                  >
                    📝 बैठक एजेंडा
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadCustomTablePreset('target')}
                    className="text-[11px] font-semibold bg-white hover:bg-indigo-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
                  >
                    🏫 शालावार लक्ष्य
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadCustomTablePreset('blank')}
                    className="text-[11px] font-semibold bg-white hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer shadow-2xs"
                  >
                    ➕ रिक्त तालिका
                  </button>
                </div>

                {customTable && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        सारणी का शीर्षक (Table Title) :
                      </label>
                      <input
                        type="text"
                        value={customTable.title || ''}
                        onChange={(e) => setCustomTable({ ...customTable, title: e.target.value })}
                        placeholder="उदा. संकुल परीक्षा समय-सारणी..."
                        className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold"
                      />
                    </div>

                    {/* Column Headers management */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          कॉलम के शीर्षक ({customTable.columns.length} कॉलम) :
                        </label>
                        <button
                          type="button"
                          onClick={handleAddCustomColumn}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" /> + नया कॉलम
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {customTable.columns.map((col, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-1 bg-white p-1 rounded border border-slate-200">
                            <input
                              type="text"
                              value={col}
                              onChange={(e) => {
                                const newCols = [...customTable.columns];
                                newCols[cIdx] = e.target.value;
                                setCustomTable({ ...customTable, columns: newCols });
                              }}
                              className="w-full text-xs font-medium px-1 outline-hidden"
                            />
                            {customTable.columns.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomColumn(cIdx)}
                                className="text-red-400 hover:text-red-600 p-0.5 cursor-pointer"
                                title="कॉलम हटाएं"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rows editor */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-slate-700">
                          पंक्तियाँ / डेटा ({customTable.rows.length} पंक्तियाँ) :
                        </label>
                        <button
                          type="button"
                          onClick={handleAddCustomRow}
                          className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> + नई पंक्ति जोड़ें
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {customTable.rows.map((row, rIdx) => (
                          <div key={rIdx} className="flex items-center gap-1 bg-white p-1.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 w-5 text-center shrink-0">
                              #{rIdx + 1}
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 flex-1">
                              {customTable.columns.map((colName, cIdx) => (
                                <input
                                  key={cIdx}
                                  type="text"
                                  value={row[cIdx] || ''}
                                  onChange={(e) => handleCustomCellChange(rIdx, cIdx, e.target.value)}
                                  placeholder={colName}
                                  className="text-xs px-1.5 py-0.5 border border-slate-100 rounded bg-slate-50 focus:bg-white"
                                />
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomRow(rIdx)}
                              className="text-red-400 hover:text-red-600 p-1 cursor-pointer shrink-0"
                              title="पंक्ति हटाएं"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. TEACHER LIST SELECTOR UI */}
            {(tableMode === 'teachers' || tableMode === 'both') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    शिक्षक चयन सूची ({selectedTeachers.length} चयनित)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newRow: SelectedTeacherInOrder = {
                          id: `custom-row-${Date.now()}`,
                          name: 'शिक्षक / कर्मचारी का नाम',
                          designation: 'सहायक शिक्षक',
                          schoolName: profile.clusterName || 'प्राथमिक शाला',
                          deputedSchool: bulkDeputedSchool || '',
                          assignedDutyRole: bulkDutyRole || ''
                        };
                        setSelectedTeachers(prev => [...prev, newRow]);
                      }}
                      className="text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-lg border border-indigo-200 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      + पंक्ति जोड़ें
                    </button>

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
                </div>

                {/* Bulk Allocation Inputs */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700">
                    एकमुश्त आवंटन (Bulk Deputation / Duty) :
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={bulkDeputedSchool}
                      onChange={(e) => setBulkDeputedSchool(e.target.value)}
                      placeholder="प्रतिनियुक्त शाला / केंद्र..."
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                    <input
                      type="text"
                      value={bulkDutyRole}
                      onChange={(e) => setBulkDutyRole(e.target.value)}
                      placeholder="दायित्व (उदा. वीक्षक/मूल्यांकन)..."
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                  {(bulkDeputedSchool || bulkDutyRole) && selectedTeachers.length > 0 && (
                    <button
                      type="button"
                      onClick={handleApplyBulkToAllSelected}
                      className="text-[11px] text-indigo-700 font-bold hover:underline cursor-pointer"
                    >
                      ✓ सभी चयनित {selectedTeachers.length} शिक्षकों पर यह लागू करें
                    </button>
                  )}
                </div>

                {/* Search & Filter */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="शिक्षक या पदनाम खोजें..."
                    className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                  />
                  <select
                    value={selectedSchoolFilter}
                    onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                  >
                    <option value="">सभी शालाएं</option>
                    {uniqueSchools.map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Teacher List */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {filteredTeachers.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">कोई शिक्षक नहीं मिला।</p>
                  ) : (
                    filteredTeachers.map((t) => {
                      const isSelected = selectedTeachers.some(st => st.id === t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleToggleTeacher(t)}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-medium'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div>
                              <div className="font-bold">{t.name}</div>
                              <div className="text-[10px] text-slate-500">{t.designation} • {t.schoolName}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Official A4 Live Preview Document */}
        <div className="lg:col-span-7">
          <div className="sticky top-4">
            <OfficialLetterView
              order={currentConstructedOrder}
              profile={profile}
              allowInlineEdit={true}
              onUpdateOrder={handleUpdateOrderFromInline}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
