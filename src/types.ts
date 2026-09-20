export interface Teacher {
  id: string;
  name: string; // शिक्षक का नाम
  designation: string; // पदनाम
  schoolName: string; // पदस्थ शाला / विद्यालय
  createdAt?: string;
  // Backward compatibility for existing records
  schoolUdise?: string;
  subject?: string;
  employeeCode?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

export interface ClusterSchool {
  id: string;
  name: string;
  udiseCode?: string;
  category?: string; // प्राथमिक / माध्यमिक / उच्चतर माध्यमिक
  village?: string;
  headmaster?: string;
  contact?: string;
}

export interface SelectedTeacherInOrder {
  id: string;
  name: string;
  designation: string;
  schoolName: string; // मूल पदस्थापना विद्यालय
  deputedSchool?: string; // प्रतिनियुक्त विद्यालय / परीक्षा केंद्र का नाम
  assignedDutyRole?: string; // विशेष भूमिका (उदा. केंद्राध्यक्ष, वीक्षक / पर्यवेक्षक, मूल्यांकनकर्ता)
  remarks?: string;
}

export interface OfficeOrder {
  id: string;
  orderNumber: string; // कार्यालयीन आदेश क्रमांक / पत्र क्रमांक
  orderDate: string; // दिनांक
  subject: string; // पत्र का विषय
  reference?: string; // संदर्भ
  content: string; // आदेश का मुख्य विवरण / निर्देश
  orderType: 'meeting' | 'duty' | 'training' | 'general' | 'notice'; // बैठक / विशेष दायित्व / प्रशिक्षण / सामान्य / कारण बताओ
  includeDeputedSchool?: boolean; // क्या इस आदेश में प्रतिनियुक्त विद्यालय (Deputed School) कॉलम दर्शाना है
  selectedTeachers: SelectedTeacherInOrder[];
  meetingDate?: string;
  meetingTime?: string;
  meetingVenue?: string;
  signatoryName: string; // संकुल प्राचार्य / समन्वयक का नाम
  signatoryDesignation: string; // पदनाम
  officeName: string; // कार्यालय संकुल संसाधन केंद्र...
  officeAddress?: string;
  copyTo: string[]; // प्रतिलिपि सूचनार्थ एवं आवश्यक कार्रवाई हेतु
  createdAt: string;
  updatedAt?: string;
}

export interface CrcProfile {
  id?: string;
  clusterName: string; // संकुल का नाम (उदा. शासकीय उच्चतर माध्यमिक विद्यालय संकुल, रामपुर)
  blockName: string; // विकासखंड (Block)
  districtName: string; // जिला
  stateName: string; // राज्य
  centerHead: string; // संकुल प्राचार्य / समन्वयक का नाम
  headDesignation: string; // प्राचार्य / संकुल समन्वयक
  phone: string;
  email: string;
  officeAddress: string;
  letterPrefix: string; // उदा: सं.सं.के./2026/
  defaultSignatory: string;
  defaultDesignation: string;
  logoUrl?: string; // कस्टम लोगो URL
  logoVariant?: 'shiksha_vibhag' | 'bepc'; // लोगो विकल्प
}
