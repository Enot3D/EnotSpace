import React, { useState, useContext } from 'react';
import { StoreContext } from '../App';
import { v4 as uuid } from 'uuid';

// ─── Note Card Component ─────────────────────────────────────────────────
function NoteCard({ note, onDelete, onOpen }) {
  const lines = note.body.split('\n');
  const preview = lines.slice(1).join(' ').slice(0, 100);

  return (
    <div
      className="card card-hover"
      style={{padding:'12px 14px',cursor:'pointer'}}
      onClick={() => onOpen()}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
        <div style={{fontSize:13,fontWeight:600,color:'var(--text0)',flex:1}}>{note.title}</div>
        <button
          onClick={(e) => { e.stopPropagation(); if(window.confirm('Удалить заметку?')) onDelete(note.id); }}
          style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--text3)',fontSize:16,padding:'0 4px',lineHeight:1}}>
          ×
        </button>
      </div>
      {preview && (
        <div style={{fontSize:11,color:'var(--text2)',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {preview}{lines.slice(1).join(' ').length > 100 ? '...' : ''}
        </div>
      )}
      <div style={{fontSize:10,color:'var(--text3)'}}>
        {new Date(note.createdAt).toLocaleDateString('ru-RU', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
      </div>
    </div>
  );
}

// ─── Note Modal Component ────────────────────────────────────────────────
function NoteModal({ note, onClose, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(note.body);

  const save = () => {
    if (!editText.trim()) return;
    onUpdate(note.id, editText);
    setEditing(false);
    onClose();
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-title">{editing ? 'Редактировать заметку' : note.title}</div>

        {editing ? (
          <>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              style={{minHeight:200,fontFamily:'var(--font-body)',fontSize:13}}
              autoFocus
            />
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={save}>Сохранить</button>
              <button className="btn" onClick={() => setEditing(false)}>Отмена</button>
            </div>
          </>
        ) : (
          <>
            <div style={{
              whiteSpace:'pre-wrap',
              fontSize:13,
              color:'var(--text1)',
              lineHeight:1.6,
              marginBottom:12,
              maxHeight:400,
              overflowY:'auto',
            }}>
              {note.body}
            </div>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:12}}>
              {new Date(note.createdAt).toLocaleString('ru-RU')}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn" style={{flex:1,borderColor:'var(--cyan)',color:'var(--cyan)'}} onClick={() => setEditing(true)}>
                ✏ Редактировать
              </button>
              <button className="btn btn-danger" onClick={() => {
                if(window.confirm('Удалить заметку?')) { onDelete(note.id); onClose(); }
              }}>
                Удалить
              </button>
              <button className="btn" onClick={onClose}>Закрыть</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Subtask Row with Edit ───────────────────────────────────────────────
function SubtaskRow({ task, order, store, toggleTask, deleteTask }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(task.title);

  const saveEdit = () => {
    if (!editText.trim()) return;
    const prev = (store.data.subtasks||{})[order.id] || [];
    store.update(d => ({
      ...d,
      subtasks: {
        ...(d.subtasks||{}),
        [order.id]: prev.map(t => t.id===task.id ? {...t, title:editText.trim()} : t)
      }
    }));
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{
        display:'flex',alignItems:'center',gap:8,padding:'12px 14px',
        borderBottom:'1px solid var(--border)',background:'var(--bg3)',
      }}>
        <input
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') setEditing(false);
          }}
          style={{flex:1,fontSize:13,marginBottom:0}}
          autoFocus
        />
        <button
          onClick={saveEdit}
          style={{
            background:'var(--cyan)',color:'var(--bg0)',border:'none',
            borderRadius:6,padding:'6px 12px',cursor:'pointer',fontSize:12,fontWeight:600,
          }}>
          ✓
        </button>
        <button
          onClick={() => setEditing(false)}
          style={{
            background:'transparent',border:'none',cursor:'pointer',
            color:'var(--text3)',fontSize:16,padding:'0 4px',
          }}>
          ×
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display:'flex',alignItems:'center',gap:10,padding:'12px 14px',
      borderBottom:'1px solid var(--border)',
      opacity: task.done ? 0.5 : 1,
    }}>
      <button
        onClick={()=>toggleTask(task.id)}
        style={{
          width:22,height:22,borderRadius:6,
          border: task.done ? '2px solid var(--green)' : '2px solid var(--border2)',
          background: task.done ? 'var(--green)' : 'transparent',
          cursor:'pointer',flexShrink:0,
          display:'flex',alignItems:'center',justifyContent:'center',
          color: task.done ? 'var(--bg0)' : 'transparent',
          fontSize:12,fontWeight:700,
          transition:'all 0.15s',
        }}
        onMouseEnter={e=>{if(!task.done) e.currentTarget.style.borderColor='var(--cyan)';}}
        onMouseLeave={e=>{if(!task.done) e.currentTarget.style.borderColor='var(--border2)';}}>
        {task.done ? '✓' : ''}
      </button>
      <span
        style={{
          flex:1,fontSize:13,
          color: task.done ? 'var(--text2)' : 'var(--text0)',
          textDecoration: task.done ? 'line-through' : 'none',
          cursor:'pointer',
        }}
        onClick={() => setEditing(true)}>
        {task.title}
      </span>
      <button
        onClick={() => setEditing(true)}
        style={{
          background:'transparent',border:'none',cursor:'pointer',
          color:'var(--text3)',fontSize:14,padding:'0 6px',
        }}>
        ✏
      </button>
      <button
        onClick={()=>deleteTask(task.id)}
        style={{
          background:'transparent',border:'none',cursor:'pointer',
          color:'var(--text3)',fontSize:16,padding:'0 4px',lineHeight:1,
        }}>
        ×
      </button>
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────
function fmt(n) { return new Intl.NumberFormat('ru-RU').format(Math.round(n)); }

function DeadlineBadge({ deadline }) {
  const diff = new Date(deadline) - Date.now();
  if (diff < 0)           return <span style={{fontSize:11,color:'var(--red)'}}>просрочен</span>;
  if (diff < 86400000)    return <span style={{fontSize:11,color:'var(--amber)'}}>сдача сегодня</span>;
  return <span style={{fontSize:11,color:'var(--text3)'}}>через {Math.floor(diff/86400000)} д</span>;
}

// ─── Focus tab (original Stone mode) ────────────────────────────────────
function FocusTab({ store, selectedOrderId, setSelectedOrderId }) {
  const [noteText, setNoteText] = useState('');
  const activeOrders = (store.data.orders || []).filter(o => ['new','in_progress'].includes(o.status));
  const currentTask  = activeOrders.find(o => o.id === selectedOrderId) || activeOrders[0];
  const printer      = currentTask ? (store.data.printers||[]).find(p => p.id === currentTask.printerId) : null;

  // Получаем подзадачи текущего проекта
  const subtasks = currentTask ? ((store.data.subtasks||{})[currentTask.id] || []) : [];
  const activeTasks = subtasks.filter(t => !t.done);
  const currentSubtask = activeTasks[0]; // Первая невыполненная задача
  const doneCnt = subtasks.filter(t => t.done).length;
  const pct = subtasks.length > 0 ? Math.round((doneCnt/subtasks.length)*100) : 0;

  const completeCurrentSubtask = () => {
    if (!currentTask || !currentSubtask) return;
    const prev = (store.data.subtasks||{})[currentTask.id] || [];
    store.update(d => ({
      ...d,
      subtasks: {
        ...(d.subtasks||{}),
        [currentTask.id]: prev.map(t => t.id===currentSubtask.id ? {...t, done:true} : t)
      }
    }));
  };

  const saveNote = () => {
    if (!noteText.trim()) return;
    const lines = noteText.split('\n');
    store.addItem('notes', { id:uuid(), title:lines[0]||'Заметка', body:noteText, createdAt:new Date().toISOString() });
    setNoteText('');
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Stone mode card */}
      <div className="card" style={{textAlign:'center',padding:'28px 20px',borderColor:'rgba(34,208,228,0.2)'}}>
        <div style={{
          width:64,height:64,borderRadius:'50%',
          border:'2px solid var(--cyan)',
          margin:'0 auto 16px',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,
        }}>⬡</div>
        <div style={{fontSize:10,color:'var(--cyan)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:6}}>
          Полный фокус
        </div>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:20}}>Режим камня</h2>

        {/* Project selector */}
        {activeOrders.length > 1 && (
          <div style={{marginBottom:14}}>
            <select
              value={currentTask?.id || ''}
              onChange={e => setSelectedOrderId(e.target.value)}
              style={{width:'100%',textAlign:'center',fontSize:13}}>
              {activeOrders.map(o => (
                <option key={o.id} value={o.id}>{o.title} · {o.client}</option>
              ))}
            </select>
          </div>
        )}

        {currentTask ? (
          <>
            <div style={{background:'var(--bg3)',borderRadius:10,padding:'12px 14px',marginBottom:14,textAlign:'left'}}>
              <div style={{fontSize:10,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>
                Активный проект
              </div>
              <div style={{fontSize:15,fontWeight:600,color:'var(--text0)',marginBottom:3}}>{currentTask.title}</div>
              <div style={{fontSize:11,color:'var(--text2)',marginBottom:8}}>
                {currentTask.client}
                {printer && <> · 🖨 {printer.name}</>}
                {' · '}
                <DeadlineBadge deadline={currentTask.deadline}/>
              </div>
              {subtasks.length > 0 && (
                <>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text2)',marginBottom:6}}>
                    <span>Прогресс: {doneCnt} из {subtasks.length}</span>
                    <span style={{color:'var(--cyan)',fontWeight:600}}>{pct}%</span>
                  </div>
                  <div className="progress" style={{height:6}}>
                    <div className="progress-fill" style={{width:pct+'%',background:pct===100?'var(--green)':'var(--cyan)'}}/>
                  </div>
                </>
              )}
            </div>

            {/* Текущая подзадача */}
            {currentSubtask ? (
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,color:'var(--cyan)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8,fontWeight:600}}>
                  Текущая задача
                </div>
                <div className="card" style={{padding:'16px',borderColor:'rgba(34,208,228,0.3)',textAlign:'center'}}>
                  <div style={{fontSize:16,fontWeight:600,color:'var(--text0)',marginBottom:16}}>
                    {currentSubtask.title}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{width:'100%',justifyContent:'center',fontSize:14,padding:'12px'}}
                    onClick={completeCurrentSubtask}>
                    ✓ Выполнить задачу
                  </button>
                </div>
              </div>
            ) : subtasks.length > 0 ? (
              <div style={{marginBottom:14}}>
                <div className="card" style={{padding:'20px',textAlign:'center',background:'var(--green-dim)',borderColor:'rgba(34,217,138,0.3)'}}>
                  <div style={{fontSize:24,marginBottom:8}}>🎉</div>
                  <div style={{fontSize:14,fontWeight:600,color:'var(--green)',marginBottom:12}}>
                    Все задачи выполнены!
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{width:'100%',justifyContent:'center',background:'var(--green)',borderColor:'var(--green)'}}
                    onClick={() => store.updateItem('orders', currentTask.id, {status:'done'})}>
                    ✓ Завершить проект
                  </button>
                </div>
              </div>
            ) : (
              <div style={{marginBottom:14}}>
                <div className="card" style={{padding:'16px',textAlign:'center',background:'var(--bg3)'}}>
                  <div style={{fontSize:13,color:'var(--text2)',marginBottom:8}}>
                    Нет подзадач для этого проекта
                  </div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>
                    Перейди в "Проект" чтобы разбить на задачи
                  </div>
                </div>
              </div>
            )}

            {subtasks.length === 0 && (
              <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',fontSize:14,padding:'12px'}}
                onClick={() => store.updateItem('orders', currentTask.id, {status:'done'})}>
                ✓ Завершить проект
              </button>
            )}
          </>
        ) : (
          <div style={{color:'var(--text2)',fontSize:13}}>
            Нет активных задач. Возьми новый заказ!
          </div>
        )}
      </div>

      {/* Quick note */}
      <div className="card">
        <div style={{fontSize:10,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>
          Заметки
        </div>
        <h3 style={{fontSize:16,fontWeight:600,marginBottom:12}}>Записать мысль</h3>
        <textarea
          value={noteText} onChange={e=>setNoteText(e.target.value)}
          placeholder={'Напиши заметку, идею, план или мысль по задаче...\nПервая строка станет заголовком'}
          style={{minHeight:110,marginBottom:10,background:'var(--bg3)'}}/>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={saveNote}>Сохранить заметку</button>
          <button className="btn" onClick={()=>setNoteText('')}>Очистить</button>
        </div>
      </div>

      {/* Recent notes */}
      {(store.data.notes||[]).length > 0 && (
        <div>
          <div className="section-title" style={{marginBottom:8}}>Последние заметки</div>
          {(store.data.notes||[]).slice(-3).reverse().map(n => (
            <div key={n.id} className="card" style={{marginBottom:8,padding:'12px 14px'}}>
              <div style={{fontSize:13,fontWeight:500,color:'var(--text0)',marginBottom:4}}>{n.title}</div>
              <div style={{fontSize:11,color:'var(--text2)',whiteSpace:'pre-wrap'}}>
                {n.body.split('\n').slice(1).join('\n').slice(0,100)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Project tab — pick order, split into subtasks ───────────────────────
function ProjectTab({ store, setTab, selectedOrderId, setSelectedOrderId }) {
  const orders = (store.data.orders||[]).filter(o => !['issued'].includes(o.status));
  const [newTask, setNewTask] = useState('');
  const [createProjectMode, setCreateProjectMode] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ title: '', client: '', deadline: '' });
  const [noteModal, setNoteModal] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Auto-select first order if none selected
  React.useEffect(() => {
    if (!selectedOrderId && orders.length > 0) {
      setSelectedOrderId(orders.find(o=>o.status==='in_progress')?.id || orders[0]?.id);
    }
  }, [orders, selectedOrderId, setSelectedOrderId]);

  const order = orders.find(o => o.id === selectedOrderId);
  const subtasks = order ? ((store.data.subtasks||{})[order.id] || []) : [];
  const projectNotes = order ? ((store.data.projectNotes||{})[order.id] || []) : [];
  const doneCnt = subtasks.filter(t => t.done).length;
  const pct = subtasks.length > 0 ? Math.round((doneCnt/subtasks.length)*100) : 0;

  const createStandaloneProject = () => {
    if (!newProjectForm.title.trim()) return alert('Укажи название проекта');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);

    const newOrder = {
      id: uuid(),
      title: newProjectForm.title.trim(),
      client: newProjectForm.client.trim() || 'Личный проект',
      status: 'new',
      deadline: newProjectForm.deadline || tomorrow.toISOString(),
      price: 0,
      cost: 0,
      paid: false,
      createdAt: new Date().toISOString(),
    };

    store.addItem('orders', newOrder);
    setSelectedOrderId(newOrder.id);
    setCreateProjectMode(false);
    setNewProjectForm({ title: '', client: '', deadline: '' });
  };

  const addSubtask = () => {
    if (!newTask.trim() || !order) return;
    const task = { id:uuid(), title:newTask.trim(), done:false, createdAt:new Date().toISOString() };
    const prev = (store.data.subtasks||{})[order.id] || [];
    store.update(d => ({
      ...d,
      subtasks: { ...(d.subtasks||{}), [order.id]: [...prev, task] }
    }));
    setNewTask('');
  };

  const toggleTask = (taskId) => {
    if (!order) return;
    const prev = (store.data.subtasks||{})[order.id] || [];
    store.update(d => ({
      ...d,
      subtasks: {
        ...(d.subtasks||{}),
        [order.id]: prev.map(t => t.id===taskId ? {...t, done:!t.done} : t)
      }
    }));
  };

  const deleteTask = (taskId) => {
    if (!order) return;
    const prev = (store.data.subtasks||{})[order.id] || [];
    store.update(d => ({
      ...d,
      subtasks: {
        ...(d.subtasks||{}),
        [order.id]: prev.filter(t => t.id!==taskId)
      }
    }));
  };

  const clearDone = () => {
    if (!order) return;
    const prev = (store.data.subtasks||{})[order.id] || [];
    store.update(d => ({
      ...d,
      subtasks: { ...(d.subtasks||{}), [order.id]: prev.filter(t=>!t.done) }
    }));
  };

  const saveNote = () => {
    if (!newNoteText.trim() || !order) return;
    const lines = newNoteText.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;

    const note = {
      id: uuid(),
      title: lines[0].trim(),
      body: newNoteText.trim(),
      createdAt: new Date().toISOString(),
    };

    const prev = (store.data.projectNotes||{})[order.id] || [];
    store.update(d => ({
      ...d,
      projectNotes: { ...(d.projectNotes||{}), [order.id]: [...prev, note] }
    }));
    setNewNoteText('');
  };

  const deleteNote = (noteId) => {
    if (!order) return;
    const prev = (store.data.projectNotes||{})[order.id] || [];
    store.update(d => ({
      ...d,
      projectNotes: { ...(d.projectNotes||{}), [order.id]: prev.filter(n => n.id !== noteId) }
    }));
  };

  const updateNote = (noteId, newBody) => {
    if (!order) return;
    const lines = newBody.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;

    const prev = (store.data.projectNotes||{})[order.id] || [];
    store.update(d => ({
      ...d,
      projectNotes: {
        ...(d.projectNotes||{}),
        [order.id]: prev.map(n => n.id === noteId ? { ...n, title: lines[0].trim(), body: newBody.trim() } : n)
      }
    }));
  };

  if (createProjectMode) {
    return (
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="card" style={{padding:'16px'}}>
          <div style={{fontSize:16,fontWeight:600,marginBottom:12,color:'var(--cyan)'}}>
            Создать новый проект
          </div>

          <div className="form-group">
            <label>Название проекта *</label>
            <input
              value={newProjectForm.title}
              onChange={e => setNewProjectForm(p => ({...p, title: e.target.value}))}
              placeholder="Разработка нового продукта..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Клиент / Описание</label>
            <input
              value={newProjectForm.client}
              onChange={e => setNewProjectForm(p => ({...p, client: e.target.value}))}
              placeholder="Личный проект, Компания X..."
            />
          </div>

          <div className="form-group">
            <label>Дедлайн</label>
            <input
              type="date"
              value={newProjectForm.deadline ? newProjectForm.deadline.slice(0, 10) : ''}
              onChange={e => setNewProjectForm(p => ({...p, deadline: e.target.value}))}
            />
          </div>

          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={createStandaloneProject}>
              Создать проект
            </button>
            <button className="btn" onClick={() => setCreateProjectMode(false)}>
              Отмена
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="empty" style={{marginTop:40}}>
        <div className="empty-icon">📋</div>
        <div className="empty-text">Нет активных проектов</div>
        <div className="empty-sub">Создай проект чтобы разбить его на задачи</div>
        <button className="btn btn-primary" style={{marginTop:16}} onClick={() => setCreateProjectMode(true)}>
          + Создать проект
        </button>
      </div>
    );
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* Order picker */}
      <div className="card" style={{padding:'14px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontSize:10,color:'var(--cyan)',textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:600}}>
            Выбрать проект
          </div>
          <button
            className="btn btn-sm"
            style={{fontSize:11,padding:'4px 10px',borderColor:'var(--cyan)',color:'var(--cyan)'}}
            onClick={() => setCreateProjectMode(true)}>
            + Новый
          </button>
        </div>
        <select
          value={selectedOrderId}
          onChange={e=>setSelectedOrderId(e.target.value)}
          style={{marginBottom:0}}>
          <option value="">— выбрать проект —</option>
          {orders.map(o => {
            const tasks  = ((store.data.subtasks||{})[o.id]||[]);
            const done   = tasks.filter(t=>t.done).length;
            const label  = `${o.title} · ${o.client}${tasks.length>0?' ('+done+'/'+tasks.length+')':''}`;
            return <option key={o.id} value={o.id}>{label}</option>;
          })}
        </select>
      </div>

      {/* Selected order info */}
      {order && (
        <div className="card" style={{padding:'14px',borderColor:'rgba(34,208,228,0.25)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:600,color:'var(--text0)'}}>{order.title}</div>
              <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>
                {order.client} · <DeadlineBadge deadline={order.deadline}/>
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:16,fontWeight:700,fontFamily:'var(--font-display)',color:'var(--cyan)'}}>{fmt(order.price)} ₽</div>
            </div>
          </div>

          {subtasks.length > 0 && (
            <>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text2)',marginBottom:6}}>
                <span>Выполнено {doneCnt} из {subtasks.length} задач</span>
                <span style={{color:'var(--cyan)',fontWeight:600}}>{pct}%</span>
              </div>
              <div className="progress" style={{height:6,marginBottom:10}}>
                <div className="progress-fill" style={{
                  width:pct+'%',
                  background: pct===100 ? 'var(--green)' : 'var(--cyan)'
                }}/>
              </div>
            </>
          )}

          <button
            className="btn"
            style={{width:'100%',justifyContent:'center',borderColor:'var(--cyan)',color:'var(--cyan)'}}
            onClick={() => {
              if (order.status !== 'in_progress') {
                store.updateItem('orders', order.id, {status: 'in_progress'});
              }
              setTab('focus');
            }}>
            🪨 Перейти в режим фокуса
          </button>
        </div>
      )}

      {/* Add subtask */}
      {order && (
        <div style={{display:'flex',gap:8}}>
          <input
            value={newTask}
            onChange={e=>setNewTask(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&addSubtask()}
            placeholder="Новая задача... (Enter)"
            style={{flex:1}}/>
          <button className="btn btn-primary" onClick={addSubtask} style={{flexShrink:0,padding:'8px 14px'}}>
            +
          </button>
        </div>
      )}

      {/* Subtask list */}
      {order && (
        <div>
          {subtasks.length === 0 ? (
            <div className="card" style={{padding:'20px',textAlign:'center'}}>
              <div style={{fontSize:24,marginBottom:8}}>🗂</div>
              <div style={{fontSize:13,color:'var(--text2)'}}>Разбей проект на маленькие задачи</div>
              <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>
                Например: «сделать 3D-модель», «нарезать G-code», «запустить печать»
              </div>
            </div>
          ) : (
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              {/* Active tasks first */}
              {subtasks.filter(t=>!t.done).map((task,i,arr) => (
                <SubtaskRow key={task.id} task={task} order={order} store={store} toggleTask={toggleTask} deleteTask={deleteTask} />
              ))}

              {/* Done tasks */}
              {subtasks.filter(t=>t.done).map((task) => (
                <SubtaskRow key={task.id} task={task} order={order} store={store} toggleTask={toggleTask} deleteTask={deleteTask} />
              ))}

              {/* Footer */}
              {doneCnt > 0 && (
                <div style={{padding:'8px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:11,color:'var(--text3)'}}>Выполнено: {doneCnt}</span>
                  <button className="btn btn-sm" style={{fontSize:10,color:'var(--text2)'}} onClick={clearDone}>
                    Очистить выполненные
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mark order done if all subtasks done */}
      {order && subtasks.length > 0 && doneCnt === subtasks.length && order.status !== 'done' && (
        <div style={{
          padding:'14px',background:'var(--green-dim)',
          border:'1px solid rgba(34,217,138,0.25)',borderRadius:10,textAlign:'center',
        }}>
          <div style={{fontSize:13,color:'var(--green)',marginBottom:10}}>
            🎉 Все задачи выполнены!
          </div>
          <button
            className="btn btn-primary"
            style={{background:'var(--green)',borderColor:'var(--green)',color:'var(--bg0)',width:'100%',justifyContent:'center'}}
            onClick={()=>store.updateItem('orders',order.id,{status:'done'})}>
            ✓ Отметить заказ готовым
          </button>
        </div>
      )}

      {/* Project Notes Section */}
      {order && (
        <div>
          <div style={{fontSize:12,color:'var(--text2)',marginBottom:10,fontWeight:600}}>📝 Заметки проекта</div>

          {/* Add note */}
          <div style={{marginBottom:10}}>
            <textarea
              value={newNoteText}
              onChange={e => setNewNoteText(e.target.value)}
              placeholder={'Первая строка — название заметки\nОстальное — содержание...'}
              style={{minHeight:80,marginBottom:8}}
            />
            <button className="btn btn-primary btn-sm" onClick={saveNote} style={{width:'100%',justifyContent:'center'}}>
              + Добавить заметку
            </button>
          </div>

          {/* Notes list */}
          {projectNotes.length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {projectNotes.slice().reverse().map(note => (
                <NoteCard key={note.id} note={note} onDelete={deleteNote} onUpdate={updateNote} onOpen={() => setNoteModal(note)} />
              ))}
            </div>
          ) : (
            <div className="card" style={{padding:'16px',textAlign:'center'}}>
              <div style={{fontSize:11,color:'var(--text3)'}}>Нет заметок для этого проекта</div>
            </div>
          )}
        </div>
      )}

      {/* Note modal */}
      {noteModal && (
        <NoteModal note={noteModal} onClose={() => setNoteModal(null)} onUpdate={updateNote} onDelete={deleteNote} />
      )}
    </div>
  );
}

// ─── Main StoneMode page ─────────────────────────────────────────────────
export default function StoneMode() {
  const store = useContext(StoreContext);
  const [tab, setTab] = useState('focus');
  const [selectedOrderId, setSelectedOrderId] = useState('');

  const TABS = [
    { id:'focus',   label:'Фокус',   icon:'🪨' },
    { id:'project', label:'Проект',  icon:'📋' },
  ];

  // Count active subtasks for badge
  const allOrders   = (store.data.orders||[]).filter(o=>o.status==='in_progress');
  const totalActive = allOrders.reduce((s,o) => {
    const tasks = ((store.data.subtasks||{})[o.id]||[]);
    return s + tasks.filter(t=>!t.done).length;
  }, 0);

  return (
    <div style={{padding:'16px'}}>

      {/* Tab switcher */}
      <div style={{
        display:'grid', gridTemplateColumns:'1fr 1fr',
        gap:6, marginBottom:16,
        background:'var(--bg2)', padding:4, borderRadius:12,
        border:'1px solid var(--border)',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{
              display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              padding:'10px',border:'none',cursor:'pointer',borderRadius:9,
              background: tab===t.id ? 'var(--bg4)' : 'transparent',
              color:       tab===t.id ? 'var(--cyan)' : 'var(--text2)',
              fontFamily:'var(--font-body)',fontSize:13,fontWeight:tab===t.id?600:400,
              transition:'all 0.15s',position:'relative',
            }}>
            <span style={{fontSize:16}}>{t.icon}</span>
            {t.label}
            {t.id==='project' && totalActive>0 && (
              <span style={{
                position:'absolute',top:4,right:8,
                background:'var(--cyan)',color:'var(--bg0)',
                fontSize:9,fontWeight:700,
                width:16,height:16,borderRadius:'50%',
                display:'flex',alignItems:'center',justifyContent:'center',
              }}>{totalActive}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'focus'   && <FocusTab   store={store} selectedOrderId={selectedOrderId} setSelectedOrderId={setSelectedOrderId}/>}
      {tab === 'project' && <ProjectTab store={store} setTab={setTab} selectedOrderId={selectedOrderId} setSelectedOrderId={setSelectedOrderId}/>}
    </div>
  );
}
