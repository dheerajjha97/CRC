import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Teacher, OfficeOrder, CrcProfile, ClusterSchool } from '../types';

export const DEFAULT_CRC_PROFILE: CrcProfile = {
  clusterName: 'संकुल संसाधन केंद्र (CRC)',
  blockName: 'गायघाट',
  districtName: 'मुजफ्फरपुर',
  stateName: 'बिहार',
  centerHead: '',
  headDesignation: 'प्राचार्य / संकुल समन्वयक',
  phone: '',
  email: '',
  officeAddress: 'संकुल संसाधन केंद्र, शिक्षा विभाग, बिहार',
  letterPrefix: 'क्र./सं.सं.के./2026/',
  defaultSignatory: '',
  defaultDesignation: 'प्राचार्य / संकुल समन्वयक'
};

export const DEMO_TEACHER_NAMES = [
  'श्री राजेश कुमार साहू',
  'श्रीमती सुनीता शर्मा',
  'श्री अनिल कुमार देवांगन',
  'सुश्री नीलम सिंह',
  'श्री मनोज कुमार वर्मा',
  'श्रीमती कंचन लता मिंज'
];

export const DEMO_SCHOOL_NAMES = [
  'शासकीय प्राथमिक शाला, नयापारा',
  'शासकीय प्राथमिक शाला, पटेलपारा',
  'शासकीय पूर्व माध्यमिक शाला, रामपुर',
  'शासकीय कन्या पूर्व माध्यमिक शाला',
  'शासकीय उच्चतर माध्यमिक विद्यालय संकुल केंद्र'
];

export const DEMO_UDISE_CODES = [
  '22100401201',
  '22100401202',
  '22100401203',
  '22100401204',
  '22100401205'
];

// TEACHERS
export async function getTeachersFromDb(): Promise<Teacher[]> {
  const teachersMap = new Map<string, Teacher>();

  try {
    const snapshot = await getDocs(collection(db, 'teachers'));
    snapshot.docs.forEach(d => {
      teachersMap.set(d.id, { id: d.id, ...d.data() } as Teacher);
    });
  } catch (err) {
    console.warn('Error fetching teachers from Firestore:', err);
  }

  // Also check localStorage backup
  try {
    const local = localStorage.getItem('crc_teachers');
    if (local) {
      const parsed: Teacher[] = JSON.parse(local);
      parsed.forEach(t => {
        if (!teachersMap.has(t.id)) {
          teachersMap.set(t.id, t);
        }
      });
    }
  } catch (e) {
    console.error(e);
  }

  const result = Array.from(teachersMap.values());
  result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'hi'));
  return result;
}

