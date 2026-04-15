// Telegram Bot Integration
const BOT_TOKEN = '8689988615:AAGHDWoclWrwyr_kB6xCpTUj6IEXrSau7Ko';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const BOT_USERNAME = 'enotspacebot';

// Отправка сообщения в Telegram
export async function sendTelegramMessage(chatId, message, options = {}) {
  if (!chatId) {
    console.warn('Telegram chatId не настроен');
    return { success: false, error: 'No chatId' };
  }

  try {
    const response = await fetch(`${API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        ...options,
      }),
    });

    const data = await response.json();

    if (data.ok) {
      return { success: true, data };
    } else {
      console.error('Telegram API error:', data);
      return { success: false, error: data.description };
    }
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return { success: false, error: error.message };
  }
}

// Форматирование напоминания для Telegram
export function formatReminderMessage(reminder) {
  const date = new Date(reminder.dueDate);
  const dateStr = date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  let message = `🔔 <b>Напоминание</b>\n\n`;
  message += `📋 <b>${reminder.title}</b>\n`;

  if (reminder.description) {
    message += `\n${reminder.description}\n`;
  }

  message += `\n⏰ ${dateStr}`;

  if (reminder.priority === 'high') {
    message += `\n\n🔴 <b>СРОЧНО!</b>`;
  }

  return message;
}

// Создание inline кнопок для напоминания
export function createReminderButtons(reminderId) {
  return {
    inline_keyboard: [
      [
        { text: '✅ Выполнено', callback_data: `done_${reminderId}` },
        { text: '⏰ +1 час', callback_data: `snooze1h_${reminderId}` },
      ],
      [
        { text: '📅 +1 день', callback_data: `snooze1d_${reminderId}` },
        { text: '🗑 Удалить', callback_data: `delete_${reminderId}` },
      ],
    ],
  };
}

// Проверка и отправка уведомлений
export async function checkAndSendNotifications(reminders, chatId, store) {
  if (!chatId) return [];

  const now = new Date();
  const results = [];
  const sentKey = 'telegram_notifications_sent';
  const sent = JSON.parse(localStorage.getItem(sentKey) || '{}');

  for (const reminder of reminders) {
    if (reminder.done || !reminder.telegramNotify) continue;

    // Проверяем, не отправляли ли уже это уведомление
    const sentTime = sent[reminder.id];
    if (sentTime) {
      // Если отправляли меньше часа назад - пропускаем
      if (Date.now() - sentTime < 60 * 60 * 1000) {
        continue;
      }
    }

    const dueDate = new Date(reminder.dueDate);
    let shouldNotify = false;
    let notifyTime = dueDate;

    // Рассчитываем время уведомления с учётом notifyBefore
    if (reminder.notifyBefore) {
      const offset = parseNotifyBefore(reminder.notifyBefore);
      notifyTime = new Date(dueDate.getTime() - offset);
    }

    // Проверяем, пора ли отправлять уведомление
    const timeDiff = notifyTime - now;

    // Отправляем если время подошло (в пределах 5 минут до или после)
    if (timeDiff > -5 * 60 * 1000 && timeDiff < 5 * 60 * 1000) {
      shouldNotify = true;
    }

    if (shouldNotify) {
      const message = formatReminderMessage(reminder);
      const buttons = createReminderButtons(reminder.id);

      const result = await sendTelegramMessage(chatId, message, {
        reply_markup: buttons,
      });

      if (result.success) {
        // Отмечаем как отправленное с текущим временем
        sent[reminder.id] = Date.now();
        localStorage.setItem(sentKey, JSON.stringify(sent));

        results.push({ reminderId: reminder.id, success: true });

        // Если есть повторение, создаём следующее напоминание
        if (reminder.repeatInterval && store) {
          createNextReminder(reminder, store);
        }
      }
    }
  }

  // Очищаем старые записи (старше 7 дней)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  Object.keys(sent).forEach(key => {
    if (sent[key] < weekAgo) delete sent[key];
  });
  localStorage.setItem(sentKey, JSON.stringify(sent));

  return results;
}

// Создание следующего напоминания при повторении
function createNextReminder(reminder, store) {
  const currentDate = new Date(reminder.dueDate);
  let nextDate;

  switch (reminder.repeatInterval) {
    case 'daily':
      nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      nextDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      nextDate = new Date(currentDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    default:
      return;
  }

  const newReminder = {
    ...reminder,
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    dueDate: nextDate.toISOString(),
    done: false,
    createdAt: new Date().toISOString(),
  };

  store.addItem('reminders', newReminder);
}

// Парсинг notifyBefore в миллисекунды
function parseNotifyBefore(notifyBefore) {
  const map = {
    '1h': 60 * 60 * 1000,
    '3h': 3 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
  };
  return map[notifyBefore] || 0;
}

// Получить информацию о боте
export async function getBotInfo() {
  try {
    const response = await fetch(`${API_URL}/getMe`);
    const data = await response.json();
    if (data.ok) {
      return { success: true, bot: data.result };
    }
    return { success: false, error: data.description };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Получить ссылку для подключения бота
export async function getTelegramBotLink() {
  return `https://t.me/${BOT_USERNAME}`;
}
