import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

// Роли пользователей
export const ROLES = {
  ADMIN: 'admin',
  OWNER_ASSISTANT: 'owner_assistant',
  MANAGER: 'manager',
  OPERATOR: 'operator',
};

// Права доступа по ролям
export const PERMISSIONS = {
  [ROLES.ADMIN]: {
    canManageUsers: true,
    canViewFinance: true,
    canEditOrders: true,
    canEditClients: true,
    canEditWarehouse: true,
    canEditPrinters: true,
    canEditGoals: true,
    canEditSettings: true,
  },
  [ROLES.OWNER_ASSISTANT]: {
    canManageUsers: false,
    canViewFinance: true,
    canEditOrders: true,
    canEditClients: true,
    canEditWarehouse: true,
    canEditPrinters: true,
    canEditGoals: true,
    canEditSettings: true,
  },
  [ROLES.MANAGER]: {
    canManageUsers: false,
    canViewFinance: false,
    canEditOrders: true,
    canEditClients: true,
    canEditWarehouse: true,
    canEditPrinters: false,
    canEditGoals: false,
    canEditSettings: false,
  },
  [ROLES.OPERATOR]: {
    canManageUsers: false,
    canViewFinance: false,
    canEditOrders: true,
    canEditClients: false,
    canEditWarehouse: false,
    canEditPrinters: true,
    canEditGoals: false,
    canEditSettings: false,
  },
};

// Создание пользователя (только для админа)
export async function createUser(email, password, role, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Сохраняем роль и данные в Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email,
      role,
      displayName: displayName || email.split('@')[0],
      createdAt: new Date().toISOString(),
      active: true,
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Вход
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Выход
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Получить данные пользователя
export async function getUserData(uid) {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Проверка прав доступа
export function hasPermission(role, permission) {
  return PERMISSIONS[role]?.[permission] || false;
}

// Слушатель изменения состояния авторизации
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
