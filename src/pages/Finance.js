import React, { useState, useContext } from 'react';
import { StoreContext } from '../App';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { v4 as uuid } from 'uuid';

function fmt(n) { return new Intl.NumberFormat('ru-RU').format(Math.round(n)); }

const CAT_COLORS = { order:'var(--cyan)', materials:'var(--amber)', equipment:'var(--purple)', electricity:'var(--green)', reserve:'var(--amber)', other:'var(--text2)' };
const CAT_LABELS = { order:'Заказ', materials:'Материалы', equipment:'Оборудование', electricity:'Электричество', reserve:'Резерв ЧД', other:'Прочее' };

function getLast7Days(transactions) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('ru-RU', { day:'numeric', month:'short' });
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const income  = transactions.filter(t => t.type==='income'  && new Date(t.date)>=dayStart && new Date(t.date)<dayEnd).reduce((s,t)=>s+t.amount,0);
    const expense = transactions.filter(t => t.type==='expense' && new Date(t.date)>=dayStart && new Date(t.date)<dayEnd).reduce((s,t)=>s+t.amount,0);
    days.push({ day:key, Выручка:income, Расходы:expense, Прибыль:income-expense });
  }
  return days;
}

// ── Transaction modal (create + edit) ──────────────────────────────────
function TxModal({ tx, onClose, store }) {
  const isNew = !tx.id;
  const [f, setF] = useState(tx || {
    type:'income', category:'order', amount:'', description:'',
    date: new Date().toISOString().slice(0,10),
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const save = () => {
    if (!f.amount || !f.description) return alert('Заполни сумму и описание');
    const obj = { ...f, id: f.id || uuid(), amount: Number(f.amount), date: new Date(f.date).toISOString() };
    if (isNew) store.addItem('transactions', obj);
    else store.updateItem('transactions', obj.id, obj);
    onClose();
  };

  const del = () => {
    if (window.confirm('Удалить операцию?')) { store.deleteItem('transactions', f.id); onClose(); }
  };

  return (
    <div className="overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-title">{isNew ? 'Новая операция' : 'Редактировать операцию'}</div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group">
            <label>Тип</label>
            <select value={f.type} onChange={e=>set('type',e.target.value)}>
              <option value="income">Доход</option>
              <option value="expense">Расход</option>
            </select>
          </div>
          <div className="form-group">
            <label>Категория</label>
            <select value={f.category} onChange={e=>set('category',e.target.value)}>
              <option value="order">Заказ</option>
              <option value="materials">Материалы</option>
              <option value="equipment">Оборудование</option>
              <option value="electricity">Электричество</option>
              <option value="other">Прочее</option>
            </select>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group">
            <label>Сумма ₽</label>
            <input type="number" value={f.amount} onChange={e=>set('amount',e.target.value)} placeholder="2 400"/>
          </div>
          <div className="form-group">
            <label>Дата</label>
            <input type="date" value={typeof f.date==='string' ? f.date.slice(0,10) : ''} onChange={e=>set('date',e.target.value)}/>
          </div>
        </div>

        <div className="form-group">
          <label>Описание</label>
          <input value={f.description} onChange={e=>set('description',e.target.value)} placeholder="Оплата заказа..."/>
        </div>

        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={save}>
            {isNew ? 'Добавить' : 'Сохранить'}
          </button>
          {!isNew && (
            <button className="btn btn-danger" onClick={del}>Удалить</button>
          )}
          <button className="btn" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────
export default function Finance() {
  const store = useContext(StoreContext);
  const [filter, setFilter]   = useState('all');
  const [modal, setModal]     = useState(null);   // null | {} | tx-object
  const [search, setSearch]   = useState('');

  const s = store.getFinanceStats();
  const chartData = getLast7Days(store.data.transactions);

  const txs = store.data.transactions
    .filter(t => {
      if (filter==='income')  return t.type==='income';
      if (filter==='expense') return t.type==='expense';
      return true;
    })
    .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()))
    .slice().reverse();

  return (
    <div style={{padding:'16px'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <h2 style={{fontSize:20,fontWeight:700}}>Финансы</h2>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal({})}>+ Операция</button>
      </div>

      {/* Key stats */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
        <div className="stat-card">
          <div className="stat-label">Выручка / месяц</div>
          <div className="stat-value" style={{color:'var(--cyan)',fontSize:18}}>{fmt(s.monthIncome)} ₽</div>
          <div className="stat-sub">неделя: {fmt(s.weekIncome)} ₽</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Прибыль / месяц</div>
          <div className="stat-value" style={{color:s.monthProfit>=0?'var(--green)':'var(--red)',fontSize:18}}>{fmt(s.monthProfit)} ₽</div>
          <div className="stat-sub">маржа {s.margin}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Расходы / месяц</div>
          <div className="stat-value" style={{color:'var(--red)',fontSize:18}}>{fmt(s.monthExpense)} ₽</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Сегодня</div>
          <div className="stat-value" style={{color:'var(--cyan)',fontSize:18}}>{fmt(s.todayIncome)} ₽</div>
        </div>
      </div>

      {/* Reserve balance — single card */}
      {(store.data.settings.reservePercent||0) > 0 && (
        <div className="card" style={{marginBottom:14,border:'1px solid rgba(245,158,11,0.3)',background:'rgba(245,158,11,0.07)',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:11,color:'var(--amber)',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:4}}>
              🐾 Резерв «Чёрный день» · {store.data.settings.reservePercent}% с заказов
            </div>
            <div style={{fontSize:22,fontWeight:700,fontFamily:'var(--font-display)',color:'var(--amber)'}}>{fmt(s.totalReserve||0)} ₽</div>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>накоплено всего</div>
          </div>
          <div style={{fontSize:32,opacity:0.4}}>🐾</div>
        </div>
      )}

      {/* Monthly goal */}
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          <span style={{fontSize:12,color:'var(--text1)'}}>Цель месяца</span>
          <span style={{fontSize:12,color:'var(--cyan)',fontWeight:600}}>
            {fmt(s.monthIncome)} / {fmt(store.data.settings.monthlyGoal)} ₽
          </span>
        </div>
        <div className="progress" style={{height:8}}>
          <div className="progress-fill" style={{
            width: Math.min(100, Math.round(s.monthIncome/store.data.settings.monthlyGoal*100))+'%',
            background:'linear-gradient(90deg,#0ea5e9,#22d0e4)'
          }}/>
        </div>
        <div style={{fontSize:11,color:'var(--text2)',marginTop:6}}>
          {Math.round(s.monthIncome/store.data.settings.monthlyGoal*100)}% выполнено
          {' · '}осталось {fmt(Math.max(0, store.data.settings.monthlyGoal-s.monthIncome))} ₽
        </div>
      </div>

      {/* Bar chart */}
      <div className="card" style={{marginBottom:14}}>
        <div style={{fontSize:12,color:'var(--text2)',marginBottom:12}}>Доходы и расходы за 7 дней</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{top:0,right:0,bottom:0,left:0}}>
            <XAxis dataKey="day" tick={{fontSize:10,fill:'#5a8aa8'}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10,fill:'#5a8aa8'}} axisLine={false} tickLine={false} width={40}
              tickFormatter={v=>v>=1000?Math.round(v/1000)+'к':v}/>
            <Tooltip
              contentStyle={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}
              labelStyle={{color:'var(--text1)'}}
              formatter={(v,n)=>[fmt(v)+' ₽',n]}/>
            <Bar dataKey="Выручка" fill="#22d0e4" radius={[3,3,0,0]}/>
            <Bar dataKey="Расходы" fill="#f43f5e" radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Profit line */}
      <div className="card" style={{marginBottom:14}}>
        <div style={{fontSize:12,color:'var(--text2)',marginBottom:12}}>Прибыль по дням</div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={chartData}>
            <XAxis dataKey="day" tick={{fontSize:10,fill:'#5a8aa8'}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10,fill:'#5a8aa8'}} axisLine={false} tickLine={false} width={40}
              tickFormatter={v=>v>=1000?Math.round(v/1000)+'к':v}/>
            <Tooltip
              contentStyle={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}
              formatter={v=>[fmt(v)+' ₽','Прибыль']}/>
            <Line type="monotone" dataKey="Прибыль" stroke="#22d98a" strokeWidth={2} dot={{fill:'#22d98a',r:3}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Filters + search */}
      <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
        {[{id:'all',l:'Все'},{id:'income',l:'Доходы'},{id:'expense',l:'Расходы'}].map(item=>(
          <button key={item.id} className="btn btn-sm" onClick={()=>setFilter(item.id)}
            style={{background:filter===item.id?'var(--cyan-dim)':'',borderColor:filter===item.id?'var(--cyan)':'',color:filter===item.id?'var(--cyan)':''}}>
            {item.l}
          </button>
        ))}
      </div>
      <input
        value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="🔍 Поиск по описанию..."
        style={{marginBottom:10}}
      />

      {/* Transaction list — tap any row to edit */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        {txs.length === 0 && (
          <div className="empty"><div className="empty-text">Нет операций</div></div>
        )}
        {txs.slice(0,100).map((tx, i) => (
          <div
            key={tx.id}
            onClick={() => setModal(tx)}
            style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 14px',
              borderBottom: i<txs.length-1 ? '1px solid var(--border)' : 'none',
              cursor:'pointer', transition:'background 0.1s',
            }}
            onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'}
            onMouseLeave={e=>e.currentTarget.style.background=''}
          >
            <div style={{
              width:6, height:6, borderRadius:'50%', flexShrink:0,
              background: tx.type==='income' ? 'var(--green)' : 'var(--red)',
            }}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,color:'var(--text1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {tx.description}
              </div>
              <div style={{fontSize:10,color:'var(--text3)',marginTop:1,display:'flex',gap:8}}>
                <span>{new Date(tx.date).toLocaleDateString('ru-RU')}</span>
                <span style={{color:CAT_COLORS[tx.category]||'var(--text2)'}}>
                  {CAT_LABELS[tx.category]||tx.category}
                </span>
              </div>
            </div>
            <div style={{
              fontSize:13, fontWeight:600, fontFamily:'var(--font-display)', flexShrink:0,
              color: tx.type==='income' ? 'var(--green)' : 'var(--red)',
            }}>
              {tx.type==='income' ? '+' : '−'}{fmt(tx.amount)} ₽
            </div>
            {/* Edit hint */}
            <span style={{fontSize:11,color:'var(--text3)',flexShrink:0}}>✏</span>
          </div>
        ))}
      </div>

      {modal !== null && (
        <TxModal tx={modal} onClose={()=>setModal(null)} store={store}/>
      )}
    </div>
  );
}
