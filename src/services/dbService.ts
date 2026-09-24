import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Teacher, OfficeOrder, CrcProfile, ClusterSchool, CustomTableData } from '../types';

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

/**
 * Deeply cleans any undefined values before sending to Firestore
 * Firestore rejects documents containing `undefined` values with an exception.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) {
    return '' as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

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
  const newTeacherData = sanitizeForFirestore({
    ...teacher,
    createdAt: new Date().toISOString()
  });
  
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
  const sanitized = sanitizeForFirestore(data);
  try {
    const docRef = doc(db, 'teachers', id);
    await updateDoc(docRef, sanitized);
  } catch (err) {
    console.warn('Firestore updateTeacher error:', err);
  }

  try {
    const current = await getTeachersFromDb();
    const updated = current.map(t => (t.id === id ? { ...t, ...sanitized } : t));
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
          tableMode: data.tableMode || (data.customTable ? 'custom' : (data.selectedTeachers && data.selectedTeachers.length > 0 ? 'teachers' : 'none')),
          selectedTeachers: data.selectedTeachers || data.teachers || [],
          customTable: data.customTable || undefined,
          meetingDate: data.meetingDate || data.scheduleDate || '',
          meetingTime: data.meetingTime || data.scheduleTime || '',
          meetingVenue: data.meetingVenue || data.venue || '',
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

  // Also check localStorage fallback
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
  const sanitizedOrder = sanitizeForFirestore({
    orderNumber: order.orderNumber || 'क्र./CRC/2026/01',
    orderDate: order.orderDate || new Date().toISOString().split('T')[0],
    subject: order.subject || '',
    reference: order.reference || '',
    content: order.content || '',
    orderType: order.orderType || 'meeting',
    tableMode: order.tableMode || 'teachers',
    selectedTeachers: order.selectedTeachers || [],
    customTable: order.customTable || null,
    meetingDate: order.meetingDate || '',
    meetingTime: order.meetingTime || '',
    meetingVenue: order.meetingVenue || '',
    signatoryName: order.signatoryName || '',
    signatoryDesignation: order.signatoryDesignation || '',
    copyTo: order.copyTo || [],
    createdAt: new Date().toISOString()
  });

  let docId = `order_${Date.now()}`;
  try {
    const docRef = await addDoc(collection(db, 'orders'), sanitizedOrder);
    docId = docRef.id;
  } catch (err) {
    console.error('Firestore saveOrder error:', err);
  }

  // Always backup to localStorage as well
  try {
    const local = localStorage.getItem('crc_orders');
    let current: OfficeOrder[] = local ? JSON.parse(local) : [];
    if (!Array.isArray(current)) current = [];
    const updated = [{ ...sanitizedOrder, id: docId } as OfficeOrder, ...current.filter(o => o.id !== docId)];
    localStorage.setItem('crc_orders', JSON.stringify(updated));
  } catch (e) {
    console.error('LocalStorage save error:', e);
  }

  return docId;
}

export async function updateOrderInDb(id: string, order: Partial<OfficeOrder>): Promise<void> {
  const sanitizedOrder = sanitizeForFirestore({
    ...order,
    updatedAt: new Date().toISOString()
  });

  try {
    const docRef = doc(db, 'orders', id);
    await setDoc(docRef, sanitizedOrder, { merge: true });
  } catch (err) {
    console.error('Firestore updateOrder error:', err);
  }

  try {
    const local = localStorage.getItem('crc_orders');
    let current: OfficeOrder[] = local ? JSON.parse(local) : [];
    if (!Array.isArray(current)) current = [];
    const updated = current.map(o => (o.id === id ? { ...o, ...sanitizedOrder, id } : o));
    localStorage.setItem('crc_orders', JSON.stringify(updated));
  } catch (e) {
    console.error('LocalStorage update error:', e);
  }
}

export async function deleteOrderFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'orders', id));
  } catch (err) {
    console.error('Firestore deleteOrder error:', err);
  }

  try {
    const local = localStorage.getItem('crc_orders');
    if (local) {
      const current: OfficeOrder[] = JSON.parse(local);
      if (Array.isArray(current)) {
        const updated = current.filter(o => o.id !== id);
        localStorage.setItem('crc_orders', JSON.stringify(updated));
      }
    }
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
  const sanitized = sanitizeForFirestore(profile);
  try {
    const docRef = doc(db, 'settings', 'crc_office');
    await setDoc(docRef, sanitized);
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
  const sanitized = sanitizeForFirestore(school);
  let docId = `school_${Date.now()}`;
  try {
    const docRef = await addDoc(collection(db, 'schools'), sanitized);
    docId = docRef.id;
  } catch (err) {
    console.warn('Firestore addSchool error:', err);
  }

  try {
    const current = await getSchoolsFromDb();
    const updated = [...current.filter(s => s.id !== docId), { ...sanitized, id: docId }];
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
