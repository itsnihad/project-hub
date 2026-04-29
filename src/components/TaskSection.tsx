import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Edit3,
  List,
  Layout
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Order } from '../types';
import { taskService } from '../services/taskService';
import { orderService } from '../services/orderService';
import { cn } from '../lib/utils';
import TaskModal from './TaskModal';

interface TaskSectionProps {
  userId: string;
}

const priorityColors: Record<TaskPriority, string> = {
  High: 'text-rose-500 bg-rose-500/10 border-rose-900',
  Medium: 'text-amber-500 bg-amber-500/10 border-amber-900',
  Low: 'text-zinc-500 bg-zinc-500/10 border-zinc-800'
};

export default function TaskSection({ userId }: TaskSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'All'>('All');
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const taskData = await taskService.getTasks(userId);
      setTasks(taskData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await taskService.updateTask(task.id, { status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    try {
      await taskService.deleteTask(taskToDelete);
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskToDelete));
      setTaskToDelete(null);
    } catch (err) {
      console.error(err);
      setTaskToDelete(null);
    }
  };

  const filteredTasks = tasks.filter(t => filterStatus === 'All' || t.status === filterStatus);

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'Pending').length,
    overdue: tasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < new Date()).length
  };

  return (
    <div className="space-y-12">
      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-lg flex gap-1">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'list' ? "bg-white text-black" : "text-zinc-600 hover:text-white"
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'kanban' ? "bg-white text-black" : "text-zinc-600 hover:text-white"
              )}
            >
              <Layout className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-lg flex gap-1 overflow-x-auto scrollbar-hide">
            {['All', 'Pending', 'In Progress', 'Completed'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s as any)}
                className={cn(
                  "px-5 py-2 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  filterStatus === s 
                    ? "bg-white text-black" 
                    : "text-zinc-500 hover:text-white"
                )}
              >
                {s === 'All' ? 'Total' : s}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
          className="btn-primary"
        >
          Add Task
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total To Do', val: stats.total, color: 'zinc' },
          { label: 'Pending', val: stats.pending, color: 'zinc' },
          { label: 'Overdue', val: stats.overdue, color: 'rose' }
        ].map((s, idx) => (
          <div key={idx} className="glass-pane">
            <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.2em] mb-4">{s.label}</p>
            <p className={cn(
              "text-3xl font-bold tracking-tight",
              s.color === 'rose' ? "text-rose-500" : "text-white"
            )}>
              {s.val}
            </p>
          </div>
        ))}
      </div>

      {/* Task List */}
      <div className="glass-pane !p-0">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
           <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Active To Do</h3>
        </div>

        <div className="divide-y divide-zinc-800">
          <AnimatePresence>
            {filteredTasks.length > 0 ? filteredTasks.map((task) => (
              <motion.div 
                layout
                key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="group p-5 hover:bg-white/[0.01] flex items-center gap-6 transition-colors"
              >
                <button 
                  onClick={() => handleToggleComplete(task)}
                  className="shrink-0"
                >
                  {task.status === 'Completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-zinc-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-700 hover:text-zinc-500 transition-colors" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-0.5">
                    <h4 className={cn(
                      "text-sm font-medium tracking-tight truncate",
                      task.status === 'Completed' ? "text-zinc-700 line-through" : "text-white"
                    )}>
                      {task.title}
                    </h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border",
                      task.status === 'Completed' ? "opacity-20" : "",
                      priorityColors[task.priority]
                    )}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-bold text-zinc-700 uppercase tracking-widest">
                    <span>{new Date(task.dueDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                    className="p-2 text-zinc-600 hover:text-white transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setTaskToDelete(task.id)}
                    className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="py-24 text-center">
                 <p className="text-zinc-700 font-bold uppercase tracking-widest text-[10px]">No tasks found</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <TaskModal 
            task={selectedTask}
            userId={userId}
            onClose={() => setIsModalOpen(false)}
            onSave={() => { setIsModalOpen(false); fetchData(); }}
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
                <p className="text-zinc-500 text-sm">Are you sure you want to permanently remove this task?</p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleDelete}
                  className="btn-primary w-full bg-rose-500 hover:bg-rose-600 text-white"
                >
                  Delete Task
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
