import { useState, useCallback } from 'react';

const STORAGE_KEY = 'enotspace_data_v2';

// ── Completely empty default — user fills from scratch ──────────────────
const defaultData = {
  settings: {
    businessName: 'ENOT SPACE',
    currency: '₽',
    electricityRate: 6.5,
    defaultMargin: 40,
    monthlyGoal: 100000,
    weeklyGoal: 25000,
    laborRatePerHour: 0,
    reservePercent: 10, // % от каждого заказа на "чёрный день"
  },
  orders: [],
  clients: [],
  printers: [],
  materials: [],
  products: [],
  purchases: [],
  goals: [],
  notes: [],
  transactions: [],
  printSchedule: [],
  reminders: [],
  // subtasks per order: { orderId: [ {id, title, done} ] }
  subtasks: {},
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    return {
      ...defaultData,
      ...parsed,
      settings: { ...defaultData.settings, ...(parsed.settings || {}) },
      subtasks: parsed.subtasks || {},
      reminders: parsed.reminders || [],
    };
  } catch {
    return defaultData;
  }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch (e) { console.error('Save failed', e); }
}

export function useStore() {
  const [data, setData] = useState(loadData);

  const update = useCallback((updater) => {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      saveData(next);
      return next;
    });
  }, []);

  const addItem = useCallback((key, item) =>
    update(prev => ({ ...prev, [key]: [...(prev[key]||[]), item] })), [update]);

  const updateItem = useCallback((key, id, changes) =>
    update(prev => ({ ...prev, [key]: prev[key].map(i => i.id === id ? { ...i, ...changes } : i) })), [update]);

  const deleteItem = useCallback((key, id) =>
    update(prev => ({ ...prev, [key]: prev[key].filter(i => i.id !== id) })), [update]);

  // Delete order AND its linked transactions
  const deleteOrder = useCallback((orderId) => {
    update(prev => ({
      ...prev,
      orders: prev.orders.filter(o => o.id !== orderId),
      transactions: prev.transactions.filter(t => t.orderId !== orderId),
      subtasks: Object.fromEntries(
        Object.entries(prev.subtasks || {}).filter(([k]) => k !== orderId)
      ),
    }));
  }, [update]);

  // ── Finance stats ──────────────────────────────────────────────────────
  const getFinanceStats = useCallback(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(todayStart); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay()+6)%7));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const txs = data.transactions || [];
    const sum = (arr, type, from) =>
      arr.filter(t => t.type===type && new Date(t.date)>=from).reduce((s,t)=>s+t.amount,0);

    const todayIncome  = sum(txs,'income', todayStart);
    const weekIncome   = sum(txs,'income', weekStart);
    const monthIncome  = sum(txs,'income', monthStart);
    const monthExpense = sum(txs,'expense',monthStart);
    const monthProfit  = monthIncome - monthExpense;
    const margin       = monthIncome > 0 ? Math.round((monthProfit/monthIncome)*100) : 0;

    // Reserve (чёрный день) — sum of all reserve transactions
    const totalReserve = txs.filter(t=>t.category==='reserve').reduce((s,t)=>s+t.amount,0);

    const orders = data.orders || [];
    const activeOrders  = orders.filter(o=>['new','in_progress'].includes(o.status)).length;
    const urgentOrders  = orders.filter(o=>{
      if (!['new','in_progress'].includes(o.status)) return false;
      return (new Date(o.deadline)-now) < 86400000*2;
    }).length;

    return { todayIncome, weekIncome, monthIncome, monthExpense, monthProfit, margin, activeOrders, urgentOrders, totalReserve };
  }, [data.transactions, data.orders]);

  // ── Smart alerts ───────────────────────────────────────────────────────
  const getAlerts = useCallback(() => {
    const alerts = [];
    const now = new Date();
    (data.materials||[]).forEach(m => {
      if (m.quantity <= m.minQuantity)
        alerts.push({ type:'warning', icon:'📦', text:`Мало: ${m.name} — ${m.quantity}${m.unit}`, action:'warehouse' });
    });
    (data.printers||[]).forEach(p => {
      if (p.hoursSinceMaintenance >= p.maintenanceIntervalHours)
        alerts.push({ type:'danger', icon:'🖨', text:`${p.name}: нужно ТО`, action:'printers' });
    });
    (data.orders||[]).filter(o=>['new','in_progress'].includes(o.status)).forEach(o => {
      const dl = new Date(o.deadline);
      if (dl < now) alerts.push({ type:'danger', icon:'⏰', text:`Просрочен: ${o.title}`, action:'orders' });
      else if ((dl-now)<86400000) alerts.push({ type:'warning', icon:'⚡', text:`Сдача сегодня: ${o.title}`, action:'orders' });
    });
    const unpaid = (data.orders||[]).filter(o=>o.status==='done'&&!o.paid);
    if (unpaid.length>0)
      alerts.push({ type:'info', icon:'💰', text:`${unpaid.length} заказов ждут оплаты`, action:'orders' });
    // Reminders
    const now2 = new Date();
    (data.reminders||[]).filter(r=>!r.done).forEach(r => {
      const diff = new Date(r.dueDate) - now2;
      if (diff < 0)
        alerts.push({ type:'danger', icon:'🔔', text:`Просрочено: ${r.title}`, action:'dashboard' });
      else if (diff < 86400000*1)
        alerts.push({ type:'warning', icon:'🔔', text:`Сегодня: ${r.title}`, action:'dashboard' });
      else if (diff < 86400000*3)
        alerts.push({ type:'info', icon:'🔔', text:`Через ${Math.floor(diff/86400000)}д: ${r.title}`, action:'dashboard' });
    });
    return alerts;
  }, [data.materials, data.printers, data.orders]);

  return { data, update, addItem, updateItem, deleteItem, deleteOrder, getFinanceStats, getAlerts };
}
