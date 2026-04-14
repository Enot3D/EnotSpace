import React, { useState, useContext } from 'react';
import { StoreContext } from '../App';
import { createUser, ROLES } from '../firebase/auth';
import { getAllUsers, deactivateUser, updateUser, getAllRoles } from '../firebase/firestore';

export default function UserManagement() {
  const store = useContext(StoreContext);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: ROLES.MANAGER,
  });

  React.useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    const result = await getAllUsers();
    if (result.success) {
      setUsers(result.users);
    }
  };

  const loadRoles = async () => {
    const result = await getAllRoles();
    if (result.success) {
      setRoles(result.roles);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    let result;
    if (editingUser) {
      // Редактирование существующего пользователя
      const updateData = {
        displayName: formData.displayName,
        role: formData.role,
      };
      result = await updateUser(editingUser.id, updateData);
    } else {
      // Создание нового пользователя
      result = await createUser(
        formData.email,
        formData.password,
        formData.role,
        formData.displayName
      );
    }

    setLoading(false);

    if (result.success) {
      setSuccess(editingUser ? 'Пользователь обновлён!' : `Пользователь ${formData.email} создан!`);
      setFormData({ email: '', password: '', displayName: '', role: ROLES.MANAGER });
      setShowForm(false);
      setEditingUser(null);
      loadUsers();
    } else {
      setError(result.error);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      displayName: user.displayName || '',
      role: user.role || ROLES.MANAGER,
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', displayName: '', role: ROLES.MANAGER });
    setShowForm(false);
  };

  const handleDeactivate = async (uid) => {
    if (!window.confirm('Деактивировать пользователя?')) return;
    const result = await deactivateUser(uid);
    if (result.success) {
      setSuccess('Пользователь деактивирован');
      loadUsers();
    } else {
      setError(result.error);
    }
  };

  const roleLabels = {
    [ROLES.ADMIN]: '👑 Админ',
    [ROLES.OWNER_ASSISTANT]: '🤝 Помощник владельца',
    [ROLES.MANAGER]: '📋 Менеджер',
    [ROLES.OPERATOR]: '🖨 Оператор',
  };

  // Получить название роли (встроенная или кастомная)
  const getRoleName = (roleId) => {
    if (roleLabels[roleId]) return roleLabels[roleId];
    const customRole = roles.find(r => r.id === roleId);
    return customRole ? customRole.name : roleId;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>👥 Управление пользователями</h1>
        <button className="btn-primary" onClick={() => { setEditingUser(null); setShowForm(!showForm); }}>
          {showForm ? 'Отмена' : '+ Добавить'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <h3 style={{ marginTop: 0 }}>{editingUser ? 'Редактировать пользователя' : 'Новый пользователь'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={editingUser}
              />
              {editingUser && (
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                  Email нельзя изменить
                </div>
              )}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="label">Имя</label>
              <input
                type="text"
                className="input"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Опционально"
              />
            </div>

            {!editingUser && (
              <div style={{ marginBottom: '12px' }}>
                <label className="label">Пароль</label>
                <input
                  type="password"
                  className="input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label className="label">Роль</label>
              <select
                className="input"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <optgroup label="Встроенные роли">
                  <option value={ROLES.MANAGER}>📋 Менеджер</option>
                  <option value={ROLES.OPERATOR}>🖨 Оператор принтера</option>
                  <option value={ROLES.OWNER_ASSISTANT}>🤝 Помощник владельца</option>
                </optgroup>
                {roles.filter(r => !r.isSystem).length > 0 && (
                  <optgroup label="Кастомные роли">
                    {roles.filter(r => !r.isSystem).map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? (editingUser ? 'Сохранение...' : 'Создание...') : (editingUser ? 'Сохранить' : 'Создать')}
              </button>
              <button type="button" className="btn" onClick={handleCancelEdit}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Пользователи ({users.length})</h3>
        {users.length === 0 ? (
          <p style={{ color: 'var(--text-dim)' }}>Нет пользователей</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  padding: '12px',
                  background: user.active ? 'var(--bg0)' : '#f5f5f5',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {user.displayName || user.email}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {user.email} • {getRoleName(user.role)}
                  </div>
                  {!user.active && (
                    <span style={{ fontSize: '12px', color: '#999' }}>Деактивирован</span>
                  )}
                </div>
                {user.active && user.role !== ROLES.ADMIN && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => handleEdit(user)}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Редактировать
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleDeactivate(user.id)}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Деактивировать
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
