import React, { useState, useEffect } from 'react';
import './index.css';
import { useStore } from './data/store';
import { onAuthChange, getUserData, getRolePermissions } from './firebase/auth';
import { checkAndSendNotifications } from './services/telegram';
import StatusBar from './components/StatusBar';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Warehouse from './pages/Warehouse';
import Finance from './pages/Finance';
import Printers from './pages/Printers';
import Clients from './pages/Clients';
import Goals from './pages/Goals';
import StoneMode from './pages/StoneMode';
import More from './pages/More';
import Reminders from './pages/Reminders';
import DailyPlanner from './pages/DailyPlanner';
import LoginPage from './pages/LoginPage';

const PAGES = ['dashboard','orders','warehouse','finance','printers','clients','goals','stone','daily','more'];

export const StoreContext = React.createContext(null);
export const NavContext = React.createContext(null);
export const AuthContext = React.createContext(null);

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [devMode, setDevMode] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [subPage, setSubPage] = useState(null);

  // Организация (пока хардкод, можно расширить для мультитенантности)
  const orgId = 'default_org';

  const store = useStore(user || (devMode ? { uid: 'dev' } : null), orgId);

  // Register SW
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Telegram notifications checker
  useEffect(() => {
    if (!user && !devMode) return; // Don't run if not authenticated

    const chatId = store.data.settings?.telegramChatId;
    if (!chatId) return;

    const checkNotifications = async () => {
      try {
        const reminders = store.data.reminders || [];
        await checkAndSendNotifications(reminders, chatId, store);
      } catch (error) {
        console.error('Notification check failed:', error);
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkNotifications, 5 * 60 * 1000);
    checkNotifications(); // Initial check

    return () => clearInterval(interval);
  }, [store.data.reminders, store.data.settings?.telegramChatId, user, devMode, store]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const result = await getUserData(firebaseUser.uid);
        if (result.success) {
          setUserData(result.data);
          // Предзагрузка прав роли в кэш
          if (result.data.role) {
            await getRolePermissions(result.data.role);
          }
        } else {
          // Если нет данных пользователя в Firestore, создаём базовую запись
          console.warn('User data not found in Firestore, user may need to be set up properly');
          setUserData({ email: firebaseUser.email, role: 'admin', displayName: firebaseUser.email });
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const nav = { page, setPage, subPage, setSubPage, go: (p, sub) => { setPage(p); setSubPage(sub || null); } };

  const renderPage = () => {
    switch(page) {
      case 'dashboard': return <Dashboard />;
      case 'orders': return <Orders />;
      case 'warehouse': return <Warehouse sub={subPage} />;
      case 'finance': return <Finance />;
      case 'printers': return <Printers />;
      case 'clients': return <Clients />;
      case 'goals': return <Goals />;
      case 'stone': return <StoneMode />;
      case 'daily': return <DailyPlanner />;
      case 'more': return <More />;
      case 'reminders': return <Reminders />;
      default: return <Dashboard />;
    }
  };

  // Показываем загрузку пока проверяем авторизацию
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg0)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⬡</div>
          <div style={{ color: 'var(--text-dim)' }}>Загрузка...</div>
        </div>
      </div>
    );
  }

  // Если не авторизован — показываем экран входа
  if (!user && !devMode) {
    return <LoginPage onLoginSuccess={() => {}} onSkipAuth={() => setDevMode(true)} />;
  }

  const authContextValue = { user, userData: userData || { email: 'dev@local', role: 'admin', displayName: 'Dev Mode' } };

  return (
    <AuthContext.Provider value={authContextValue}>
      <StoreContext.Provider value={store}>
        <NavContext.Provider value={nav}>
          <div style={{ display:'flex', flexDirection:'column', minHeight:'100dvh', background:'var(--bg0)' }}>
            {/* Top status bar */}
            <StatusBar />

            {/* Main content */}
            <main style={{ flex: 1, overflowY:'auto', overflowX:'hidden', paddingBottom: 'calc(var(--nav-h) + var(--safe-bottom) + 8px)' }}>
              <div className="animate-fade" key={page}>
                {renderPage()}
              </div>
            </main>

            {/* Bottom navigation */}
            <BottomNav />
          </div>
        </NavContext.Provider>
      </StoreContext.Provider>
    </AuthContext.Provider>
  );
}
