// Диагностика Firebase
// Открой консоль браузера (F12) и вставь этот код

console.log('=== FIREBASE ДИАГНОСТИКА ===');

// 1. Проверка конфигурации
import { auth, db } from './firebase/config';
console.log('✅ Firebase инициализирован');
console.log('Auth:', auth);
console.log('Firestore:', db);

// 2. Проверка текущего пользователя
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('✅ Пользователь авторизован:', user.email);
    console.log('User UID:', user.uid);

    // 3. Проверка данных в Firestore
    import { doc, getDoc } from 'firebase/firestore';
    getDoc(doc(db, 'users', user.uid))
      .then((docSnap) => {
        if (docSnap.exists()) {
          console.log('✅ Данные пользователя найдены:', docSnap.data());
        } else {
          console.error('❌ Данные пользователя НЕ найдены в Firestore!');
          console.log('Создай документ: users/' + user.uid);
        }
      })
      .catch((error) => {
        console.error('❌ Ошибка чтения Firestore:', error);
      });
  } else {
    console.log('❌ Пользователь НЕ авторизован');
  }
});

// 4. Проверка правил Firestore
console.log('Проверь правила Firestore в консоли Firebase');
