import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  LogOut, 
  CheckSquare,
  BarChart3,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { authService } from './services/authService';
import { orderService } from './services/orderService';
import { Order, AppUser, OrderStatus } from './types';
import { cn, formatCurrency } from './lib/utils';
import { format } from 'date-fns';
import TaskSection from './components/TaskSection';
import OrdersSection from './components/OrdersSection';

// Pages
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Settings from './components/Settings';
import Report from './components/Report';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [view, setView] = useState<'dashboard' | 'todo' | 'projects' | 'settings' | 'report'>('dashboard');
  const [isInitializing, setIsInitializing] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('order_dash_user');
    
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setIsInitializing(false);
  }, []);

  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('order_dash_user', JSON.stringify(user));
    localStorage.setItem('last_username', user.username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('order_dash_user');
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden font-sans bg-black text-zinc-400 selection:bg-white selection:text-black">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        onLogout={() => setShowLogoutConfirm(true)} 
        currentUser={currentUser}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-12 relative pb-32 md:pb-12">
        <div className="max-w-6xl mx-auto relative z-10">
          <header className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em] mb-2">Authenticated Session</p>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {view === 'dashboard' && 'Dashboard'}
                {view === 'todo' && 'To Do'}
                {view === 'projects' && 'Projects'}
                {view === 'settings' && 'Settings'}
                {view === 'report' && 'Analysis'}
              </h1>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Dashboard userId={currentUser.id} setView={setView} />
              </motion.div>
            )}

            {view === 'todo' && (
              <motion.div
                key="todo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TaskSection userId={currentUser.id} />
              </motion.div>
            )}

            {view === 'projects' && (
              <motion.div
                key="projects"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <OrdersSection userId={currentUser.id} />
              </motion.div>
            )}

            {view === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Settings currentUser={currentUser} onUserUpdate={handleLogin} />
              </motion.div>
            )}

            {view === 'report' && (
              <motion.div
                key="report"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Report userId={currentUser.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 flex justify-between items-center z-50">
        <button 
          onClick={() => setView('dashboard')}
          className={cn(view === 'dashboard' ? "text-white" : "text-zinc-600")}
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setView('todo')}
          className={cn(view === 'todo' ? "text-white" : "text-zinc-600")}
        >
          <CheckSquare className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setView('projects')}
          className={cn(view === 'projects' ? "text-white" : "text-zinc-600")}
        >
          <Briefcase className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setShowLogoutConfirm(true)}
          className="text-zinc-600"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </nav>

      {/* Custom Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-sm w-full text-center space-y-8"
            >
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Logout</h3>
                <p className="text-zinc-500 text-sm">Return to secure entrance?</p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    handleLogout();
                    setShowLogoutConfirm(false);
                  }}
                  className="btn-primary w-full"
                >
                  Confirm Exit
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="btn-secondary w-full"
                >
                  Stay Online
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
