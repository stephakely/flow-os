import React, { useState, useEffect } from 'react';
import { api, formatAmount } from '../lib/apiService';
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2, BarChart2, PieChart } from 'lucide-react';

const EXPENSE_CATS = ['Logiciels', 'Matériel', 'Marketing', 'Locaux', 'Salaires', 'Formation', 'Divers'];

export default function Finances({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [archives, setArchives] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState({ label: '', amount: '', category: 'Logiciels', date: new Date().toISOString().slice(0, 10), recurring: false });

  useEffect(() => {
    loadExpenses();
    const unsub = api.subscribeArchives(setArchives);
    const handleUpdate = () => loadExpenses();
    window.addEventListener('flow-db-update', handleUpdate);
    return () => { unsub(); window.removeEventListener('flow-db-update', handleUpdate); };
  }, []);

  const loadExpenses = () => {
    const lsdb = JSON.parse(localStorage.getItem('flow_os_db_v2') || '{}');
    setExpenses(lsdb.expenses || []);
  };

  const saveExpense = async (e) => {
    e.preventDefault();
    const lsdb = JSON.parse(localStorage.getItem('flow_os_db_v2') || '{}');
    if (!lsdb.expenses) lsdb.expenses = [];
    lsdb.expenses.push({ id: `exp_${Date.now()}`, ...form, amount: parseFloat(form.amount), createdAt: new Date().toISOString() });
    localStorage.setItem('flow_os_db_v2', JSON.stringify(lsdb));
    setShowExpenseModal(false);
    setForm({ label: '', amount: '', category: 'Logiciels', date: new Date().toISOString().slice(0, 10), recurring: false });
    loadExpenses();
  };

  const deleteExpense = (id) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    const lsdb = JSON.parse(localStorage.getItem('flow_os_db_v2') || '{}');
    lsdb.expenses = (lsdb.expenses || []).filter(e => e.id !== id);
    localStorage.setItem('flow_os_db_v2', JSON.stringify(lsdb));
    loadExpenses();
  };

  // Stats filtrées par mois
  const filteredExpenses = expenses.filter(e => e.date?.startsWith(filterMonth));
  const filteredRevenue = archives.filter(a => a.archivedAt?.startsWith(filterMonth));

  const totalRevenue = filteredRevenue.reduce((s, a) => s + (a.price || 0), 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const profit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;

  // Par catégorie
  const byCategory = EXPENSE_CATS.map(cat => ({
    cat,
    total: filteredExpenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  // Par mois pour le revenue (toutes les archives)
  const revenueByMonth = {};
  archives.forEach(a => {
    const month = a.archivedAt?.slice(0, 7);
    if (!month) return;
    if (!revenueByMonth[month]) revenueByMonth[month] = 0;
    revenueByMonth[month] += a.price || 0;
  });
  const revenueMonths = Object.entries(revenueByMonth).sort(([a], [b]) => b.localeCompare(a)).slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <header className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Finances & <span className="text-cyber-neon">Comptabilité</span></h1>
          <p className="text-cyber-muted text-sm mt-1 uppercase tracking-widest">Revenus, dépenses et marges</p>
        </div>
        <div className="flex gap-3 items-center">
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="bg-black/50 border border-cyber-border text-white p-2 rounded-lg focus:border-cyber-neon outline-none text-sm" />
          {user.role === 'admin' && (
            <button onClick={() => setShowExpenseModal(true)} className="neon-button-primary flex items-center gap-2">
              <Plus size={16} /> Dépense
            </button>
          )}
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 border border-green-500/20">
          <p className="text-xs text-cyber-muted uppercase tracking-widest">Revenus</p>
          <p className="text-2xl font-black text-green-400 mt-1">{formatAmount(totalRevenue)}</p>
          <p className="text-xs text-cyber-muted mt-1">{filteredRevenue.length} projets livrés</p>
        </div>
        <div className="glass-card p-5 border border-red-500/20">
          <p className="text-xs text-cyber-muted uppercase tracking-widest">Dépenses</p>
          <p className="text-2xl font-black text-red-400 mt-1">{formatAmount(totalExpenses)}</p>
          <p className="text-xs text-cyber-muted mt-1">{filteredExpenses.length} lignes</p>
        </div>
        <div className={`glass-card p-5 border ${profit >= 0 ? 'border-cyber-neon/20' : 'border-red-500/20'}`}>
          <p className="text-xs text-cyber-muted uppercase tracking-widest">Résultat Net</p>
          <p className={`text-2xl font-black mt-1 ${profit >= 0 ? 'text-cyber-neon' : 'text-red-400'}`}>{formatAmount(profit)}</p>
          <p className="text-xs text-cyber-muted mt-1">{profit >= 0 ? '↑ Bénéfice' : '↓ Déficit'}</p>
        </div>
        <div className="glass-card p-5 border border-purple-500/20">
          <p className="text-xs text-cyber-muted uppercase tracking-widest">Marge Nette</p>
          <p className={`text-2xl font-black mt-1 ${Number(margin) > 50 ? 'text-green-400' : Number(margin) > 20 ? 'text-yellow-400' : 'text-red-400'}`}>{margin}%</p>
          <p className="text-xs text-cyber-muted mt-1">du chiffre d'affaires</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dépenses par catégorie */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-bold text-cyber-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <PieChart size={16} /> Dépenses par Catégorie
          </h2>
          {byCategory.length === 0 ? (
            <p className="text-cyber-muted text-sm text-center py-8">Aucune dépense ce mois-ci</p>
          ) : (
            <div className="space-y-3">
              {byCategory.map(({ cat, total }) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{cat}</span>
                    <span className="text-cyber-neon font-mono">{formatAmount(total)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/50 rounded-full">
                    <div className="h-full bg-cyber-neon rounded-full" style={{ width: `${Math.min((total / totalExpenses) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue par mois */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-bold text-cyber-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <BarChart2 size={16} /> Revenus par Mois
          </h2>
          {revenueMonths.length === 0 ? (
            <p className="text-cyber-muted text-sm text-center py-8">Aucun revenu archivé</p>
          ) : (
            <div className="space-y-3">
              {revenueMonths.map(([month, rev]) => {
                const maxRev = Math.max(...revenueMonths.map(([, r]) => r));
                return (
                  <div key={month}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{month}</span>
                      <span className="text-green-400 font-mono">{formatAmount(rev)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/50 rounded-full">
                      <div className="h-full bg-green-400 rounded-full" style={{ width: `${(rev / maxRev) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Liste des dépenses */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-bold text-cyber-muted uppercase tracking-widest mb-4">Dépenses — {filterMonth}</h2>
        {filteredExpenses.length === 0 ? (
          <p className="text-cyber-muted text-sm text-center py-8">Aucune dépense enregistrée pour ce mois</p>
        ) : (
          <div className="space-y-2">
            {filteredExpenses.sort((a, b) => b.date.localeCompare(a.date)).map(exp => (
              <div key={exp.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-cyber-border/20 hover:border-cyber-border/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-400 rounded border border-red-500/20">{exp.category}</span>
                  <div>
                    <p className="text-sm text-white">{exp.label}</p>
                    <p className="text-xs text-cyber-muted">{new Date(exp.date).toLocaleDateString('fr-FR')} {exp.recurring && '🔁 Récurrent'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-red-400">-{formatAmount(exp.amount)}</span>
                  {user.role === 'admin' && (
                    <button onClick={() => deleteExpense(exp.id)} className="text-red-500/40 hover:text-red-500"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Dépense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-md mx-4 border border-cyber-neon/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-cyber-neon uppercase tracking-widest">Nouvelle Dépense</h2>
              <button onClick={() => setShowExpenseModal(false)} className="text-cyber-muted hover:text-white">✕</button>
            </div>
            <form onSubmit={saveExpense} className="space-y-4">
              <div>
                <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Libellé *</label>
                <input required type="text" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
                  className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Montant (€) *</label>
                  <input required type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none" />
                </div>
                <div>
                  <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Date *</label>
                  <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Catégorie</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none">
                  {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.recurring} onChange={e => setForm({ ...form, recurring: e.target.checked })}
                  className="w-4 h-4 rounded accent-cyber-neon" />
                <span className="text-sm text-cyber-muted">Dépense récurrente (mensuelle)</span>
              </label>
              <button type="submit" className="w-full neon-button-primary py-3 uppercase tracking-widest font-bold">Enregistrer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
