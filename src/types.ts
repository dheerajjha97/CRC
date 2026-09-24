export interface Teacher {
  id: string;
  name: string;
  designation: string;
  schoolName: string;
  phone?: string;
  email?: string;
  subject?: string;
  createdAt?: string;
}

export interface SelectedTeacherInOrder {
  id: string;
  name: string;
  designation: string;
  schoolName: string;
  deputedSchool?: string; // प्रतिनियुक्त शाला / परीक्षा केंद्र (if deputed)
  assignedDutyRole?: string; // विशिष्ट दायित्व (e.g. वीक्षक, मूल्यांकनकर्ता)
}

export interface CustomTableColumn {
  id: string;
  label: string;
  width?: string;
}

export interface CustomTableData {
  title?: string; // सारणी का शीर्षक (उदा. "समय सारणी", "सामग्री वितरण विवरण")
  columns: string[]; // e.g. ["क्र.", "कक्षा", "विषय", "परीक्षा दिनांक", "समय"]
  rows: string[][]; // e.g. [["1", "कक्षा 5", "गणित", "28/09/2026", "10:00 AM"]]
}

export interface ClusterSchool {
  id: string;
  name: string;
  udiseCode?: string;
  category?: string; // प्राथमिक, पूर्व माध्यमिक, उच्च प्राथमिक
  village?: string;
}

export interface OfficeOrder {
  id?: string;
  orderNumber: string; // क्र./CRC/2026/01
  orderDate: string; // YYYY-MM-DD
  subject: string; // विषय
  reference?: string; // प्रसंग / संदर्भ पत्र
  content: string; // मुख्य विवरण / आदेश
  orderType: 'meeting' | 'deputation' | 'exam_duty' | 'training' | 'evaluation' | 'general' | 'inspection' | 'custom_table';
  tableMode?: 'teachers' | 'custom' | 'both' | 'none'; // कौन सी सारणी दर्शानी है
  selectedTeachers: SelectedTeacherInOrder[];
  customTable?: CustomTableData;
  meetingDate?: string;
  meetingTime?: string;
  meetingVenue?: string;
  signatoryName?: string;
  signatoryDesignation?: string;
  // Header Customization (Order specific override)
  headerOfficeTitle?: string;
  headerClusterName?: string;
  headerBlock?: string;
  headerDistrict?: string;
  headerState?: string;
  headerAddress?: string;
  headerPhone?: string;
  headerEmail?: string;
  headerLogoVariant?: 'bihar_seal' | 'shiksha_vibhag' | 'ashoka_emblem';
  headerLogoUrl?: string;
  copyTo?: string[]; // प्रतिलिपि
  createdAt?: string;
  updatedAt?: string;
}

export interface CrcProfile {
  clusterName: string;
  officeTitle?: string; // e.g. "कार्यालय संकुल समन्वयक / प्राचार्य"
  blockName: string;
  districtName: string;
  stateName: string;
  centerHead: string;
  headDesignation: string;
  phone: string;
  email: string;
  officeAddress: string;
  letterPrefix: string;
  defaultSignatory: string;
  defaultDesignation: string;
  logoUrl?: string;
  logoVariant?: 'bihar_seal' | 'shiksha_vibhag' | 'ashoka_emblem';
}

export interface OrderTemplate {
  id: string;
  name: string;
  category: 'meeting' | 'deputation' | 'exam_duty' | 'training' | 'evaluation' | 'general' | 'inspection' | 'custom_table';
  subject: string;
  reference: string;
  content: string;
  tableMode?: 'teachers' | 'custom' | 'both' | 'none';
  customTable?: CustomTableData;
  copyTo: string[];
}
