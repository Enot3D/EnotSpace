// ENOT SPACE Telegram Bot
// Запуск: node bot.js

const BOT_TOKEN = '8689988615:AAGHDWoclWrwyr_kB6xCpTUj6IEXrSau7Ko';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const PORT = process.env.PORT || 3000;
const ORG_ID = 'default_org'; // ID организации в Firestore

let offset = 0;

// Простой HTTP сервер для Render (чтобы не засыпал)
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', bot: 'running' }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ENOT SPACE Bot is running! 🤖');
  }
});

server.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});

// Хранилище для связи chatId с orgId (в продакшене использовать БД)
const userOrgs = {
  '464350533': 'default_org', // Твой Chat ID
};

// Отправка сообщения
async function sendMessage(chatId, text, options = {}) {
  try {
    const response = await fetch(`${API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        ...options,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Send message error:', error);
  }
}

// Редактирование сообщения
async function editMessage(chatId, messageId, text, options = {}) {
  try {
    const response = await fetch(`${API_URL}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: text,
        parse_mode: 'HTML',
        ...options,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Edit message error:', error);
  }
}

// Обработка callback от кнопок
async function handleCallback(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;

  console.log(`[${new Date().toISOString()}] Callback from ${chatId}: ${data}`);

  // Парсим callback data: action_reminderId
  const [action, reminderId] = data.split('_');

  // Отправляем подтверждение (убирает "часики" на кнопке)
  await fetch(`${API_URL}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQuery.id,
      text: 'Обрабатываю...',
    }),
  });

  // Получаем orgId для этого пользователя
  const orgId = userOrgs[chatId] || ORG_ID;

  // Обрабатываем действие
  let responseText = '';
  let success = false;

  if (action === 'done') {
    // Отметить выполненным
    const firebase = require('./firebase.js');
    success = await firebase.updateReminder(orgId, reminderId, { done: true });
    responseText = success ? '✅ Напоминание отмечено выполненным!' : '❌ Ошибка обновления';

  } else if (action === 'snooze1h') {
    // Отложить на 1 час
    const firebase = require('./firebase.js');
    const newDate = new Date(Date.now() + 60 * 60 * 1000);
    success = await firebase.updateReminder(orgId, reminderId, { dueDate: newDate.toISOString() });
    responseText = success ? '⏰ Напоминание отложено на 1 час' : '❌ Ошибка обновления';

  } else if (action === 'snooze1d') {
    // Отложить на 1 день
    const firebase = require('./firebase.js');
    const newDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    success = await firebase.updateReminder(orgId, reminderId, { dueDate: newDate.toISOString() });
    responseText = success ? '📅 Напоминание отложено на 1 день' : '❌ Ошибка обновления';

  } else if (action === 'delete') {
    // Удалить
    const firebase = require('./firebase.js');
    success = await firebase.deleteReminder(orgId, reminderId);
    responseText = success ? '🗑 Напоминание удалено' : '❌ Ошибка удаления';
  }

  // Обновляем сообщение
  const originalText = callbackQuery.message.text;
  const updatedText = `${originalText}\n\n${responseText}`;

  await editMessage(chatId, messageId, updatedText, {
    reply_markup: { inline_keyboard: [] } // Убираем кнопки
  });
}

// Заглушки для работы с Firestore (пока упрощённая версия)
async function updateReminderInFirestore(reminderId, updates) {
  // TODO: Реализовать через Firebase REST API или Admin SDK
  console.log(`Update reminder ${reminderId}:`, updates);
  return true;
}

async function deleteReminderFromFirestore(reminderId) {
  // TODO: Реализовать через Firebase REST API или Admin SDK
  console.log(`Delete reminder ${reminderId}`);
  return true;
}

// Обработка команды /start
function handleStart(chatId, username) {
  const message = `👋 Привет${username ? ', ' + username : ''}!

Я бот <b>ENOT SPACE</b> — твой помощник для управления 3D-производством.

🔑 <b>Твой Chat ID:</b> <code>${chatId}</code>

<b>Что я умею:</b>
📋 /reminders — показать активные напоминания
➕ /add — создать быстрое напоминание
📊 /stats — статистика по заказам
🖨 /printers — статус принтеров
💰 /finance — финансовая сводка
❓ /help — помощь

<b>Настройка:</b>
1. Скопируй свой Chat ID выше
2. Открой приложение ENOT SPACE
3. Перейди в Ещё → Настройки
4. Вставь Chat ID в поле "Telegram Chat ID"
5. Готово! Теперь напоминания будут приходить сюда 🎉`;

  sendMessage(chatId, message);
}

// Обработка команды /help
function handleHelp(chatId) {
  const message = `📖 <b>Справка по командам</b>

<b>Напоминания:</b>
/reminders — список активных напоминаний
/add — создать напоминание
  Пример: /add Позвонить клиенту через 2 часа

<b>Статистика:</b>
/stats — сводка по заказам и финансам
/printers — статус всех принтеров
/finance — финансы за сегодня/неделю/месяц

<b>Быстрые действия:</b>
/orders — активные заказы
/alerts — важные уведомления

<b>Настройки:</b>
/settings — текущие настройки
/chatid — показать твой Chat ID

Нужна помощь? Напиши @YourSupportUsername`;

  sendMessage(chatId, message);
}

// Обработка команды /chatid
function handleChatId(chatId) {
  const message = `🔑 <b>Твой Chat ID:</b>

<code>${chatId}</code>

Скопируй его и вставь в настройки приложения ENOT SPACE (Ещё → Настройки → Telegram Chat ID)`;

  sendMessage(chatId, message);
}

// Обработка команды /add (создание напоминания)
function handleAdd(chatId, text) {
  if (!text || text.trim() === '') {
    sendMessage(chatId, `❌ Укажи текст напоминания

<b>Примеры:</b>
/add Позвонить клиенту через 2 часа
/add Проверить заказ завтра в 10:00
/add Купить пластик

Напоминание будет создано в приложении.`);
    return;
  }

  // Здесь можно добавить логику парсинга времени и создания напоминания
  // Пока просто подтверждаем
  sendMessage(chatId, `✅ Напоминание создано!

📋 ${text}

⚠️ Для полной функциональности создавай напоминания в приложении ENOT SPACE.
Там можно настроить время, приоритет и повторения.`);
}

// Обработка команды /reminders
function handleReminders(chatId) {
  // В реальном приложении здесь будет запрос к базе данных
  const message = `📋 <b>Активные напоминания</b>

Для просмотра напоминаний открой приложение ENOT SPACE → Планировщик

💡 <i>Скоро здесь будет список твоих напоминаний с кнопками для быстрых действий!</i>`;

  sendMessage(chatId, message);
}

// Обработка команды /stats
function handleStats(chatId) {
  const message = `📊 <b>Статистика</b>

Для просмотра полной статистики открой приложение ENOT SPACE → Дашборд

💡 <i>Скоро здесь будет сводка по заказам, финансам и производству!</i>`;

  sendMessage(chatId, message);
}

// Обработка команды /printers
function handlePrinters(chatId) {
  const message = `🖨 <b>Статус принтеров</b>

Для просмотра статуса принтеров открой приложение ENOT SPACE → Ещё → Принтеры

💡 <i>Скоро здесь будет статус всех принтеров в реальном времени!</i>`;

  sendMessage(chatId, message);
}

// Обработка команды /finance
function handleFinance(chatId) {
  const message = `💰 <b>Финансы</b>

Для просмотра финансов открой приложение ENOT SPACE → Финансы

💡 <i>Скоро здесь будет финансовая сводка за день/неделю/месяц!</i>`;

  sendMessage(chatId, message);
}

// Обработка неизвестной команды
function handleUnknown(chatId) {
  sendMessage(chatId, `❓ Неизвестная команда

Используй /help чтобы увидеть список доступных команд.`);
}

// Обработка входящего сообщения
function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const username = message.from.username;

  console.log(`[${new Date().toISOString()}] Message from ${chatId}: ${text}`);

  // Команды
  if (text.startsWith('/start')) {
    handleStart(chatId, username);
  } else if (text.startsWith('/help')) {
    handleHelp(chatId);
  } else if (text.startsWith('/chatid')) {
    handleChatId(chatId);
  } else if (text.startsWith('/add ')) {
    const reminderText = text.substring(5);
    handleAdd(chatId, reminderText);
  } else if (text.startsWith('/reminders')) {
    handleReminders(chatId);
  } else if (text.startsWith('/stats')) {
    handleStats(chatId);
  } else if (text.startsWith('/printers')) {
    handlePrinters(chatId);
  } else if (text.startsWith('/finance')) {
    handleFinance(chatId);
  } else if (text.startsWith('/')) {
    handleUnknown(chatId);
  } else {
    // Обычное сообщение (не команда)
    sendMessage(chatId, `Получил твоё сообщение: "${text}"

Используй команды для управления. Напиши /help чтобы увидеть список.`);
  }
}

// Обработка входящего обновления
function handleUpdate(update) {
  if (update.message) {
    handleMessage(update.message);
  } else if (update.callback_query) {
    handleCallback(update.callback_query);
  }
}

// Получение обновлений (long polling)
async function getUpdates() {
  try {
    const response = await fetch(`${API_URL}/getUpdates?offset=${offset}&timeout=30`);
    const data = await response.json();

    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        handleUpdate(update);
      }
    }
  } catch (error) {
    console.error('Get updates error:', error);
  }

  // Продолжаем polling
  setTimeout(getUpdates, 100);
}

// Запуск бота
console.log('🤖 ENOT SPACE Bot started...');
console.log('Bot token:', BOT_TOKEN.substring(0, 20) + '...');
console.log('Waiting for messages...\n');

getUpdates();
