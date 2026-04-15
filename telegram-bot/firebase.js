// Firebase Admin для бота (серверная часть)
// Используем Firebase REST API для работы без Admin SDK

const FIREBASE_PROJECT_ID = 'enot-space';
const FIREBASE_API_KEY = 'AIzaSyDTDN2WIQIz2yIjuYQKuJuWBYt1_sgsdsQ';

// Получить все данные организации из Firestore
async function getOrgData(orgId) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/organizations/${orgId}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Firestore fetch failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.fields) return null;

    // Парсим данные
    const orgData = {};
    Object.keys(data.fields).forEach(key => {
      const field = data.fields[key];
      if (field.stringValue) {
        try {
          orgData[key] = JSON.parse(field.stringValue);
        } catch {
          orgData[key] = field.stringValue;
        }
      }
    });

    return orgData;
  } catch (error) {
    console.error('Failed to get org data:', error);
    return null;
  }
}

// Обновить данные организации в Firestore
async function updateOrgData(orgId, updates) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/organizations/${orgId}`;

    // Формируем поля для обновления
    const fields = {};
    const updateMask = [];

    Object.keys(updates).forEach(key => {
      fields[key] = { stringValue: JSON.stringify(updates[key]) };
      updateMask.push(key);
    });

    const updateUrl = `${url}?updateMask.fieldPaths=${updateMask.join('&updateMask.fieldPaths=')}`;
    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to update org data:', error);
    return false;
  }
}

// Обновить напоминание в Firestore
async function updateReminder(orgId, reminderId, updates) {
  try {
    const orgData = await getOrgData(orgId);
    if (!orgData) return false;

    const reminders = orgData.reminders || [];
    const index = reminders.findIndex(r => r.id === reminderId);

    if (index !== -1) {
      reminders[index] = { ...reminders[index], ...updates };
      return await updateOrgData(orgId, { reminders });
    }

    return false;
  } catch (error) {
    console.error('Failed to update reminder:', error);
    return false;
  }
}

// Удалить напоминание из Firestore
async function deleteReminder(orgId, reminderId) {
  try {
    const orgData = await getOrgData(orgId);
    if (!orgData) return false;

    const reminders = orgData.reminders || [];
    const filtered = reminders.filter(r => r.id !== reminderId);

    return await updateOrgData(orgId, { reminders: filtered });
  } catch (error) {
    console.error('Failed to delete reminder:', error);
    return false;
  }
}

module.exports = {
  getOrgData,
  updateReminder,
  deleteReminder,
};
