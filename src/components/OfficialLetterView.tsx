import React, { useState, useEffect } from 'react';
import { OfficeOrder, CrcProfile, SelectedTeacherInOrder, CustomTableData } from '../types';
import { BiharEducationLogo } from './BiharEducationLogo';
import { MsWordEditor } from './MsWordEditor';
import { 
  Edit3, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2,
  Table as TableIcon
} from 'lucide-react';

interface OfficialLetterViewProps {
  order: OfficeOrder;
  profile: CrcProfile;
  id?: string;
  isPrintPreview?: boolean;
  allowInlineEdit?: boolean;
  onUpdateOrder?: (updatedOrder: OfficeOrder) => void;
  onUpdateProfile?: (updatedProfile: CrcProfile) => void;
}

export const OfficialLetterView: React.FC<OfficialLetterViewProps> = ({
  order,
  profile,
  id = 'official-letter-document',
  isPrintPreview = false,
  allowInlineEdit = true,
  onUpdateOrder,
  onUpdateProfile
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableOrder, setEditableOrder] = useState<OfficeOrder>({ ...order });
  const [saveToast, setSaveToast] = useState(false);
  const [profileSavedToast, setProfileSavedToast] = useState(false);
  const [showLogoPicker, setShowLogoPicker] = useState(false);

  // Sync internal state when external order prop changes
  useEffect(() => {
    setEditableOrder({ ...order });
  }, [order]);

  const handleFieldChange = <K extends keyof OfficeOrder>(field: K, value: OfficeOrder[K]) => {
    const updated = {
      ...editableOrder,
      [field]: value
    };
    setEditableOrder(updated);
    if (onUpdateOrder) {
      onUpdateOrder(updated);
    }
  };

  // Save current header as default profile header
  const handleSaveHeaderToProfile = () => {
    if (!onUpdateProfile) return;
    const updatedProfile: CrcProfile = {
      ...profile,
      officeTitle: activeOrder.headerOfficeTitle ?? profile.officeTitle ?? 'कार्यालय संकुल समन्वयक / प्राचार्य',
      clusterName: activeOrder.headerClusterName ?? profile.clusterName ?? 'संकुल संसाधन केंद्र (CRC)',
      blockName: activeOrder.headerBlock ?? profile.blockName ?? 'गायघाट',
      districtName: activeOrder.headerDistrict ?? profile.districtName ?? 'मुजफ्फरपुर',
      stateName: activeOrder.headerState ?? profile.stateName ?? 'बिहार',
      officeAddress: activeOrder.headerAddress ?? profile.officeAddress ?? 'संकुल संसाधन केंद्र, शिक्षा विभाग',
      phone: activeOrder.headerPhone ?? profile.phone ?? '',
      email: activeOrder.headerEmail ?? profile.email ?? '',
      logoVariant: activeOrder.headerLogoVariant ?? profile.logoVariant ?? 'bihar_seal',
      logoUrl: activeOrder.headerLogoUrl ?? profile.logoUrl ?? ''
    };
    onUpdateProfile(updatedProfile);
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 4000);
  };

  // Teachers table operations
  const handleTeacherFieldChange = (
    index: number,
    field: keyof SelectedTeacherInOrder,
    value: string
  ) => {
    const currentTeachers = [...(editableOrder.selectedTeachers || [])];
    if (currentTeachers[index]) {
      currentTeachers[index] = {
        ...currentTeachers[index],
        [field]: value
      };
      handleFieldChange('selectedTeachers', currentTeachers);
    }
  };

  const handleAddTeacherRow = () => {
    const currentTeachers = [...(editableOrder.selectedTeachers || [])];
    const newTeacher: SelectedTeacherInOrder = {
      id: `custom-teacher-${Date.now()}`,
      name: 'नया शिक्षक / शिक्षिका',
      designation: 'सहायक शिक्षक',
      schoolName: profile.clusterName || 'संकुल विद्यालय',
      deputedSchool: '',
      assignedDutyRole: ''
    };
    handleFieldChange('selectedTeachers', [...currentTeachers, newTeacher]);
  };

  const handleDeleteTeacherRow = (index: number) => {
    const currentTeachers = [...(editableOrder.selectedTeachers || [])];
    currentTeachers.splice(index, 1);
    handleFieldChange('selectedTeachers', currentTeachers);
  };

  // Custom Table operations
  const handleCustomTableCellChange = (rowIndex: number, colIndex: number, value: string) => {
    if (!editableOrder.customTable) return;
    const currentTable: CustomTableData = JSON.parse(JSON.stringify(editableOrder.customTable));
    if (!currentTable.rows[rowIndex]) currentTable.rows[rowIndex] = [];
    currentTable.rows[rowIndex][colIndex] = value;
    handleFieldChange('customTable', currentTable);
  };

  const handleCustomTableHeaderChange = (colIndex: number, value: string) => {
    if (!editableOrder.customTable) return;
    const currentTable: CustomTableData = JSON.parse(JSON.stringify(editableOrder.customTable));
    currentTable.columns[colIndex] = value;
    handleFieldChange('customTable', currentTable);
  };

  const handleCustomTableTitleChange = (value: string) => {
    if (!editableOrder.customTable) return;
    const currentTable: CustomTableData = { ...editableOrder.customTable, title: value };
    handleFieldChange('customTable', currentTable);
  };

  const handleAddCustomTableRow = () => {
    const currentTable: CustomTableData = editableOrder.customTable 
      ? JSON.parse(JSON.stringify(editableOrder.customTable))
      : {
          title: 'विवरणी सारणी',
          columns: ['क्र.', 'विवरण / मद', 'मात्रा / संख्या', 'टिप्पणी / रिमार्क'],
          rows: []
        };

    const newRow = currentTable.columns.map((_, idx) => (idx === 0 ? `${currentTable.rows.length + 1}` : ''));
    currentTable.rows.push(newRow);
    handleFieldChange('customTable', currentTable);
  };

  const handleDeleteCustomTableRow = (rowIndex: number) => {
    if (!editableOrder.customTable) return;
    const currentTable: CustomTableData = JSON.parse(JSON.stringify(editableOrder.customTable));
    currentTable.rows.splice(rowIndex, 1);
    // Auto re-number the first column if it looks like numbers
    currentTable.rows.forEach((row, i) => {
      if (/^\d+$/.test(row[0] || '')) {
        row[0] = `${i + 1}`;
      }
    });
    handleFieldChange('customTable', currentTable);
  };

  const handleAddCustomTableColumn = () => {
    const currentTable: CustomTableData = editableOrder.customTable 
      ? JSON.parse(JSON.stringify(editableOrder.customTable))
      : {
          title: 'विवरणी सारणी',
          columns: ['क्र.', 'विवरण'],
          rows: [['1', '']]
        };

    currentTable.columns.push(`कॉलम ${currentTable.columns.length + 1}`);
    currentTable.rows.forEach(row => row.push(''));
    handleFieldChange('customTable', currentTable);
  };

  const handleDeleteCustomTableColumn = (colIndex: number) => {
    if (!editableOrder.customTable || editableOrder.customTable.columns.length <= 1) return;
    const currentTable: CustomTableData = JSON.parse(JSON.stringify(editableOrder.customTable));
    currentTable.columns.splice(colIndex, 1);
    currentTable.rows.forEach(row => row.splice(colIndex, 1));
    handleFieldChange('customTable', currentTable);
  };

  const defaultCopies = [
    `जिला शिक्षा पदाधिकारी / जिला शिक्षा अधिकारी, जिला - ${profile.districtName || 'मुजफ्फरपुर'} की ओर सादर सूचनार्थ।`,
    `प्रखंड शिक्षा पदाधिकारी / विकासखंड शिक्षा अधिकारी (BEO), प्रखंड/विकासखंड - ${profile.blockName || 'गायघाट'} की ओर सादर सूचनार्थ।`,
    `प्रखंड साधन सेवी / विकासखंड स्रोत समन्वयक (BRCC), प्रखंड/विकासखंड - ${profile.blockName || 'गायघाट'} की ओर सूचनार्थ।`,
    `संबंधित विद्यालय के प्रधानाध्यापक / प्राचार्य / प्रभारी प्रधानाध्यापक, सर्व संबंधित विद्यालय की ओर सूचना एवं आवश्यक अनुपालनार्थ।`,
    `सर्व संबंधित शिक्षक / शिक्षिका, तत्काल आदेश पालनार्थ।`,
    `कार्यालय संचिका / गार्ड फाइल (Guard File)।`
  ];

  const handleCopyToChange = (index: number, value: string) => {
    const currentCopies = [...(editableOrder.copyTo || defaultCopies)];
    currentCopies[index] = value;
    handleFieldChange('copyTo', currentCopies);
  };

  const handleAddCopyRow = () => {
    const currentCopies = [...(editableOrder.copyTo || defaultCopies)];
    currentCopies.push('सर्व संबंधित की ओर सूचना एवं आवश्यक कार्रवाई हेतु।');
    handleFieldChange('copyTo', currentCopies);
  };

  const handleDeleteCopyRow = (index: number) => {
    const currentCopies = [...(editableOrder.copyTo || defaultCopies)];
    currentCopies.splice(index, 1);
    handleFieldChange('copyTo', currentCopies);
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      setIsEditing(false);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3500);
      if (onUpdateOrder) {
        onUpdateOrder(editableOrder);
      }
    } else {
      setIsEditing(true);
    }
  };

  const activeOrder = isEditing ? editableOrder : order;

  // Format Date in Indian standard (DD/MM/YYYY)
  const formattedDate = activeOrder.orderDate ? new Date(activeOrder.orderDate).toLocaleDateString('hi-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) : new Date().toLocaleDateString('hi-IN');

  // Teachers table calculations
  const teachers = activeOrder.selectedTeachers || [];
  const validDeputedSchools = teachers
    .map(t => (t.deputedSchool || '').trim())
    .filter(Boolean);
  const uniqueDeputedSchools = Array.from(new Set(validDeputedSchools));
  const isAllSameDeputedSchool = uniqueDeputedSchools.length === 1 && 
    (validDeputedSchools.length === teachers.length || (teachers.length > 0 && validDeputedSchools.length > 0 && validDeputedSchools.length >= teachers.length - 1));
  const commonDeputedSchoolName = isAllSameDeputedSchool ? uniqueDeputedSchools[0] : null;
  const showDeputedSchoolColumn = isEditing || uniqueDeputedSchools.length > 1 || (uniqueDeputedSchools.length === 1 && !isAllSameDeputedSchool);

  const validDutyRoles = teachers
    .map(t => (t.assignedDutyRole || '').trim())
    .filter(Boolean);
  const uniqueDutyRoles = Array.from(new Set(validDutyRoles));
  const isAllSameDuty = uniqueDutyRoles.length === 1 && 
    (validDutyRoles.length === teachers.length || (teachers.length > 0 && validDutyRoles.length > 0));
  const commonDutyName = isAllSameDuty ? uniqueDutyRoles[0] : null;
  const showDutyRoleColumn = isEditing || uniqueDutyRoles.length > 1 || (uniqueDutyRoles.length === 1 && !isAllSameDuty);

  // Signatory details
  const primarySignatoryName = activeOrder.signatoryName || profile.defaultSignatory || profile.centerHead || 'संकुल प्राचार्य / समन्वयक';
  const primarySignatoryDesignation = activeOrder.signatoryDesignation || profile.defaultDesignation || profile.headDesignation || 'संकुल समन्वयक / प्राचार्य';
  
  // Header details (supports order-level customization or profile fallbacks)
  const headerOfficeTitle = activeOrder.headerOfficeTitle !== undefined ? activeOrder.headerOfficeTitle : (profile.officeTitle || 'कार्यालय संकुल समन्वयक / प्राचार्य');
  const headerClusterName = activeOrder.headerClusterName !== undefined ? activeOrder.headerClusterName : (profile.clusterName || 'संकुल संसाधन केंद्र (CRC)');
  const headerBlock = activeOrder.headerBlock !== undefined ? activeOrder.headerBlock : (profile.blockName || 'गायघाट');
  const headerDistrict = activeOrder.headerDistrict !== undefined ? activeOrder.headerDistrict : (profile.districtName || 'मुजफ्फरपुर');
  const headerState = activeOrder.headerState !== undefined ? activeOrder.headerState : (profile.stateName || 'बिहार');
  const headerAddress = activeOrder.headerAddress !== undefined ? activeOrder.headerAddress : (profile.officeAddress || 'संकुल संसाधन केंद्र, शिक्षा विभाग');
  const headerPhone = activeOrder.headerPhone !== undefined ? activeOrder.headerPhone : (profile.phone || '');
  const headerEmail = activeOrder.headerEmail !== undefined ? activeOrder.headerEmail : (profile.email || '');
  const headerLogoVariant = activeOrder.headerLogoVariant || profile.logoVariant || 'bihar_seal';
  const headerLogoUrl = activeOrder.headerLogoUrl || profile.logoUrl;

  const copyToList = activeOrder.copyTo !== undefined ? activeOrder.copyTo : defaultCopies;
  const showCopyTo = copyToList && copyToList.length > 0;

  // Table display decisions
  const tableMode = activeOrder.tableMode || (activeOrder.customTable ? 'custom' : (teachers.length > 0 ? 'teachers' : 'none'));
  const showTeachersTable = (tableMode === 'teachers' || tableMode === 'both') && (teachers.length > 0 || isEditing);
  const showCustomTable = (tableMode === 'custom' || tableMode === 'both' || (activeOrder.customTable && tableMode !== 'none')) && (activeOrder.customTable || isEditing);

  return (
    <div className="relative group/letter">
      {/* Inline Editing Control Toolbar (Hidden in Print and PDF) */}
      {allowInlineEdit && (
        <div className="print:hidden mb-3 bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-toggle-inline-edit"
              onClick={handleToggleEdit}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isEditing
                  ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-300'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
            >
              {isEditing ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>संपादन समाप्त करें (Done Editing)</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>✏️ इनलाइन संपादन करें (Inline Edit)</span>
                </>
              )}
            </button>

            {isEditing && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
                हेडर, विषय, विवरण या तालिका पर सीधे क्लिक करके संपादन करें
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {profileSavedToast && (
              <span className="flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-300 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                हेडर प्रोफ़ाइल में सुरक्षित हो गया!
              </span>
            )}
            {saveToast && (
              <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                बदलाव सुरक्षित हो गए
              </span>
            )}
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              A4 पोर्ट्रेट शासकीय प्रारूप
            </span>
          </div>
        </div>
      )}

      {/* Official A4 Government Document Container */}
      <div
        id={id}
        className={`bg-white text-slate-900 border border-slate-300 shadow-sm mx-auto overflow-hidden font-['Mukta',sans-serif] ${
          isPrintPreview ? 'max-w-none shadow-none border-none p-0' : 'max-w-[850px] p-8 md:p-12'
        }`}
        style={{
          boxSizing: 'border-box',
          minHeight: '1080px',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          lineHeight: '1.6',
          fontFamily: "'Mukta', sans-serif"
        }}
      >
        {/* Top Official Letterhead */}
        {isEditing ? (
          <div className="letterhead-header border-2 border-dashed border-amber-400 bg-amber-50/40 p-3.5 rounded-xl mb-4 print:border-none print:p-0">
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-amber-200">
              <span className="text-[11px] font-bold text-amber-900 uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                🏛️ शासकीय लेटरहेड / हेडर संपादन (Edit Letterhead)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogoPicker(!showLogoPicker)}
                  className="text-[10px] font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                >
                  {showLogoPicker ? 'लोगो विकल्प बंद करें' : '🖼️ लोगो/सील बदलें'}
                </button>
                {onUpdateProfile && (
                  <button
                    type="button"
                    onClick={handleSaveHeaderToProfile}
                    className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-0.5 rounded cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                    title="इस हेडर को डिफ़ॉल्ट प्रोफ़ाइल में सहेजें ताकि भविष्य के सभी आदेशों में यही दिखे"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>प्रोफ़ाइल में डिफ़ॉल्ट बनाएं</span>
                  </button>
                )}
              </div>
            </div>

            {/* Optional Logo Selector Row */}
            {showLogoPicker && (
              <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-xs mb-3 space-y-2">
                <div className="text-[11px] font-bold text-slate-800">लोगो एवं शासकीय सील चयन:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('headerLogoVariant', 'bihar_seal');
                      handleFieldChange('headerLogoUrl', '');
                    }}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                      headerLogoVariant === 'bihar_seal' && !headerLogoUrl ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <BiharEducationLogo variant="bihar_seal" size={32} />
                    <div className="text-[10px]">
                      <div className="font-bold text-slate-900">बिहार सरकार सील</div>
                      <div className="text-slate-500">मानक राज्य सील</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('headerLogoVariant', 'shiksha_vibhag');
                      handleFieldChange('headerLogoUrl', '');
                    }}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                      headerLogoVariant === 'shiksha_vibhag' && !headerLogoUrl ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <BiharEducationLogo variant="shiksha_vibhag" size={32} />
                    <div className="text-[10px]">
                      <div className="font-bold text-slate-900">शिक्षा विभाग सील</div>
                      <div className="text-slate-500">विभागीय प्रतीक</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('headerLogoVariant', 'ashoka_emblem');
                      handleFieldChange('headerLogoUrl', '');
                    }}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                      headerLogoVariant === 'ashoka_emblem' && !headerLogoUrl ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <BiharEducationLogo variant="ashoka_emblem" size={32} />
                    <div className="text-[10px]">
                      <div className="font-bold text-slate-900">अशोक स्तम्भ सील</div>
                      <div className="text-slate-500">राष्ट्रीय प्रतीक</div>
                    </div>
                  </button>
                </div>

                <div className="pt-1">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    या कस्टम लोगो इमेज URL:
                  </label>
                  <input
                    type="url"
                    value={headerLogoUrl || ''}
                    onChange={(e) => handleFieldChange('headerLogoUrl', e.target.value)}
                    placeholder="https://example.com/custom-logo.png"
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              {/* Logo Display */}
              <div 
                className="shrink-0 flex flex-col items-center justify-center cursor-pointer group"
                onClick={() => setShowLogoPicker(!showLogoPicker)}
                title="लोगो बदलने के लिए क्लिक करें"
              >
                <BiharEducationLogo 
                  variant={headerLogoVariant} 
                  customUrl={headerLogoUrl}
                  size={68} 
                  className="group-hover:opacity-80 transition-opacity" 
                />
                <span className="text-[9px] text-amber-800 font-bold mt-1 group-hover:underline">बदलें ⚙️</span>
              </div>

              {/* Editable Fields in Letterhead */}
              <div className="flex-1 space-y-2">
                {/* Office Title Input & Presets */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <label className="text-[10px] font-bold text-slate-700">
                      कार्यालय का पद / शीर्ष पंक्ति:
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['कार्यालय संकुल समन्वयक / प्राचार्य', 'कार्यालय प्रधानाध्यापक', 'कार्यालय प्रभारी प्रधानाध्यापक', 'कार्यालय प्रखंड शिक्षा पदाधिकारी'].map(titlePreset => (
                        <button
                          key={titlePreset}
                          type="button"
                          onClick={() => handleFieldChange('headerOfficeTitle', titlePreset)}
                          className="text-[9px] bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 px-1.5 py-0.2 rounded cursor-pointer transition-colors"
                        >
                          {titlePreset}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={headerOfficeTitle}
                    onChange={(e) => handleFieldChange('headerOfficeTitle', e.target.value)}
                    placeholder="कार्यालय संकुल समन्वयक / प्राचार्य"
                    className="w-full px-2.5 py-1 bg-white border border-amber-400 rounded text-center text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Main Cluster / School Heading */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    संकुल / विद्यालय का मुख्य नाम (Cluster/School Name):
                  </label>
                  <input
                    type="text"
                    value={headerClusterName}
                    onChange={(e) => handleFieldChange('headerClusterName', e.target.value)}
                    placeholder="उदा. संकुल संसाधन केंद्र, उत्क्रमित उच्च माध्यमिक विद्यालय..."
                    className="w-full px-2.5 py-1 bg-white border border-amber-400 rounded text-center text-sm md:text-base font-black text-slate-950 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Block, District, State (3 columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600">प्रखंड / विकासखंड:</label>
                    <input
                      type="text"
                      value={headerBlock}
                      onChange={(e) => handleFieldChange('headerBlock', e.target.value)}
                      placeholder="प्रखंड (उदा. गायघाट)"
                      className="w-full px-2 py-0.5 bg-white border border-amber-300 rounded text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600">जिला:</label>
                    <input
                      type="text"
                      value={headerDistrict}
                      onChange={(e) => handleFieldChange('headerDistrict', e.target.value)}
                      placeholder="जिला (उदा. मुजफ्फरपुर)"
                      className="w-full px-2 py-0.5 bg-white border border-amber-300 rounded text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600">राज्य:</label>
                    <input
                      type="text"
                      value={headerState}
                      onChange={(e) => handleFieldChange('headerState', e.target.value)}
                      placeholder="राज्य (उदा. बिहार)"
                      className="w-full px-2 py-0.5 bg-white border border-amber-300 rounded text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Address, Phone, Email (3 columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600">कार्यालय का पता:</label>
                    <input
                      type="text"
                      value={headerAddress}
                      onChange={(e) => handleFieldChange('headerAddress', e.target.value)}
                      placeholder="पता / स्थान"
                      className="w-full px-2 py-0.5 bg-white border border-amber-300 rounded text-[11px] text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600">दूरभाष / मोबाइल:</label>
                    <input
                      type="text"
                      value={headerPhone}
                      onChange={(e) => handleFieldChange('headerPhone', e.target.value)}
                      placeholder="+91 9XXXXXXXXX"
                      className="w-full px-2 py-0.5 bg-white border border-amber-300 rounded text-[11px] text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600">कार्यालयीन ईमेल:</label>
                    <input
                      type="email"
                      value={headerEmail}
                      onChange={(e) => handleFieldChange('headerEmail', e.target.value)}
                      placeholder="crc.office@gmail.com"
                      className="w-full px-2 py-0.5 bg-white border border-amber-300 rounded text-[11px] text-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="letterhead-header relative group/head border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between gap-4"
            style={{ 
              borderBottom: '2.5px solid #0f172a', 
              paddingBottom: '12px', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {/* Quick Edit Header Button on Hover in View Mode */}
            {allowInlineEdit && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="absolute -top-3 right-0 print:hidden opacity-0 group-hover/head:opacity-100 transition-opacity bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs cursor-pointer flex items-center gap-1"
                title="हेडर विवरण संपादित करें"
              >
                <Edit3 className="w-3 h-3" />
                <span>हेडर एडिट करें</span>
              </button>
            )}

            {/* Official Emblem Logo */}
            <div className="shrink-0 flex items-center justify-center">
              <BiharEducationLogo 
                variant={headerLogoVariant} 
                customUrl={headerLogoUrl}
                size={72} 
                className="print:w-16 print:h-16" 
              />
            </div>

            {/* Letterhead Text Center Aligned */}
            <div className="flex-1 text-center px-2">
              <p 
                className="text-xs md:text-sm font-semibold text-slate-700 tracking-wider uppercase mb-0.5"
                style={{ fontSize: '12px', fontWeight: '600', color: '#334155', letterSpacing: '1px', margin: 0 }}
              >
                {headerOfficeTitle}
              </p>
              <h1 
                className="text-lg md:text-xl font-black text-slate-950 tracking-wide mb-0.5"
                style={{ fontSize: '19px', fontWeight: '900', color: '#020617', margin: '2px 0' }}
              >
                {headerClusterName}
              </h1>
              <p 
                className="text-xs md:text-sm font-bold text-slate-800 mb-0.5"
                style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', margin: 0 }}
              >
                प्रखंड/विकासखंड: {headerBlock || 'गायघाट'}, जिला: {headerDistrict || 'मुजफ्फरपुर'} ({headerState || 'बिहार'})
              </p>
              <p 
                className="text-[11px] text-slate-600 font-medium"
                style={{ fontSize: '11px', color: '#475569', margin: 0 }}
              >
                {headerAddress || 'संकुल संसाधन केंद्र, शिक्षा विभाग'}
                {headerPhone ? ` | दूरभाष: ${headerPhone}` : ''}
                {headerEmail ? ` | ई-मेल: ${headerEmail}` : ''}
              </p>
            </div>

            {/* Right Logo Spacer for perfect symmetry */}
            <div className="shrink-0 flex items-center justify-center opacity-0 pointer-events-none w-[72px]" aria-hidden="true">
              <BiharEducationLogo size={72} />
            </div>
          </div>
        )}

        {/* Dispatch Order Number & Date Bar */}
        <div 
          className="dispatch-bar flex items-center justify-between text-xs md:text-sm font-bold text-slate-900 border-b border-slate-300 pb-2 mb-4"
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            borderBottom: '1px solid #cbd5e1', 
            paddingBottom: '8px', 
            marginBottom: '14px',
            fontSize: '13.5px' 
          }}
        >
          <div style={{ fontWeight: '600', color: '#0f172a' }} className="flex items-center gap-1">
            <span>पत्र क्रमांक :</span>{' '}
            {isEditing ? (
              <input
                type="text"
                value={activeOrder.orderNumber || ''}
                onChange={(e) => handleFieldChange('orderNumber', e.target.value)}
                placeholder="क्र./CRC/2026/01"
                className="px-2 py-0.5 border border-amber-400 bg-amber-50 rounded font-mono font-bold text-slate-950 text-xs w-48 focus:ring-1 focus:ring-amber-500"
              />
            ) : (
              <span className="font-mono font-bold tracking-wide text-slate-950" style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#020617' }}>
                {activeOrder.orderNumber || 'क्र./CRC/2026/01'}
              </span>
            )}
          </div>
          
          <div style={{ fontWeight: '600', color: '#0f172a' }} className="flex items-center gap-1">
            <span>दिनांक :</span>{' '}
            {isEditing ? (
              <input
                type="date"
                value={activeOrder.orderDate || ''}
                onChange={(e) => handleFieldChange('orderDate', e.target.value)}
                className="px-2 py-0.5 border border-amber-400 bg-amber-50 rounded font-bold text-slate-950 text-xs focus:ring-1 focus:ring-amber-500"
              />
            ) : (
              <span className="font-bold text-slate-950" style={{ fontWeight: 'bold', color: '#020617' }}>
                {formattedDate}
              </span>
            )}
          </div>
        </div>

        {/* Title Banner */}
        <div 
          className="order-title-banner text-center my-3.5"
          style={{ textAlign: 'center', margin: '14px 0' }}
        >
          <span 
            className="inline-block border-b-2 border-slate-900 pb-0.5 text-base md:text-lg font-bold tracking-wider text-slate-950 uppercase"
            style={{ 
              display: 'inline-block', 
              borderBottom: '2px solid #0f172a', 
              paddingBottom: '2px', 
              fontSize: '17px', 
              fontWeight: 'bold', 
              letterSpacing: '1px',
              color: '#020617'
            }}
          >
            // कार्यालयीन आदेश //
          </span>
        </div>

        {/* Subject & Reference Section */}
        <div 
          className="subject-reference-block space-y-2 mb-5 text-sm md:text-[15px] leading-relaxed"
          style={{ marginBottom: '18px', fontSize: '14.5px', lineHeight: 1.6 }}
        >
          {/* Subject */}
          <div 
            className="flex items-start gap-1"
            style={{ display: 'flex', alignItems: 'flex-start' }}
          >
            <span 
              className="font-bold text-slate-950 shrink-0"
              style={{ fontWeight: 'bold', color: '#020617', minWidth: '65px', display: 'inline-block' }}
            >
              विषय :
            </span>
            {isEditing ? (
              <textarea
                value={activeOrder.subject || ''}
                onChange={(e) => handleFieldChange('subject', e.target.value)}
                rows={2}
                placeholder="आदेश का विषय लिखें..."
                className="w-full px-2 py-1 border border-amber-400 bg-amber-50 rounded font-bold text-slate-950 text-sm underline decoration-slate-400 focus:ring-1 focus:ring-amber-500 resize-y"
              />
            ) : (
              <span 
                className="font-bold text-slate-950 underline decoration-slate-400 underline-offset-4"
                style={{ fontWeight: 'bold', color: '#020617', textDecoration: 'underline', textUnderlineOffset: '4px' }}
              >
                {activeOrder.subject || '—'}
              </span>
            )}
          </div>

          {/* Reference */}
          {(activeOrder.reference || isEditing) && (
            <div 
              className="flex items-start text-xs md:text-sm text-slate-800 gap-1"
              style={{ display: 'flex', alignItems: 'flex-start', fontSize: '13px', color: '#1e293b', marginTop: '4px' }}
            >
              <span 
                className="font-bold text-slate-900 shrink-0"
                style={{ fontWeight: 'bold', color: '#0f172a', minWidth: '65px', display: 'inline-block' }}
              >
                प्रसंग :
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={activeOrder.reference || ''}
                  onChange={(e) => handleFieldChange('reference', e.target.value)}
                  placeholder="संदर्भ/प्रसंग पत्र क्रमांक एवं दिनांक (ऐच्छिक)..."
                  className="w-full px-2 py-1 border border-amber-400 bg-amber-50 rounded text-slate-900 text-xs focus:ring-1 focus:ring-amber-500"
                />
              ) : (
                <span style={{ color: '#334155' }}>
                  {activeOrder.reference}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Main Order Body Text */}
        <div className="mb-5" style={{ marginBottom: '18px' }}>
          {isEditing ? (
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-amber-900 mb-1">
                मुख्य आदेश विवरण (MS Word Style Order Body Content) :
              </label>
              <MsWordEditor
                value={activeOrder.content || ''}
                onChange={(val) => handleFieldChange('content', val)}
                minHeight="220px"
                label="वर्ड एडिटर (Letter Body)"
                placeholder="शासकीय आदेश का मुख्य विवरण यहाँ MS Word की तरह टाइप व फॉर्मेट करें..."
              />
            </div>
          ) : (
            <div 
              className="order-body-content text-sm md:text-[15px] leading-relaxed text-justify text-slate-900 prose max-w-none [&>p]:mb-3 [&>p]:text-justify [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
              style={{ 
                fontSize: '14.5px', 
                lineHeight: '1.75', 
                textAlign: 'justify', 
                textJustify: 'inter-word',
                color: '#0f172a'
              }}
            >
              {/<[a-z][\s\S]*>/i.test(activeOrder.content || '') ? (
                <div dangerouslySetInnerHTML={{ __html: activeOrder.content || '' }} />
              ) : (
                <div style={{ whiteSpace: 'pre-line' }}>{activeOrder.content}</div>
              )}
            </div>
          )}
        </div>

        {/* Meeting or Schedule Specific Box if applicable */}
        {(activeOrder.meetingDate || activeOrder.meetingTime || activeOrder.meetingVenue || isEditing) && (
          <div 
            className={`meeting-details-box bg-slate-50 border border-slate-300 rounded p-3 mb-5 text-xs md:text-sm ${
              isEditing ? 'border-dashed border-amber-400 bg-amber-50/40 p-3' : ''
            }`}
            style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #cbd5e1', 
              borderRadius: '6px', 
              padding: '10px 14px', 
              marginBottom: '16px',
              fontSize: '13px'
            }}
          >
            {isEditing ? (
              <div className="space-y-2">
                <div className="text-xs font-bold text-amber-900">बैठक / कार्यक्रम विवरण (वैकल्पिक) :</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600">दिनांक</label>
                    <input
                      type="date"
                      value={activeOrder.meetingDate || ''}
                      onChange={(e) => handleFieldChange('meetingDate', e.target.value)}
                      className="w-full px-2 py-1 border border-amber-300 rounded text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600">समय</label>
                    <input
                      type="text"
                      value={activeOrder.meetingTime || ''}
                      onChange={(e) => handleFieldChange('meetingTime', e.target.value)}
                      placeholder="उदा. 11:00 AM"
                      className="w-full px-2 py-1 border border-amber-300 rounded text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600">स्थान</label>
                    <input
                      type="text"
                      value={activeOrder.meetingVenue || ''}
                      onChange={(e) => handleFieldChange('meetingVenue', e.target.value)}
                      placeholder="उदा. संकुल सभागार"
                      className="w-full px-2 py-1 border border-amber-300 rounded text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-800">
                {activeOrder.meetingDate && (
                  <div>
                    <strong style={{ color: '#0f172a' }}>दिनांक: </strong>
                    <span>{new Date(activeOrder.meetingDate).toLocaleDateString('hi-IN')}</span>
                  </div>
                )}
                {activeOrder.meetingTime && (
                  <div>
                    <strong style={{ color: '#0f172a' }}>समय: </strong>
                    <span>{activeOrder.meetingTime}</span>
                  </div>
                )}
                {activeOrder.meetingVenue && (
                  <div>
                    <strong style={{ color: '#0f172a' }}>स्थान: </strong>
                    <span>{activeOrder.meetingVenue}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 1. CUSTOM DYNAMIC TABLE SECTION (कस्टम तालिका / समय-सारणी / वितरण विवरण आदि) */}
        {showCustomTable && activeOrder.customTable && (
          <div className="custom-table-section my-5" style={{ margin: '18px 0' }}>
            <div className="flex items-center justify-between mb-2">
              <div 
                className="text-xs md:text-sm font-bold text-slate-950 flex items-center gap-1.5"
                style={{ fontSize: '14px', fontWeight: 'bold', color: '#020617' }}
              >
                <TableIcon className="w-4 h-4 text-indigo-600 shrink-0 print:hidden" />
                {isEditing ? (
                  <input
                    type="text"
                    value={activeOrder.customTable.title || 'विवरणी सारणी'}
                    onChange={(e) => handleCustomTableTitleChange(e.target.value)}
                    placeholder="सारणी का शीर्षक लिखें..."
                    className="px-2 py-0.5 border border-amber-400 bg-amber-50 rounded text-xs font-bold text-slate-900"
                  />
                ) : (
                  <span>{activeOrder.customTable.title ? `${activeOrder.customTable.title} :` : 'विवरणी तालिका :'}</span>
                )}
              </div>

              {isEditing && (
                <div className="print:hidden flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAddCustomTableRow}
                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded border border-indigo-200 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    + पंक्ति (Row)
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomTableColumn}
                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-1 rounded border border-slate-300 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    + कॉलम (Col)
                  </button>
                </div>
              )}
            </div>

            {/* Custom Table Content */}
            <div className="overflow-x-auto">
              <table 
                className="w-full border-collapse border border-slate-700 text-xs md:text-[13.5px] text-left"
                style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  border: '1.5px solid #1e293b', 
                  fontSize: '13px',
                  textAlign: 'left',
                  margin: '8px 0'
                }}
              >
                <thead>
                  <tr 
                    className="bg-slate-100 text-slate-950 font-bold border-b border-slate-700"
                    style={{ backgroundColor: '#f1f5f9', color: '#020617', fontWeight: 'bold', borderBottom: '1.5px solid #1e293b' }}
                  >
                    {activeOrder.customTable.columns.map((col, cIdx) => (
                      <th 
                        key={cIdx} 
                        style={{ 
                          border: '1px solid #334155', 
                          padding: '7px 8px', 
                          textAlign: cIdx === 0 ? 'center' : 'left',
                          width: cIdx === 0 ? '42px' : 'auto'
                        }}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={col}
                              onChange={(e) => handleCustomTableHeaderChange(cIdx, e.target.value)}
                              className="w-full px-1 py-0.5 border border-amber-300 bg-amber-50 rounded text-xs font-bold"
                            />
                            {activeOrder.customTable!.columns.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomTableColumn(cIdx)}
                                className="text-red-500 hover:text-red-700 p-0.5"
                                title="कॉलम हटाएं"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          col
                        )}
                      </th>
                    ))}
                    {isEditing && (
                      <th className="print:hidden" style={{ border: '1px solid #334155', padding: '7px 8px', width: '45px', textAlign: 'center' }}>
                        हटाएं
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {activeOrder.customTable.rows.length === 0 ? (
                    <tr>
                      <td colSpan={activeOrder.customTable.columns.length + (isEditing ? 1 : 0)} className="text-center py-4 text-slate-400 text-xs italic">
                        कोई डेटा उपलब्ध नहीं है। पंक्ति जोड़ने हेतु '+ पंक्ति' बटन दबाएं।
                      </td>
                    </tr>
                  ) : (
                    activeOrder.customTable.rows.map((row, rIdx) => (
                      <tr 
                        key={rIdx} 
                        className="hover:bg-slate-50"
                        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                      >
                        {activeOrder.customTable!.columns.map((_, cIdx) => (
                          <td 
                            key={cIdx} 
                            style={{ 
                              border: '1px solid #334155', 
                              padding: '6px 8px', 
                              textAlign: cIdx === 0 ? 'center' : 'left',
                              fontWeight: cIdx === 0 ? '600' : 'normal',
                              color: '#0f172a'
                            }}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                value={row[cIdx] || ''}
                                onChange={(e) => handleCustomTableCellChange(rIdx, cIdx, e.target.value)}
                                className="w-full px-1.5 py-0.5 border border-amber-300 bg-amber-50 rounded text-xs"
                              />
                            ) : (
                              row[cIdx] || '—'
                            )}
                          </td>
                        ))}
                        {isEditing && (
                          <td className="print:hidden text-center" style={{ border: '1px solid #334155', padding: '4px' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomTableRow(rIdx)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                              title="पंक्ति हटाएं"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. TEACHERS LIST TABLE SECTION */}
        {showTeachersTable && (
          <div className="teachers-table-section my-5" style={{ margin: '18px 0' }}>
            <div className="flex items-center justify-between mb-2">
              <div 
                className="text-xs md:text-sm font-bold text-slate-950"
                style={{ fontSize: '14px', fontWeight: 'bold', color: '#020617' }}
              >
                संबंधित आदेशित शिक्षकों की सूची :
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleAddTeacherRow}
                  className="print:hidden inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2.5 py-1 rounded border border-indigo-200 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  शिक्षक पंक्ति जोड़ें
                </button>
              )}
            </div>

            {/* Clean Highlights for Uniform Deputed School and/or Uniform Duty */}
            {!isEditing && (commonDeputedSchoolName || commonDutyName) && (
              <div 
                className="common-info-banner bg-slate-50 border border-slate-300 rounded p-2.5 mb-3 text-xs md:text-[13.5px] space-y-1.5"
                style={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '6px', 
                  padding: '9px 12px', 
                  marginBottom: '12px', 
                  fontSize: '13px' 
                }}
              >
                {commonDeputedSchoolName && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap' }}>
                      प्रतिनियुक्त विद्यालय / परीक्षा केंद्र :
                    </span>
                    <span style={{ fontWeight: 'bold', color: '#1e3a8a', textDecoration: 'underline' }}>
                      {commonDeputedSchoolName}
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic' }}>
                      (उपरोक्त सभी शिक्षकों हेतु)
                    </span>
                  </div>
                )}
                {commonDutyName && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap' }}>
                      सौंपा गया दायित्व / कार्य :
                    </span>
                    <span style={{ fontWeight: 'bold', color: '#0f172a' }}>
                      {commonDutyName}
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic' }}>
                      (उपरोक्त सभी शिक्षकों हेतु)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Official Clean Table */}
            <div className="overflow-x-auto">
              <table 
                className="w-full border-collapse border border-slate-700 text-xs md:text-[13.5px] text-left"
                style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  border: '1.5px solid #1e293b', 
                  fontSize: '13px',
                  textAlign: 'left',
                  margin: '8px 0'
                }}
              >
                <thead>
                  <tr 
                    className="bg-slate-100 text-slate-950 font-bold border-b border-slate-700"
                    style={{ backgroundColor: '#f1f5f9', color: '#020617', fontWeight: 'bold', borderBottom: '1.5px solid #1e293b' }}
                  >
                    <th style={{ border: '1px solid #334155', padding: '7px 8px', width: '38px', textAlign: 'center' }}>
                      क्र.
                    </th>
                    <th style={{ border: '1px solid #334155', padding: '7px 10px', width: showDeputedSchoolColumn || showDutyRoleColumn ? '22%' : '28%' }}>
                      शिक्षक का नाम
                    </th>
                    <th style={{ border: '1px solid #334155', padding: '7px 10px', width: showDeputedSchoolColumn || showDutyRoleColumn ? '20%' : '26%' }}>
                      पदनाम
                    </th>
                    <th style={{ border: '1px solid #334155', padding: '7px 10px' }}>
                      {showDeputedSchoolColumn ? 'मूल पदस्थापना विद्यालय' : 'पदस्थ विद्यालय'}
                    </th>
                    {showDeputedSchoolColumn && (
                      <th style={{ border: '1px solid #334155', padding: '7px 10px', backgroundColor: '#eef2ff', color: '#1e1b4b', fontWeight: 'bold' }}>
                        प्रतिनियुक्त विद्यालय / केंद्र
                      </th>
                    )}
                    {showDutyRoleColumn && (
                      <th style={{ border: '1px solid #334155', padding: '7px 10px' }}>
                        आवंटित दायित्व
                      </th>
                    )}
                    {isEditing && (
                      <th className="print:hidden" style={{ border: '1px solid #334155', padding: '7px 8px', width: '45px', textAlign: 'center' }}>
                        हटाएं
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {teachers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-slate-400 text-xs italic">
                        कोई शिक्षक सूची शामिल नहीं है।
                      </td>
                    </tr>
                  ) : (
                    teachers.map((t, idx) => (
                      <tr 
                        key={t.id || idx} 
                        className="hover:bg-slate-50"
                        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                      >
                        <td style={{ border: '1px solid #334155', padding: '6px 8px', textAlign: 'center', fontWeight: '600' }}>
                          {idx + 1}
                        </td>
                        
                        {/* Teacher Name */}
                        <td style={{ border: '1px solid #334155', padding: '6px 10px', fontWeight: 'bold', color: '#020617' }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={t.name}
                              onChange={(e) => handleTeacherFieldChange(idx, 'name', e.target.value)}
                              className="w-full px-1.5 py-0.5 border border-amber-300 bg-amber-50 rounded text-xs font-bold"
                            />
                          ) : (
                            t.name
                          )}
                        </td>

                        {/* Designation */}
                        <td style={{ border: '1px solid #334155', padding: '6px 10px', color: '#1e293b' }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={t.designation}
                              onChange={(e) => handleTeacherFieldChange(idx, 'designation', e.target.value)}
                              className="w-full px-1.5 py-0.5 border border-amber-300 bg-amber-50 rounded text-xs"
                            />
                          ) : (
                            t.designation
                          )}
                        </td>

                        {/* School Name */}
                        <td style={{ border: '1px solid #334155', padding: '6px 10px', color: '#1e293b' }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={t.schoolName}
                              onChange={(e) => handleTeacherFieldChange(idx, 'schoolName', e.target.value)}
                              className="w-full px-1.5 py-0.5 border border-amber-300 bg-amber-50 rounded text-xs"
                            />
                          ) : (
                            t.schoolName
                          )}
                        </td>

                        {/* Deputed School */}
                        {showDeputedSchoolColumn && (
                          <td style={{ border: '1px solid #334155', padding: '6px 10px', fontWeight: '600', color: '#1e3a8a', backgroundColor: '#faf5ff' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={t.deputedSchool || ''}
                                onChange={(e) => handleTeacherFieldChange(idx, 'deputedSchool', e.target.value)}
                                placeholder="प्रतिनियुक्त शाला..."
                                className="w-full px-1.5 py-0.5 border border-indigo-300 bg-indigo-50 rounded text-xs"
                              />
                            ) : (
                              t.deputedSchool || '— (मूल शाला)'
                            )}
                          </td>
                        )}

                        {/* Duty Role */}
                        {showDutyRoleColumn && (
                          <td style={{ border: '1px solid #334155', padding: '6px 10px', color: '#0f172a' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={t.assignedDutyRole || ''}
                                onChange={(e) => handleTeacherFieldChange(idx, 'assignedDutyRole', e.target.value)}
                                placeholder="आवंटित कार्य..."
                                className="w-full px-1.5 py-0.5 border border-amber-300 bg-amber-50 rounded text-xs"
                              />
                            ) : (
                              t.assignedDutyRole || 'उपस्थिति / दायित्व निर्वहन'
                            )}
                          </td>
                        )}

                        {/* Delete Row in Edit Mode */}
                        {isEditing && (
                          <td className="print:hidden text-center" style={{ border: '1px solid #334155', padding: '4px' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteTeacherRow(idx)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                              title="पंक्ति हटाएं"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Closing instruction / Compliance note (Customizable & Removable) */}
        {isEditing ? (
          <div 
            className="compliance-note-edit mt-4 p-3 bg-amber-50/80 border border-amber-300 rounded-xl"
            style={{ marginTop: '16px' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={activeOrder.showComplianceNote !== false}
                  onChange={(e) => handleFieldChange('showComplianceNote', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-900">
                  अंतिम अनुपालन वाक्य (Closing Compliance Sentence)
                </span>
              </label>

              <button
                type="button"
                onClick={() => handleFieldChange('showComplianceNote', !(activeOrder.showComplianceNote !== false))}
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded cursor-pointer transition-colors ${
                  activeOrder.showComplianceNote !== false 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                {activeOrder.showComplianceNote !== false ? '✕ इस वाक्य को हटाएं' : '+ वाक्य जोड़ें'}
              </button>
            </div>

            {activeOrder.showComplianceNote !== false ? (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={activeOrder.complianceNote ?? 'उक्त आदेश का तत्काल एवं कड़ाई से पालन सुनिश्चित किया जाए।'}
                  onChange={(e) => handleFieldChange('complianceNote', e.target.value)}
                  placeholder="उदा. उक्त आदेश का तत्काल एवं कड़ाई से पालन सुनिश्चित किया जाए।"
                  className="w-full px-2.5 py-1.5 border border-amber-300 bg-white rounded-lg text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex flex-wrap gap-1 items-center text-[10px] text-slate-600">
                  <span className="font-bold">त्वरित विकल्प:</span>
                  {[
                    'उक्त आदेश का तत्काल एवं कड़ाई से पालन सुनिश्चित किया जाए।',
                    'उक्त आदेश का अक्षरशः एवं समयबद्ध अनुपालन सुनिश्चित करें।',
                    'कृपया इसे सर्वोच्च प्राथमिकता दी जाए।',
                    'सक्षम प्राधिकार के अनुमोदनोपरांत यह आदेश निर्गत किया जाता है।'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleFieldChange('complianceNote', preset)}
                      className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded text-slate-700 hover:text-indigo-700 cursor-pointer truncate max-w-[220px]"
                      title={preset}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 italic bg-white/70 p-2 rounded border border-dashed border-slate-300">
                🚫 अनुपालन वाक्य को हटा दिया गया है। पत्र में कोई अतिरिक्त वाक्य नहीं छपेगा।
              </div>
            )}
          </div>
        ) : (
          activeOrder.showComplianceNote !== false && (
            <p 
              className="mandatory-note text-xs md:text-sm font-semibold text-slate-900 mt-4 leading-normal"
              style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a', margin: '16px 0 0 0' }}
            >
              {activeOrder.complianceNote || 'उक्त आदेश का तत्काल एवं कड़ाई से पालन सुनिश्चित किया जाए।'}
            </p>
          )
        )}

        {/* Primary Signatory Section (Strictly Right Aligned) */}
        <div 
          className="primary-signatory-block mt-8 flex justify-end"
          style={{ 
            marginTop: '28px', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            textAlign: 'right' 
          }}
        >
          <div 
            className="text-right min-w-[220px]"
            style={{ textAlign: 'right', display: 'inline-block' }}
          >
            <div 
              className="h-10 border-b border-dashed border-slate-300 mb-1 flex items-end justify-end"
              style={{ height: '36px', borderBottom: '1px dashed #cbd5e1', marginBottom: '4px' }}
            >
              <span className="text-[10px] text-slate-400 italic print:hidden">हस्ताक्षर एवं पदमुद्रा</span>
            </div>

            {isEditing ? (
              <div className="space-y-1 text-right">
                <input
                  type="text"
                  value={activeOrder.signatoryName || ''}
                  onChange={(e) => handleFieldChange('signatoryName', e.target.value)}
                  placeholder="हस्ताक्षरकर्ता का नाम"
                  className="w-full px-1.5 py-0.5 border border-amber-300 bg-amber-50 rounded text-xs font-bold text-right"
                />
                <input
                  type="text"
                  value={activeOrder.signatoryDesignation || ''}
                  onChange={(e) => handleFieldChange('signatoryDesignation', e.target.value)}
                  placeholder="पदनाम"
                  className="w-full px-1.5 py-0.5 border border-amber-300 bg-amber-50 rounded text-xs text-right"
                />
              </div>
            ) : (
              <>
                <p 
                  className="text-xs md:text-sm font-bold text-slate-950"
                  style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#020617', margin: 0 }}
                >
                  ({primarySignatoryName})
                </p>
                <p 
                  className="text-xs text-slate-800 font-semibold"
                  style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', margin: 0 }}
                >
                  {primarySignatoryDesignation}
                </p>
                <p 
                  className="text-[11px] text-slate-700 font-medium"
                  style={{ fontSize: '11px', color: '#334155', margin: 0 }}
                >
                  {headerClusterName}, {headerBlock || 'गायघाट'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Endorsement / Copy To (पृष्ठांकन / प्रतिलिपि) Section */}
        {showCopyTo && (
          <div 
            className="copy-to-section mt-6 pt-4 border-t border-slate-400"
            style={{ 
              marginTop: '22px', 
              paddingTop: '12px', 
              borderTop: '1.5px solid #64748b' 
            }}
          >
            <div 
              className="flex justify-between text-xs md:text-[13px] font-bold text-slate-950 mb-2"
              style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '8px', fontSize: '12.5px' }}
            >
              <span>पृष्ठांकन क्रमांक: {activeOrder.orderNumber || 'क्र./CRC/2026/01'}</span>
              <span>दिनांक: {formattedDate}</span>
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <p 
                className="text-xs md:text-sm font-bold text-slate-950 underline decoration-slate-400"
                style={{ fontSize: '13px', fontWeight: 'bold', color: '#020617', textDecoration: 'underline' }}
              >
                प्रतिलिपि सूचनार्थ एवं आवश्यक कार्रवाई हेतु प्रेषित :
              </p>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleAddCopyRow}
                  className="print:hidden inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  + प्रतिलिपि पंक्ति
                </button>
              )}
            </div>

            <ol 
              className="list-decimal list-outside pl-5 space-y-1 text-xs md:text-[13px] text-slate-800"
              style={{ paddingLeft: '20px', margin: '4px 0', fontSize: '12.5px', lineHeight: '1.5', color: '#1e293b' }}
            >
              {copyToList.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '3px' }}>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleCopyToChange(idx, e.target.value)}
                        className="w-full px-1.5 py-0.5 border border-amber-300 bg-amber-50 rounded text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteCopyRow(idx)}
                        className="p-1 text-red-500 hover:text-red-700 rounded cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    item
                  )}
                </li>
              ))}
            </ol>

            {/* Endorsement Secondary Signatory */}
            <div 
              className="endorsement-signatory mt-6 flex justify-end"
              style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-end', textAlign: 'right' }}
            >
              <div 
                className="text-right min-w-[200px]"
                style={{ textAlign: 'right', display: 'inline-block' }}
              >
                <p 
                  className="text-xs md:text-sm font-bold text-slate-950"
                  style={{ fontSize: '13px', fontWeight: 'bold', color: '#020617', margin: 0 }}
                >
                  ({primarySignatoryName})
                </p>
                <p 
                  className="text-xs text-slate-800 font-semibold"
                  style={{ fontSize: '11.5px', fontWeight: '600', color: '#1e293b', margin: 0 }}
                >
                  {primarySignatoryDesignation}
                </p>
                <p 
                  className="text-[11px] text-slate-700 font-medium"
                  style={{ fontSize: '11px', color: '#334155', margin: 0 }}
                >
                  {headerClusterName}, {headerBlock || 'गायघाट'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
