import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Briefcase, 
  Download, 
  Calendar,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { Order } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

interface ReportProps {
  userId: string;
}

export default function Report({ userId }: ReportProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetch = async () => {
      const data = await orderService.getAllOrders(userId);
      setOrders(data);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  // Consider only delivered orders for revenue tracking
  const deliveredOrders = orders.filter(o => o.status === 'Delivered' && o.deliveredDate);
  
  const currentMonthOrders = deliveredOrders.filter(o => {
    try {
      const date = parseISO(o.deliveredDate!);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    } catch (e) {
      return false;
    }
  });

  const stats = {
    projectValue: currentMonthOrders.reduce((acc, o) => acc + o.amount, 0),
    netRevenue: currentMonthOrders.reduce((acc, o) => acc + o.finalValue, 0),
    count: currentMonthOrders.length
  };

  const changeMonth = (offset: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setMonth(nextDate.getMonth() + offset);
    setSelectedDate(nextDate);
  };

  const handleExport = () => {
    const reportData = {
      period: format(selectedDate, 'MMMM yyyy'),
      timestamp: new Date().toISOString(),
      summary: stats,
      orders: currentMonthOrders.map((o: Order) => ({
        id: o.orderId,
        client: o.clientName,
        projectValue: o.amount,
        netRevenue: o.finalValue,
        deliveredDate: o.deliveredDate
      }))
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Revenue_Report_${format(selectedDate, 'MMM_yyyy')}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex animate-pulse flex-col gap-6">
        <div className="h-64 glass-pane bg-white/5 border-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 glass-pane bg-white/5 border-white/5" />
          <div className="h-64 glass-pane bg-white/5 border-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Intelligence</h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">Monthly performance and revenue audit.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-4">
            <button 
              onClick={() => changeMonth(-1)}
              className="text-zinc-600 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-2 border-x border-zinc-900 min-w-[140px] justify-center">
              <Calendar className="w-3.5 h-3.5 text-zinc-700" />
              <span className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">
                {format(selectedDate, 'MMMM yyyy')}
              </span>
            </div>
            <button 
              onClick={() => changeMonth(1)}
              className="text-zinc-600 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={handleExport}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-pane group relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-white/10 transition-colors" />
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-6 font-sans">Project Value</p>
          <div className="flex items-end justify-between relative z-10">
            <p className="text-5xl font-bold text-white tracking-tighter font-mono">{formatCurrency(stats.projectValue)}</p>
            <Briefcase className="w-6 h-6 text-zinc-800 group-hover:text-zinc-500 transition-colors" />
          </div>
          <p className="text-[9px] font-bold text-zinc-800 uppercase tracking-widest mt-4">Gross aggregate for {format(selectedDate, 'MMMM')}</p>
        </div>

        <div className="glass-pane group relative overflow-hidden border-emerald-500/20">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-emerald-500/10 transition-colors" />
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-6 font-sans">Net Revenue</p>
          <div className="flex items-end justify-between relative z-10">
            <p className="text-5xl font-bold text-emerald-500 tracking-tighter font-mono">{formatCurrency(stats.netRevenue)}</p>
            <TrendingUp className="w-6 h-6 text-emerald-950 group-hover:text-emerald-500 transition-colors" />
          </div>
          <p className="text-[9px] font-bold text-zinc-800 uppercase tracking-widest mt-4">Actual earnings (Excl. 20% Fee)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section className="glass-pane">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-[0.3em]">Monthly Throughput</h3>
              <p className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-bold">{stats.count} nodes successfully finalized</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          
          <div className="bg-zinc-950/50 rounded-2xl border border-zinc-900 border-dashed p-12 text-center">
            <Activity className="w-8 h-8 text-zinc-900 mx-auto mb-4" />
            <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.3em]">System Intelligence Node Active</p>
            <p className="text-zinc-800 text-[9px] max-w-xs mx-auto mt-2 leading-relaxed">
              Revenue records are synchronized upon delivery confirmation. 
              {stats.count === 0 && " No finalized records detected for the selected period."}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
