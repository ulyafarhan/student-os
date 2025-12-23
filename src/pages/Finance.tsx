import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, ArrowUpRight, ArrowDownRight, 
  History, PieChart, MoreVertical, 
  Search, Receipt, Keyboard, X
} from 'lucide-react';
import { dbService } from '@/services/db.service';
import { clsx } from 'clsx';
import { smartCategorizer } from '@/services/smart-categorizer.service';
import { syncEngine } from '@/services/sync-engine.service';

export const Finance: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState({ income: 0, expense: 0, total: 0 });
  const [filter, setFilter] = useState<'Semua' | 'EXPENSE' | 'INCOME'>('Semua');
  const [showManual, setShowManual] = useState(false);
  const [formData, setFormData] = useState({ title: '', amount: '', type: 'EXPENSE', category: 'Umum' });

  useEffect(() => {
    loadFinanceData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.title.length > 2) {
        const suggested = await smartCategorizer.predictCategory(formData.title);
        setFormData(prev => ({ ...prev, category: suggested }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.title]);

  const loadFinanceData = async () => {
    const data = await dbService.getTransactions();
    const bal = await dbService.getBalance();
    setTransactions(data.reverse());
    setBalance(bal);
  };

  const handleManualSave = async () => {
    if (!formData.title || !formData.amount) return alert("Mohon isi nama dan nominal transaksi.");
    
    await dbService.addTransaction({
      ...formData,
      amount: Number(formData.amount),
      date: new Date().toISOString(),
      synced: false
    });
    
    setFormData({ title: '', amount: '', type: 'EXPENSE', category: 'Umum' });
    setShowManual(false);
    await loadFinanceData();
    
    syncEngine.performSync();
  };

  const filteredTransactions = transactions.filter(t => 
    filter === 'Semua' || t.type === filter
  );

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(num);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black italic text-app-text-main tracking-tighter uppercase">PONDS</h1>
          <p className="text-app-text-muted text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
            Financial Ledger & Analytics
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => navigate('/scanner')} 
          className="p-4 bg-app-surface border border-app-border rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-all"
        >
          <Receipt className="text-app-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">Scan Struk</span>
        </button>
        <button 
          onClick={() => setShowManual(true)} 
          className="p-4 bg-app-surface border border-app-border rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-all"
        >
          <Keyboard className="text-emerald-500" />
          <span className="text-xs font-bold uppercase tracking-widest">Input Manual</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-app-primary to-blue-600 rounded-xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Total Balance</p>
            <h2 className="text-5xl font-black mt-2 tracking-tighter">{formatRupiah(balance.total)}</h2>
            <div className="flex gap-8 mt-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl"><ArrowDownRight size={18} className="text-green-300" /></div>
                <div>
                  <p className="text-[9px] font-bold uppercase opacity-60">Pemasukan</p>
                  <p className="font-bold">{formatRupiah(balance.income)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl"><ArrowUpRight size={18} className="text-red-300" /></div>
                <div>
                  <p className="text-[9px] font-bold uppercase opacity-60">Pengeluaran</p>
                  <p className="font-bold">{formatRupiah(balance.expense)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-app-surface border border-app-border rounded-xl p-8 flex flex-col justify-center items-center text-center space-y-4">
          <div className="p-4 bg-app-primary/10 rounded-xl text-app-primary">
            <PieChart size={32} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight">Spending Trend</h4>
            <p className="text-xs text-app-text-muted mt-1">Data finansial diproses secara lokal.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <History size={18} className="text-app-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest">Riwayat Transaksi</h3>
          </div>
          <div className="flex gap-2">
            {['Semua', 'EXPENSE', 'INCOME'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={clsx(
                  "px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border",
                  filter === f 
                    ? "bg-app-text-main border-app-text-main text-app-surface" 
                    : "bg-app-surface border-app-border text-app-text-muted"
                )}
              >
                {f === 'EXPENSE' ? 'Keluar' : f === 'INCOME' ? 'Masuk' : 'Semua'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredTransactions.map((t) => (
            <div 
              key={t.id}
              className="bg-app-surface border border-app-border rounded-xl p-5 flex items-center justify-between hover:border-app-primary/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={clsx(
                  "p-3 rounded-xl transition-colors",
                  t.type === 'INCOME' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {t.type === 'INCOME' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-app-text-main">{t.title}</h4>
                  <p className="text-[10px] text-app-text-muted font-bold uppercase tracking-tighter mt-1">
                    {t.category} • {new Date(t.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={clsx(
                  "text-base font-black tracking-tight",
                  t.type === 'INCOME' ? "text-green-500" : "text-app-text-main"
                )}>
                  {t.type === 'INCOME' ? '+' : '-'} {formatRupiah(t.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showManual && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end">
          <div className="w-full bg-app-surface rounded-t-xl p-8 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold uppercase tracking-tight">Input Manual</h2>
              <button onClick={() => setShowManual(false)} className="p-2 text-app-text-muted transition-colors hover:text-red-500">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Nama Transaksi" 
                  value={formData.title}
                  className="w-full p-4 bg-app-bg rounded-xl border border-app-border outline-none focus:border-app-primary text-app-text-main" 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                />
                {formData.title.length > 2 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-app-primary bg-app-primary/10 px-2 py-1 rounded-lg">
                    Auto: {formData.category}
                  </span>
                )}
              </div>
              <input 
                type="number" 
                placeholder="Nominal" 
                value={formData.amount}
                className="w-full p-4 bg-app-bg rounded-xl border border-app-border outline-none focus:border-app-primary text-app-text-main"
                onChange={e => setFormData({...formData, amount: e.target.value})} 
              />
              <div className="grid grid-cols-2 gap-4">
                <select 
                  className="p-4 bg-app-bg rounded-xl border border-app-border text-app-text-main outline-none focus:border-app-primary"
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                  value={formData.type}
                >
                  <option value="EXPENSE">Pengeluaran</option>
                  <option value="INCOME">Pemasukan</option>
                </select>
                <select 
                  className="p-4 bg-app-bg rounded-xl border border-app-border text-app-text-main outline-none focus:border-app-primary"
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  value={formData.category}
                >
                  {['Makanan', 'Transport', 'Pendidikan', 'Hiburan', 'Tagihan', 'Umum'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleManualSave} 
                className="w-full py-4 bg-app-primary text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-app-primary/20 active:scale-[0.98] transition-all"
              >
                Simpan Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;