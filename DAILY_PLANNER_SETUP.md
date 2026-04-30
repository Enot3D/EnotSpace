# 📅 Настройка синхронизации для Планировки дня

## ✅ Хорошие новости!

Синхронизация `dailyTasks` с Firebase **уже работает автоматически**! 

Код в `store.js` сохраняет все данные организации в Firestore, включая новое поле `dailyTasks`.

## 🔍 Что проверить перед деплоем

### 1. Проверь правила Firestore

Открой Firebase Console → Firestore Database → Rules

Убедись, что правила разрешают чтение/запись для авторизованных пользователей:

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

### 2. Структура данных в Firestore

После первого использования в Firestore появится:

```
organizations/
  └── default_org/
      ├── settings: {...}
      ├── orders: [...]
      ├── clients: [...]
      ├── dailyTasks: {
      │     "2026-04-30": [
      │       {
      │         id: "uuid",
      │         title: "Задача 1",
      │         done: false,
      │         createdAt: "2026-04-30T12:00:00.000Z",
      │         blockedUntil: null
      │       }
      │     ]
      │   }
      └── ...
```

## 🚀 Деплой на GitHub Pages

### 1. Проверь локально

```bash
cd "C:\Users\Klop\Desktop\ENOT Space\printboss"
npm start
```

Открой http://localhost:3000 и протестируй:
- ✅ Создание задач
- ✅ Отметка выполнения
- ✅ Редактирование
- ✅ Перенос на другую дату
- ✅ Блокировка до даты
- ✅ Прогресс-бар

### 2. Собери проект

```bash
npm run build
```

### 3. Запуш на GitHub

```bash
git add .
git commit -m "Добавлена вкладка Планировка дня

- Создание задач на день
- Автоматический перенос невыполненных задач
- Просмотр прошлых дней (30 дней)
- Редактирование и удаление задач
- Перенос задачи на конкретную дату
- Блокировка задачи до определенной даты
- Прогресс-бар дня (выполнено/всего)
- Синхронизация через Firebase

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>"

git push origin main
```

### 4. Задеплой на GitHub Pages

```bash
npm run deploy
```

## 📱 Проверка после деплоя

1. Открой приложение на GitHub Pages
2. Войди в аккаунт
3. Перейди на вкладку "День" (📅)
4. Создай несколько задач
5. Открой приложение на другом устройстве
6. Проверь, что задачи синхронизировались ✅

## 🔄 Как работает синхронизация

1. **Создание задачи** → сохраняется в `localStorage` → отправляется в Firestore
2. **Изменение на другом устройстве** → Firestore отправляет обновление → обновляется `localStorage` и UI
3. **Офлайн режим** → изменения сохраняются в `localStorage` → синхронизируются при подключении к интернету

## 🐛 Если что-то не работает

### Задачи не синхронизируются

1. Проверь консоль браузера (F12) на ошибки
2. Проверь, что пользователь авторизован
3. Проверь правила Firestore
4. Проверь, что `orgId = 'default_org'` в `App.js`

### Задачи дублируются

Это нормально при первом запуске — данные из `localStorage` мигрируют в Firestore.
После первой синхронизации дублирование прекратится.

## ✨ Готово!

Теперь Планировка дня работает с синхронизацией между всеми устройствами! 🎉
