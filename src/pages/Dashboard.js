import React, { useContext } from 'react';
import { StoreContext, NavContext } from '../App';

function fmt(n) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n));
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'только что';
  if (h < 24) return h + 'ч назад';
  return Math.floor(h/24) + 'д назад';
}

function deadlineLabel(dateStr) {
  const diff = new Date(dateStr) - Date.now();
  if (diff < 0) return { text: 'просрочен', color: 'var(--red)' };
  const h = Math.floor(diff / 3600000);
  if (h < 24) return { text: 'сегодня', color: 'var(--amber)' };
  const d = Math.floor(h / 24);
  return { text: 'через ' + d + 'д', color: 'var(--text2)' };
}

const STATUS_LABELS = { new:'Новый', in_progress:'В работе', done:'Готов', issued:'Выдан' };
const STATUS_COLORS = { new:'var(--cyan)', in_progress:'var(--amber)', done:'var(--green)', issued:'var(--text2)' };

export default function Dashboard() {
  const store = useContext(StoreContext);
  const nav = useContext(NavContext);
  const { data, getAlerts, getFinanceStats } = store;
  const alerts = getAlerts();
  const s = getFinanceStats();

  const activeOrders = data.orders.filter(o => ['new','in_progress'].includes(o.status)).slice(0,4);
  const lowMaterials = data.materials.filter(m => m.quantity <= m.minQuantity);
  const recentTx = data.transactions.slice(-3).reverse();

  const topGoal = data.goals.find(g => !g.done);

  return (
    <div style={{ padding:'16px' }}>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom:14 }}>
          {alerts.slice(0,3).map((a,i) => (
            <div key={i} className={`alert alert-${a.type}`} style={{ marginBottom:6, cursor:'pointer' }}
              onClick={() => nav.setPage(a.action)}>
              <span>{a.icon}</span>
              <span>{a.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
        <div className="stat-card">
          <div className="stat-label">Выручка / месяц</div>
          <div className="stat-value" style={{ color:'var(--cyan)', fontSize:20 }}>{fmt(s.monthIncome)} ₽</div>
          <div className="stat-sub">расходы {fmt(s.monthExpense)} ₽</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Прибыль / месяц</div>
          <div className="stat-value" style={{ color: s.monthProfit >= 0 ? 'var(--green)' : 'var(--red)', fontSize:20 }}>{fmt(s.monthProfit)} ₽</div>
          <div className="stat-sub">маржа {s.margin}%</div>
        </div>
        <div className="stat-card" style={{ cursor:'pointer' }} onClick={() => nav.setPage('orders')}>
          <div className="stat-label">В работе</div>
          <div className="stat-value" style={{ fontSize:20 }}>{s.activeOrders}</div>
          <div className="stat-sub">{s.urgentOrders > 0 ? `⚡ ${s.urgentOrders} срочных` : 'без срочных'}</div>
        </div>
        <div className="stat-card" style={{ cursor:'pointer' }} onClick={() => nav.setPage('printers')}>
          <div className="stat-label">Принтеры</div>
          <div className="stat-value" style={{ fontSize:20 }}>{data.printers.filter(p=>p.status==='working').length}<span style={{ fontSize:14, color:'var(--text2)' }}>/{data.printers.length}</span></div>
          <div className="stat-sub">работают сейчас</div>
        </div>
      </div>

      {/* Top goal progress */}
      {topGoal && (
        <div className="card" style={{ marginBottom:14, cursor:'pointer' }} onClick={() => nav.setPage('goals')}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:12, color:'var(--text1)', fontWeight:500 }}>🎯 {topGoal.title}</span>
            <span style={{ fontSize:11, color:topGoal.color }}>
              {Math.round((topGoal.current/topGoal.target)*100)}%
            </span>
          </div>
          <div className="progress" style={{ height:6 }}>
            <div className="progress-fill" style={{
              width: Math.min(100,(topGoal.current/topGoal.target)*100) + '%',
              background: topGoal.color
            }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:11, color:'var(--text2)' }}>
            <span>{fmt(topGoal.current)} / {fmt(topGoal.target)}</span>
            <span>до {new Date(topGoal.deadline).toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}</span>
          </div>
        </div>
      )}

      {/* Active orders */}
      <div style={{ marginBottom:14 }}>
        <div className="section-header">
          <span className="section-title">Активные заказы</span>
          <button className="btn btn-sm" onClick={() => nav.setPage('orders')}>Все</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {activeOrders.length === 0 && <div className="empty"><div className="empty-text">Нет активных заказов</div></div>}
          {activeOrders.map(order => {
            const dl = deadlineLabel(order.deadline);
            return (
              <div key={order.id} className="card card-hover" style={{ padding:'12px 14px' }}
                onClick={() => nav.setPage('orders')}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--text0)', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{order.title}</div>
                    <div style={{ fontSize:11, color:'var(--text2)' }}>{order.client}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0, marginLeft:10 }}>
                    <div style={{ fontSize:13, fontWeight:600, fontFamily:'var(--font-display)', color:'var(--cyan)' }}>{fmt(order.price)} ₽</div>
                    <div style={{ fontSize:10, color:dl.color, marginTop:2 }}>{dl.text}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
                  <span className="dot" style={{ background:STATUS_COLORS[order.status] }} />
                  <span style={{ fontSize:11, color:STATUS_COLORS[order.status] }}>{STATUS_LABELS[order.status]}</span>
                  {order.priority === 'high' && <span className="badge badge-red" style={{ marginLeft:'auto' }}>Срочно</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Low materials warning */}
      {lowMaterials.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <div className="section-header">
            <span className="section-title">⚠ Заканчивается материал</span>
            <button className="btn btn-sm" onClick={() => nav.go('warehouse','materials')}>Склад</button>
          </div>
          {lowMaterials.map(m => (
            <div key={m.id} className="card" style={{ marginBottom:6, padding:'10px 12px', background:'var(--amber-dim)', borderColor:'rgba(245,158,11,0.2)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:m.colorHex }} />
                  <span style={{ fontSize:12, color:'var(--text1)' }}>{m.name}</span>
                </div>
                <span style={{ fontSize:12, color:'var(--amber)', fontWeight:600 }}>{m.quantity} {m.unit}</span>
              </div>
              <div className="progress" style={{ marginTop:6, height:3 }}>
                <div className="progress-fill" style={{ width:Math.round((m.quantity/m.minQuantity)*100)+'%', background:'var(--amber)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming reminders */}
      {(() => {
        const now = Date.now();
        const upcoming = (data.reminders || [])
          .filter(r => !r.done && new Date(r.dueDate) - now < 86400000 * 7)
          .sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 3);
        if (upcoming.length === 0) return null;
        return (
          <div style={{ marginBottom:14 }}>
            <div className="section-header">
              <span className="section-title">🔔 Планировщик</span>
              <button className="btn btn-sm" onClick={() => nav.setPage('reminders')}>Все</button>
            </div>
            {upcoming.map(r => {
              const diff = new Date(r.dueDate) - now;
              const dlText  = diff < 0 ? 'просрочено' : diff < 86400000 ? 'сегодня' : `через ${Math.floor(diff/86400000)}д`;
              const dlColor = diff < 0 ? 'var(--red)' : diff < 86400000 ? 'var(--amber)' : 'var(--cyan)';
              const linkedOrder = r.orderId ? (data.orders||[]).find(o=>o.id===r.orderId) : null;
              return (
                <div key={r.id} className="card" style={{
                  marginBottom:6, padding:'10px 14px',
                  borderLeft:`3px solid ${dlColor}`,
                  display:'flex', alignItems:'center', gap:10,
                  cursor:'pointer',
                }} onClick={() => nav.setPage('reminders')}>
                  <button
                    onClick={e=>{e.stopPropagation();store.updateItem('reminders',r.id,{done:true});}}
                    style={{
                      width:20,height:20,borderRadius:5,flexShrink:0,
                      border:'2px solid var(--border2)',background:'transparent',
                      cursor:'pointer',transition:'all 0.15s',
                    }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='var(--green)'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border2)'}
                  />
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,color:'var(--text0)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.title}</div>
                    {linkedOrder && <div style={{fontSize:10,color:'var(--cyan)',marginTop:1}}>📋 {linkedOrder.title}</div>}
                  </div>
                  <span style={{fontSize:11,color:dlColor,fontWeight:600,flexShrink:0}}>{dlText}</span>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Recent transactions */}
      <div>
        <div className="section-header">
          <span className="section-title">Последние операции</span>
          <button className="btn btn-sm" onClick={() => nav.setPage('finance')}>Все</button>
        </div>
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {recentTx.map((tx, i) => (
            <div key={tx.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderBottom: i < recentTx.length-1 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontSize:12, color:'var(--text1)' }}>{tx.description}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{timeAgo(tx.date)}</div>
              </div>
              <div style={{ fontWeight:600, fontSize:13, fontFamily:'var(--font-display)', color: tx.type==='income' ? 'var(--green)' : 'var(--red)' }}>
                {tx.type==='income' ? '+' : '−'}{fmt(tx.amount)} ₽
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Printer status quick view */}
      <div style={{ marginTop:14 }}>
        <div className="section-header">
          <span className="section-title">Принтеры</span>
          <button className="btn btn-sm" onClick={() => nav.setPage('printers')}>Все</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {data.printers.map(p => {
            const dotClass = p.status==='working' ? 'dot-cyan' : p.status==='idle' ? 'dot-gray' : 'dot-amber';
            const statusLabel = { working:'Работает', idle:'Простой', maintenance:'ТО нужно', error:'Ошибка' }[p.status];
            return (
              <div key={p.id} className="card" style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                <span className={`dot ${dotClass}`} />
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:13, color:'var(--text0)', fontWeight:500 }}>{p.name}</span>
                </div>
                <span style={{ fontSize:11, color:'var(--text2)' }}>{statusLabel}</span>
                <span style={{ fontSize:11, color:'var(--text3)' }}>{p.hoursTotal}ч</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
