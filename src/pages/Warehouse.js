import React, { useState, useContext } from 'react';
import { StoreContext } from '../App';
import { v4 as uuid } from 'uuid';

function fmt(n) { return new Intl.NumberFormat('ru-RU').format(Math.round(n)); }

// ───── Material Modal ─────
function MatModal({ item, onClose, store }) {
  const isNew = !item.id;

  // costPer100g from spool: price / (kg * 1000) * 100
  const calcPer100g = (price, kg) => {
    const p = Number(price); const k = Number(kg);
    if (p > 0 && k > 0) return Math.round((p / (k * 1000)) * 100 * 100) / 100;
    return '';
  };

  const [f, setF] = useState(() => {
    const base = item || {
      name:'', type:'PLA', colorHex:'#22d0e4', brand:'',
      spoolPrice:'', spoolWeightKg:1,
      costPer100g:'',
      quantity:'', unit:'г', minQuantity:300, supplier:'', notes:'',
    };
    return base;
  });

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  // Recalc costPer100g whenever spool inputs change
  const handlePrice  = v => { set('spoolPrice',     v); const c = calcPer100g(v, f.spoolWeightKg); if(c!=='') set('costPer100g', c); };
  const handleWeight = v => { set('spoolWeightKg',  v); const c = calcPer100g(f.spoolPrice, v);    if(c!=='') set('costPer100g', c); };

  const per100g  = calcPer100g(f.spoolPrice, f.spoolWeightKg);
  const perGram  = per100g !== '' ? (Number(per100g) / 100).toFixed(3) : '';
  const totalGrams = Number(f.spoolWeightKg) * 1000;

  const save = () => {
    if (!f.name) return alert('Укажи название');
    const obj = {
      ...f, id: f.id || uuid(),
      quantity:     Number(f.quantity)     || 0,
      minQuantity:  Number(f.minQuantity)  || 0,
      costPer100g:  Number(f.costPer100g)  || 0,
      spoolWeightKg:Number(f.spoolWeightKg)|| 1,
      spoolPrice:   Number(f.spoolPrice)   || 0,
    };
    if (isNew) store.addItem('materials', obj);
    else       store.updateItem('materials', obj.id, obj);
    onClose();
  };
  const del = () => { if (window.confirm('Удалить?')) { store.deleteItem('materials', f.id); onClose(); } };

  return (
    <div className="overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-title">{isNew ? 'Новый материал' : 'Редактировать'}</div>

        {/* Name */}
        <div className="form-group">
          <label>Название *</label>
          <input value={f.name} onChange={e=>set('name',e.target.value)} placeholder="PLA Чёрный" autoFocus/>
        </div>

        {/* Type + unit */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group">
            <label>Тип</label>
            <select value={f.type} onChange={e=>set('type',e.target.value)}>
              {['PLA','PETG','ABS','ASA','Resin','TPU','Нейлон','Другое'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Ед. учёта</label>
            <select value={f.unit} onChange={e=>set('unit',e.target.value)}>
              {['г','кг','мл','л','шт'].map(u=><option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* ── Spool price block ─────────────────────────────────── */}
        <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10,padding:'14px',marginBottom:12}}>
          <div style={{fontSize:11,color:'var(--cyan)',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:12}}>
            🧮 Цена по катушке
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div className="form-group" style={{marginBottom:0}}>
              <label>Цена катушки ₽</label>
              <input type="number" min="0" step="10" value={f.spoolPrice}
                onChange={e=>handlePrice(e.target.value)} placeholder="1 900"/>
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label>Вес катушки кг</label>
              <input type="number" min="0.1" step="0.25" value={f.spoolWeightKg}
                onChange={e=>handleWeight(e.target.value)} placeholder="1"/>
            </div>
          </div>

          {/* Result pills */}
          {per100g !== '' && (
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <div style={{
                flex:1,background:'var(--bg2)',borderRadius:8,padding:'8px 12px',
                display:'flex',flexDirection:'column',alignItems:'center',
              }}>
                <div style={{fontSize:10,color:'var(--text3)',marginBottom:3}}>за 100г</div>
                <div style={{fontSize:18,fontWeight:700,fontFamily:'var(--font-display)',color:'var(--green)'}}>{per100g} ₽</div>
              </div>
              <div style={{
                flex:1,background:'var(--bg2)',borderRadius:8,padding:'8px 12px',
                display:'flex',flexDirection:'column',alignItems:'center',
              }}>
                <div style={{fontSize:10,color:'var(--text3)',marginBottom:3}}>за 1г</div>
                <div style={{fontSize:18,fontWeight:700,fontFamily:'var(--font-display)',color:'var(--cyan)'}}>{perGram} ₽</div>
              </div>
              <div style={{
                flex:1,background:'var(--bg2)',borderRadius:8,padding:'8px 12px',
                display:'flex',flexDirection:'column',alignItems:'center',
              }}>
                <div style={{fontSize:10,color:'var(--text3)',marginBottom:3}}>г в катушке</div>
                <div style={{fontSize:18,fontWeight:700,fontFamily:'var(--font-display)',color:'var(--text1)'}}>{totalGrams}г</div>
              </div>
            </div>
          )}
        </div>

        {/* costPer100g — auto-filled, can override */}
        <div className="form-group">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
            <label style={{margin:0}}>Цена за 100г ₽ (используется в расчётах)</label>
            {per100g !== '' && String(Number(f.costPer100g)) !== String(per100g) && (
              <span style={{fontSize:10,color:'var(--amber)',cursor:'pointer'}} onClick={()=>set('costPer100g',per100g)}>
                ↺ {per100g} ₽
              </span>
            )}
          </div>
          <input type="number" step="0.01" value={f.costPer100g}
            onChange={e=>set('costPer100g',e.target.value)}
            placeholder="авто из катушки ↑"/>
        </div>

        {/* Stock */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group">
            <label>Остаток на складе ({f.unit})</label>
            <input type="number" value={f.quantity} onChange={e=>set('quantity',e.target.value)} placeholder="1000"/>
          </div>
          <div className="form-group">
            <label>Минимум (порог)</label>
            <input type="number" value={f.minQuantity} onChange={e=>set('minQuantity',e.target.value)} placeholder="300"/>
          </div>
        </div>

        {/* Brand + color */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Бренд</label><input value={f.brand} onChange={e=>set('brand',e.target.value)} placeholder="Bambu Lab"/></div>
          <div className="form-group"><label>Цвет</label><input type="color" value={f.colorHex} onChange={e=>set('colorHex',e.target.value)} style={{height:38,padding:'2px 4px',cursor:'pointer'}}/></div>
        </div>

        <div className="form-group"><label>Поставщик</label><input value={f.supplier} onChange={e=>set('supplier',e.target.value)} placeholder="AliExpress"/></div>
        <div className="form-group"><label>Заметки</label><textarea value={f.notes} onChange={e=>set('notes',e.target.value)} style={{minHeight:50}}/></div>

        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={save}>{isNew ? 'Добавить' : 'Сохранить'}</button>
          {!isNew && <button className="btn btn-danger btn-sm" onClick={del}>Удалить</button>}
          <button className="btn" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

// ───── Sell Product Modal ─────
function SellModal({ product, onClose, store }) {
  const [qty, setQty] = useState(1);
  const [client, setClient] = useState('');
  const [notes, setNotes] = useState('');

  const totalPrice = product.price * qty;
  const totalCost = product.cost * qty;
  const profit = totalPrice - totalCost;

  const sell = () => {
    if (qty <= 0) return alert('Укажи количество');
    if (qty > product.quantity) return alert('Недостаточно товара на складе');

    // Списываем со склада
    store.updateItem('products', product.id, {
      quantity: product.quantity - qty
    });

    // Записываем доход в финансы
    store.addItem('transactions', {
      id: uuid(),
      type: 'income',
      category: 'order',
      amount: totalPrice,
      description: `Продажа: ${product.name} (${qty} шт)${client ? ' · ' + client : ''}`,
      date: new Date().toISOString(),
      productId: product.id,
    });

    // Записываем себестоимость как расход (для учёта)
    if (totalCost > 0) {
      store.addItem('transactions', {
        id: uuid(),
        type: 'expense',
        category: 'materials',
        amount: totalCost,
        description: `Себестоимость: ${product.name} (${qty} шт)`,
        date: new Date().toISOString(),
        productId: product.id,
      });
    }

    onClose();
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-title">Списать товар</div>

        <div style={{background:'var(--bg3)',borderRadius:10,padding:'14px',marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:500,color:'var(--text0)',marginBottom:4}}>{product.name}</div>
          <div style={{fontSize:11,color:'var(--text2)'}}>
            На складе: {product.quantity} шт · Цена: {fmt(product.price)} ₽/шт
          </div>
        </div>

        <div className="form-group">
          <label>Количество *</label>
          <input type="number" min="1" max={product.quantity} value={qty}
            onChange={e => setQty(Number(e.target.value))} autoFocus/>
        </div>

        <div className="form-group">
          <label>Клиент (необязательно)</label>
          <input value={client} onChange={e => setClient(e.target.value)}
            placeholder="Имя клиента или компании"/>
        </div>

        <div className="form-group">
          <label>Примечание</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Дополнительная информация..." style={{minHeight:60}}/>
        </div>

        {/* Summary */}
        <div style={{background:'var(--green-dim)',border:'1px solid rgba(34,217,138,0.25)',borderRadius:10,padding:'12px',marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:12,color:'var(--text2)'}}>Выручка:</span>
            <span style={{fontSize:14,fontWeight:600,color:'var(--green)'}}>{fmt(totalPrice)} ₽</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:12,color:'var(--text2)'}}>Себестоимость:</span>
            <span style={{fontSize:14,fontWeight:600,color:'var(--red)'}}>{fmt(totalCost)} ₽</span>
          </div>
          <div style={{height:'1px',background:'var(--border)',margin:'8px 0'}}/>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:13,color:'var(--text1)',fontWeight:600}}>Прибыль:</span>
            <span style={{fontSize:16,fontWeight:700,fontFamily:'var(--font-display)',color:'var(--green)'}}>{fmt(profit)} ₽</span>
          </div>
        </div>

        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-primary" style={{flex:1,background:'var(--green)',borderColor:'var(--green)'}} onClick={sell}>
            Списать {qty} шт
          </button>
          <button className="btn" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

// ───── Product Modal ─────
function ProdModal({ item, onClose, store }) {
  const isNew = !item.id;
  const [f, setF] = useState(item || { name:'', sku:'', category:'', quantity:'', reservedQty:'', materialId:'', materialGrams:'', cost:'', price:'', printerId:'', printHours:'', notes:'' });
  const set = (k,v) => setF(p => ({...p,[k]:v}));

  // Auto-calc cost
  React.useEffect(() => {
    if (!f.materialId || !f.materialGrams) return;
    const mat = store.data.materials.find(m=>m.id===f.materialId);
    const printer = store.data.printers.find(p=>p.id===f.printerId);
    if (!mat) return;
    const matCost = (Number(f.materialGrams)/100)*mat.costPer100g;
    const elecCost = printer ? (Number(f.printHours)||0)*(printer.powerW/1000)*store.data.settings.electricityRate : 0;
    setF(p=>({...p, cost:Math.round(matCost+elecCost)}));
  }, [f.materialId, f.materialGrams, f.printerId, f.printHours]);

  const save = () => {
    if (!f.name) return alert('Укажи название');
    const obj = { ...f, id:f.id||uuid(), quantity:Number(f.quantity)||0, reservedQty:Number(f.reservedQty)||0, materialGrams:Number(f.materialGrams)||0, cost:Number(f.cost)||0, price:Number(f.price)||0, printHours:Number(f.printHours)||0, createdAt:f.createdAt||new Date().toISOString() };
    if (isNew) store.addItem('products', obj);
    else store.updateItem('products', obj.id, obj);
    onClose();
  };
  const del = () => { if(window.confirm('Удалить?')) { store.deleteItem('products',f.id); onClose(); }};

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-title">{isNew?'Новый товар':'Редактировать товар'}</div>
        <div className="form-group"><label>Название *</label><input value={f.name} onChange={e=>set('name',e.target.value)} placeholder="Корпус камеры v2"/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Артикул (SKU)</label><input value={f.sku} onChange={e=>set('sku',e.target.value)} placeholder="CAM-002"/></div>
          <div className="form-group"><label>Категория</label><input value={f.category} onChange={e=>set('category',e.target.value)} placeholder="Электроника"/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>На складе (шт)</label><input type="number" value={f.quantity} onChange={e=>set('quantity',e.target.value)}/></div>
          <div className="form-group"><label>Зарезервировано</label><input type="number" value={f.reservedQty} onChange={e=>set('reservedQty',e.target.value)}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Материал</label>
            <select value={f.materialId} onChange={e=>set('materialId',e.target.value)}>
              <option value="">— выбрать —</option>
              {store.data.materials.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Граммов на шт</label><input type="number" value={f.materialGrams} onChange={e=>set('materialGrams',e.target.value)} placeholder="120"/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Принтер</label>
            <select value={f.printerId} onChange={e=>set('printerId',e.target.value)}>
              <option value="">— выбрать —</option>
              {store.data.printers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Часов печати</label><input type="number" step="0.5" value={f.printHours} onChange={e=>set('printHours',e.target.value)}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Себестоимость ₽</label><input type="number" value={f.cost} onChange={e=>set('cost',e.target.value)}/></div>
          <div className="form-group"><label>Цена продажи ₽</label><input type="number" value={f.price} onChange={e=>set('price',e.target.value)}/></div>
        </div>
        <div className="form-group"><label>Заметки</label><textarea value={f.notes} onChange={e=>set('notes',e.target.value)} style={{minHeight:50}}/></div>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={save}>{isNew?'Добавить':'Сохранить'}</button>
          {!isNew && <button className="btn btn-danger btn-sm" onClick={del}>Удалить</button>}
          <button className="btn" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

// ───── Purchase Modal ─────
function PurchaseModal({ onClose, store }) {
  const [f, setF] = useState({
    materialId:'', spoolCount:1, spoolWeightKg:1, spoolPrice:'',
    supplier:'', date:new Date().toISOString().slice(0,10), notes:'',
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const mat        = store.data.materials.find(m => m.id === f.materialId);
  const spoolGrams = Number(f.spoolWeightKg) * 1000;
  const totalGrams = spoolGrams * Number(f.spoolCount || 1);
  const totalCost  = Number(f.spoolPrice || 0) * Number(f.spoolCount || 1);
  const per100g    = (f.spoolPrice > 0 && f.spoolWeightKg > 0)
    ? Math.round((Number(f.spoolPrice) / spoolGrams) * 100 * 100) / 100
    : null;

  const save = () => {
    if (!f.materialId)    return alert('Выбери материал');
    if (!f.spoolPrice)    return alert('Укажи цену катушки');
    if (!f.spoolWeightKg) return alert('Укажи вес катушки');

    const unit = mat?.unit || 'г';
    const obj = {
      id: uuid(), materialId: f.materialId, materialName: mat?.name||'',
      quantity: totalGrams, unit,
      totalCost, supplier: f.supplier,
      date: new Date(f.date).toISOString(), notes: f.notes,
      spoolCount: Number(f.spoolCount), spoolWeightKg: Number(f.spoolWeightKg), spoolPrice: Number(f.spoolPrice),
    };
    store.addItem('purchases', obj);

    // Update stock + recalc price per 100g
    const updates = {
      quantity: (mat?.quantity||0) + totalGrams,
      spoolPrice: Number(f.spoolPrice),
      spoolWeightKg: Number(f.spoolWeightKg),
    };
    if (per100g) updates.costPer100g = per100g;
    store.updateItem('materials', f.materialId, updates);

    // Finance transaction
    if (totalCost > 0) {
      store.addItem('transactions', {
        id:uuid(), type:'expense', category:'materials',
        amount: totalCost,
        description: `Закупка: ${mat?.name||''} ${f.spoolCount}×${f.spoolWeightKg}кг`,
        date: new Date().toISOString(),
      });
    }
    onClose();
  };

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-title">Закупка материала</div>

        {/* Material picker */}
        <div className="form-group">
          <label>Материал *</label>
          <select value={f.materialId} onChange={e=>set('materialId',e.target.value)}>
            <option value="">— выбрать —</option>
            {(store.data.materials||[]).map(m=>(
              <option key={m.id} value={m.id}>{m.name} (ост. {m.quantity}{m.unit})</option>
            ))}
          </select>
        </div>

        {/* Spool params */}
        <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10,padding:'14px',marginBottom:12}}>
          <div style={{fontSize:11,color:'var(--cyan)',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:12}}>
            📦 Катушки
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
            <div className="form-group" style={{marginBottom:0}}>
              <label>Кол-во катушек</label>
              <input type="number" min="1" step="1" value={f.spoolCount}
                onChange={e=>set('spoolCount',e.target.value)} placeholder="1"/>
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label>Вес 1 катушки кг</label>
              <input type="number" min="0.1" step="0.25" value={f.spoolWeightKg}
                onChange={e=>set('spoolWeightKg',e.target.value)} placeholder="1"/>
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label>Цена 1 катушки ₽</label>
              <input type="number" min="0" step="10" value={f.spoolPrice}
                onChange={e=>set('spoolPrice',e.target.value)} placeholder="1 900"/>
            </div>
          </div>

          {/* Live result */}
          {per100g && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {[
                { label:'Итого граммов', value: totalGrams+'г',  color:'var(--text1)' },
                { label:'Итого сумма',   value: totalCost+'₽',   color:'var(--red)'   },
                { label:'За 100г',       value: per100g+'₽',     color:'var(--green)' },
              ].map(s=>(
                <div key={s.label} style={{background:'var(--bg2)',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                  <div style={{fontSize:10,color:'var(--text3)',marginBottom:3}}>{s.label}</div>
                  <div style={{fontSize:15,fontWeight:700,fontFamily:'var(--font-display)',color:s.color}}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supplier + date */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-group"><label>Поставщик</label><input value={f.supplier} onChange={e=>set('supplier',e.target.value)} placeholder="AliExpress"/></div>
          <div className="form-group"><label>Дата</label><input type="date" value={f.date} onChange={e=>set('date',e.target.value)}/></div>
        </div>
        <div className="form-group"><label>Заметки</label><textarea value={f.notes} onChange={e=>set('notes',e.target.value)} style={{minHeight:50}}/></div>

        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={save}>
            Оприходовать {per100g ? `(${totalGrams}г · ${totalCost}₽)` : ''}
          </button>
          <button className="btn" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

// ───── Main Warehouse Page ─────
export default function Warehouse({ sub }) {
  const store = useContext(StoreContext);
  const [tab, setTab] = useState(sub==='products' ? 'products' : 'materials');
  const [modal, setModal] = useState(null);
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [sellModal, setSellModal] = useState(null);

  const { materials, products } = store.data;
  const totalMatValue = materials.reduce((s,m) => s+(m.quantity/100*m.costPer100g),0);
  const totalProdValue = products.reduce((s,p) => s+p.quantity*p.cost,0);
  const totalProdRevenue = products.reduce((s,p) => s+p.quantity*p.price,0);

  return (
    <div style={{padding:'16px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <h2 style={{fontSize:20,fontWeight:700}}>Склад</h2>
        <div style={{display:'flex',gap:6}}>
          {tab==='materials' && <button className="btn btn-sm" style={{borderColor:'var(--amber)',color:'var(--amber)'}} onClick={()=>setPurchaseModal(true)}>📥 Закупка</button>}
          <button className="btn btn-primary btn-sm" onClick={()=>setModal({})}>+</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
        <div className="stat-card" style={{cursor:'pointer',borderColor:tab==='materials'?'var(--amber)':''}} onClick={()=>setTab('materials')}>
          <div className="stat-label">🧱 Склад материалов</div>
          <div className="stat-value" style={{fontSize:18,color:'var(--amber)'}}>{fmt(totalMatValue)} ₽</div>
          <div className="stat-sub">{materials.length} позиций</div>
        </div>
        <div className="stat-card" style={{cursor:'pointer',borderColor:tab==='products'?'var(--green)':''}} onClick={()=>setTab('products')}>
          <div className="stat-label">📦 Готовая продукция</div>
          <div className="stat-value" style={{fontSize:18,color:'var(--green)'}}>{fmt(totalProdRevenue)} ₽</div>
          <div className="stat-sub">себест. {fmt(totalProdValue)} ₽</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {[{id:'materials',label:'Материалы'},{id:'products',label:'Готовая продукция'},{id:'purchases',label:'Закупки'}].map(t=>(
          <button key={t.id} className="btn btn-sm" onClick={()=>setTab(t.id)}
            style={{background:tab===t.id?'var(--cyan-dim)':'',borderColor:tab===t.id?'var(--cyan)':'',color:tab===t.id?'var(--cyan)':''}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Materials */}
      {tab==='materials' && (
        <div>
          {materials.map(m => {
            const pct = Math.min(100, Math.round((m.quantity/Math.max(m.minQuantity*3,m.quantity))*100));
            const low = m.quantity <= m.minQuantity;
            return (
              <div key={m.id} className="card card-hover" style={{marginBottom:8,padding:'12px 14px',borderColor:low?'rgba(245,158,11,0.3)':''}} onClick={()=>setModal(m)}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                  <div style={{width:12,height:12,borderRadius:'50%',background:m.colorHex,flexShrink:0,border:'1px solid rgba(255,255,255,0.1)'}}/>
                  <span style={{fontSize:13,fontWeight:500,flex:1,color:'var(--text0)'}}>{m.name}</span>
                  <span className={`badge ${low?'badge-amber':'badge-gray'}`}>{m.type}</span>
                  <span style={{fontSize:13,fontWeight:600,fontFamily:'var(--font-display)',color:low?'var(--amber)':'var(--text0)'}}>{m.quantity} {m.unit}</span>
                </div>
                <div className="progress"><div className="progress-fill" style={{width:pct+'%',background:low?'var(--amber)':'var(--cyan)'}}/></div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'var(--text2)'}}>
                  <span>{m.brand}</span>
                  <span>{fmt(m.quantity/100*m.costPer100g)} ₽ · {m.costPer100g}₽/100{m.unit}</span>
                </div>
                {low && <div style={{fontSize:10,color:'var(--amber)',marginTop:4}}>⚠ Ниже минимума ({m.minQuantity} {m.unit})</div>}
              </div>
            );
          })}
          {materials.length===0 && <div className="empty"><div className="empty-icon">🧱</div><div className="empty-text">Нет материалов</div></div>}
        </div>
      )}

      {/* Products */}
      {tab==='products' && (
        <div>
          {products.map(p => {
            const avail = p.quantity - (p.reservedQty||0);
            const margin = p.price>0 ? Math.round(((p.price-p.cost)/p.price)*100) : 0;
            return (
              <div key={p.id} className="card" style={{marginBottom:8,padding:'12px 14px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                  <div style={{flex:1,cursor:'pointer'}} onClick={()=>setModal({...p,_type:'product'})}>
                    <div style={{fontSize:13,fontWeight:500,color:'var(--text0)'}}>{p.name}</div>
                    <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>{p.sku} · {p.category}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:18,fontWeight:700,fontFamily:'var(--font-display)',color:'var(--green)'}}>{p.quantity} <span style={{fontSize:12}}>шт</span></div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>своб. {avail}</div>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:11,color:'var(--text2)',marginBottom:8}}>
                  <span>себест. {fmt(p.cost)} ₽</span>
                  <span style={{color:'var(--cyan)'}}>продажа {fmt(p.price)} ₽</span>
                  <span style={{color:'var(--green)'}}>маржа {margin}%</span>
                </div>
                {p.quantity > 0 && (
                  <button
                    className="btn btn-sm"
                    style={{width:'100%',justifyContent:'center',borderColor:'var(--green)',color:'var(--green)'}}
                    onClick={(e) => { e.stopPropagation(); setSellModal(p); }}>
                    💰 Списать товар
                  </button>
                )}
              </div>
            );
          })}
          {products.length===0 && <div className="empty"><div className="empty-icon">📦</div><div className="empty-text">Нет товаров</div></div>}
        </div>
      )}

      {/* Purchases */}
      {tab==='purchases' && (
        <div>
          <button className="btn" style={{borderColor:'var(--amber)',color:'var(--amber)',width:'100%',marginBottom:12,justifyContent:'center'}} onClick={()=>setPurchaseModal(true)}>
            📥 Новая закупка
          </button>
          {store.data.purchases.slice().reverse().map(p=>(
            <div key={p.id} className="card" style={{marginBottom:8,padding:'12px 14px'}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:500,color:'var(--text0)'}}>{p.materialName}</div>
                  <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>{p.supplier} · {new Date(p.date).toLocaleDateString('ru-RU')}</div>
                  {p.notes && <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{p.notes}</div>}
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--amber)'}}>{p.quantity} {p.unit}</div>
                  <div style={{fontSize:12,color:'var(--red)'}}>{fmt(p.totalCost)} ₽</div>
                </div>
              </div>
            </div>
          ))}
          {store.data.purchases.length===0 && <div className="empty"><div className="empty-text">Нет закупок</div></div>}
        </div>
      )}

      {modal !== null && (
        (tab === 'products' || modal._type === 'product')
          ? <ProdModal item={modal} onClose={()=>setModal(null)} store={store}/>
          : <MatModal item={modal} onClose={()=>setModal(null)} store={store}/>
      )}

      {purchaseModal && <PurchaseModal onClose={()=>setPurchaseModal(false)} store={store}/>}
      {sellModal && <SellModal product={sellModal} onClose={()=>setSellModal(null)} store={store}/>}
    </div>
  );
}
