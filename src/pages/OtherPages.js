import React, { useState, useContext } from 'react';
import { StoreContext, NavContext, AuthContext } from '../App';
import { v4 as uuid } from 'uuid';
import { signOut, ROLES, hasPermissionSync } from '../firebase/auth';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';

function fmt(n) { return new Intl.NumberFormat('ru-RU').format(Math.round(n)); }

// ═══════════════════════════════════════════
// PRINTERS
// ═══════════════════════════════════════════
function PrinterModal({ item, onClose, store }) {
  const isNew = !item.id;
  const [f, setF] = useState(item || { name:'', model:'', status:'idle', powerW:240, hoursTotal:0, hoursSinceMaintenance:0, maintenanceIntervalHours:200, notes:'', color:'#22d0e4', purchaseCost:0, amortizationPerHour:0 });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const save = () => {
    if (!f.name) return alert('Укажи название');
    const obj = {...f, id:f.id||uuid(), powerW:Number(f.powerW), hoursTotal:Number(f.hoursTotal), hoursSinceMaintenance:Number(f.hoursSinceMaintenance), maintenanceIntervalHours:Number(f.maintenanceIntervalHours), purchaseCost:Number(f.purchaseCost)||0, amortizationPerHour:Number(f.amortizationPerHour)||0};
    if (isNew) store.addItem('printers', obj);
    else store.updateItem('printers', obj.id, obj);
    onClose();
  };
  const del = () => { if(window.confirm('Удалить принтер?')) { store.deleteItem('printers',f.id); onClose(); }};
  const doMaintenance = () => {
    store.updateItem('printers', f.id, { hoursSinceMaintenance: 0 });
    onClose();
  };

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-title">{isNew?'Новый принтер':'Редактировать принтер'}</div>
        <div className="form-group"><label>Название *</label><input value={f.name} onChange={e=>set('name',e.target.value)} placeholder="Ender 3 Pro"/></div>
        <div className="form-group"><label>Модель</label><input value={f.model} onChange={e=>set('model',e.target.value)} placeholder="Creality Ender 3 Pro"/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Статус</label>
            <select value={f.status} onChange={e=>set('status',e.target.value)}>
              <option value="working">Работает</option>
              <option value="idle">Простой</option>
              <option value="maintenance">Нужно ТО</option>
              <option value="error">Ошибка</option>
            </select>
          </div>
          <div className="form-group"><label>Мощность (Вт)</label><input type="number" value={f.powerW} onChange={e=>set('powerW',e.target.value)}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Всего часов</label><input type="number" value={f.hoursTotal} onChange={e=>set('hoursTotal',e.target.value)}/></div>
          <div className="form-group"><label>Часов с ТО</label><input type="number" value={f.hoursSinceMaintenance} onChange={e=>set('hoursSinceMaintenance',e.target.value)}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Интервал ТО (ч)</label><input type="number" value={f.maintenanceIntervalHours} onChange={e=>set('maintenanceIntervalHours',e.target.value)}/></div>
          <div className="form-group"><label>Цвет</label><input type="color" value={f.color} onChange={e=>set('color',e.target.value)} style={{height:38,padding:'2px 4px',cursor:'pointer'}}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Стоимость покупки ₽</label><input type="number" value={f.purchaseCost} onChange={e=>set('purchaseCost',e.target.value)} placeholder="20000"/></div>
          <div className="form-group">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <label style={{margin:0}}>Амортизация ₽/ч</label>
              {f.purchaseCost > 0 && f.maintenanceIntervalHours > 0 && (
                <button className="btn btn-sm" style={{fontSize:10,padding:'1px 7px'}}
                  onClick={()=>set('amortizationPerHour', Math.round((f.purchaseCost / (f.maintenanceIntervalHours * 10)) * 100)/100)}>авто</button>
              )}
            </div>
            <input type="number" step="0.1" value={f.amortizationPerHour} onChange={e=>set('amortizationPerHour',e.target.value)} placeholder="2.5"/>
          </div>
        </div>
        <div className="form-group"><label>Заметки</label><textarea value={f.notes} onChange={e=>set('notes',e.target.value)} style={{minHeight:50}}/></div>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={save}>{isNew?'Добавить':'Сохранить'}</button>
          {!isNew && <button className="btn" style={{borderColor:'var(--green)',color:'var(--green)'}} onClick={doMaintenance}>✓ ТО сделано</button>}
          {!isNew && <button className="btn btn-danger btn-sm" onClick={del}>×</button>}
          <button className="btn" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

export function Printers() {
  const store = useContext(StoreContext);
  const [modal, setModal] = useState(null);
  const { printers } = store.data;
  const elecRate = store.data.settings.electricityRate;

  return (
    <div style={{padding:'16px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <h2 style={{fontSize:20,fontWeight:700}}>Принтеры</h2>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal({})}>+ Добавить</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
        <div className="stat-card"><div className="stat-label">Работают</div><div className="stat-value" style={{color:'var(--cyan)'}}>{printers.filter(p=>p.status==='working').length}/{printers.length}</div></div>
        <div className="stat-card"><div className="stat-label">Нужно ТО</div><div className="stat-value" style={{color:'var(--amber)'}}>{printers.filter(p=>p.hoursSinceMaintenance>=p.maintenanceIntervalHours).length}</div></div>
      </div>
      {printers.map(p => {
        const toMaint = p.maintenanceIntervalHours - p.hoursSinceMaintenance;
        const needsMaint = p.hoursSinceMaintenance >= p.maintenanceIntervalHours;
        const maintPct = Math.min(100, Math.round((p.hoursSinceMaintenance/p.maintenanceIntervalHours)*100));
        const elecPerHour = (p.powerW/1000)*elecRate;
        const dotClass = {working:'dot-cyan',idle:'dot-gray',maintenance:'dot-amber',error:'dot-red'}[p.status]||'dot-gray';
        const statusLabel = {working:'Работает',idle:'Простой',maintenance:'Нужно ТО',error:'Ошибка'}[p.status];
        return (
          <div key={p.id} className="card card-hover" style={{marginBottom:10,padding:'14px'}} onClick={()=>setModal(p)}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <span className={`dot ${dotClass}`}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:'var(--text0)'}}>{p.name}</div>
                <div style={{fontSize:11,color:'var(--text2)'}}>{p.model}</div>
              </div>
              <span style={{fontSize:11,color:dotClass.includes('cyan')?'var(--cyan)':dotClass.includes('amber')?'var(--amber)':'var(--text2)'}}>{statusLabel}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
              {[['Наработка',p.hoursTotal+'ч'],['Мощность',p.powerW+'Вт'],['Эл-во/ч',elecPerHour.toFixed(2)+'₽']].map(([l,v])=>(
                <div key={l} style={{textAlign:'center',padding:'6px',background:'var(--bg3)',borderRadius:8}}>
                  <div style={{fontSize:10,color:'var(--text3)'}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:500,color:'var(--text1)',marginTop:2}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:'var(--text2)',marginBottom:6,display:'flex',justifyContent:'space-between'}}>
              <span>До ТО: {needsMaint ? <span style={{color:'var(--red)'}}>требуется!</span> : toMaint+'ч'}</span>
              <span>{maintPct}% ресурса</span>
            </div>
            <div className="progress"><div className="progress-fill" style={{width:maintPct+'%',background:needsMaint?'var(--red)':maintPct>70?'var(--amber)':'var(--cyan)'}}/></div>
            {p.notes && <div style={{fontSize:11,color:'var(--text3)',marginTop:8}}>{p.notes}</div>}
          </div>
        );
      })}
      {printers.length===0 && <div className="empty"><div className="empty-icon">🖨</div><div className="empty-text">Нет принтеров</div></div>}
      {modal !== null && <PrinterModal item={modal} onClose={()=>setModal(null)} store={store}/>}
    </div>
  );
}

// ═══════════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════════
function ClientModal({ item, onClose, store }) {
  const isNew = !item.id;
  const [f, setF] = useState(item || { name:'', phone:'', email:'', notes:'', tags:[] });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const save = () => {
    if (!f.name) return alert('Укажи имя');
    const obj = {...f, id:f.id||uuid(), createdAt:f.createdAt||new Date().toISOString()};
    if (isNew) store.addItem('clients', obj);
    else store.updateItem('clients', obj.id, obj);
    onClose();
  };
  const del = () => { if(window.confirm('Удалить клиента?')) { store.deleteItem('clients',f.id); onClose(); }};
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-title">{isNew?'Новый клиент':'Редактировать клиента'}</div>
        <div className="form-group"><label>Имя / Компания *</label><input value={f.name} onChange={e=>set('name',e.target.value)} placeholder="Иван Петров"/></div>
        <div className="form-group"><label>Телефон</label><input value={f.phone} onChange={e=>set('phone',e.target.value)} placeholder="+7 900 000-00-00"/></div>
        <div className="form-group"><label>Email</label><input value={f.email} onChange={e=>set('email',e.target.value)} placeholder="email@mail.ru"/></div>
        <div className="form-group"><label>Заметки</label><textarea value={f.notes} onChange={e=>set('notes',e.target.value)} style={{minHeight:60}}/></div>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={save}>{isNew?'Добавить':'Сохранить'}</button>
          {!isNew && <button className="btn btn-danger btn-sm" onClick={del}>Удалить</button>}
          <button className="btn" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

export function Clients() {
  const store = useContext(StoreContext);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const { clients, orders } = store.data;
  const filtered = clients.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{padding:'16px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <h2 style={{fontSize:20,fontWeight:700}}>Клиенты</h2>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal({})}>+ Добавить</button>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Поиск клиента..." style={{marginBottom:12}}/>
      {filtered.map(c => {
        const clientOrders = orders.filter(o=>o.client===c.name);
        const total = clientOrders.reduce((s,o)=>s+o.price,0);
        const active = clientOrders.filter(o=>['new','in_progress'].includes(o.status)).length;
        return (
          <div key={c.id} className="card card-hover" style={{marginBottom:8,padding:'12px 14px'}} onClick={()=>setModal(c)}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:'var(--cyan-dim)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:14,fontWeight:600,color:'var(--cyan)'}}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,color:'var(--text0)'}}>{c.name}</div>
                <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>{c.phone||c.email||'Нет контактов'}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:13,fontWeight:600,fontFamily:'var(--font-display)',color:'var(--cyan)'}}>{fmt(total)} ₽</div>
                <div style={{fontSize:10,color:'var(--text3)'}}>{clientOrders.length} заказов{active>0?` · ${active} актив.`:''}</div>
              </div>
            </div>
            {c.notes && <div style={{fontSize:11,color:'var(--text3)',marginTop:8,paddingTop:8,borderTop:'1px solid var(--border)'}}>{c.notes}</div>}
          </div>
        );
      })}
      {filtered.length===0 && <div className="empty"><div className="empty-icon">👤</div><div className="empty-text">Нет клиентов</div></div>}
      {modal !== null && <ClientModal item={modal} onClose={()=>setModal(null)} store={store}/>}
    </div>
  );
}

// ═══════════════════════════════════════════
// GOALS
// ═══════════════════════════════════════════
function GoalModal({ item, onClose, store }) {
  const isNew = !item.id;
  const [f, setF] = useState(item || { title:'', type:'revenue', target:'', current:'0', deadline:new Date(Date.now()+86400000*30).toISOString().slice(0,10), done:false, color:'#22d0e4' });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const save = () => {
    if (!f.title||!f.target) return alert('Укажи название и цель');
    const obj = {...f, id:f.id||uuid(), target:Number(f.target), current:Number(f.current), deadline:new Date(f.deadline).toISOString()};
    if (isNew) store.addItem('goals', obj);
    else store.updateItem('goals', obj.id, obj);
    onClose();
  };
  const del = () => { if(window.confirm('Удалить цель?')) { store.deleteItem('goals',f.id); onClose(); }};
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-title">{isNew?'Новая цель':'Редактировать цель'}</div>
        <div className="form-group"><label>Название *</label><input value={f.title} onChange={e=>set('title',e.target.value)} placeholder="Заработать 100 000 ₽ за май"/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Тип</label>
            <select value={f.type} onChange={e=>set('type',e.target.value)}>
              <option value="revenue">Выручка</option>
              <option value="profit">Прибыль</option>
              <option value="orders">Заказы</option>
              <option value="quality">Качество %</option>
              <option value="custom">Произвольная</option>
            </select>
          </div>
          <div className="form-group"><label>Цвет</label><input type="color" value={f.color} onChange={e=>set('color',e.target.value)} style={{height:38,padding:'2px 4px',cursor:'pointer'}}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Цель</label><input type="number" value={f.target} onChange={e=>set('target',e.target.value)} placeholder="100000"/></div>
          <div className="form-group"><label>Текущее</label><input type="number" value={f.current} onChange={e=>set('current',e.target.value)} placeholder="0"/></div>
        </div>
        <div className="form-group"><label>Дедлайн</label><input type="date" value={f.deadline?.slice(0,10)||''} onChange={e=>set('deadline',e.target.value)}/></div>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={save}>{isNew?'Создать':'Сохранить'}</button>
          {!isNew && <button className="btn btn-danger btn-sm" onClick={del}>×</button>}
          <button className="btn" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

export function Goals() {
  const store = useContext(StoreContext);
  const [modal, setModal] = useState(null);
  const { goals } = store.data;
  const active = goals.filter(g=>!g.done);
  const done = goals.filter(g=>g.done);

  return (
    <div style={{padding:'16px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <h2 style={{fontSize:20,fontWeight:700}}>Цели</h2>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal({})}>+ Цель</button>
      </div>
      <div style={{marginBottom:14}}>
        {active.map(g => {
          const pct = Math.min(100, Math.round((g.current/g.target)*100));
          const dl = new Date(g.deadline)-Date.now();
          return (
            <div key={g.id} className="card card-hover" style={{marginBottom:10,padding:'14px'}} onClick={()=>setModal(g)}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:500,color:'var(--text0)',flex:1,paddingRight:10}}>{g.title}</div>
                <div style={{fontSize:20,fontWeight:700,fontFamily:'var(--font-display)',color:g.color,flexShrink:0}}>{pct}%</div>
              </div>
              <div className="progress" style={{height:8,marginBottom:8}}>
                <div className="progress-fill" style={{width:pct+'%',background:g.color}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text2)'}}>
                <span>{fmt(g.current)} / {fmt(g.target)}</span>
                <span>{dl>0?'до '+new Date(g.deadline).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):<span style={{color:'var(--red)'}}>просрочена</span>}</span>
              </div>
              {pct>=100 && (
                <div style={{marginTop:8,textAlign:'center'}}>
                  <button className="btn btn-sm" style={{borderColor:'var(--green)',color:'var(--green)'}}
                    onClick={e=>{e.stopPropagation();store.updateItem('goals',g.id,{done:true})}}>
                    ✓ Отметить выполненной
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {active.length===0 && <div className="empty"><div className="empty-icon">🎯</div><div className="empty-text">Нет активных целей</div><div className="empty-sub">Добавь первую цель</div></div>}
      </div>
      {done.length>0 && (
        <div>
          <div className="section-title" style={{marginBottom:10}}>Выполненные ({done.length})</div>
          {done.map(g=>(
            <div key={g.id} className="card" style={{marginBottom:8,padding:'12px 14px',opacity:0.6,cursor:'pointer'}} onClick={()=>setModal(g)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:12,color:'var(--text1)'}}>{g.title}</div>
                <span className="badge badge-green">✓ Выполнено</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal !== null && <GoalModal item={modal} onClose={()=>setModal(null)} store={store}/>}
    </div>
  );
}

// ═══════════════════════════════════════════
// STONE MODE — Focus + Project Tasks
// ═══════════════════════════════════════════
export function StoneMode() {
  const store = React.useContext(StoreContext);
  const [tab, setTab] = useState('focus');       // focus | project
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [noteText, setNoteText] = useState('');

  const orders = (store.data.orders||[]).filter(o=>['new','in_progress'].includes(o.status));
  const currentTask = store.data.orders?.find(o=>o.status==='in_progress') || orders[0];
  const printer = currentTask ? (store.data.printers||[]).find(p=>p.id===currentTask.printerId) : null;

  // Subtasks for selected order
  const focusOrderId = selectedOrderId || currentTask?.id || '';
  const focusOrder = (store.data.orders||[]).find(o=>o.id===focusOrderId);
  const subtasks = (store.data.subtasks||{})[focusOrderId] || [];
  const doneTasks = subtasks.filter(t=>t.done).length;
  const pct = subtasks.length>0 ? Math.round((doneTasks/subtasks.length)*100) : 0;

  const addTask = () => {
    if (!newTaskTitle.trim() || !focusOrderId) return;
    const updated = { ...(store.data.subtasks||{}), [focusOrderId]: [...subtasks, { id:uuid(), title:newTaskTitle.trim(), done:false, createdAt:new Date().toISOString() }] };
    store.update(d=>({...d, subtasks:updated}));
    setNewTaskTitle('');
  };

  const toggleTask = (tid) => {
    const updated = { ...(store.data.subtasks||{}), [focusOrderId]: subtasks.map(t=>t.id===tid?{...t,done:!t.done}:t) };
    store.update(d=>({...d, subtasks:updated}));
  };

  const deleteTask = (tid) => {
    const updated = { ...(store.data.subtasks||{}), [focusOrderId]: subtasks.filter(t=>t.id!==tid) };
    store.update(d=>({...d, subtasks:updated}));
  };

  const saveNote = () => {
    if (!noteText.trim()) return;
    const lines = noteText.split('\n');
    store.addItem('notes', { id:uuid(), title:lines[0]||'Заметка', body:noteText, createdAt:new Date().toISOString() });
    setNoteText('');
  };

  return (
    <div style={{ padding:'16px' }}>

      {/* Tab switcher */}
      <div style={{ display:'flex', background:'var(--bg2)', borderRadius:12, padding:3, marginBottom:16 }}>
        {[{id:'focus',label:'🪨 Фокус'},{id:'project',label:'📋 Задачи проекта'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1, padding:'8px 0', borderRadius:9, border:'none', cursor:'pointer',
            background:tab===t.id?'var(--bg4)':'transparent',
            color:tab===t.id?'var(--text0)':'var(--text2)',
            fontFamily:'var(--font-body)', fontSize:13, fontWeight:tab===t.id?500:400,
            transition:'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── FOCUS TAB ─────────────────────────────── */}
      {tab==='focus' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card" style={{ textAlign:'center', padding:'24px 20px', borderColor:'rgba(34,208,228,0.2)' }}>
            <div style={{ width:60,height:60,borderRadius:'50%',border:'2px solid var(--cyan)',margin:'0 auto 16px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24 }}>⬡</div>
            <div style={{ fontSize:10, color:'var(--cyan)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:6 }}>Полный фокус</div>
            <h2 style={{ fontSize:20, fontWeight:700, marginBottom:16 }}>Режим камня</h2>
            {currentTask ? (
              <>
                <div style={{ fontSize:11,color:'var(--text2)',marginBottom:4 }}>Текущий заказ</div>
                <div style={{ fontSize:15, fontWeight:600, color:'var(--text0)', marginBottom:4 }}>{currentTask.title}</div>
                <div style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>{currentTask.client}</div>
                {printer && <div style={{ fontSize:11, color:'var(--cyan)', marginBottom:12 }}>🖨 {printer.name}</div>}
                {/* Subtask progress */}
                {subtasks.length>0 && (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text2)', marginBottom:6 }}>
                      <span>Подзадачи</span><span>{doneTasks}/{subtasks.length} ({pct}%)</span>
                    </div>
                    <div className="progress" style={{ height:6 }}>
                      <div className="progress-fill" style={{ width:pct+'%', background:'var(--cyan)' }}/>
                    </div>
                  </div>
                )}
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={()=>{ store.updateItem('orders',currentTask.id,{status:'done'}); }}>
                    ✓ Завершить заказ
                  </button>
                  <button className="btn btn-sm" style={{ borderColor:'var(--purple)', color:'var(--purple)' }} onClick={()=>{ setSelectedOrderId(currentTask.id); setTab('project'); }}>
                    Задачи
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color:'var(--text2)', fontSize:13 }}>Нет активных заказов</div>
            )}
          </div>

          {/* Note */}
          <div className="card">
            <div style={{ fontSize:11, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Заметка</div>
            <textarea value={noteText} onChange={e=>setNoteText(e.target.value)}
              placeholder={"Мысль, идея, план...\nПервая строка — заголовок"}
              style={{ minHeight:100, marginBottom:10, background:'var(--bg3)' }}/>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={saveNote}>Сохранить</button>
              <button className="btn" onClick={()=>setNoteText('')}>Очистить</button>
            </div>
          </div>

          {/* Recent notes */}
          {(store.data.notes||[]).length>0 && (
            <div>
              <div className="section-title" style={{ marginBottom:8 }}>Последние заметки</div>
              {(store.data.notes||[]).slice(-3).reverse().map(n=>(
                <div key={n.id} className="card" style={{ marginBottom:8, padding:'12px 14px' }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--text0)', marginBottom:4 }}>{n.title}</div>
                  <div style={{ fontSize:11, color:'var(--text2)', whiteSpace:'pre-wrap' }}>{n.body.split('\n').slice(1).join('\n').slice(0,100)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PROJECT TASKS TAB ─────────────────────── */}
      {tab==='project' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Order picker */}
          <div className="card" style={{ padding:'12px 14px' }}>
            <label style={{ fontSize:11, color:'var(--text2)', marginBottom:6, display:'block', textTransform:'uppercase', letterSpacing:'0.07em' }}>
              Проект (заказ)
            </label>
            <select value={focusOrderId} onChange={e=>setSelectedOrderId(e.target.value)}
              style={{ fontWeight:500 }}>
              <option value="">— выбрать заказ —</option>
              {orders.map(o=>(
                <option key={o.id} value={o.id}>{o.title} · {o.client}</option>
              ))}
              {/* Also show done orders */}
              {(store.data.orders||[]).filter(o=>o.status==='done').map(o=>(
                <option key={o.id} value={o.id}>[Готово] {o.title}</option>
              ))}
            </select>
          </div>

          {focusOrder && (
            <>
              {/* Order summary */}
              <div className="card" style={{ padding:'12px 14px', borderColor:'rgba(34,208,228,0.2)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'var(--text0)' }}>{focusOrder.title}</div>
                    <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{focusOrder.client}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:14, fontWeight:600, fontFamily:'var(--font-display)', color:'var(--cyan)' }}>{focusOrder.price?.toLocaleString()} ₽</div>
                    {subtasks.length>0 && <div style={{ fontSize:11, color:'var(--text2)' }}>{doneTasks}/{subtasks.length} задач</div>}
                  </div>
                </div>
                {subtasks.length>0 && (
                  <div style={{ marginTop:10 }}>
                    <div className="progress" style={{ height:5 }}>
                      <div className="progress-fill" style={{ width:pct+'%', background: pct===100?'var(--green)':'var(--cyan)' }}/>
                    </div>
                    <div style={{ fontSize:10, color:'var(--text2)', marginTop:4 }}>{pct}% выполнено</div>
                  </div>
                )}
              </div>

              {/* Add task */}
              <div style={{ display:'flex', gap:8 }}>
                <input value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)}
                  placeholder="Новая подзадача..."
                  onKeyDown={e=>e.key==='Enter'&&addTask()}
                  style={{ flex:1 }}/>
                <button className="btn btn-primary btn-sm" onClick={addTask} style={{ flexShrink:0 }}>+</button>
              </div>

              {/* Task list */}
              {subtasks.length===0 && (
                <div className="empty" style={{ padding:'24px 0' }}>
                  <div className="empty-icon">✅</div>
                  <div className="empty-text">Нет подзадач</div>
                  <div className="empty-sub">Разбей заказ на маленькие шаги</div>
                </div>
              )}

              {subtasks.map((task, i)=>(
                <div key={task.id} style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'12px 14px', background:'var(--bg2)', borderRadius:10,
                  border:'1px solid var(--border)', opacity:task.done?0.5:1,
                  transition:'opacity 0.2s',
                }}>
                  <div
                    onClick={()=>toggleTask(task.id)}
                    style={{
                      width:20, height:20, borderRadius:6, flexShrink:0, cursor:'pointer',
                      border: task.done ? 'none' : '2px solid var(--border2)',
                      background: task.done ? 'var(--green)' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:12, color:'var(--bg0)', transition:'all 0.15s',
                    }}>
                    {task.done ? '✓' : ''}
                  </div>
                  <span style={{
                    flex:1, fontSize:13, color:'var(--text0)',
                    textDecoration: task.done ? 'line-through' : 'none',
                  }}>{task.title}</span>
                  <button onClick={()=>deleteTask(task.id)} style={{
                    background:'none', border:'none', color:'var(--text3)', cursor:'pointer',
                    fontSize:16, padding:'0 4px', lineHeight:1,
                  }}>×</button>
                </div>
              ))}

              {pct===100 && subtasks.length>0 && (
                <div style={{ textAlign:'center', padding:'12px', background:'var(--green-dim)', border:'1px solid rgba(34,217,138,0.2)', borderRadius:10 }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>🎉</div>
                  <div style={{ fontSize:13, color:'var(--green)', fontWeight:600 }}>Все задачи выполнены!</div>
                </div>
              )}
            </>
          )}

          {!focusOrder && orders.length===0 && (
            <div className="empty"><div className="empty-icon">📋</div><div className="empty-text">Нет активных заказов</div></div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// MORE
// ═══════════════════════════════════════════
export function More() {
  const store = useContext(StoreContext);
  const nav = useContext(NavContext);
  const auth = useContext(AuthContext);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [botUsername, setBotUsername] = useState('');
  const { settings } = store.data;
  const [s, setS] = useState(settings);

  // Получаем информацию о боте при открытии настроек
  React.useEffect(() => {
    if (settingsOpen) {
      // Используем хардкод имени бота
      setBotUsername('enotspacebot');
    }
  }, [settingsOpen]);

  const saveSettings = () => {
    store.update(d => ({...d, settings:{ ...d.settings, ...s, electricityRate:Number(s.electricityRate), defaultMargin:Number(s.defaultMargin), monthlyGoal:Number(s.monthlyGoal), weeklyGoal:Number(s.weeklyGoal), laborRatePerHour:Number(s.laborRatePerHour)||0, reservePercent:Number(s.reservePercent)||0 }}));
    setSettingsOpen(false);
  };

  const handleLogout = async () => {
    if (window.confirm('Выйти из системы?')) {
      await signOut();
    }
  };

  const isAdmin = auth?.userData?.role === ROLES.ADMIN;
  const canManageUsers = hasPermissionSync(auth?.userData?.role, 'canManageUsers');
  const canManageRoles = hasPermissionSync(auth?.userData?.role, 'canManageRoles');

  const MENU_ITEMS = [
    { icon:'🖨', label:'Принтеры', page:'printers' },
    { icon:'👤', label:'Клиенты', page:'clients' },
    { icon:'🎯', label:'Цели', page:'goals' },
    { icon:'🪨', label:'Режим камня', page:'stone' },
  ];

  if (showUserManagement) {
    return <UserManagement />;
  }

  if (showRoleManagement) {
    return <RoleManagement />;
  }

  return (
    <div style={{padding:'16px'}}>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>Ещё</h2>
      <div className="card" style={{padding:0,overflow:'hidden',marginBottom:14}}>
        {MENU_ITEMS.map((item,i)=>(
          <div key={item.page} className="list-item" style={{padding:'14px',cursor:'pointer',borderBottom:i<MENU_ITEMS.length-1?'1px solid var(--border)':'none',borderRadius:0}}
            onClick={()=>nav.setPage(item.page)}>
            <span style={{fontSize:18}}>{item.icon}</span>
            <span style={{fontSize:13,color:'var(--text0)',flex:1}}>{item.label}</span>
            <span style={{color:'var(--text3)'}}>›</span>
          </div>
        ))}
      </div>

      <div className="card" style={{padding:0,overflow:'hidden',marginBottom:14}}>
        <div className="list-item" style={{padding:'14px',cursor:'pointer'}} onClick={()=>setSettingsOpen(true)}>
          <span style={{fontSize:18}}>⚙️</span>
          <span style={{fontSize:13,color:'var(--text0)',flex:1}}>Настройки</span>
          <span style={{color:'var(--text3)'}}>›</span>
        </div>
        {canManageUsers && (
          <div className="list-item" style={{padding:'14px',cursor:'pointer',borderTop:'1px solid var(--border)'}} onClick={()=>setShowUserManagement(true)}>
            <span style={{fontSize:18}}>👥</span>
            <span style={{fontSize:13,color:'var(--text0)',flex:1}}>Управление пользователями</span>
            <span style={{color:'var(--text3)'}}>›</span>
          </div>
        )}
        {canManageRoles && (
          <div className="list-item" style={{padding:'14px',cursor:'pointer',borderTop:'1px solid var(--border)'}} onClick={()=>setShowRoleManagement(true)}>
            <span style={{fontSize:18}}>🎭</span>
            <span style={{fontSize:13,color:'var(--text0)',flex:1}}>Управление ролями</span>
            <span style={{color:'var(--text3)'}}>›</span>
          </div>
        )}
        <div className="list-item" style={{padding:'14px',cursor:'pointer',borderTop:'1px solid var(--border)'}} onClick={handleLogout}>
          <span style={{fontSize:18}}>🚪</span>
          <span style={{fontSize:13,color:'var(--red)',flex:1}}>Выйти</span>
          <span style={{color:'var(--text3)'}}>›</span>
        </div>
      </div>

      {/* App info */}
      <div className="card" style={{padding:'14px',textAlign:'center'}}>
        <div style={{fontSize:24,marginBottom:8}}>⬡</div>
        <div style={{fontFamily:'var(--font-display)',fontSize:16,fontWeight:700,color:'var(--cyan)',marginBottom:4}}>ENOT SPACE</div>
        <div style={{fontSize:11,color:'var(--text3)'}}>Система управления производством</div>
        <div style={{fontSize:10,color:'var(--text3)',marginTop:4}}>v1.0 · Данные хранятся локально</div>
      </div>

      {settingsOpen && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setSettingsOpen(false)}>
          <div className="modal">
            <div className="modal-handle"/>
            <div className="modal-title">Настройки</div>
            <div className="form-group"><label>Название бизнеса</label><input value={s.businessName} onChange={e=>setS(p=>({...p,businessName:e.target.value}))}/></div>
            <div className="form-group"><label>Цель на месяц ₽</label><input type="number" value={s.monthlyGoal} onChange={e=>setS(p=>({...p,monthlyGoal:e.target.value}))}/></div>
            <div className="form-group"><label>Цель на неделю ₽</label><input type="number" value={s.weeklyGoal} onChange={e=>setS(p=>({...p,weeklyGoal:e.target.value}))}/></div>
            <div className="form-group"><label>Стоимость кВт·ч (₽)</label><input type="number" step="0.1" value={s.electricityRate} onChange={e=>setS(p=>({...p,electricityRate:e.target.value}))}/></div>
            <div className="form-group"><label>Наценка по умолчанию (%)</label><input type="number" value={s.defaultMargin} onChange={e=>setS(p=>({...p,defaultMargin:e.target.value}))}/></div>
            <div className="form-group"><label>Ставка оператора (₽/ч, 0 = не учитывать)</label><input type="number" value={s.laborRatePerHour||0} onChange={e=>setS(p=>({...p,laborRatePerHour:e.target.value}))}/></div>
            <div className="form-group">
              <label>Резерв «Чёрный день» (% от каждого заказа)</label>
              <input type="number" min="0" max="50" value={s.reservePercent||0} onChange={e=>setS(p=>({...p,reservePercent:e.target.value}))} placeholder="10"/>
              <div style={{fontSize:11,color:'var(--text2)',marginTop:3}}>Авто-списывается при оплате заказа в отдельную категорию «Резерв»</div>
            </div>

            <div style={{height:1,background:'var(--border)',margin:'16px 0'}}/>

            {/* Telegram Settings */}
            <div style={{fontSize:11,color:'var(--cyan)',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:8}}>
              📱 Уведомления Telegram
            </div>
            <div className="form-group">
              <label>Telegram Chat ID</label>
              <input
                value={s.telegramChatId||''}
                onChange={e=>setS(p=>({...p,telegramChatId:e.target.value}))}
                placeholder="123456789"
              />
              <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>
                {botUsername ? (
                  <>
                    1. Открой бота{' '}
                    <a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer" style={{color:'var(--cyan)'}}>
                      @{botUsername}
                    </a>
                    {' '}и напиши /start<br/>
                    2. Скопируй Chat ID и вставь сюда
                  </>
                ) : (
                  <>
                    Чтобы получить Chat ID: напиши боту <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" style={{color:'var(--cyan)'}}>@userinfobot</a>
                  </>
                )}
              </div>
            </div>

            {s.telegramChatId && (
              <div style={{background:'var(--green-dim)',border:'1px solid rgba(34,217,138,0.25)',borderRadius:8,padding:'10px 12px',marginBottom:12}}>
                <div style={{fontSize:11,color:'var(--green)',display:'flex',alignItems:'center',gap:6}}>
                  <span>✓</span>
                  <span>Telegram подключен! Уведомления будут приходить автоматически.</span>
                </div>
              </div>
            )}

            <div style={{display:'flex',gap:8,marginTop:8}}>>
              <button className="btn btn-primary" style={{flex:1}} onClick={saveSettings}>Сохранить</button>
              <button className="btn" onClick={()=>setSettingsOpen(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
