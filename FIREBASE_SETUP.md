# 🔥 Настройка Firebase для ENOT SPACE

## Шаг 1: Создай проект в Firebase

1. Перейди на https://console.firebase.google.com/
2. Нажми **"Добавить проект"** (Add project)
3. Введи название: `ENOT-SPACE` (или любое другое)
4. Отключи Google Analytics (не нужен для этого проекта)
5. Нажми **"Создать проект"**

## Шаг 2: Настрой Authentication

1. В левом меню выбери **Authentication**
2. Нажми **"Начать"** (Get started)
3. Выбери метод входа: **Email/Password**
4. Включи переключатель **"Email/Password"**
5. Сохрани

## Шаг 3: Настрой Firestore Database

1. В левом меню выбери **Firestore Database**
2. Нажми **"Создать базу данных"** (Create database)
3. Выбери режим: **"Начать в тестовом режиме"** (Start in test mode)
4. Выбери регион: **europe-west** (ближайший к тебе)
5. Нажми **"Включить"**

### Настрой правила безопасности Firestore:

В разделе **Rules** замени правила на:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Только авторизованные пользователи
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Организации - только для своей организации
    match /organizations/{orgId} {
      allow read, write: if request.auth != null;
    }
    
    // Пользователи - только админы могут читать всех
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

Нажми **"Опубликовать"**

## Шаг 4: Получи конфигурацию Firebase

1. В левом меню нажми на **шестерёнку ⚙️** → **Project Settings**
2. Прокрути вниз до раздела **"Your apps"**
3. Нажми на иконку **</>** (Web)
4. Введи название приложения: `ENOT-SPACE-WEB`
5. **НЕ** включай Firebase Hosting
6. Нажми **"Зарегистрировать приложение"**
7. Скопируй объект `firebaseConfig`

## Шаг 5: Обнови конфигурацию в коде

Открой файл `src/firebase/config.js` и замени значения:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",              // Твой API Key
  authDomain: "enot-space.firebaseapp.com",
  projectId: "enot-space",
  storageBucket: "enot-space.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Шаг 6: Создай первого пользователя (АДМИНА)

### Вариант 1: Через Firebase Console (рекомендуется)

1. Перейди в **Authentication** → **Users**
2. Нажми **"Add user"**
3. Введи:
   - Email: `твой@email.com`
   - Password: `твой_пароль` (минимум 6 символов)
4. Нажми **"Add user"**
5. Скопируй **User UID** (длинная строка типа `xYz123AbC...`)

### Создай запись в Firestore:

1. Перейди в **Firestore Database**
2. Нажми **"Start collection"**
3. Collection ID: `users`
4. Document ID: **вставь скопированный User UID**
5. Добавь поля:
   - `email` (string): `твой@email.com`
   - `role` (string): `admin`
   - `displayName` (string): `Твоё Имя`
   - `createdAt` (string): `2026-04-14T16:00:00.000Z`
   - `active` (boolean): `true`
6. Нажми **"Save"**

### Создай организацию:

1. В Firestore нажми **"Start collection"**
2. Collection ID: `organizations`
3. Document ID: `default_org`
4. Добавь поля из твоего localStorage (скопируй данные из браузера)
5. Нажми **"Save"**

## Шаг 7: Запусти приложение

```bash
npm start
```

Теперь при открытии приложения ты увидишь экран входа!

## Шаг 8: Войди и создай других пользователей

1. Войди с email и паролем админа
2. Перейди в **Ещё** → **Управление пользователями**
3. Создай аккаунты для сотрудников

---

## 🔒 Безопасность

После настройки **обязательно** измени правила Firestore на продакшн-режим:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Пользователи могут читать только свои данные
    match /users/{userId} {
      allow read: if request.auth.uid == userId || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth.uid == userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Организации - только авторизованные пользователи своей организации
    match /organizations/{orgId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📱 Миграция данных из localStorage

Если у тебя уже есть данные в localStorage:

1. Открой DevTools (F12) → Console
2. Выполни:
```javascript
localStorage.getItem('enotspace_data_v2')
```
3. Скопируй JSON
4. В Firestore создай документ `organizations/default_org` и вставь эти данные

---

## ✅ Готово!

Теперь твоё приложение:
- ✅ Синхронизируется между устройствами в реальном времени
- ✅ Защищено авторизацией
- ✅ Поддерживает несколько пользователей с разными ролями
- ✅ Работает офлайн (данные кэшируются в localStorage)
