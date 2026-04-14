import React, { useState, useEffect } from 'react';
import './index.css';
import { useStore } from './data/store';
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

const PAGES = ['dashboard','orders','warehouse','finance','printers','clients','goals','stone','more'];

export const StoreContext = React.createContext(null);
export const NavContext = React.createContext(null);

export default function App() {
  const store = useStore();
  const [page, setPage] = useState('dashboard');
  const [subPage, setSubPage] = useState(null);

  // Register SW
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
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
      case 'more': return <More />;
      case 'reminders': return <Reminders />;
      default: return <Dashboard />;
    }
  };

  return (
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
  );
}
