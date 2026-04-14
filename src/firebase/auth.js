import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { getRole } from './firestore';

// Кэш ролей в памяти
const rolesCache = new Map();

// Роли пользователей (для обратной совместимости)
export const ROLES = {
  ADMIN: 'admin',
  OWNER_ASSISTANT: 'owner_assistant',
  MANAGER: 'manager',
  OPERATOR: 'operator',
};

// Права доступа по ролям (встроенные роли для обратной совместимости)
export const PERMISSIONS = {
  [ROLES.ADMIN]: {
    canManageUsers: true,
    canManageRoles: true,
    canViewFinance: true,
    canEditOrders: true,
    canEditClients: true,
    canEditWarehouse: true,
    canEditPrinters: true,
    canEditGoals: true,
    canEditSettings: true,
    sections: {
      dashboard: true,
      orders: true,
      warehouse: true,
      finance: true,
      printers: true,
      clients: true,
      goals: true,
      stone: true,
      more: true,
      reminders: true,
    }
  },
  [ROLES.OWNER_ASSISTANT]: {
    canManageUsers: false,
    canManageRoles: false,
    canViewFinance: true,
    canEditOrders: true,
    canEditClients: true,
    canEditWarehouse: true,
    canEditPrinters: true,
    canEditGoals: true,
    canEditSettings: true,
    sections: {
      dashboard: true,
      orders: true,
      warehouse: true,
      finance: true,
      printers: true,
      clients: true,
      goals: true,
      stone: true,
      more: true,
      reminders: true,
    }
  },
  [ROLES.MANAGER]: {
    canManageUsers: false,
    canManageRoles: false,
    canViewFinance: false,
    canEditOrders: true,
    canEditClients: true,
    canEditWarehouse: true,
    canEditPrinters: false,
    canEditGoals: false,
    canEditSettings: false,
    sections: {
      dashboard: true,
      orders: true,
      warehouse: true,
      finance: false,
      printers: false,
      clients: true,
      goals: false,
      stone: true,
      more: true,
      reminders: true,
    }
  },
  [ROLES.OPERATOR]: {
    canManageUsers: false,
    canManageRoles: false,
    canViewFinance: false,
    canEditOrders: true,
    canEditClients: false,
    canEditWarehouse: false,
    canEditPrinters: true,
    canEditGoals: false,
    canEditSettings: false,
    sections: {
      dashboard: true,
      orders: true,
      warehouse: false,
      finance: false,
      printers: true,
      clients: false,
      goals: false,
      stone: true,
      more: true,
      reminders: true,
    }
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

// Получить права роли (из кэша или Firestore)
export async function getRolePermissions(roleId) {
  // Проверяем кэш
  if (rolesCache.has(roleId)) {
    return rolesCache.get(roleId);
  }

  // Проверяем встроенные роли
  if (PERMISSIONS[roleId]) {
    rolesCache.set(roleId, PERMISSIONS[roleId]);
    return PERMISSIONS[roleId];
  }

  // Загружаем из Firestore
  try {
    const result = await getRole(roleId);
    if (result.success && result.role) {
      const permissions = result.role.permissions || {};
      rolesCache.set(roleId, permissions);
      return permissions;
    }
  } catch (error) {
    console.error('Error loading role permissions:', error);
  }

  // Возвращаем пустые права по умолчанию
  return {
    canManageUsers: false,
    canManageRoles: false,
    canViewFinance: false,
    canEditOrders: false,
    canEditClients: false,
    canEditWarehouse: false,
    canEditPrinters: false,
    canEditGoals: false,
    canEditSettings: false,
    sections: {
      dashboard: true,
      orders: false,
      warehouse: false,
      finance: false,
      printers: false,
      clients: false,
      goals: false,
      stone: false,
      more: true,
      reminders: false,
    }
  };
}

// Очистить кэш ролей (вызывать при изменении ролей)
export function clearRolesCache() {
  rolesCache.clear();
}

// Проверка прав доступа (обновлено для поддержки кастомных ролей)
export async function hasPermission(roleId, permission) {
  const permissions = await getRolePermissions(roleId);
  return permissions[permission] || false;
}

// Синхронная проверка прав (использует кэш)
export function hasPermissionSync(roleId, permission) {
  const permissions = rolesCache.get(roleId) || PERMISSIONS[roleId];
  return permissions?.[permission] || false;
}

// Проверка доступа к разделу
export async function hasSectionAccess(roleId, sectionId) {
  const permissions = await getRolePermissions(roleId);
  return permissions.sections?.[sectionId] !== false;
}

// Синхронная проверка доступа к разделу
export function hasSectionAccessSync(roleId, sectionId) {
  const permissions = rolesCache.get(roleId) || PERMISSIONS[roleId];
  return permissions?.sections?.[sectionId] !== false;
}

// Создание пользователя (только для админа)
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
