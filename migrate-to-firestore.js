// Миграция данных из localStorage в Firestore
// Открой консоль браузера (F12) и вставь этот код

import { db } from './firebase/config';
import { doc, setDoc } from 'firebase/firestore';

// Получаем данные из localStorage
const localData = localStorage.getItem('enotspace_data_v2');

if (localData) {
  const data = JSON.parse(localData);

  // Сохраняем в Firestore
  setDoc(doc(db, 'organizations', 'default_org'), data)
    .then(() => {
      console.log('✅ Данные успешно мигрированы в Firestore!');
      console.log('Перезагрузи страницу (F5)');
    })
    .catch((error) => {
      console.error('❌ Ошибка миграции:', error);
    });
} else {
  console.log('⚠️ Нет данных в localStorage для миграции');
  console.log('Создаю пустую организацию...');

  const defaultData = {
    settings: {
      businessName: 'ENOT SPACE',
      currency: '₽',
      electricityRate: 6.5,
      defaultMargin: 40,
      monthlyGoal: 100000,
      weeklyGoal: 25000,
      laborRatePerHour: 0,
      reservePercent: 10,
    },
    orders: [],
    clients: [],
    printers: [],
    materials: [],
    products: [],
    purchases: [],
    goals: [],
    notes: [],
    transactions: [],
    printSchedule: [],
    reminders: [],
    subtasks: {},
  };

  setDoc(doc(db, 'organizations', 'default_org'), defaultData)
    .then(() => {
      console.log('✅ Пустая организация создана!');
      console.log('Перезагрузи страницу (F5)');
    })
    .catch((error) => {
      console.error('❌ Ошибка создания:', error);
    });
}
