import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Settings, 
  BarChart3, 
  LogOut,
  Briefcase,
  CheckSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentView: 'dashboard' | 'todo' | 'projects' | 'settings' | 'report';
  setView: (view: 'dashboard' | 'todo' | 'projects' | 'settings' | 'report') => void;
  onLogout: () => void;
  currentUser: any; 
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ 
  currentView, 
  setView, 
  onLogout, 
  currentUser,
  isCollapsed,
  setIsCollapsed
}: SidebarProps) {
  const isAdmin = currentUser.role === 'admin';
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', value: 'dashboard' as const },
    { icon: CheckSquare, label: 'To Do', value: 'todo' as const },
    { icon: Briefcase, label: 'Projects', value: 'projects' as const },
    { icon: BarChart3, label: 'Intelligence', value: 'report' as const },
    { icon: Settings, label: 'Terminal', value: 'settings' as const },
  ];

  return (
    <aside className={cn(
      "hidden md:flex border-r border-zinc-800 bg-black flex-col py-10 shrink-0 relative z-50 transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 hover:text-white transition-colors z-[60]"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <div className={cn("mb-16 flex items-center gap-3 transition-all", isCollapsed ? "px-6" : "px-8")}>
        <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-bold text-black shrink-0">
          <Briefcase className="w-4 h-4" />
        </div>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-hidden whitespace-nowrap"
          >
            <p className="text-xs font-bold text-white tracking-widest uppercase">System</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 w-full px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = currentView === item.value;
          return (
            <button
              key={item.value}
              onClick={() => setView(item.value)}
              className={cn(
                "w-full flex items-center p-3 rounded-lg transition-colors duration-200 relative",
                isCollapsed ? "justify-center" : "gap-3",
                isActive 
                  ? "bg-zinc-800 text-white" 
                  : "text-zinc-500 hover:text-white"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-zinc-600")} />
              {!isCollapsed && (
                <span className="font-bold text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 mt-auto">
        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center p-3 rounded-lg text-zinc-500 hover:text-rose-500 transition-colors duration-200",
            isCollapsed ? "justify-center" : "gap-3"
          )}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && (
            <span className="font-bold text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
