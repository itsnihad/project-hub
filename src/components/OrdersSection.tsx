import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2,
  Filter,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { orderService } from '../services/orderService';
import { Order, OrderStatus } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import OrderModal from './OrderModal';

interface OrdersSectionProps {
  userId: string;
}

const statusStyles: Record<OrderStatus, string> = {
  WIP: 'bg-amber-500/10 text-amber-500 border-amber-800',
  NRA: 'bg-blue-500/10 text-blue-500 border-blue-800',
  Delivered: 'bg-emerald-500/10 text-emerald-500 border-emerald-800',
};

export default function OrdersSection({ userId }: OrdersSectionProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    status: 'all',
    client: '',
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAllOrders(userId);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  const handleDelete = async () => {
    if (!orderToDelete) return;
    try {
      await orderService.deleteOrder(orderToDelete);
      fetchOrders();
      setOrderToDelete(null);
    } catch (err) {
      console.error(err);
      setOrderToDelete(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filter.status === 'all' || order.status === filter.status;
    const matchesClient = order.clientName.toLowerCase().includes(filter.client.toLowerCase()) ||
                         order.orderId.toLowerCase().includes(filter.client.toLowerCase());
    return matchesStatus && matchesClient;
  });

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
        <div>
           <h3 className="text-2xl font-bold text-white tracking-tight">Project Registry</h3>
           <p className="text-zinc-500 text-xs mt-1">Manage and track all project records.</p>
        </div>
        <button
          onClick={() => {
            setEditingOrder(null);
            setShowModal(true);
          }}
          className="btn-primary"
        >
          Add Project
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-700" />
          <input
            type="text"
            placeholder="Search projects..."
            value={filter.client}
            onChange={(e) => setFilter({ ...filter, client: e.target.value })}
            className="input-simple w-full !pl-10"
          />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-lg flex gap-1 overflow-x-auto scrollbar-hide">
          {['all', 'WIP', 'NRA', 'Delivered'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter({ ...filter, status: s })}
              className={cn(
                "px-5 py-2 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                filter.status === s 
                  ? "bg-white text-black" 
                  : "text-zinc-500 hover:text-white"
              )}
            >
              {s === 'all' ? 'All' : s === 'WIP' ? 'Working' : s === 'NRA' ? 'Awaiting' : 'Finished'}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-pane !p-0 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-600">
                <th className="py-4 px-8 text-[9px] font-bold uppercase tracking-[0.2em]">Project</th>
                <th className="py-4 px-8 text-[9px] font-bold uppercase tracking-[0.2em]">Client</th>
                <th className="py-4 px-8 text-[9px] font-bold uppercase tracking-[0.2em] text-right">Value</th>
                <th className="py-4 px-8 text-[9px] font-bold uppercase tracking-[0.2em] text-center">Status</th>
                <th className="py-4 px-8 text-[9px] font-bold uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-zinc-700 font-bold uppercase tracking-widest text-[10px]">Loading Registry...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-zinc-700 font-bold uppercase tracking-widest text-[10px]">No records found</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="py-5 px-8">
                      <div className="text-white font-medium tracking-tight mb-0.5">{order.orderId}</div>
                      <div className="text-zinc-700 text-[9px] font-bold uppercase tracking-widest">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</div>
                    </td>
                    <td className="py-5 px-8">
                      <div className="text-white font-medium tracking-tight mb-0.5 whitespace-normal max-w-[200px]">{order.clientName}</div>
                      <div className="text-zinc-700 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                        Added by {order.username}
                        {order.specialNote && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Has special notes" />
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-8 text-right font-medium text-white text-base">
                      {formatCurrency(order.finalValue)}
                    </td>
                    <td className="py-5 px-8 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border transition-all inline-block min-w-[90px]",
                        statusStyles[order.status]
                      )}>
                        {order.status === 'WIP' ? 'Working' : order.status === 'NRA' ? 'Awaiting' : 'Finished'}
                      </span>
                    </td>
                    <td className="py-5 px-8 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingOrder(order);
                            setShowModal(true);
                          }}
                          className="p-2 text-zinc-600 hover:text-white transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setOrderToDelete(order.id);
                          }}
                          className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <OrderModal
          order={editingOrder}
          userId={userId}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchOrders();
          }}
        />
      )}

      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-sm w-full text-center space-y-8"
            >
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Project</h3>
                <p className="text-zinc-500 text-sm">Are you sure you want to permanently remove this project record?</p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleDelete}
                  className="btn-primary w-full bg-rose-500 hover:bg-rose-600 text-white"
                >
                  Delete Record
                </button>
                <button 
                  onClick={() => setOrderToDelete(null)}
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
