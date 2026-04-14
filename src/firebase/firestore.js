import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
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

// ═══════════════════════════════════════════
// РОЛИ
// ═══════════════════════════════════════════

// Получить все роли
export async function getAllRoles() {
  try {
    const querySnapshot = await getDocs(collection(db, 'roles'));
    const roles = [];
    querySnapshot.forEach((doc) => {
      roles.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, roles };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Получить роль по ID
export async function getRole(roleId) {
  try {
    const docSnap = await getDoc(doc(db, 'roles', roleId));
    if (docSnap.exists()) {
      return { success: true, role: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Role not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Создать роль
export async function createRole(roleData) {
  try {
    const roleId = roleData.id || `role_${Date.now()}`;
    await setDoc(doc(db, 'roles', roleId), {
      ...roleData,
      createdAt: new Date().toISOString(),
    });
    return { success: true, roleId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Обновить роль
export async function updateRole(roleId, data) {
  try {
    await updateDoc(doc(db, 'roles', roleId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Удалить роль и перевести пользователей на роль по умолчанию
export async function deleteRole(roleId, defaultRoleId = 'manager') {
  try {
    // Найти всех пользователей с этой ролью
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', roleId))
    );

    // Перевести их на роль по умолчанию
    const updatePromises = [];
    usersSnapshot.forEach((userDoc) => {
      updatePromises.push(
        updateDoc(doc(db, 'users', userDoc.id), { role: defaultRoleId })
      );
    });

    await Promise.all(updatePromises);

    // Удалить роль
    await deleteDoc(doc(db, 'roles', roleId));

    return { success: true, affectedUsers: usersSnapshot.size };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Изменить роль пользователя
export async function updateUserRole(userId, roleId) {
  try {
    await updateDoc(doc(db, 'users', userId), { role: roleId });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
