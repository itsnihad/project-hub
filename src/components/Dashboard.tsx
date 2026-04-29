import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ChevronRight, 
  CheckSquare,
  Package,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Trash2,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { orderService } from '../services/orderService';
import { taskService } from '../services/taskService';
import { Order, Task } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

import OrderModal from './OrderModal';
import TaskModal from './TaskModal';

interface DashboardProps {
  userId: string;
  setView: (view: 'dashboard' | 'todo' | 'projects' | 'settings' | 'report') => void;
}

export default function Dashboard({ userId, setView }: DashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, tasksData] = await Promise.all([
        orderService.getAllOrders(userId),
        taskService.getTasks(userId)
      ]);
      setOrders(ordersData);
      setTasks(tasksData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleTaskDelete = async () => {
    if (!taskToDelete) return;
    
    console.log('Dashboard delete protocol active for task ID:', taskToDelete);
    try {
      await taskService.deleteTask(taskToDelete);
      setTasks(prev => prev.filter(t => t.id !== taskToDelete));
      console.log('Dashboard: Task record successfully expunged');
      setTaskToDelete(null);
    } catch (err) {
      console.error('Dashboard: Delete protocol failure:', err);
      alert('Delete protocol failed. Access denied or network error.');
      setTaskToDelete(null);
    }
  };

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const deliveredOrders = orders.filter(o => o.status === 'Delivered' && o.deliveredDate);
  const currentMonthOrders = deliveredOrders.filter(o => {
    try {
      const date = parseISO(o.deliveredDate!);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    } catch (e) {
      return false;
    }
  });

  const projectValue = currentMonthOrders.reduce((acc, o) => acc + o.amount, 0);
  const netRevenue = currentMonthOrders.reduce((acc, o) => acc + o.finalValue, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-zinc-500 text-xs">Performance metrics for {format(new Date(), 'MMMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowTaskModal(true)}
            className="btn-secondary"
          >
            New Task
          </button>
          <button 
            onClick={() => setShowProjectModal(true)}
            className="btn-primary"
          >
            New Project
          </button>
        </div>
      </header>

      {/* Analytics */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-pane group relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 rounded-full" />
          <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.2em] mb-4 relative z-10">Project Value</p>
          <p className="text-4xl font-bold text-white tracking-tight relative z-10">
            {formatCurrency(projectValue)}
          </p>
        </div>

        <div className="glass-pane group border-emerald-500/10 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />
          <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.2em] mb-4 relative z-10">Revenue</p>
          <p className="text-4xl font-bold text-emerald-500 tracking-tight relative z-10">
            {formatCurrency(netRevenue)}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <section className="glass-pane !p-0">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Workload</h3>
            <button 
              onClick={() => setView('todo')}
              className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest hover:text-white transition-colors"
            >
              View All
            </button>
          </div>
          <div className="p-2 space-y-1">
            {tasks.length === 0 ? (
              <div className="py-12 text-center text-zinc-700 text-[10px] uppercase font-bold tracking-widest">No active tasks</div>
            ) : tasks.slice(0, 5).map(task => (
              <div key={task.id} className="p-4 hover:bg-white/[0.02] rounded-xl flex items-center justify-between group transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    task.priority === 'High' ? 'bg-rose-500' : 
                    task.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  )} />
                  <p className="text-sm font-medium text-white tracking-tight">{task.title}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                    {format(new Date(task.dueDate), 'MMM dd')}
                  </p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setTaskToDelete(task.id);
                    }}
                    className="p-1 text-zinc-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Projects */}
        <section className="glass-pane !p-0">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Project Hub</h3>
            <button 
              onClick={() => setView('projects')}
              className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest hover:text-white transition-colors"
            >
              Analyze
            </button>
          </div>
          <div className="p-2 space-y-1">
            {orders.length === 0 ? (
              <div className="py-12 text-center text-zinc-700 text-[10px] uppercase font-bold tracking-widest">Registry empty</div>
            ) : orders.slice(0, 5).map(order => (
              <div key={order.id} className="p-4 hover:bg-white/[0.02] rounded-xl flex items-center justify-between group transition-colors">
                <div>
                  <p className="text-sm font-medium text-white tracking-tight">{order.clientName}</p>
                  <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mt-1">
                      {formatCurrency(order.finalValue)}
                  </p>
                </div>
                <div className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded text-[8px] font-bold uppercase tracking-widest text-zinc-500">
                  {order.status}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showProjectModal && (
          <OrderModal 
            order={null}
            userId={userId}
            onClose={() => setShowProjectModal(false)}
            onSave={() => {
              setShowProjectModal(false);
              fetchData();
            }}
          />
        )}
        {showTaskModal && (
          <TaskModal 
            task={null}
            userId={userId}
            onClose={() => setShowTaskModal(false)}
            onSave={() => {
              setShowTaskModal(false);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {taskToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-sm w-full text-center space-y-8"
            >
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Task</h3>
                <p className="text-zinc-500 text-sm">Remove this record permanently?</p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleTaskDelete}
                  className="btn-primary w-full bg-rose-500 hover:bg-rose-600 text-white"
                >
                  Confirm Delete
                </button>
                <button 
                  onClick={() => setTaskToDelete(null)}
                  className="btn-secondary w-full"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
