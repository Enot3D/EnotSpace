import React, { useState, useContext } from 'react';
import { StoreContext } from '../App';
import { v4 as uuid } from 'uuid';

// ── helpers ──────────────────────────────────────────────────────────────
function diffLabel(dueDate, done) {
  if (done) return { text:'✓ выполнено', color:'var(--text3)' };
  const diff = new Date(dueDate) - Date.now();
  if (diff < 0) return { text:'просрочено', color:'var(--red)' };
  const h = Math.floor(diff / 3600000);
  if (h < 1)  return { text:'< 1 часа',    color:'var(--red)'   };
  if (h < 24) return { text:'сегодня',      color:'var(--amber)' };
  const d = Math.floor(h / 24);
  if (d === 1) return { text:'завтра',      color:'var(--amber)' };
  if (d <= 7)  return { text:`через ${d} дн`, color:'var(--cyan)' };
  return { text: new Date(dueDate).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}), color:'var(--text2)' };
}

const PRIORITY_COLORS = { high:'var(--red)', normal:'var(--cyan)', low:'var(--text2)' };
const PRIORITY_LABELS = { high:'Срочно', normal:'Обычный', low:'Низкий' };

// ── Reminder modal ───────────────────────────────────────────────────────
function ReminderModal({ item, onClose, store }) {
  const isNew = !item.id;
  const tomorrow = new Date(Date.now() + 86400000);
  const [f, setF] = useState(item || {
    title: '',
    description: '',
    dueDate: tomorrow.toISOString().slice(0, 10),
    dueTime: '09:00',
    orderId: '',
    priority: 'normal',
    done: false,
    notifyBefore: '', // '1h', '1d', '1w', etc
    repeatInterval: '', // 'daily', 'weekly', 'monthly'
    telegramNotify: false,
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const save = () => {
    if (!f.title.trim()) return alert('Укажи название напоминания');
    const dateStr = f.dueDate + 'T' + (f.dueTime || '09:00') + ':00';
    const obj = {
      ...f,
      id: f.id || uuid(),
      title: f.title.trim(),
      dueDate: new Date(dateStr).toISOString(),
      createdAt: f.createdAt || new Date().toISOString(),
    };
    if (isNew) store.addItem('reminders', obj);
    else store.updateItem('reminders', obj.id, obj);
    onClose();
  };

  const del = () => {
    if (window.confirm('Удалить напоминание?')) {
      store.deleteItem('reminders', f.id);
      onClose();
    }
  };

  const orders = (store.data.orders || []).filter(o => !['issued'].includes(o.status));

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">{isNew ? 'Новое напоминание' : 'Редактировать'}</div>

        <div className="form-group">
          <label>Название *</label>
          <input value={f.title} onChange={e => set('title', e.target.value)}
            placeholder="Позвонить клиенту, сдать заказ, купить пластик..." autoFocus />
        </div>

        <div className="form-group">
          <label>Описание (необязательно)</label>
          <textarea value={f.description} onChange={e => set('description', e.target.value)}
            placeholder="Подробности..." style={{ minHeight: 60 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label>Дата</label>
            <input type="date" value={f.dueDate?.slice(0, 10) || ''} onChange={e => set('dueDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Время</label>
            <input type="time" value={f.dueTime || '09:00'} onChange={e => set('dueTime', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label>Приоритет</label>
            <select value={f.priority} onChange={e => set('priority', e.target.value)}>
              <option value="high">Срочно</option>
              <option value="normal">Обычный</option>
              <option value="low">Низкий</option>
            </select>
          </div>
          <div className="form-group">
            <label>Привязать к заказу</label>
            <select value={f.orderId || ''} onChange={e => set('orderId', e.target.value)}>
              <option value="">— без заказа —</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>{o.title} · {o.client}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notification settings */}
        <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10,padding:'14px',marginBottom:12}}>
          <div style={{fontSize:11,color:'var(--cyan)',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:12}}>
            🔔 Уведомления
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div className="form-group" style={{marginBottom:0}}>
              <label>Напомнить заранее</label>
              <select value={f.notifyBefore || ''} onChange={e => set('notifyBefore', e.target.value)}>
                <option value="">В срок</option>
                <option value="1h">За 1 час</option>
                <option value="3h">За 3 часа</option>
                <option value="1d">За 1 день</option>
                <option value="3d">За 3 дня</option>
                <option value="1w">За неделю</option>
              </select>
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label>Повторять</label>
              <select value={f.repeatInterval || ''} onChange={e => set('repeatInterval', e.target.value)}>
                <option value="">Не повторять</option>
                <option value="daily">Каждый день</option>
                <option value="weekly">Каждую неделю</option>
                <option value="monthly">Каждый месяц</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              id="tg-notify"
              checked={!!f.telegramNotify}
              onChange={e => set('telegramNotify', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--cyan)', flexShrink: 0 }}
            />
            <label htmlFor="tg-notify" style={{ margin: 0, cursor: 'pointer', color: 'var(--text1)', fontSize: 13 }}>
              Отправить в Telegram
            </label>
          </div>
        </div>

        {!isNew && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <input type="checkbox" id="done-cb" checked={!!f.done}
              onChange={e => set('done', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--green)', flexShrink: 0 }} />
            <label htmlFor="done-cb" style={{ margin: 0, cursor: 'pointer', color: 'var(--text1)', fontSize: 13 }}>
              Выполнено
            </label>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>
            {isNew ? 'Создать' : 'Сохранить'}
          </button>
          {!isNew && <button className="btn btn-danger" onClick={del}>Удалить</button>}
          <button className="btn" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

// ── Reminder card ────────────────────────────────────────────────────────
function ReminderCard({ reminder, onClick, store }) {
  const dl = diffLabel(reminder.dueDate, reminder.done);
  const linkedOrder = reminder.orderId
    ? (store.data.orders || []).find(o => o.id === reminder.orderId)
    : null;

  const toggleDone = (e) => {
    e.stopPropagation();
    store.updateItem('reminders', reminder.id, { done: !reminder.done });
  };

  return (
    <div
      className="card card-hover"
      style={{
        marginBottom: 8, padding: '12px 14px',
        opacity: reminder.done ? 0.5 : 1,
        borderLeft: `3px solid ${PRIORITY_COLORS[reminder.priority]}`,
        borderRadius: 'var(--radius-lg)',
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Done toggle */}
        <button
          onClick={toggleDone}
          style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
            border: reminder.done ? '2px solid var(--green)' : '2px solid var(--border2)',
            background: reminder.done ? 'var(--green)' : 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--bg0)', fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
          }}>
          {reminder.done ? '✓' : ''}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 500, color: 'var(--text0)',
            textDecoration: reminder.done ? 'line-through' : 'none',
          }}>
            {reminder.title}
          </div>
          {reminder.description && (
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {reminder.description}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: dl.color, fontWeight: 500 }}>⏰ {dl.text}</span>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>
              {new Date(reminder.dueDate).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
            {linkedOrder && (
              <span style={{ fontSize: 10, color: 'var(--cyan)', background: 'var(--cyan-dim)', padding: '1px 6px', borderRadius: 6 }}>
                📋 {linkedOrder.title}
              </span>
            )}
          </div>
        </div>

        <span style={{ fontSize: 10, color: PRIORITY_COLORS[reminder.priority], flexShrink: 0, marginTop: 2 }}>
          {PRIORITY_LABELS[reminder.priority]}
        </span>
      </div>
    </div>
  );
}

// ── Main Reminders page ──────────────────────────────────────────────────
export default function Reminders() {
  const store = useContext(StoreContext);
  const [modal, setModal] = useState(null);
  const [showDone, setShowDone] = useState(false);

  const all = (store.data.reminders || []).slice().sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const active = all.filter(r => !r.done);
  const done   = all.filter(r => r.done);

  // Group active by urgency
  const overdue  = active.filter(r => new Date(r.dueDate) < Date.now());
  const today    = active.filter(r => { const d = new Date(r.dueDate)-Date.now(); return d>=0 && d<86400000; });
  const soon     = active.filter(r => { const d = new Date(r.dueDate)-Date.now(); return d>=86400000 && d<86400000*7; });
  const later    = active.filter(r => new Date(r.dueDate)-Date.now() >= 86400000*7);

  const Section = ({ label, items, color }) => items.length === 0 ? null : (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', padding: '1px 7px', borderRadius: 20 }}>{items.length}</span>
      </div>
      {items.map(r => <ReminderCard key={r.id} reminder={r} store={store} onClick={() => setModal(r)} />)}
    </div>
  );

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Планировщик</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({})}>+ Напоминание</button>
      </div>

      {/* Summary strip */}
      {active.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Просрочено', count: overdue.length, color: 'var(--red)' },
            { label: 'Сегодня',    count: today.length,   color: 'var(--amber)' },
            { label: 'На неделе',  count: soon.length,    color: 'var(--cyan)' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: '10px 12px' }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.count > 0 ? s.color : 'var(--text3)', fontSize: 22 }}>{s.count}</div>
            </div>
          ))}
        </div>
      )}

      {active.length === 0 && done.length === 0 && (
        <div className="empty" style={{ marginTop: 40 }}>
          <div className="empty-icon">🔔</div>
          <div className="empty-text">Нет напоминаний</div>
          <div className="empty-sub">Нажми «+ Напоминание» чтобы добавить</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModal({})}>
            + Добавить первое
          </button>
        </div>
      )}

      <Section label="Просрочено" items={overdue} color="var(--red)" />
      <Section label="Сегодня"    items={today}   color="var(--amber)" />
      <Section label="На неделе"  items={soon}    color="var(--cyan)" />
      <Section label="Позже"      items={later}   color="var(--text2)" />

      {/* Done toggle */}
      {done.length > 0 && (
        <div>
          <button className="btn btn-sm" onClick={() => setShowDone(p => !p)}
            style={{ marginBottom: 10, color: 'var(--text2)' }}>
            {showDone ? '▲' : '▼'} Выполненные ({done.length})
          </button>
          {showDone && done.map(r => (
            <ReminderCard key={r.id} reminder={r} store={store} onClick={() => setModal(r)} />
          ))}
        </div>
      )}

      {modal !== null && (
        <ReminderModal item={modal} onClose={() => setModal(null)} store={store} />
      )}
    </div>
  );
}
