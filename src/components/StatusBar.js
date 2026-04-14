import React, { useContext } from 'react';
import { StoreContext, NavContext, AuthContext } from '../App';

function fmt(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'М';
  if (n >= 1000) return (n/1000).toFixed(0) + 'к';
  return n.toString();
}

export default function StatusBar() {
  const store = useContext(StoreContext);
  const nav = useContext(NavContext);
  const auth = useContext(AuthContext);
  const s = store.getFinanceStats();
  const alerts = store.getAlerts();

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--bg1)', borderBottom: '1px solid var(--border)',
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      {/* App header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px 8px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'var(--cyan)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <polygon points="8,2 14,12 2,12" fill="#080f18"/>
              <polygon points="8,5 12,12 4,12" fill="rgba(255,255,255,0.3)"/>
            </svg>
          </div>
          <div>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, color:'var(--text0)', letterSpacing:'-0.3px' }}>ENOT SPACE</span>
            {auth?.userData && (
              <div style={{ fontSize:9, color:'var(--text3)', marginTop:1 }}>
                {auth.userData.displayName || auth.user.email}
                {store.syncing && <span style={{ marginLeft:4, color:'var(--cyan)' }}>● синхр...</span>}
                {store.syncError && (
                  <span
                    style={{ marginLeft:4, color:'var(--red)', cursor:'pointer' }}
                    title={store.syncError}
                    onClick={() => console.error('Sync error:', store.syncError)}
                  >
                    ● ошибка (клик для деталей)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {alerts.length > 0 && (
            <div style={{ position:'relative', cursor:'pointer' }} onClick={() => nav.setPage('dashboard')}>
              <span style={{ fontSize:16 }}>🔔</span>
              <span style={{ position:'absolute', top:-3, right:-3, background:'var(--red)', color:'#fff', fontSize:9, fontWeight:700, width:14, height:14, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>{alerts.length}</span>
            </div>
          )}
          <button className="btn btn-sm" onClick={() => nav.setPage('stone')} style={{ padding:'4px 10px', fontSize:11 }}>
            🪨 Фокус
          </button>
        </div>
      </div>

      {/* Finance strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', borderTop:'1px solid var(--border)', padding:'6px 0' }}>
        {[
          { label:'Сегодня', value: fmt(s.todayIncome)+'₽', color:'var(--cyan)' },
          { label:'Неделя', value: fmt(s.weekIncome)+'₽', color:'var(--text0)' },
          { label:'Месяц', value: fmt(s.monthIncome)+'₽', color:'var(--text0)' },
          { label:'Прибыль', value: fmt(s.monthProfit)+'₽', color: s.monthProfit >= 0 ? 'var(--green)' : 'var(--red)' },
          { label:'Заказы', value: s.activeOrders + (s.urgentOrders > 0 ? ' ⚡'+s.urgentOrders : ''), color: s.urgentOrders > 0 ? 'var(--amber)' : 'var(--text0)' },
        ].map((item, i) => (
          <div key={i} style={{ textAlign:'center', padding:'2px 0', borderLeft: i > 0 ? '1px solid var(--border)' : 'none', cursor:'pointer' }}
            onClick={() => nav.setPage(i < 4 ? 'finance' : 'orders')}>
            <div style={{ fontSize:10, color:'var(--text2)', letterSpacing:'0.05em', marginBottom:2 }}>{item.label}</div>
            <div style={{ fontSize:13, fontWeight:600, fontFamily:'var(--font-display)', color:item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Goal progress bar */}
      {(() => {
        const goal = store.data.settings.monthlyGoal;
        const curr = s.monthIncome;
        const pct = Math.min(100, Math.round((curr / goal) * 100));
        return (
          <div style={{ padding:'0 16px 8px', display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ flex:1 }}>
              <div className="progress">
                <div className="progress-fill" style={{ width:pct+'%', background: pct >= 100 ? 'var(--green)' : 'linear-gradient(90deg, var(--cyan2), var(--cyan))' }} />
              </div>
            </div>
            <span style={{ fontSize:10, color:'var(--text2)', whiteSpace:'nowrap' }}>Цель {pct}%</span>
          </div>
        );
      })()}
    </div>
  );
}
