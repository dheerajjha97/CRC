import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Teacher, OfficeOrder, CrcProfile, ClusterSchool } from '../types';

export const DEFAULT_CRC_PROFILE: CrcProfile = {
  clusterName: 'संकुल संसाधन केंद्र (CRC)',
  blockName: '',
  districtName: '',
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

// Known demo records list for cleanup
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

export async function getTeachersFromDb(): Promise<Teacher[]> {
  try {
    const q = query(collection(db, 'teachers'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Teacher));
  } catch (err) {
    console.error('Error getting teachers:', err);
    return [];
  }
}

export async function cleanupDemoDataFromDb(): Promise<{ deletedTeachers: number; deletedSchools: number }> {
  let deletedTeachers = 0;
  let deletedSchools = 0;

  try {
    // 1. Clean demo teachers
    const teacherSnap = await getDocs(collection(db, 'teachers'));
    const batch = writeBatch(db);
    let hasTeacherBatch = false;

    teacherSnap.docs.forEach(docSnap => {
      const data = docSnap.data();
      const isDemo = DEMO_TEACHER_NAMES.some(
        name => data.name && (data.name.trim() === name || data.name.includes(name))
      );
      if (isDemo) {
        batch.delete(docSnap.ref);
        deletedTeachers++;
        hasTeacherBatch = true;
      }
    });

    if (hasTeacherBatch) {
      await batch.commit();
    }

    // 2. Clean demo schools
    const schoolSnap = await getDocs(collection(db, 'schools'));
    const schoolBatch = writeBatch(db);
    let hasSchoolBatch = false;

    schoolSnap.docs.forEach(docSnap => {
      const data = docSnap.data();
      const isDemoName = DEMO_SCHOOL_NAMES.some(
        name => data.name && (data.name.trim() === name || data.name.includes(name))
      );
      const isDemoUdise = DEMO_UDISE_CODES.some(
        code => data.udiseCode && data.udiseCode.trim() === code
      );
      if (isDemoName || isDemoUdise) {
        schoolBatch.delete(docSnap.ref);
        deletedSchools++;
        hasSchoolBatch = true;
      }
    });

    if (hasSchoolBatch) {
      await schoolBatch.commit();
    }

    // 3. Clean dummy profile name if present
    const profileRef = doc(db, 'settings', 'crc_office');
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      const pData = profileSnap.data();
      if (pData.centerHead === 'डॉ. रमेश कुमार वर्मा' || pData.defaultSignatory === 'डॉ. रमेश कुमार वर्मा') {
        await updateDoc(profileRef, {
          centerHead: '',
          defaultSignatory: '',
          phone: pData.phone === '+91 98765 43210' ? '' : pData.phone,
          email: pData.email === 'crc.bihar.edu@gov.in' ? '' : pData.email
        });
      }
    }
  } catch (err) {
    console.error('Error cleaning demo data:', err);
  }

  return { deletedTeachers, deletedSchools };
}

export async function addTeacherToDb(teacher: Omit<Teacher, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'teachers'), {
    ...teacher,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function updateTeacherInDb(id: string, data: Partial<Teacher>): Promise<void> {
  const docRef = doc(db, 'teachers', id);
  await updateDoc(docRef, { ...data });
}

export async function deleteTeacherFromDb(id: string): Promise<void> {
  await deleteDoc(doc(db, 'teachers', id));
}

// ORDERS
export async function getOrdersFromDb(): Promise<OfficeOrder[]> {
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OfficeOrder));
  } catch (err) {
    console.error('Error getting orders:', err);
    return [];
  }
}

export async function saveOrderToDb(order: Omit<OfficeOrder, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'orders'), {
    ...order,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function updateOrderInDb(id: string, order: Partial<OfficeOrder>): Promise<void> {
  const docRef = doc(db, 'orders', id);
  await updateDoc(docRef, {
    ...order,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteOrderFromDb(id: string): Promise<void> {
  await deleteDoc(doc(db, 'orders', id));
}

// PROFILE / SETTINGS
export async function getCrcProfileFromDb(): Promise<CrcProfile> {
  try {
    const docRef = doc(db, 'settings', 'crc_office');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as CrcProfile;
    }
    // initialize default profile
    await setDoc(docRef, DEFAULT_CRC_PROFILE);
    return DEFAULT_CRC_PROFILE;
  } catch (err) {
    console.error('Error getting CRC profile:', err);
    return DEFAULT_CRC_PROFILE;
  }
}

export async function saveCrcProfileToDb(profile: CrcProfile): Promise<void> {
  const docRef = doc(db, 'settings', 'crc_office');
  await setDoc(docRef, profile);
}

// SCHOOLS
export async function getSchoolsFromDb(): Promise<ClusterSchool[]> {
  try {
    const q = query(collection(db, 'schools'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClusterSchool));
  } catch (err) {
    console.error('Error getting schools:', err);
    return [];
  }
}

export async function addSchoolToDb(school: Omit<ClusterSchool, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'schools'), school);
  return docRef.id;
}

export async function deleteSchoolFromDb(id: string): Promise<void> {
  await deleteDoc(doc(db, 'schools', id));
}
