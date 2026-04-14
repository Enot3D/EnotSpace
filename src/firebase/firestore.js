import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config';

// Получить данные организации
export async function getOrgData(orgId) {
  try {
    const docSnap = await getDoc(doc(db, 'organizations', orgId));
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: false, error: 'Organization not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Сохранить данные организации
export async function saveOrgData(orgId, data) {
  try {
    await setDoc(doc(db, 'organizations', orgId), data, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Подписка на изменения данных организации (реалтайм)
export function subscribeToOrgData(orgId, callback) {
  const docRef = doc(db, 'organizations', orgId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ success: true, data: docSnap.data() });
    } else {
      callback({ success: false, error: 'Organization not found' });
    }
  }, (error) => {
    callback({ success: false, error: error.message });
  });
}

// Получить список всех пользователей (для админа)
export async function getAllUsers() {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, users };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Обновить данные пользователя
export async function updateUser(uid, data) {
  try {
    await updateDoc(doc(db, 'users', uid), data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Деактивировать пользователя
export async function deactivateUser(uid) {
  try {
    await updateDoc(doc(db, 'users', uid), { active: false });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Миграция данных из localStorage в Firestore
export async function migrateLocalStorageToFirestore(orgId, localData) {
  try {
    await saveOrgData(orgId, {
      ...localData,
      migratedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
