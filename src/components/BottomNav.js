import React, { useContext } from 'react';
import { NavContext } from '../App';

const NAV_ITEMS = [
  { id:'dashboard',  icon:'⬡',  label:'Главная' },
  { id:'orders',     icon:'📋', label:'Заказы' },
  { id:'warehouse',  icon:'🏭', label:'Склад' },
  { id:'reminders',  icon:'🔔', label:'План' },
  { id:'more',       icon:'⋯',  label:'Ещё' },
];

export default function BottomNav() {
  const { page, setPage } = useContext(NavContext);

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'var(--bg1)', borderTop: '1px solid var(--border)',
      display: 'grid', gridTemplateColumns: 'repeat(5,1fr)',
      paddingBottom: 'var(--safe-bottom)',
      height: 'calc(var(--nav-h) + var(--safe-bottom))',
    }}>
      {NAV_ITEMS.map(item => {
        const active = page === item.id;
        return (
          <button key={item.id} onClick={() => setPage(item.id)}
            style={{
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap: 3, border:'none', background:'transparent', cursor:'pointer',
              color: active ? 'var(--cyan)' : 'var(--text2)',
              transition: 'color 0.15s',
              padding: '8px 0 4px',
              position: 'relative',
            }}>
            {active && (
              <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:24, height:2, background:'var(--cyan)', borderRadius:'0 0 2px 2px' }} />
            )}
            <span style={{ fontSize:18, lineHeight:1 }}>{item.icon}</span>
            <span style={{ fontSize:10, fontWeight: active ? 500 : 400, letterSpacing:'0.03em' }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
