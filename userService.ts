import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

export const createUser = async (email: string, role: 'visitor' | 'caregiver', displayName: string) => {
  const path = 'users';
  try {
    const userRef = doc(db, path, email);
    await setDoc(userRef, {
      email,
      role,
      displayName,
      createdAt: new Date()
    });
    return email;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const getUsers = async (role: 'visitor' | 'caregiver') => {
  const path = 'users';
  try {
    const q = query(collection(db, path), where('role', '==', role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const createStudent = async (name: string, grade: string, parentEmail?: string, libraryId?: string) => {
  const path = 'students';
  try {
    const studentRef = await addDoc(collection(db, path), {
      name,
      grade,
      parentEmail: parentEmail || null,
      libraryId: libraryId || null,
      createdAt: new Date()
    });
    return studentRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};
