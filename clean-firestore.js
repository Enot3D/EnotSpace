// Скрипт для очистки пустых элементов в Firestore
// Запусти один раз в консоли браузера (F12)

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase/config';

async function cleanFirestoreData() {
  console.log('🧹 Начинаю очистку данных...');

  try {
    // Получаем данные
    const docRef = doc(db, 'organizations', 'default_org');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('❌ Документ не найден');
      return;
    }

    const data = docSnap.data();
    console.log('📦 Данные получены');

    // Очищаем массивы от пустых элементов
    const arrayKeys = ['orders', 'clients', 'printers', 'materials', 'products', 'purchases', 'goals', 'notes', 'transactions', 'printSchedule', 'reminders'];

    let cleaned = false;
    arrayKeys.forEach(key => {
      if (Array.isArray(data[key])) {
        const before = data[key].length;
        data[key] = data[key].filter(item =>
          item && typeof item === 'object' && Object.keys(item).length > 0 && item.id
        );
        const after = data[key].length;
        if (before !== after) {
          console.log(`✅ ${key}: удалено ${before - after} пустых элементов`);
          cleaned = true;
        }
      }
    });

    if (cleaned) {
      // Сохраняем очищенные данные
      await setDoc(docRef, data);
      console.log('✅ Данные очищены и сохранены!');
      console.log('🔄 Перезагрузи страницу (F5)');
    } else {
      console.log('✅ Пустых элементов не найдено');
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

// Запускаем очистку
cleanFirestoreData();
