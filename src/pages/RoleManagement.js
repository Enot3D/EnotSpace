import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { getAllRoles, createRole, updateRole, deleteRole } from '../firebase/firestore';
import { clearRolesCache, ROLES } from '../firebase/auth';

export default function RoleManagement() {
  const auth = useContext(AuthContext);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    permissions: {
      canManageUsers: false,
      canManageRoles: false,
      canViewFinance: false,
      canEditOrders: false,
      canEditClients: false,
      canEditWarehouse: false,
      canEditPrinters: false,
      canEditGoals: false,
      canEditSettings: false,
      sections: {
        dashboard: true,
        orders: false,
        warehouse: false,
        finance: false,
        printers: false,
        clients: false,
        goals: false,
        stone: false,
        more: true,
        reminders: false,
      }
    }
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    const result = await getAllRoles();
    if (result.success) {
      setRoles(result.roles);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        permissions: role.permissions || formData.permissions
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        permissions: {
          canManageUsers: false,
          canManageRoles: false,
          canViewFinance: false,
          canEditOrders: false,
          canEditClients: false,
          canEditWarehouse: false,
          canEditPrinters: false,
          canEditGoals: false,
          canEditSettings: false,
          sections: {
            dashboard: true,
            orders: false,
            warehouse: false,
            finance: false,
            printers: false,
            clients: false,
            goals: false,
            stone: false,
            more: true,
            reminders: false,
          }
        }
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const roleData = {
      name: formData.name,
      permissions: formData.permissions,
      isSystem: false,
      createdBy: auth.user.uid,
    };

    let result;
    if (editingRole) {
      result = await updateRole(editingRole.id, roleData);
    } else {
      result = await createRole(roleData);
    }

    setLoading(false);

    if (result.success) {
      setSuccess(editingRole ? 'Роль обновлена!' : 'Роль создана!');
      setShowModal(false);
      clearRolesCache();
      loadRoles();
    } else {
      setError(result.error);
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Удалить роль? Все пользователи с этой ролью будут переведены на роль "Менеджер".')) return;

    setLoading(true);
    const result = await deleteRole(roleId, ROLES.MANAGER);
    setLoading(false);

    if (result.success) {
      setSuccess(`Роль удалена. Переведено пользователей: ${result.affectedUsers}`);
      clearRolesCache();
      loadRoles();
    } else {
      setError(result.error);
    }
  };

  const togglePermission = (key) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const toggleSection = (key) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        sections: {
          ...prev.permissions.sections,
          [key]: !prev.permissions.sections[key]
        }
      }
    }));
  };

  const systemRoles = roles.filter(r => r.isSystem);
  const customRoles = roles.filter(r => !r.isSystem);

  const permissionLabels = {
    canManageUsers: 'Управление пользователями',
    canManageRoles: 'Управление ролями',
    canViewFinance: 'Просмотр финансов',
    canEditOrders: 'Редактирование заказов',
    canEditClients: 'Редактирование клиентов',
    canEditWarehouse: 'Редактирование склада',
    canEditPrinters: 'Редактирование принтеров',
    canEditGoals: 'Редактирование целей',
    canEditSettings: 'Редактирование настроек',
  };

  const sectionLabels = {
    dashboard: 'Главная',
    orders: 'Заказы',
    warehouse: 'Склад',
    finance: 'Финансы',
    printers: 'Принтеры',
    clients: 'Клиенты',
    goals: 'Цели',
    stone: 'Режим камня',
    more: 'Ещё',
    reminders: 'Планировщик',
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>🎭 Управление ролями</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Создать роль
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading && !showModal ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          Загрузка...
        </div>
      ) : (
        <>
          {/* Встроенные роли */}
          {systemRoles.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Встроенные роли
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {systemRoles.map((role) => (
                  <div key={role.id} className="card" style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text0)' }}>
                          {role.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>
                          Системная роль
                        </div>
                      </div>
                      <button
                        className="btn-secondary"
                        onClick={() => handleOpenModal(role)}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        Просмотр
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Кастомные роли */}
          <div>
            <h3 style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Кастомные роли ({customRoles.length})
            </h3>
            {customRoles.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🎭</div>
                <div className="empty-text">Нет кастомных ролей</div>
                <div className="empty-sub">Создайте первую роль с настраиваемыми правами</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {customRoles.map((role) => (
                  <div key={role.id} className="card" style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text0)' }}>
                          {role.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                          Создана {new Date(role.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-secondary"
                          onClick={() => handleOpenModal(role)}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => handleDelete(role.id)}
                          style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--red)', borderColor: 'var(--red)' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Модальное окно */}
      {showModal && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-handle" />
            <div className="modal-title">
              {editingRole ? (editingRole.isSystem ? 'Просмотр роли' : 'Редактировать роль') : 'Новая роль'}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label className="label">Название роли *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={editingRole?.isSystem}
                  placeholder="Например: Дизайнер"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="label" style={{ marginBottom: '12px', display: 'block' }}>
                  Права доступа
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.keys(permissionLabels).map((key) => (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        background: 'var(--bg3)',
                        borderRadius: '8px',
                        cursor: editingRole?.isSystem ? 'not-allowed' : 'pointer',
                        opacity: editingRole?.isSystem ? 0.6 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions[key]}
                        onChange={() => togglePermission(key)}
                        disabled={editingRole?.isSystem}
                        style={{ cursor: editingRole?.isSystem ? 'not-allowed' : 'pointer' }}
                      />
                      <span style={{ fontSize: '13px', color: 'var(--text1)' }}>
                        {permissionLabels[key]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="label" style={{ marginBottom: '12px', display: 'block' }}>
                  Доступ к разделам
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.keys(sectionLabels).map((key) => (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        background: 'var(--bg3)',
                        borderRadius: '6px',
                        cursor: editingRole?.isSystem ? 'not-allowed' : 'pointer',
                        opacity: editingRole?.isSystem ? 0.6 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.sections[key]}
                        onChange={() => toggleSection(key)}
                        disabled={editingRole?.isSystem}
                        style={{ cursor: editingRole?.isSystem ? 'not-allowed' : 'pointer' }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text1)' }}>
                        {sectionLabels[key]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {!editingRole?.isSystem && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? 'Сохранение...' : (editingRole ? 'Сохранить' : 'Создать')}
                  </button>
                  <button type="button" className="btn" onClick={() => setShowModal(false)}>
                    Отмена
                  </button>
                </div>
              )}

              {editingRole?.isSystem && (
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ width: '100%' }}>
                  Закрыть
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
