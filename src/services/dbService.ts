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
  clusterName: 'संकुल संसाधन केंद्र (CRC) - उत्क्रमित उच्च माध्यमिक विद्यालय',
  blockName: 'सदर प्रखंड',
  districtName: 'पटना',
  stateName: 'बिहार',
  centerHead: 'डॉ. रमेश कुमार वर्मा',
  headDesignation: 'संकुल प्राचार्य / समन्वयक',
  phone: '+91 98765 43210',
  email: 'crc.bihar.edu@gov.in',
  officeAddress: 'संकुल संसाधन केंद्र, शिक्षा विभाग, बिहार',
  letterPrefix: 'क्र./सं.सं.के./2026/',
  defaultSignatory: 'डॉ. रमेश कुमार वर्मा',
  defaultDesignation: 'प्राचार्य / संकुल समन्वयक'
};

export const INITIAL_SCHOOLS: Omit<ClusterSchool, 'id'>[] = [
  { name: 'शासकीय प्राथमिक शाला, नयापारा', udiseCode: '22100401201', category: 'प्राथमिक शाला', village: 'नयापारा' },
  { name: 'शासकीय प्राथमिक शाला, पटेलपारा', udiseCode: '22100401202', category: 'प्राथमिक शाला', village: 'पटेलपारा' },
  { name: 'शासकीय पूर्व माध्यमिक शाला, रामपुर', udiseCode: '22100401203', category: 'माध्यमिक शाला', village: 'रामपुर' },
  { name: 'शासकीय कन्या पूर्व माध्यमिक शाला', udiseCode: '22100401204', category: 'कन्या माध्यमिक शाला', village: 'मुख्य ग्राम' },
  { name: 'शासकीय उच्चतर माध्यमिक विद्यालय संकुल केंद्र', udiseCode: '22100401205', category: 'उच्चतर माध्यमिक विद्यालय', village: 'संकुल मुख्यालय' },
];

export const INITIAL_TEACHERS: Omit<Teacher, 'id'>[] = [
  {
    name: 'श्री राजेश कुमार साहू',
    designation: 'सहायक शिक्षक (LB)',
    schoolName: 'शासकीय प्राथमिक शाला, नयापारा'
  },
  {
    name: 'श्रीमती सुनीता शर्मा',
    designation: 'प्रधान पाठक (प्राथमिक शाला)',
    schoolName: 'शासकीय प्राथमिक शाला, पटेलपारा'
  },
  {
    name: 'श्री अनिल कुमार देवांगन',
    designation: 'उच्च श्रेणी शिक्षक (शिक्षक LB)',
    schoolName: 'शासकीय पूर्व माध्यमिक शाला, रामपुर'
  },
  {
    name: 'सुश्री नीलम सिंह',
    designation: 'उच्च श्रेणी शिक्षक',
    schoolName: 'शासकीय कन्या पूर्व माध्यमिक शाला'
  },
  {
    name: 'श्री मनोज कुमार वर्मा',
    designation: 'व्याख्याता (एल.बी.)',
    schoolName: 'शासकीय उच्चतर माध्यमिक विद्यालय संकुल केंद्र'
  },
  {
    name: 'श्रीमती कंचन लता मिंज',
    designation: 'सहायक शिक्षक',
    schoolName: 'शासकीय प्राथमिक शाला, नयापारा'
  }
];

export async function getTeachersFromDb(): Promise<Teacher[]> {
  try {
    const q = query(collection(db, 'teachers'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      // Seed initial sample teachers if empty
      await seedInitialTeachers();
      const newSnap = await getDocs(q);
      return newSnap.docs.map(d => ({ id: d.id, ...d.data() } as Teacher));
    }
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Teacher));
  } catch (err) {
    console.error('Error getting teachers:', err);
    return [];
  }
}

export async function seedInitialTeachers(): Promise<void> {
  const batch = writeBatch(db);
  const teachersCol = collection(db, 'teachers');
  INITIAL_TEACHERS.forEach(t => {
    const docRef = doc(teachersCol);
    batch.set(docRef, {
      ...t,
      createdAt: new Date().toISOString()
    });
  });
  await batch.commit();
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
    if (snapshot.empty) {
      const batch = writeBatch(db);
      const schoolsCol = collection(db, 'schools');
      INITIAL_SCHOOLS.forEach(s => {
        const docRef = doc(schoolsCol);
        batch.set(docRef, s);
      });
      await batch.commit();
      const newSnap = await getDocs(q);
      return newSnap.docs.map(d => ({ id: d.id, ...d.data() } as ClusterSchool));
    }
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
