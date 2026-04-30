import React, { useState, useContext, useEffect } from 'react';
import { StoreContext } from '../App';
import { v4 as uuid } from 'uuid';

export default function DailyPlanner() {
  const store = useContext(StoreContext);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [moveToDate, setMoveToDate] = useState('');
  const [blockUntilDate, setBlockUntilDate] = useState('');

  const dailyTasks = store.data.dailyTasks || {};
  const todayTasks = dailyTasks[selectedDate] || [];

  // Автоматический перенос невыполненных задач
  useEffect(() => {
    const today = getTodayString();
    const yesterday = getYesterdayString();

    if (!dailyTasks[yesterday]) return;

    const unfinishedYesterday = dailyTasks[yesterday].filter(t => !t.done);

    if (unfinishedYesterday.length > 0) {
      const todayTaskIds = new Set((dailyTasks[today] || []).map(t => t.id));
      const tasksToMove = unfinishedYesterday.filter(t => !todayTaskIds.has(t.id));

      if (tasksToMove.length > 0) {
        store.update(prev => ({
          ...prev,
          dailyTasks: {
            ...prev.dailyTasks,
            [today]: [...(prev.dailyTasks[today] || []), ...tasksToMove],
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

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

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

    store.update(prev => ({
      ...prev,
      dailyTasks: {
        ...prev.dailyTasks,
        [selectedDate]: [...(prev.dailyTasks[selectedDate] || []), task],
      },
    }));

    setNewTaskTitle('');
  }

  function toggleTask(taskId) {
    const tasks = dailyTasks[selectedDate] || [];
    const updated = tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);

    store.update(prev => ({
      ...prev,
      dailyTasks: {
        ...prev.dailyTasks,
        [selectedDate]: updated,
      },
    }));
  }

  function deleteTask(taskId) {
    const tasks = dailyTasks[selectedDate] || [];
    const updated = tasks.filter(t => t.id !== taskId);

    store.update(prev => ({
      ...prev,
      dailyTasks: {
        ...prev.dailyTasks,
        [selectedDate]: updated,
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

    const tasks = dailyTasks[selectedDate] || [];
    const updated = tasks.map(t => t.id === editingId ? { ...t, title: editingTitle.trim() } : t);

    store.update(prev => ({
      ...prev,
      dailyTasks: {
        ...prev.dailyTasks,
        [selectedDate]: updated,
      },
    }));

    setEditingId(null);
  }

  function moveTask(taskId, toDate) {
    const tasks = dailyTasks[selectedDate] || [];
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedCurrent = tasks.filter(t => t.id !== taskId);
    const targetTasks = dailyTasks[toDate] || [];

    store.update(prev => ({
      ...prev,
      dailyTasks: {
        ...prev.dailyTasks,
        [selectedDate]: updatedCurrent,
        [toDate]: [...targetTasks, task],
      },
    }));

    setShowDatePicker(null);
    setMoveToDate('');
  }

  function blockTask(taskId, untilDate) {
    const tasks = dailyTasks[selectedDate] || [];
    const updated = tasks.map(t => t.id === taskId ? { ...t, blockedUntil: untilDate } : t);

    store.update(prev => ({
      ...prev,
      dailyTasks: {
        ...prev.dailyTasks,
        [selectedDate]: updated,
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
    const tasks = dailyTasks[selectedDate] || [];
    const updated = tasks.map(t => t.id === taskId ? { ...t, blockedUntil: null } : t);

    store.update(prev => ({
      ...prev,
      dailyTasks: {
        ...prev.dailyTasks,
        [selectedDate]: updated,
      },
    }));
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

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      {/* Заголовок */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: 'var(--text)' }}>
          📅 Планировка дня
        </h1>
      </div>

      {/* Выбор даты */}
      <div style={{ marginBottom: 16 }}>
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
          {availableDates.map(date => (
            <option key={date} value={date}>
              {formatDate(date)} {dailyTasks[date] ? `(${dailyTasks[date].length})` : ''}
            </option>
          ))}
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
