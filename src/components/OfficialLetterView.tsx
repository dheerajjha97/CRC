import React from 'react';
import { OfficeOrder, CrcProfile } from '../types';

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

  return (
    <div
      id={id}
      className={`bg-white text-slate-900 border border-slate-300 rounded shadow-md mx-auto print:shadow-none print:border-none print:m-0 font-['Mukta','Noto_Sans_Devanagari',sans-serif] ${
        isPrintPreview ? 'p-6 md:p-10 max-w-[850px] min-h-[1100px]' : 'p-8 md:p-12 max-w-[850px] min-h-[1120px]'
      }`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* State / Education Department Seal & CRC Letterhead Header */}
      <div className="text-center border-b-2 border-slate-800 pb-4 mb-5">
        <div className="flex items-center justify-center space-x-3 mb-1">
          <div className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center bg-slate-50 font-bold text-xs tracking-tighter text-slate-800">
            शासन
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 leading-snug">
              कार्यालय संकुल प्राचार्य / समन्वयक
            </h1>
            <h2 className="text-base md:text-lg font-semibold text-slate-800">
              {profile.clusterName || 'संकुल संसाधन केंद्र (CRC)'}
            </h2>
          </div>
        </div>

        <p className="text-xs md:text-sm text-slate-700 font-medium">
          विकासखंड: <span className="font-semibold text-slate-900">{profile.blockName || 'सदर'}</span>, 
          जिला: <span className="font-semibold text-slate-900">{profile.districtName || 'रायपुर'}</span> ({profile.stateName || 'भारत'})
        </p>
        
        {(profile.phone || profile.email) && (
          <p className="text-[11px] text-slate-600 mt-0.5">
            {profile.phone ? `दूरभाष: ${profile.phone}` : ''} 
            {profile.phone && profile.email ? ' | ' : ''}
            {profile.email ? `ईमेल: ${profile.email}` : ''}
          </p>
        )}
      </div>

      {/* Dispatch Number and Date Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs md:text-sm font-semibold border-b border-slate-200 pb-2 mb-4">
        <div>
          पत्र क्रमांक / आदेश : <span className="text-slate-900 font-mono tracking-wide">{order.orderNumber || 'क्र./सं.सं.के./2026/01'}</span>
        </div>
        <div>
          दिनांक : <span className="text-slate-900">{formattedDate}</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center my-3">
        <span className="inline-block border-b-2 border-slate-900 pb-0.5 text-base md:text-lg font-bold tracking-wide uppercase">
          // कार्यालयीन आदेश //
        </span>
      </div>

      {/* Subject & Reference */}
      <div className="space-y-1.5 mb-5 text-sm md:text-base leading-relaxed">
        <div className="flex items-start">
          <span className="font-bold min-w-[70px] text-slate-900">विषय :</span>
          <span className="font-semibold text-slate-900 underline decoration-slate-400 underline-offset-4">
            {order.subject || 'शिक्षकों के संबंध में आवश्यक दायित्व एवं निर्देश बाबत।'}
          </span>
        </div>

        {order.reference && (
          <div className="flex items-start text-xs md:text-sm text-slate-700">
            <span className="font-bold min-w-[70px] text-slate-800">संदर्भ :</span>
            <span>{order.reference}</span>
          </div>
        )}
      </div>

      {/* Main Order Body */}
      <div className="text-sm md:text-[15px] leading-relaxed text-justify text-slate-800 space-y-3 mb-6 whitespace-pre-line">
        {order.content}
      </div>

      {/* Meeting or Schedule Specific Box if applicable */}
      {(order.meetingDate || order.meetingTime || order.meetingVenue) && (
        <div className="bg-slate-50 border border-slate-300 rounded p-3 mb-5 text-xs md:text-sm grid grid-cols-1 md:grid-cols-3 gap-2">
          {order.meetingDate && (
            <div>
              <span className="font-bold text-slate-800">नियत तिथि: </span>
              <span>{order.meetingDate}</span>
            </div>
          )}
          {order.meetingTime && (
            <div>
              <span className="font-bold text-slate-800">समय: </span>
              <span>{order.meetingTime}</span>
            </div>
          )}
          {order.meetingVenue && (
            <div className="md:col-span-1">
              <span className="font-bold text-slate-800">स्थान: </span>
              <span>{order.meetingVenue}</span>
            </div>
          )}
        </div>
      )}

      {/* Teachers List Table with Smart Column Management (Hides column if all teachers share same school or same duty) */}
      {order.selectedTeachers && order.selectedTeachers.length > 0 && (() => {
        // Compute unique deputed schools
        const deputedSchools = Array.from(
          new Set(order.selectedTeachers.map(t => (t.deputedSchool || '').trim()).filter(Boolean))
        );
        const hasAnyDeputedSchool = deputedSchools.length > 0;
        const isSingleCommonDeputedSchool = hasAnyDeputedSchool && deputedSchools.length === 1 && 
          order.selectedTeachers.every(t => (t.deputedSchool || '').trim() === deputedSchools[0]);
        const commonDeputedSchoolName = isSingleCommonDeputedSchool ? deputedSchools[0] : null;

        // Show Deputed School column ONLY if there are multiple DIFFERENT destination schools
        const showDeputedSchoolColumn = hasAnyDeputedSchool && !isSingleCommonDeputedSchool;

        // Compute unique duty roles
        const dutyRoles = Array.from(
          new Set(order.selectedTeachers.map(t => (t.assignedDutyRole || '').trim()).filter(Boolean))
        );
        const hasAnyDutyRole = dutyRoles.length > 0;
        const isSingleCommonDuty = hasAnyDutyRole && dutyRoles.length === 1 &&
          order.selectedTeachers.every(t => (t.assignedDutyRole || '').trim() === dutyRoles[0]);
        const commonDutyName = isSingleCommonDuty ? dutyRoles[0] : null;

        // Show Assigned Duty column ONLY if there are multiple DIFFERENT duties
        const showDutyRoleColumn = hasAnyDutyRole && !isSingleCommonDuty;

        return (
          <div className="my-5">
            {/* Table Header with contextual badges if common school/duty applies */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
              <div className="text-xs md:text-sm font-bold text-slate-900">
                संबंधित आदेशित शिक्षकों की सूची :
              </div>
            </div>

            {/* Common Deputed School or Common Duty Callout Badges */}
            {(commonDeputedSchoolName || commonDutyName) && (
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 mb-3 text-xs md:text-[13px] space-y-1">
                {commonDeputedSchoolName && (
                  <div className="flex items-start gap-1.5 text-slate-900 font-medium">
                    <span className="font-bold text-slate-800 shrink-0">प्रतिनियुक्त विद्यालय / परीक्षा केंद्र :</span>
                    <span className="font-bold text-indigo-900 underline decoration-indigo-300 underline-offset-2">
                      {commonDeputedSchoolName}
                    </span>
                    <span className="text-[11px] text-slate-500 italic ml-1">
                      (उपरोक्त सभी शिक्षकों हेतु एक समान)
                    </span>
                  </div>
                )}
                {commonDutyName && (
                  <div className="flex items-start gap-1.5 text-slate-900 font-medium">
                    <span className="font-bold text-slate-800 shrink-0">सौंपा गया दायित्व / कार्य :</span>
                    <span className="font-bold text-slate-950">
                      {commonDutyName}
                    </span>
                    <span className="text-[11px] text-slate-500 italic ml-1">
                      (उपरोक्त सभी शिक्षकों हेतु एक समान)
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-400 text-xs md:text-sm text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-semibold border-b border-slate-400">
                    <th className="border border-slate-400 p-2 w-12 text-center">क्र.</th>
                    <th className="border border-slate-400 p-2">शिक्षक का नाम</th>
                    <th className="border border-slate-400 p-2">पदनाम</th>
                    <th className="border border-slate-400 p-2">
                      {showDeputedSchoolColumn ? 'मूल पदस्थापना विद्यालय' : 'पदस्थ विद्यालय'}
                    </th>
                    {showDeputedSchoolColumn && (
                      <th className="border border-slate-400 p-2 bg-indigo-50/50 text-indigo-950 font-bold">
                        प्रतिनियुक्त विद्यालय / परीक्षा केंद्र
                      </th>
                    )}
                    {showDutyRoleColumn && (
                      <th className="border border-slate-400 p-2">आवंटित दायित्व / कार्य</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {order.selectedTeachers.map((t, idx) => (
                    <tr key={t.id || idx} className="hover:bg-slate-50">
                      <td className="border border-slate-400 p-2 text-center font-medium">{idx + 1}</td>
                      <td className="border border-slate-400 p-2 font-semibold text-slate-900">
                        {t.name}
                      </td>
                      <td className="border border-slate-400 p-2 text-slate-800">{t.designation}</td>
                      <td className="border border-slate-400 p-2 text-slate-800">{t.schoolName}</td>
                      {showDeputedSchoolColumn && (
                        <td className="border border-slate-400 p-2 font-semibold text-indigo-900 bg-indigo-50/30">
                          {t.deputedSchool || '— (मूल शाला)'}
                        </td>
                      )}
                      {showDutyRoleColumn && (
                        <td className="border border-slate-400 p-2 font-medium text-slate-900">
                          {t.assignedDutyRole || 'उपस्थिति / दायित्व निर्वहन'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Mandatory closing instruction */}
      <p className="text-xs md:text-sm text-slate-800 mt-4 leading-normal italic">
        उक्त आदेश का तत्काल एवं कड़ाई से पालन सुनिश्चित किया जाए।
      </p>

      {/* Signatory Section */}
      <div className="mt-10 flex justify-end">
        <div className="text-center min-w-[220px]">
          <div className="h-12 flex items-end justify-center">
            {/* Signature space placeholder */}
            <span className="text-[11px] text-slate-400 italic">
              (हस्ताक्षरित)
            </span>
          </div>
          <div className="border-t border-slate-400 pt-1 text-xs md:text-sm font-bold text-slate-900">
            {order.signatoryName || profile.defaultSignatory || profile.centerHead}
          </div>
          <div className="text-[11px] md:text-xs text-slate-700 font-medium">
            {order.signatoryDesignation || profile.defaultDesignation || profile.headDesignation}
          </div>
          <div className="text-[11px] text-slate-600">
            {profile.clusterName}
          </div>
        </div>
      </div>

      {/* Dispatch Copy To / प्रतिलिपि Section */}
      {(() => {
        // If order.copyTo is provided as array, use it (if empty [], hide section). If undefined, fallback to default.
        const defaultCopies = [
          `जिला शिक्षा अधिकारी, जिला - ${profile.districtName || 'रायपुर'} की ओर सादर सूचनार्थ।`,
          `विकासखंड शिक्षा अधिकारी (BEO), विकासखंड - ${profile.blockName || 'सदर'} की ओर सादर सूचनार्थ।`,
          `विकासखंड स्रोत समन्वयक (BRCC), विकासखंड - ${profile.blockName || 'सदर'} की ओर सूचनार्थ।`,
          `संबंधित प्रधान पाठक / प्राचार्य, सर्व संबंधित विद्यालय की ओर सूचना एवं पालनार्थ।`,
          `सर्व संबंधित शिक्षक, पालनार्थ।`,
          `कार्यालयीन संचिका / आदेश नस्ती (Guard File)।`
        ];

        const copyToList = order.copyTo !== undefined ? order.copyTo : defaultCopies;

        if (!copyToList || copyToList.length === 0) {
          return null;
        }

        return (
          <div className="mt-8 pt-4 border-t border-slate-300 text-xs md:text-[13px] text-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold">
                पृ. क्रमांक / सं.सं.के. / प्रतिलिपि / 2026 /
              </span>
              <span>दिनांक : {formattedDate}</span>
            </div>
            <p className="font-semibold text-slate-900 mb-1">
              प्रतिलिपि सूचनार्थ एवं आवश्यक कार्रवाई हेतु प्रेषित :
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-700 pl-1">
              {copyToList.map((cp, i) => (
                <li key={i} className="leading-relaxed">{cp}</li>
              ))}
            </ol>

            {/* Secondary Signatory for Endorsement / प्रतिलिपि */}
            <div className="mt-6 flex justify-end">
              <div className="text-center min-w-[200px]">
                <div className="border-t border-slate-300 pt-1 text-xs font-bold text-slate-800">
                  {order.signatoryDesignation || profile.defaultDesignation || 'संकुल समन्वयक / प्राचार्य'}
                </div>
                <div className="text-[11px] text-slate-600">
                  {profile.clusterName}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
