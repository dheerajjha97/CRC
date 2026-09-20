import React, { useState, useEffect } from 'react';
import { OfficeOrder, CrcProfile, SelectedTeacherInOrder } from '../types';
import { BiharEducationLogo } from './BiharEducationLogo';
import { 
  Edit3, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';

interface OfficialLetterViewProps {
  order: OfficeOrder;
  profile: CrcProfile;
  id?: string;
  isPrintPreview?: boolean;
  allowInlineEdit?: boolean;
  onUpdateOrder?: (updatedOrder: OfficeOrder) => void;
}

export const OfficialLetterView: React.FC<OfficialLetterViewProps> = ({
  order,
  profile,
  id = 'official-letter-document',
  isPrintPreview = false,
  allowInlineEdit = true,
  onUpdateOrder
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableOrder, setEditableOrder] = useState<OfficeOrder>({ ...order });
  const [saveToast, setSaveToast] = useState(false);

  // Sync internal state when external order prop changes (and not currently editing actively)
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
      // Saving and exiting edit mode
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
  const clusterTitle = profile.clusterName || 'संकुल संसाधन केंद्र (CRC)';

  const copyToList = activeOrder.copyTo !== undefined ? activeOrder.copyTo : defaultCopies;
  const showCopyTo = copyToList && copyToList.length > 0;

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
                पत्र में किसी भी टेक्स्ट पर क्लिक करके सीधे टाइप करें
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {saveToast && (
              <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                बदलाव सुरक्षित हो गए!
              </span>
            )}
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              {isEditing ? 'लाइव एडिट मोड सक्रिय' : 'प्रिंट / A4 प्रिव्यू मोड'}
            </span>
          </div>
        </div>
      )}

      {/* Main Official Document Layout */}
      <div
        id={id}
        className={`official-letter-page bg-white text-slate-900 border border-slate-300 rounded shadow-md mx-auto print:shadow-none print:border-none print:m-0 font-['Mukta','Noto_Sans_Devanagari',sans-serif] ${
          isPrintPreview ? 'p-6 md:p-10 max-w-[850px] min-h-[1100px]' : 'p-8 md:p-12 max-w-[850px] min-h-[1120px]'
        } ${isEditing ? 'ring-2 ring-amber-400 bg-amber-50/10' : ''}`}
        style={{
          boxSizing: 'border-box',
          fontFamily: "'Mukta', 'Noto Sans Devanagari', 'Segoe UI', Tahoma, sans-serif",
          lineHeight: 1.65,
          color: '#0f172a',
          backgroundColor: '#ffffff'
        }}
      >
        {/* State / Education Department Emblem & CRC Letterhead */}
        <div 
          className="letterhead-header text-center border-b-2 border-slate-900 pb-3.5 mb-4"
          style={{ borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '16px', textAlign: 'center' }}
        >
          <div 
            className="flex items-center justify-center gap-3.5 mb-1.5"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '6px' }}
          >
            {/* Official Emblem */}
            <BiharEducationLogo 
              size={58} 
              customUrl={profile.logoUrl} 
              variant={profile.logoVariant || 'shiksha_vibhag'}
              className="shrink-0" 
            />

            <div>
              <div className="text-[11px] font-bold tracking-wider text-slate-700 uppercase" style={{ fontSize: '11px', letterSpacing: '1px', color: '#475569', marginBottom: '1px' }}>
                शिक्षा विभाग • बिहार सरकार
              </div>
              <h1 
                className="text-lg md:text-xl font-bold tracking-tight text-slate-950 leading-tight"
                style={{ fontSize: '19px', fontWeight: 'bold', color: '#020617', margin: 0, lineHeight: 1.3 }}
              >
                कार्यालय संकुल प्राचार्य / समन्वयक
              </h1>
              <h2 
                className="text-base md:text-lg font-bold text-slate-900"
                style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: '2px 0 0 0' }}
              >
                {clusterTitle}
              </h2>
            </div>
          </div>

          <p 
            className="text-xs md:text-sm text-slate-700 font-medium"
            style={{ fontSize: '13px', color: '#334155', margin: '3px 0 0 0' }}
          >
            प्रखंड / विकासखंड: <strong style={{ color: '#0f172a' }}>{profile.blockName || 'गायघाट'}</strong>, 
            जिला: <strong style={{ color: '#0f172a' }}>{profile.districtName || 'मुजफ्फरपुर'}</strong> ({profile.stateName || 'बिहार'})
          </p>
          
          {(profile.phone || profile.email) && (
            <p 
              className="text-[11px] text-slate-600 mt-0.5"
              style={{ fontSize: '11.5px', color: '#475569', margin: '2px 0 0 0' }}
            >
              {profile.phone ? `दूरभाष: ${profile.phone}` : ''} 
              {profile.phone && profile.email ? ' | ' : ''}
              {profile.email ? `ईमेल: ${profile.email}` : ''}
            </p>
          )}
        </div>

        {/* Dispatch Number and Date Bar */}
        <div 
          className="dispatch-bar flex flex-wrap items-center justify-between text-xs md:text-sm font-semibold border-b border-slate-300 pb-2 mb-4"
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: '1px solid #cbd5e1', 
            paddingBottom: '8px', 
            marginBottom: '16px',
            fontSize: '13.5px'
          }}
        >
          <div style={{ fontWeight: '600', color: '#0f172a' }} className="flex items-center gap-1">
            <span>पत्र क्रमांक / आदेश :</span>{' '}
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
              <label className="block text-[11px] font-bold text-amber-900">
                मुख्य आदेश विवरण (Order Body Content) :
              </label>
              <textarea
                value={activeOrder.content || ''}
                onChange={(e) => handleFieldChange('content', e.target.value)}
                rows={6}
                placeholder="मुख्य आदेश का शासकीय विवरण यहाँ लिखें..."
                className="w-full p-2.5 border border-amber-400 bg-amber-50 rounded text-sm leading-relaxed text-slate-900 focus:ring-1 focus:ring-amber-500 font-['Mukta',sans-serif] resize-y"
              />
            </div>
          ) : (
            <div 
              className="order-body-content text-sm md:text-[15px] leading-relaxed text-justify text-slate-900 whitespace-pre-line"
              style={{ 
                fontSize: '14.5px', 
                lineHeight: '1.75', 
                textAlign: 'justify', 
                textJustify: 'inter-word',
                color: '#0f172a', 
                whiteSpace: 'pre-line' 
              }}
            >
              {activeOrder.content}
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
              backgroundColor: isEditing ? '#fefce8' : '#f8fafc', 
              border: isEditing ? '1px dashed #f59e0b' : '1px solid #cbd5e1', 
              borderRadius: '6px', 
              padding: '10px 14px', 
              marginBottom: '18px', 
              fontSize: '13px'
            }}
          >
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">नियत तिथि</label>
                  <input
                    type="text"
                    value={activeOrder.meetingDate || ''}
                    onChange={(e) => handleFieldChange('meetingDate', e.target.value)}
                    placeholder="उदा. 25/09/2026"
                    className="w-full px-2 py-1 border border-slate-300 bg-white rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">समय</label>
                  <input
                    type="text"
                    value={activeOrder.meetingTime || ''}
                    onChange={(e) => handleFieldChange('meetingTime', e.target.value)}
                    placeholder="उदा. प्रातः 11:00 बजे"
                    className="w-full px-2 py-1 border border-slate-300 bg-white rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">स्थान / वेन्यू</label>
                  <input
                    type="text"
                    value={activeOrder.meetingVenue || ''}
                    onChange={(e) => handleFieldChange('meetingVenue', e.target.value)}
                    placeholder="उदा. संकुल संसाधन केंद्र सभागार"
                    className="w-full px-2 py-1 border border-slate-300 bg-white rounded text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {activeOrder.meetingDate && (
                  <div style={{ marginBottom: '4px' }}>
                    <strong style={{ color: '#0f172a' }}>नियत तिथि: </strong>
                    <span>{activeOrder.meetingDate}</span>
                  </div>
                )}
                {activeOrder.meetingTime && (
                  <div style={{ marginBottom: '4px' }}>
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

        {/* Teachers List Table Section */}
        {(teachers.length > 0 || isEditing) && (
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

        {/* Mandatory closing instruction */}
        <p 
          className="mandatory-note text-xs md:text-sm font-semibold text-slate-900 mt-4 leading-normal"
          style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a', margin: '16px 0 0 0' }}
        >
          उक्त आदेश का तत्काल एवं कड़ाई से पालन सुनिश्चित किया जाए।
        </p>

        {/* Primary Signatory Section (Strictly Right Aligned) */}
        <div 
          className="primary-signatory-block mt-8 flex justify-end"
          style={{ 
            marginTop: '28px', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            width: '100%',
            pageBreakInside: 'avoid',
            breakInside: 'avoid'
          }}
        >
          <div 
            className="text-center min-w-[240px]"
            style={{ 
              textAlign: 'center', 
              minWidth: '240px', 
              marginLeft: 'auto',
              display: 'inline-block'
            }}
          >
            <div 
              className="h-12 flex items-end justify-center"
              style={{ height: '45px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
            >
              <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                (हस्ताक्षरित)
              </span>
            </div>
            
            {isEditing ? (
              <div className="space-y-1 mt-1">
                <input
                  type="text"
                  value={activeOrder.signatoryName || ''}
                  onChange={(e) => handleFieldChange('signatoryName', e.target.value)}
                  placeholder="हस्ताक्षरकर्ता का नाम"
                  className="w-full px-2 py-0.5 border border-amber-300 bg-amber-50 rounded text-xs font-bold text-center"
                />
                <input
                  type="text"
                  value={activeOrder.signatoryDesignation || ''}
                  onChange={(e) => handleFieldChange('signatoryDesignation', e.target.value)}
                  placeholder="पदनाम"
                  className="w-full px-2 py-0.5 border border-amber-300 bg-amber-50 rounded text-xs font-semibold text-center"
                />
              </div>
            ) : (
              <>
                <div 
                  className="border-t border-slate-500 pt-1 text-xs md:text-sm font-bold text-slate-950"
                  style={{ borderTop: '1px solid #475569', paddingTop: '4px', fontSize: '14px', fontWeight: 'bold', color: '#020617' }}
                >
                  {primarySignatoryName}
                </div>
                <div 
                  className="text-[11.5px] md:text-xs text-slate-800 font-semibold"
                  style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}
                >
                  {primarySignatoryDesignation}
                </div>
              </>
            )}

            <div 
              className="text-[11px] text-slate-600"
              style={{ fontSize: '11px', color: '#475569' }}
            >
              {clusterTitle}
            </div>
          </div>
        </div>

        {/* Dispatch Copy To / प्रतिलिपि Section */}
        {showCopyTo && (
          <div 
            className="endorsement-copy-to-block mt-7 pt-4 border-t border-slate-300 text-xs md:text-[13px] text-slate-900"
            style={{ 
              marginTop: '24px', 
              paddingTop: '14px', 
              borderTop: '1px solid #cbd5e1', 
              fontSize: '12.5px', 
              color: '#0f172a',
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            <div 
              className="flex justify-between items-center mb-1.5 font-semibold"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontWeight: '600' }}
            >
              <span style={{ fontWeight: 'bold' }}>
                पृ. क्रमांक / सं.सं.के. / प्रतिलिपि / 2026 / __________
              </span>
              <span>दिनांक : {formattedDate}</span>
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <p 
                className="font-bold text-slate-950"
                style={{ fontWeight: 'bold', color: '#020617', margin: 0 }}
              >
                प्रतिलिपि सूचनार्थ एवं आवश्यक कार्रवाई हेतु प्रेषित :
              </p>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleAddCopyRow}
                  className="print:hidden inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5" />
                  प्रतिलिपि जोड़ें
                </button>
              )}
            </div>

            <ol 
              className="list-decimal list-inside space-y-1 text-slate-800 pl-1"
              style={{ listStyleType: 'decimal', paddingLeft: '6px', margin: '4px 0', lineHeight: 1.6 }}
            >
              {copyToList.map((cp, i) => (
                <li key={i} style={{ marginBottom: '3px' }} className="group/item">
                  {isEditing ? (
                    <div className="inline-flex items-center gap-1.5 w-[94%]">
                      <input
                        type="text"
                        value={cp}
                        onChange={(e) => handleCopyToChange(i, e.target.value)}
                        className="w-full px-2 py-0.5 border border-amber-300 bg-amber-50 rounded text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteCopyRow(i)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                        title="हटाएं"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span>{cp}</span>
                  )}
                </li>
              ))}
            </ol>

            {/* Secondary Signatory for Endorsement / प्रतिलिपि (Right Aligned) */}
            <div 
              className="mt-6 flex justify-end"
              style={{ 
                marginTop: '22px', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                width: '100%' 
              }}
            >
              <div 
                className="text-center min-w-[220px]"
                style={{ 
                  textAlign: 'center', 
                  minWidth: '220px', 
                  marginLeft: 'auto',
                  display: 'inline-block'
                }}
              >
                <div 
                  className="border-t border-slate-400 pt-1 text-xs font-bold text-slate-900"
                  style={{ borderTop: '1px solid #64748b', paddingTop: '4px', fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}
                >
                  {primarySignatoryDesignation}
                </div>
                <div 
                  className="text-[11px] text-slate-600"
                  style={{ fontSize: '11px', color: '#475569' }}
                >
                  {clusterTitle}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
