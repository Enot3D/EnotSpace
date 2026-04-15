# 🚀 Запуск Telegram бота на Render.com

Бесплатный хостинг для Telegram бота ENOT SPACE.

---

## 📋 Что нужно

- Аккаунт на [GitHub](https://github.com)
- Аккаунт на [Render.com](https://render.com) (регистрация через GitHub)
- Твой репозиторий с кодом бота

---

## 🔧 Подготовка репозитория

### 1. Создай файл package.json в папке telegram-bot

```bash
cd telegram-bot
```

Создай файл `package.json`:

```json
{
  "name": "enot-space-bot",
  "version": "1.0.0",
  "description": "Telegram bot for ENOT SPACE",
  "main": "bot.js",
  "scripts": {
    "start": "node bot.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {}
}
```

### 2. Залей код на GitHub

```bash
cd ..
git add .
git commit -m "Add Telegram bot"
git push
```

---

## 🌐 Настройка на Render.com

### Шаг 1: Регистрация

1. Открой [render.com](https://render.com)
2. Нажми **"Get Started"**
3. Выбери **"Sign in with GitHub"**
4. Авторизуй Render доступ к твоим репозиториям

### Шаг 2: Создание Web Service

1. На главной странице нажми **"New +"**
2. Выбери **"Web Service"**
3. Найди свой репозиторий `printboss` (или как он называется)
4. Нажми **"Connect"**

### Шаг 3: Настройки сервиса

Заполни форму:

**Name:** `enot-space-bot` (или любое имя)

**Region:** `Frankfurt (EU Central)` (ближе к России)

**Branch:** `main` (или `master`)

**Root Directory:** `telegram-bot`

**Runtime:** `Node`

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
node bot.js
```

**Instance Type:** `Free`

### Шаг 4: Environment Variables (необязательно)

Если хочешь скрыть токен бота:

1. Нажми **"Advanced"**
2. Добавь переменную окружения:
   - **Key:** `BOT_TOKEN`
   - **Value:** `8689988615:AAGHDWoclWrwyr_kB6xCpTUj6IEXrSau7Ko`

Тогда в `bot.js` измени:
```javascript
const BOT_TOKEN = process.env.BOT_TOKEN || '8689988615:AAGHDWoclWrwyr_kB6xCpTUj6IEXrSau7Ko';
```

### Шаг 5: Deploy

1. Нажми **"Create Web Service"**
2. Render начнёт деплой (займёт 2-3 минуты)
3. Дождись статуса **"Live"** 🟢

---

## ✅ Проверка работы

### 1. Проверь логи

В панели Render:
- Перейди в **"Logs"**
- Должно быть:
  ```
  🤖 ENOT SPACE Bot started...
  Bot token: 8689988615:AAGH...
  Waiting for messages...
  ```

### 2. Проверь бота

1. Открой Telegram
2. Найди бота: [@enotspacebot](https://t.me/enotspacebot)
3. Напиши `/start`
4. Бот должен ответить приветствием и показать твой Chat ID

### 3. Проверь уведомления

1. Открой приложение ENOT SPACE
2. Перейди в **Планировщик**
3. Создай напоминание:
   - Название: "Тест"
   - Время: через 2 минуты
   - ✅ **Отправить в Telegram**
4. Сохрани
5. Через 2 минуты должно прийти уведомление в Telegram! 🎉

---

## ⚠️ Важно знать

### Бесплатный план Render.com:

✅ **Плюсы:**
- Бесплатно навсегда
- 750 часов/месяц (достаточно для 1 сервиса)
- Автоматический деплой при push в GitHub
- SSL сертификат

❌ **Минусы:**
- Засыпает через **15 минут** без активности
- Просыпается за ~30 секунд при первом запросе
- Может пропустить уведомления если бот спит

### Решение проблемы засыпания:

**Вариант 1: Ping сервис (бесплатно)**

Используй [cron-job.org](https://cron-job.org):
1. Зарегистрируйся
2. Создай задачу:
   - URL: `https://enot-space-bot.onrender.com` (твой URL от Render)
   - Интервал: каждые 10 минут
3. Бот будет всегда активен

**Вариант 2: UptimeRobot (бесплатно)**

1. Зарегистрируйся на [uptimerobot.com](https://uptimerobot.com)
2. Добавь монитор:
   - Type: HTTP(s)
   - URL: твой URL от Render
   - Interval: 5 минут
3. Готово!

**Вариант 3: Платный план Render ($7/месяц)**
- Не засыпает
- Больше ресурсов
- Приоритетная поддержка

---

## 🔄 Обновление бота

Когда меняешь код:

```bash
git add .
git commit -m "Update bot"
git push
```

Render автоматически задеплоит новую версию! 🚀

---

## 🐛 Troubleshooting

### Бот не запускается

**Проверь логи в Render:**
- Ошибка `Cannot find module` → проверь `package.json`
- Ошибка `ECONNREFUSED` → проблема с токеном бота
- Ошибка `Port already in use` → убери код с портами (не нужен для бота)

### Бот не отвечает

1. Проверь статус в Render (должен быть 🟢 Live)
2. Проверь логи — есть ли ошибки?
3. Попробуй перезапустить: **Manual Deploy → Deploy latest commit**

### Уведомления не приходят

1. Проверь Chat ID в настройках приложения
2. Проверь что чекбокс "Отправить в Telegram" включен
3. Проверь что приложение открыто (проверка каждые 5 минут)
4. Если бот спит — настрой ping (см. выше)

---

## 📊 Мониторинг

### Render Dashboard

- **Logs** — логи в реальном времени
- **Metrics** — использование CPU/RAM
- **Events** — история деплоев
- **Settings** — настройки сервиса

### Полезные команды

Проверить бота через API:
```bash
curl https://api.telegram.org/bot8689988615:AAGHDWoclWrwyr_kB6xCpTUj6IEXrSau7Ko/getMe
```

Отправить тестовое сообщение:
```bash
curl -X POST https://api.telegram.org/bot8689988615:AAGHDWoclWrwyr_kB6xCpTUj6IEXrSau7Ko/sendMessage \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"464350533","text":"Тест!"}'
```

---

## 🎯 Итого

1. ✅ Создал `package.json` в `telegram-bot/`
2. ✅ Залил на GitHub
3. ✅ Зарегистрировался на Render.com
4. ✅ Создал Web Service
5. ✅ Настроил Build/Start команды
6. ✅ Задеплоил
7. ✅ Проверил работу бота
8. ✅ Настроил ping (опционально)

**Готово!** Бот работает 24/7 бесплатно! 🎉

---

## 📞 Поддержка

Если что-то не работает:
1. Проверь логи в Render
2. Проверь статус бота: `/start` в Telegram
3. Проверь настройки в приложении

Бот работает? Создай тестовое напоминание и получи уведомление! 🔔
