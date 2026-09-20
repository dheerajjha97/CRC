import React from 'react';
import { OfficeOrder, CrcProfile } from '../types';
import { BiharEducationLogo } from './BiharEducationLogo';

interface OfficialLetterViewProps {
  order: OfficeOrder;
  profile: CrcProfile;
  id?: string;
  isPrintPreview?: boolean;
}

export const OfficialLetterView: React.FC<OfficialLetterViewProps> = ({
  order,
  profile,
  id = 'official-letter-document',
  isPrintPreview = false
}) => {
  // Format Date in Indian standard (DD/MM/YYYY)
  const formattedDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString('hi-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) : new Date().toLocaleDateString('hi-IN');

  // Compute smart column visibility for teachers table
  const teachers = order.selectedTeachers || [];
  
  // Non-empty deputed schools
  const validDeputedSchools = teachers
    .map(t => (t.deputedSchool || '').trim())
    .filter(Boolean);
  const uniqueDeputedSchools = Array.from(new Set(validDeputedSchools));

  // If all teachers have the EXACT same deputed school, or if all non-empty match and there is at least one
  const isAllSameDeputedSchool = uniqueDeputedSchools.length === 1 && 
    (validDeputedSchools.length === teachers.length || teachers.length > 0 && validDeputedSchools.length > 0 && validDeputedSchools.length >= teachers.length - 1);
  const commonDeputedSchoolName = isAllSameDeputedSchool ? uniqueDeputedSchools[0] : null;

  // Show deputed school column ONLY if multiple different schools exist
  const showDeputedSchoolColumn = uniqueDeputedSchools.length > 1 || (uniqueDeputedSchools.length === 1 && !isAllSameDeputedSchool);

  // Non-empty duty roles
  const validDutyRoles = teachers
    .map(t => (t.assignedDutyRole || '').trim())
    .filter(Boolean);
  const uniqueDutyRoles = Array.from(new Set(validDutyRoles));

  // If all teachers have the EXACT same duty role
  const isAllSameDuty = uniqueDutyRoles.length === 1 && 
    (validDutyRoles.length === teachers.length || teachers.length > 0 && validDutyRoles.length > 0);
  const commonDutyName = isAllSameDuty ? uniqueDutyRoles[0] : null;

  // Show duty role column ONLY if multiple different duties exist
  const showDutyRoleColumn = uniqueDutyRoles.length > 1 || (uniqueDutyRoles.length === 1 && !isAllSameDuty);

  // Signatory details
  const primarySignatoryName = order.signatoryName || profile.defaultSignatory || profile.centerHead || 'संकुल प्राचार्य / समन्वयक';
  const primarySignatoryDesignation = order.signatoryDesignation || profile.defaultDesignation || profile.headDesignation || 'संकुल समन्वयक / प्राचार्य';
  const clusterTitle = profile.clusterName || 'संकुल संसाधन केंद्र (CRC)';

  // Endorsement / प्रतिलिपि default list
  const defaultCopies = [
    `जिला शिक्षा पदाधिकारी / जिला शिक्षा अधिकारी, जिला - ${profile.districtName || 'मुजफ्फरपुर'} की ओर सादर सूचनार्थ।`,
    `प्रखंड शिक्षा पदाधिकारी / विकासखंड शिक्षा अधिकारी (BEO), प्रखंड/विकासखंड - ${profile.blockName || 'गायघाट'} की ओर सादर सूचनार्थ।`,
    `प्रखंड साधन सेवी / विकासखंड स्रोत समन्वयक (BRCC), प्रखंड/विकासखंड - ${profile.blockName || 'गायघाट'} की ओर सूचनार्थ।`,
    `संबंधित विद्यालय के प्रधानाध्यापक / प्राचार्य / प्रभारी प्रधानाध्यापक, सर्व संबंधित विद्यालय की ओर सूचना एवं आवश्यक अनुपालनार्थ।`,
    `सर्व संबंधित शिक्षक / शिक्षिका, तत्काल आदेश पालनार्थ।`,
    `कार्यालय संचिका / गार्ड फाइल (Guard File)।`
  ];

  const copyToList = order.copyTo !== undefined ? order.copyTo : defaultCopies;
  const showCopyTo = copyToList && copyToList.length > 0;

  return (
    <div
      id={id}
      className={`official-letter-page bg-white text-slate-900 border border-slate-300 rounded shadow-md mx-auto print:shadow-none print:border-none print:m-0 font-['Mukta','Noto_Sans_Devanagari',sans-serif] ${
        isPrintPreview ? 'p-6 md:p-10 max-w-[850px] min-h-[1100px]' : 'p-8 md:p-12 max-w-[850px] min-h-[1120px]'
      }`}
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
          {/* Bihar Education Department Official Emblem */}
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
        <div style={{ fontWeight: '600', color: '#0f172a' }}>
          पत्र क्रमांक / आदेश : <span className="font-mono font-bold tracking-wide text-slate-950" style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#020617' }}>{order.orderNumber || 'क्र./CRC/2026/01'}</span>
        </div>
        <div style={{ fontWeight: '600', color: '#0f172a' }}>
          दिनांक : <span className="font-bold text-slate-950" style={{ fontWeight: 'bold', color: '#020617' }}>{formattedDate}</span>
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
      {(order.subject || order.reference) && (
        <div 
          className="subject-reference-block space-y-2 mb-5 text-sm md:text-[15px] leading-relaxed"
          style={{ marginBottom: '18px', fontSize: '14.5px', lineHeight: 1.6 }}
        >
          {order.subject && (
            <div 
              className="flex items-start"
              style={{ display: 'flex', alignItems: 'flex-start' }}
            >
              <span 
                className="font-bold text-slate-950 shrink-0"
                style={{ fontWeight: 'bold', color: '#020617', minWidth: '65px', display: 'inline-block' }}
              >
                विषय :
              </span>
              <span 
                className="font-bold text-slate-950 underline decoration-slate-400 underline-offset-4"
                style={{ fontWeight: 'bold', color: '#020617', textDecoration: 'underline', textUnderlineOffset: '4px' }}
              >
                {order.subject}
              </span>
            </div>
          )}

          {order.reference && (
            <div 
              className="flex items-start text-xs md:text-sm text-slate-800"
              style={{ display: 'flex', alignItems: 'flex-start', fontSize: '13px', color: '#1e293b', marginTop: '4px' }}
            >
              <span 
                className="font-bold text-slate-900 shrink-0"
                style={{ fontWeight: 'bold', color: '#0f172a', minWidth: '65px', display: 'inline-block' }}
              >
                प्रसंग :
              </span>
              <span style={{ color: '#334155' }}>
                {order.reference}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Order Body Text */}
      <div 
        className="order-body-content text-sm md:text-[15px] leading-relaxed text-justify text-slate-900 mb-5 whitespace-pre-line"
        style={{ 
          fontSize: '14.5px', 
          lineHeight: '1.75', 
          textAlign: 'justify', 
          textJustify: 'inter-word',
          color: '#0f172a', 
          marginBottom: '18px',
          whiteSpace: 'pre-line' 
        }}
      >
        {order.content}
      </div>

      {/* Meeting or Schedule Specific Box if applicable */}
      {(order.meetingDate || order.meetingTime || order.meetingVenue) && (
        <div 
          className="meeting-details-box bg-slate-50 border border-slate-300 rounded p-3 mb-5 text-xs md:text-sm grid grid-cols-1 md:grid-cols-3 gap-2"
          style={{ 
            backgroundColor: '#f8fafc', 
            border: '1px solid #cbd5e1', 
            borderRadius: '6px', 
            padding: '10px 14px', 
            marginBottom: '18px', 
            fontSize: '13px'
          }}
        >
          {order.meetingDate && (
            <div style={{ marginBottom: '4px' }}>
              <strong style={{ color: '#0f172a' }}>नियत तिथि: </strong>
              <span>{order.meetingDate}</span>
            </div>
          )}
          {order.meetingTime && (
            <div style={{ marginBottom: '4px' }}>
              <strong style={{ color: '#0f172a' }}>समय: </strong>
              <span>{order.meetingTime}</span>
            </div>
          )}
          {order.meetingVenue && (
            <div>
              <strong style={{ color: '#0f172a' }}>स्थान: </strong>
              <span>{order.meetingVenue}</span>
            </div>
          )}
        </div>
      )}

      {/* Teachers List Table Section */}
      {teachers.length > 0 && (
        <div className="teachers-table-section my-5" style={{ margin: '18px 0' }}>
          {/* Section Header */}
          <div 
            className="text-xs md:text-sm font-bold text-slate-950 mb-2"
            style={{ fontSize: '14px', fontWeight: 'bold', color: '#020617', marginBottom: '8px' }}
          >
            संबंधित आदेशित शिक्षकों की सूची :
          </div>

          {/* Clean Highlights for Uniform Deputed School and/or Uniform Duty */}
          {(commonDeputedSchoolName || commonDutyName) && (
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
                </tr>
              </thead>
              <tbody>
                {teachers.map((t, idx) => (
                  <tr 
                    key={t.id || idx} 
                    className="hover:bg-slate-50"
                    style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                  >
                    <td style={{ border: '1px solid #334155', padding: '6px 8px', textAlign: 'center', fontWeight: '600' }}>
                      {idx + 1}
                    </td>
                    <td style={{ border: '1px solid #334155', padding: '6px 10px', fontWeight: 'bold', color: '#020617' }}>
                      {t.name}
                    </td>
                    <td style={{ border: '1px solid #334155', padding: '6px 10px', color: '#1e293b' }}>
                      {t.designation}
                    </td>
                    <td style={{ border: '1px solid #334155', padding: '6px 10px', color: '#1e293b' }}>
                      {t.schoolName}
                    </td>
                    {showDeputedSchoolColumn && (
                      <td style={{ border: '1px solid #334155', padding: '6px 10px', fontWeight: '600', color: '#1e3a8a', backgroundColor: '#faf5ff' }}>
                        {t.deputedSchool || '— (मूल शाला)'}
                      </td>
                    )}
                    {showDutyRoleColumn && (
                      <td style={{ border: '1px solid #334155', padding: '6px 10px', color: '#0f172a' }}>
                        {t.assignedDutyRole || 'उपस्थिति / दायित्व निर्वहन'}
                      </td>
                    )}
                  </tr>
                ))}
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

          <p 
            className="font-bold text-slate-950 mb-1.5"
            style={{ fontWeight: 'bold', color: '#020617', marginBottom: '6px' }}
          >
            प्रतिलिपि सूचनार्थ एवं आवश्यक कार्रवाई हेतु प्रेषित :
          </p>

          <ol 
            className="list-decimal list-inside space-y-1 text-slate-800 pl-1"
            style={{ listStyleType: 'decimal', paddingLeft: '6px', margin: '4px 0', lineHeight: 1.6 }}
          >
            {copyToList.map((cp, i) => (
              <li key={i} style={{ marginBottom: '3px' }}>
                {cp}
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
  );
};
