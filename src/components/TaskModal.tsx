import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Order } from '../types';
import { taskService } from '../services/taskService';
import { orderService } from '../services/orderService';
import { cn } from '../lib/utils';

interface TaskModalProps {
  task: Task | null;
  userId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function TaskModal({ task, userId, onClose, onSave }: TaskModalProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Pending',
    dueDate: new Date().toISOString().split('T')[0],
    orderId: ''
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
    if (task) {
      setFormData({
        ...task,
        dueDate: task.dueDate.split('T')[0]
      });
    }
  }, [task]);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getAllOrders(userId);
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (task?.id) {
        await taskService.updateTask(task.id, formData);
      } else {
        await taskService.addTask({
          ...(formData as Omit<Task, 'id' | 'createdAt'>),
          userId
        });
      }
      onSave();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/95 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl relative p-6 sm:p-8 my-auto max-h-none sm:max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-4 top-4 text-zinc-500 hover:text-white p-2 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Task Details</h2>
            <p className="text-zinc-500 text-xs mt-1">Define task parameters and priority.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-simple w-full"
                placeholder="e.g. Design meeting"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Priority & Status</label>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="input-simple w-full bg-zinc-950 pr-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="input-simple w-full bg-zinc-950 pr-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Linked Project</label>
              <select
                value={formData.orderId || ''}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                className="input-simple w-full bg-zinc-950 pr-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat"
              >
                <option value="">No link</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>{o.clientName}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Saving...' : 'Save Task'}
          </button>
        </form>
      </div>
    </div>
  );
}
