import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
import { calculateValues, cn, formatCurrency } from '../lib/utils';

interface OrderModalProps {
  order: Order | null;
  userId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function OrderModal({ order, userId, onClose, onSave }: OrderModalProps) {
  const [formData, setFormData] = useState<Partial<Order>>({
    clientName: '',
    amount: 0,
    collaborationPercent: 0,
    siteUrl: '',
    username: '',
    password: '',
    transferredUrl: '',
    specialNote: '',
    status: 'WIP',
    orderId: ''
  });

  const [calcs, setCalcs] = useState(calculateValues(0, 0));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData({
        ...order,
        specialNote: order.specialNote || '',
        transferredUrl: order.transferredUrl || ''
      });
      setCalcs(calculateValues(order.amount, order.collaborationPercent));
    }
  }, [order]);

  useEffect(() => {
    const amount = Number(formData.amount || 0);
    const collab = Number(formData.collaborationPercent || 0);
    setCalcs(calculateValues(amount, collab));
  }, [formData.amount, formData.collaborationPercent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (order?.id) {
        await orderService.updateOrder(order.id, formData);
      } else {
        await orderService.addOrder(formData, userId);
      }
      onSave();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-2xl relative overflow-hidden flex flex-col lg:flex-row my-auto max-h-none lg:max-h-[90vh]">
        <button onClick={onClose} className="absolute right-4 top-4 text-zinc-500 hover:text-white z-20 p-2 transition-colors bg-zinc-900/50 rounded-full lg:bg-transparent">
          <X className="w-5 h-5" />
        </button>

        {/* Financial Side */}
        <div className="w-full lg:w-72 bg-zinc-950 p-6 space-y-8 border-b lg:border-b-0 lg:border-r border-zinc-800 overflow-y-auto shrink-0">
          <div>
            <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-6">Financials</h3>
            <div className="space-y-6">
              <div>
                <p className="text-[8px] uppercase font-bold text-zinc-700 tracking-widest mb-1">Gross Amount</p>
                <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(formData.amount || 0)}</p>
              </div>
              <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <p className="text-[8px] uppercase font-bold text-zinc-600 mb-1">Fee (20%)</p>
                <p className="text-lg font-bold text-white tracking-tight">-{formatCurrency(calcs.revenue)}</p>
              </div>
              {Number(formData.collaborationPercent) > 0 && (
                <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                  <p className="text-[8px] uppercase font-bold text-zinc-600 mb-1">Split ({formData.collaborationPercent}%)</p>
                  <p className="text-lg font-bold text-white tracking-tight">-{formatCurrency(calcs.collaborationDeduction)}</p>
                </div>
              )}
              <div className="pt-6 border-t border-zinc-800">
                <p className="text-[8px] uppercase font-bold text-emerald-500 mb-1">Net Proceeds</p>
                <p className="text-3xl font-bold text-emerald-400 tracking-tight">{formatCurrency(calcs.finalValue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Project Details</h2>
              <p className="text-zinc-500 text-xs mt-1">Configure project records and access parameters.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Left Column */}
              <div className="space-y-5">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Order ID</label>
                  <input
                    type="text"
                    required
                    value={formData.orderId}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                    className="input-simple w-full"
                    placeholder="e.g. ORD-12345"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Client Name</label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="input-simple w-full"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Amount ($)</label>
                    <input
                      type="number"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="input-simple w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Split (%)</label>
                    <input
                      type="number"
                      value={formData.collaborationPercent}
                      onChange={(e) => setFormData({ ...formData, collaborationPercent: Number(e.target.value) })}
                      className="input-simple w-full"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Status</label>
                  <div className="flex gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
                    {(['WIP', 'NRA', 'Delivered'] as OrderStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: s })}
                        className={cn(
                          "flex-1 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all",
                          formData.status === s 
                            ? "bg-white text-black" 
                            : "text-zinc-600 hover:text-white"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="input-simple w-full text-xs"
                      placeholder="Username"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Password</label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-simple w-full text-xs"
                      placeholder="Password"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Transferred Link</label>
                  <input
                    type="text"
                    value={formData.transferredUrl}
                    onChange={(e) => setFormData({ ...formData, transferredUrl: e.target.value })}
                    className="input-simple w-full text-xs"
                    placeholder="Link or reference..."
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Special Note</label>
                  <textarea
                    value={formData.specialNote}
                    onChange={(e) => setFormData({ ...formData, specialNote: e.target.value })}
                    className="input-simple w-full text-xs min-h-[100px] py-3 resize-none"
                    placeholder="Additional instructions or notes..."
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 uppercase tracking-[0.2em] font-bold text-[10px]"
            >
              {loading ? 'Performing Transaction...' : 'Confirm and Save Project'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
