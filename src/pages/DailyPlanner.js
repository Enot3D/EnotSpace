import React, { useState, useContext, useEffect } from 'react';
import { StoreContext, AuthContext } from '../App';
import { v4 as uuid } from 'uuid';
import { getAllUsers } from '../firebase/firestore';

export default function DailyPlanner() {
  const store = useContext(StoreContext);
  const auth = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [moveToDate, setMoveToDate] = useState('');
  const [blockUntilDate, setBlockUntilDate] = useState('');
  const [showManagement, setShowManagement] = useState(false);
  const [managementUserId, setManagementUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [delegateTaskId, setDelegateTaskId] = useState(null);
  const [delegateToUserId, setDelegateToUserId] = useState('');

  const currentUserId = auth?.user?.uid || 'dev';
  const isAdmin = auth?.userData?.role === 'admin';

  // Загрузка пользователей для админа
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    const result = await getAllUsers();
    if (result.success) {
      setUsers(result.users.filter(u => u.active !== false));
    }
  };

  const dailyTasks = store.data.dailyTasks || {};

  // Определяем, чьи задачи показываем
  const viewingUserId = showManagement && managementUserId ? managementUserId : currentUserId;
  const todayTasks = (dailyTasks[selectedDate]?.[viewingUserId]) || [];

  // Автоматический перенос невыполненных задач текущего пользователя
  useEffect(() => {
    const today = getTodayString();
    const yesterday = getYesterdayString();

    if (!dailyTasks[yesterday]?.[currentUserId]) return;

    const unfinishedYesterday = dailyTasks[yesterday][currentUserId].filter(t => !t.done);

    if (unfinishedYesterday.length > 0) {
      const todayTaskIds = new Set((dailyTasks[today]?.[currentUserId] || []).map(t => t.id));
      const tasksToMove = unfinishedYesterday.filter(t => !todayTaskIds.has(t.id));

      if (tasksToMove.length > 0) {
        store.update(prev => ({
          ...prev,
          dailyTasks: {
            ...prev.dailyTasks,
            [today]: {
              ...(prev.dailyTasks[today] || {}),
              [currentUserId]: [...(prev.dailyTasks[today]?.[currentUserId] || []), ...tasksToMove],
            },
          },
        }));
      }
    }
  }, []);

  function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function getYesterdayString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function getTomorrowString() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function getDateOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const isToday = dateStr === getTodayString();
    const isYesterday = dateStr === getYesterdayString();

    const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' });
    const dayMonth = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    if (isToday) return `Сегодня, ${dayMonth}`;
    if (isYesterday) return `Вчера, ${dayMonth}`;
    return `${dayName}, ${dayMonth}`;
  }

  function addTask() {
    if (!newTaskTitle.trim()) return;

    const task = {
      id: uuid(),
      title: newTaskTitle.trim(),
      done: false,
      createdAt: new Date().toISOString(),
      blockedUntil: null,
    };

    const targetUserId = showManagement && managementUserId ? managementUserId : currentUserId;

    store.update(prev => ({
      ...prev,
      dailyTasks: {
        ...prev.dailyTasks,
        [selectedDate]: {
          ...(prev.dailyTasks[selectedDate] || {}),
          [targetUserId]: [...(prev.dailyTasks[selectedDate]?.[targetUserId] || []), task],
        },
      },
    }));

    setNewTaskTitle('');
  }

  function toggleTask(taskId) {
    const tasks = todayTasks;
    const updated = tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);

    store.update(prev => ({
      ...prev,
      dailyTasks: {
        ...prev.dailyTasks,
        [selectedDate]: {
          ...(prev.dailyTasks[selectedDate] || {}),
          [viewingUserId]: updated,
        },
      },
    }));
  }

  function deleteTask(taskId) {
    const tasks = todayTasks;
    const updated = tasks.filter(t => t.id !== taskId);

    store.update(prev => ({
      ...prev,
      dailyTasks: {
        ...prev.dailyTasks,
        [selectedDate]: {
          ...(prev.dailyTasks[selectedDate] || {}),
          [viewingUserId]: updated,
        },
      },
    }));
  }

  function startEdit(task) {
    setEditingId(task.id);
    setEditingTitle(task.title);
  }

  function saveEdit() {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    const tasks = todayTasks;
    const updated = tasks.map(t => t.id === editingId ? { ...t, title: editingTitle.trim() } : t);

    store.update(prev => ({
      ...prev,
      dailyTasks: {
        ...prev.dailyTasks,
        [selectedDate]: {
          ...(prev.dailyTasks[selectedDate] || {}),
          [viewingUserId]: updated,
        },
      },
    }));

    setEditingId(null);
  }

  function moveTask(taskId, toDate) {
    const tasks = todayTasks;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedCurrent = tasks.filter(t => t.id !== taskId);
    const targetTasks = dailyTasks[toDate]?.[viewingUserId] || [];

    store.update(prev => ({
      ...prev,
      dailyTasks: {
        ...prev.dailyTasks,
        [selectedDate]: {
          ...(prev.dailyTasks[selectedDate] || {}),
          [viewingUserId]: updatedCurrent,
        },
        [toDate]: {
          ...(prev.dailyTasks[toDate] || {}),
          [viewingUserId]: [...targetTasks, task],
        },
      },
    }));

    setShowDatePicker(null);
    setMoveToDate('');
  }

  function blockTask(taskId, untilDate) {
    const tasks = todayTasks;
    const updated = tasks.map(t => t.id === taskId ? { ...t, blockedUntil: untilDate } : t);

    store.update(prev => ({
      ...prev,
      dailyTasks: {
        ...prev.dailyTasks,
        [selectedDate]: {
          ...(prev.dailyTasks[selectedDate] || {}),
          [viewingUserId]: updated,
        },
      },
    }));

    setShowDatePicker(null);
    setBlockUntilDate('');
  }

  function isTaskBlocked(task) {
    if (!task.blockedUntil) return false;
    return new Date(task.blockedUntil) > new Date();
  }

  function unblockTask(taskId) {
    const tasks = todayTasks;
    const updated = tasks.map(t => t.id === taskId ? { ...t, blockedUntil: null } : t);

    store.update(prev => ({
      ...prev,
      dailyTasks: {
        ...prev.dailyTasks,
        [selectedDate]: {
          ...(prev.dailyTasks[selectedDate] || {}),
          [viewingUserId]: updated,
        },
      },
    }));
  }

  function delegateTask(taskId, toUserId) {
    const tasks = todayTasks;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedCurrent = tasks.filter(t => t.id !== taskId);
    const targetTasks = dailyTasks[selectedDate]?.[toUserId] || [];

    store.update(prev => ({
      ...prev,
      dailyTasks: {
        ...prev.dailyTasks,
        [selectedDate]: {
          ...(prev.dailyTasks[selectedDate] || {}),
          [currentUserId]: updatedCurrent,
          [toUserId]: [...targetTasks, { ...task, done: false }],
        },
      },
    }));

    setDelegateTaskId(null);
    setDelegateToUserId('');
  }

  // Прогресс дня
  const totalTasks = todayTasks.length;
  const doneTasks = todayTasks.filter(t => t.done).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Список доступных дат (последние 30 дней)
  const availableDates = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    availableDates.push(dateStr);
  }

  // Подсчет задач для каждой даты
  function getTaskCountForDate(dateStr) {
    const userTasks = dailyTasks[dateStr]?.[viewingUserId] || [];
    return userTasks.length;
  }

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      {/* Заголовок */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: 'var(--text)' }}>
          📅 Планировка дня
        </h1>
        {isAdmin && !showManagement && (
          <button
            onClick={() => setShowManagement(true)}
            style={{
              padding: '8px 16px',
              fontSize: 16,
              border: 'none',
              borderRadius: 12,
              background: 'var(--purple)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            👥
          </button>
        )}
      </div>

      {/* Режим управления (только для админа) */}
      {showManagement && isAdmin && (
        <div style={{
          background: 'var(--bg1)',
          border: '2px solid var(--purple)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--purple)' }}>👥 Управление задачами</h3>
            <button
              onClick={() => {
                setShowManagement(false);
                setManagementUserId('');
              }}
              style={{
                padding: '4px 12px',
                fontSize: 14,
                border: 'none',
                borderRadius: 8,
                background: 'var(--red)',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
          <select
            value={managementUserId}
            onChange={(e) => setManagementUserId(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 16,
              border: '1px solid var(--border)',
              borderRadius: 12,
              background: 'var(--bg0)',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            <option value="">Выберите сотрудника</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.displayName || user.email}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Выбор даты */}
      <div style={{ marginBottom: 16 }}>
        {/* Быстрые кнопки */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            onClick={() => setSelectedDate(getDateOffset(-1))}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: 14,
              border: selectedDate === getDateOffset(-1) ? '2px solid var(--cyan)' : '1px solid var(--border)',
              borderRadius: 10,
              background: selectedDate === getDateOffset(-1) ? 'var(--cyan)' : 'var(--bg1)',
              color: selectedDate === getDateOffset(-1) ? 'white' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: selectedDate === getDateOffset(-1) ? 600 : 400,
            }}
          >
            ← Вчера
          </button>
          <button
            onClick={() => setSelectedDate(getTodayString())}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: 14,
              border: selectedDate === getTodayString() ? '2px solid var(--cyan)' : '1px solid var(--border)',
              borderRadius: 10,
              background: selectedDate === getTodayString() ? 'var(--cyan)' : 'var(--bg1)',
              color: selectedDate === getTodayString() ? 'white' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: selectedDate === getTodayString() ? 600 : 400,
            }}
          >
            Сегодня
          </button>
          <button
            onClick={() => setSelectedDate(getDateOffset(1))}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: 14,
              border: selectedDate === getDateOffset(1) ? '2px solid var(--cyan)' : '1px solid var(--border)',
              borderRadius: 10,
              background: selectedDate === getDateOffset(1) ? 'var(--cyan)' : 'var(--bg1)',
              color: selectedDate === getDateOffset(1) ? 'white' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: selectedDate === getDateOffset(1) ? 600 : 400,
            }}
          >
            Завтра →
          </button>
        </div>

        {/* Выпадающий список для других дат */}
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 16,
            border: '1px solid var(--border)',
            borderRadius: 12,
            background: 'var(--bg1)',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          {availableDates.map(date => {
            const count = getTaskCountForDate(date);
            return (
              <option key={date} value={date}>
                {formatDate(date)} {count > 0 ? `(${count})` : ''}
              </option>
            );
          })}
        </select>
      </div>

      {/* Прогресс бар */}
      {totalTasks > 0 && (
        <div style={{
          background: 'var(--bg1)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: 'var(--text2)' }}>Прогресс дня</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cyan)' }}>
              {doneTasks} / {totalTasks} ({progress}%)
            </span>
          </div>
          <div style={{
            height: 8,
            background: 'var(--bg0)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--cyan), var(--purple))',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Добавление задачи */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
      }}>
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Новая задача..."
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: 16,
            border: '1px solid var(--border)',
            borderRadius: 12,
            background: 'var(--bg1)',
            color: 'var(--text)',
          }}
        />
        <button
          onClick={addTask}
          style={{
            padding: '12px 20px',
            fontSize: 16,
            border: 'none',
            borderRadius: 12,
            background: 'var(--cyan)',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          +
        </button>
      </div>

      {/* Список задач */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {todayTasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: 'var(--text-dim)',
            fontSize: 14,
          }}>
            Нет задач на этот день
          </div>
        ) : (
          todayTasks.map(task => {
            const blocked = isTaskBlocked(task);
            const canDelegate = isAdmin && !showManagement && viewingUserId === currentUserId;

            return (
              <div
                key={task.id}
                style={{
                  background: 'var(--bg1)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 12,
                  opacity: blocked ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Чекбокс */}
                  <button
                    onClick={() => !blocked && toggleTask(task.id)}
                    disabled={blocked}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: task.done ? 'none' : '2px solid var(--border)',
                      background: task.done ? 'var(--cyan)' : 'transparent',
                      color: 'white',
                      cursor: blocked ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {task.done && '✓'}
                  </button>

                  {/* Название */}
                  {editingId === task.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={saveEdit}
                      autoFocus
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        fontSize: 16,
                        border: '1px solid var(--cyan)',
                        borderRadius: 6,
                        background: 'var(--bg0)',
                        color: 'var(--text)',
                      }}
                    />
                  ) : (
                    <div
                      onClick={() => !blocked && startEdit(task)}
                      style={{
                        flex: 1,
                        fontSize: 16,
                        color: task.done ? 'var(--text-dim)' : 'var(--text)',
                        textDecoration: task.done ? 'line-through' : 'none',
                        cursor: blocked ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {task.title}
                      {blocked && (
                        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--orange)' }}>
                          🔒 до {new Date(task.blockedUntil).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Кнопки действий */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {blocked ? (
                      <button
                        onClick={() => unblockTask(task.id)}
                        style={{
                          padding: '4px 8px',
                          fontSize: 12,
                          border: 'none',
                          borderRadius: 6,
                          background: 'var(--orange)',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        🔓
                      </button>
                    ) : (
                      <>
                        {canDelegate && (
                          <button
                            onClick={() => setDelegateTaskId(delegateTaskId === task.id ? null : task.id)}
                            style={{
                              padding: '4px 8px',
                              fontSize: 12,
                              border: 'none',
                              borderRadius: 6,
                              background: 'var(--green)',
                              color: 'white',
                              cursor: 'pointer',
                            }}
                          >
                            ➡️
                          </button>
                        )}
                        <button
                          onClick={() => setShowDatePicker(showDatePicker === `move-${task.id}` ? null : `move-${task.id}`)}
                          style={{
                            padding: '4px 8px',
                            fontSize: 12,
                            border: 'none',
                            borderRadius: 6,
                            background: 'var(--purple)',
                            color: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          📅
                        </button>
                        <button
                          onClick={() => setShowDatePicker(showDatePicker === `block-${task.id}` ? null : `block-${task.id}`)}
                          style={{
                            padding: '4px 8px',
                            fontSize: 12,
                            border: 'none',
                            borderRadius: 6,
                            background: 'var(--orange)',
                            color: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          🔒
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        border: 'none',
                        borderRadius: 6,
                        background: 'var(--red)',
                        color: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Модалка делегирования */}
                {delegateTaskId === task.id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                      Делегировать сотруднику:
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        value={delegateToUserId}
                        onChange={(e) => setDelegateToUserId(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          fontSize: 14,
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          background: 'var(--bg0)',
                          color: 'var(--text)',
                        }}
                      >
                        <option value="">Выберите сотрудника</option>
                        {users.filter(u => u.id !== currentUserId).map(user => (
                          <option key={user.id} value={user.id}>
                            {user.displayName || user.email}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => delegateToUserId && delegateTask(task.id, delegateToUserId)}
                        disabled={!delegateToUserId}
                        style={{
                          padding: '8px 16px',
                          fontSize: 14,
                          border: 'none',
                          borderRadius: 6,
                          background: delegateToUserId ? 'var(--green)' : 'var(--bg0)',
                          color: 'white',
                          cursor: delegateToUserId ? 'pointer' : 'not-allowed',
                        }}
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                )}

                {/* Модалка переноса */}
                {showDatePicker === `move-${task.id}` && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                      Перенести на дату:
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="date"
                        value={moveToDate}
                        onChange={(e) => setMoveToDate(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          fontSize: 14,
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          background: 'var(--bg0)',
                          color: 'var(--text)',
                        }}
                      />
                      <button
                        onClick={() => moveToDate && moveTask(task.id, moveToDate)}
                        disabled={!moveToDate}
                        style={{
                          padding: '8px 16px',
                          fontSize: 14,
                          border: 'none',
                          borderRadius: 6,
                          background: moveToDate ? 'var(--cyan)' : 'var(--bg0)',
                          color: 'white',
                          cursor: moveToDate ? 'pointer' : 'not-allowed',
                        }}
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                )}

                {/* Модалка блокировки */}
                {showDatePicker === `block-${task.id}` && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                      Заблокировать до:
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="date"
                        value={blockUntilDate}
                        onChange={(e) => setBlockUntilDate(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          fontSize: 14,
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          background: 'var(--bg0)',
                          color: 'var(--text)',
                        }}
                      />
                      <button
                        onClick={() => blockUntilDate && blockTask(task.id, blockUntilDate)}
                        disabled={!blockUntilDate}
                        style={{
                          padding: '8px 16px',
                          fontSize: 14,
                          border: 'none',
                          borderRadius: 6,
                          background: blockUntilDate ? 'var(--orange)' : 'var(--bg0)',
                          color: 'white',
                          cursor: blockUntilDate ? 'pointer' : 'not-allowed',
                        }}
                      >
                        🔒
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