export async function addTeacherToDb(teacher: Omit<Teacher, 'id'>): Promise<string> {
  const newTeacherData = {
    ...teacher,
    createdAt: new Date().toISOString()
  };
  
  let docId = `teacher_${Date.now()}`;
  try {
    const docRef = await addDoc(collection(db, 'teachers'), newTeacherData);
    docId = docRef.id;
  } catch (err) {
    console.warn('Firestore addTeacher error, storing locally:', err);
  }

  // Backup to localStorage
  try {
    const current = await getTeachersFromDb();
    const updated = [...current.filter(t => t.id !== docId), { ...newTeacherData, id: docId }];
    localStorage.setItem('crc_teachers', JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }

  return docId;
}

export async function updateTeacherInDb(id: string, data: Partial<Teacher>): Promise<void> {
  try {
    const docRef = doc(db, 'teachers', id);
    await updateDoc(docRef, { ...data });
  } catch (err) {
    console.warn('Firestore updateTeacher error:', err);
  }

  try {
    const current = await getTeachersFromDb();
    const updated = current.map(t => (t.id === id ? { ...t, ...data } : t));
    localStorage.setItem('crc_teachers', JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
}

export async function deleteTeacherFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'teachers', id));
  } catch (err) {
    console.warn('Firestore deleteTeacher error:', err);
  }

  try {
    const current = await getTeachersFromDb();
    const updated = current.filter(t => t.id !== id);
    localStorage.setItem('crc_teachers', JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
}

// ORDERS (जावक पंजी) - Multi-collection resilient fetch
export async function getOrdersFromDb(): Promise<OfficeOrder[]> {
  const ordersMap = new Map<string, OfficeOrder>();

  // List of possible collections where letters might have been saved
  const collectionsToCheck = ['orders', 'office_orders', 'letters', 'jawak_panji', 'dispatch_orders'];

  for (const colName of collectionsToCheck) {
    try {
      // Direct getDocs without orderBy to ensure documents missing 'createdAt' field are NOT filtered out by Firestore
      const snapshot = await getDocs(collection(db, colName));
      snapshot.docs.forEach(d => {
        const data = d.data();
        const orderObj: OfficeOrder = {
          id: d.id,
          orderNumber: data.orderNumber || data.dispatchNumber || data.letterNo || '',
          orderDate: data.orderDate || data.date || data.createdAt?.split('T')[0] || '',
          subject: data.subject || data.title || '',
          reference: data.reference || data.prasang || '',
          content: data.content || data.body || data.description || '',
          orderType: data.orderType || data.type || 'meeting',
          meetingDate: data.meetingDate || data.scheduleDate || '',
          meetingTime: data.meetingTime || data.scheduleTime || '',
          meetingVenue: data.meetingVenue || data.venue || '',
          selectedTeachers: data.selectedTeachers || data.teachers || [],
          signatoryName: data.signatoryName || data.signatory || '',
          signatoryDesignation: data.signatoryDesignation || data.designation || '',
          copyTo: data.copyTo || data.endorsements || []
        };
        // If it has at least some content or subject or orderNumber, keep it
        if (orderObj.subject || orderObj.orderNumber || orderObj.content) {
          ordersMap.set(d.id, orderObj);
        }
      });
    } catch (err) {
      console.warn(`Could not fetch from collection '${colName}':`, err);
    }
  }

  // Also check localStorage fallback in case orders were saved locally
  try {
    const localKeys = ['crc_orders', 'office_orders', 'jawak_panji', 'orders'];
    for (const key of localKeys) {
      const local = localStorage.getItem(key);
      if (local) {
        const parsed: OfficeOrder[] = JSON.parse(local);
        if (Array.isArray(parsed)) {
          parsed.forEach(o => {
            const id = o.id || `local_${Math.random()}`;
            if (!ordersMap.has(id)) {
              ordersMap.set(id, { ...o, id });
            }
          });
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  const allOrders = Array.from(ordersMap.values());

  // Sort descending by date / orderNumber
  allOrders.sort((a, b) => {
    const dateA = a.orderDate || '';
    const dateB = b.orderDate || '';
    if (dateA && dateB && dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }
    return (b.orderNumber || '').localeCompare(a.orderNumber || '');
  });

  return allOrders;
}

export async function saveOrderToDb(order: Omit<OfficeOrder, 'id'>): Promise<string> {
  const orderData = {
    ...order,
    createdAt: new Date().toISOString()
  };

  let docId = `order_${Date.now()}`;
  try {
    const docRef = await addDoc(collection(db, 'orders'), orderData);
    docId = docRef.id;
  } catch (err) {
    console.warn('Firestore saveOrder error, storing locally:', err);
  }

  // Always backup to localStorage as well
  try {
    const current = await getOrdersFromDb();
    const updated = [{ ...orderData, id: docId }, ...current.filter(o => o.id !== docId)];
    localStorage.setItem('crc_orders', JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }

  return docId;
}

export async function updateOrderInDb(id: string, order: Partial<OfficeOrder>): Promise<void> {
  const updatePayload = {
    ...order,
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, 'orders', id);
    await updateDoc(docRef, updatePayload);
  } catch (err) {
    console.warn('Firestore updateOrder error:', err);
  }

  try {
    const current = await getOrdersFromDb();
    const updated = current.map(o => (o.id === id ? { ...o, ...updatePayload } : o));
    localStorage.setItem('crc_orders', JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
}

export async function deleteOrderFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'orders', id));
  } catch (err) {
    console.warn('Firestore deleteOrder error:', err);
  }

  try {
    const current = await getOrdersFromDb();
    const updated = current.filter(o => o.id !== id);
    localStorage.setItem('crc_orders', JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
}

// CRC PROFILE SETTINGS
export async function getCrcProfileFromDb(): Promise<CrcProfile> {
  try {
    const docRef = doc(db, 'settings', 'crc_office');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_CRC_PROFILE, ...docSnap.data() } as CrcProfile;
    }
  } catch (err) {
    console.warn('Error getting CRC profile:', err);
  }

  try {
    const local = localStorage.getItem('crc_profile');
    if (local) {
      return { ...DEFAULT_CRC_PROFILE, ...JSON.parse(local) };
    }
  } catch (e) {
    console.error(e);
  }

  return DEFAULT_CRC_PROFILE;
}

export async function saveCrcProfileToDb(profile: CrcProfile): Promise<void> {
  try {
    const docRef = doc(db, 'settings', 'crc_office');
    await setDoc(docRef, profile);
  } catch (err) {
    console.warn('Firestore saveProfile error:', err);
  }

  try {
    localStorage.setItem('crc_profile', JSON.stringify(profile));
  } catch (e) {
    console.error(e);
  }
}

// SCHOOLS
export async function getSchoolsFromDb(): Promise<ClusterSchool[]> {
  const schoolsMap = new Map<string, ClusterSchool>();

  try {
    const snapshot = await getDocs(collection(db, 'schools'));
    snapshot.docs.forEach(d => {
      schoolsMap.set(d.id, { id: d.id, ...d.data() } as ClusterSchool);
    });
  } catch (err) {
    console.warn('Error getting schools from Firestore:', err);
  }

  try {
    const local = localStorage.getItem('crc_schools');
    if (local) {
      const parsed: ClusterSchool[] = JSON.parse(local);
      parsed.forEach(s => {
        if (!schoolsMap.has(s.id)) {
          schoolsMap.set(s.id, s);
        }
      });
    }
  } catch (e) {
    console.error(e);
  }

  const result = Array.from(schoolsMap.values());
  result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'hi'));
  return result;
}

export async function addSchoolToDb(school: Omit<ClusterSchool, 'id'>): Promise<string> {
  let docId = `school_${Date.now()}`;
  try {
    const docRef = await addDoc(collection(db, 'schools'), school);
    docId = docRef.id;
  } catch (err) {
    console.warn('Firestore addSchool error:', err);
  }

  try {
    const current = await getSchoolsFromDb();
    const updated = [...current.filter(s => s.id !== docId), { ...school, id: docId }];
    localStorage.setItem('crc_schools', JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }

  return docId;
}

export async function deleteSchoolFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'schools', id));
  } catch (err) {
    console.warn('Firestore deleteSchool error:', err);
  }

  try {
    const current = await getSchoolsFromDb();
    const updated = current.filter(s => s.id !== id);
    localStorage.setItem('crc_schools', JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
}
