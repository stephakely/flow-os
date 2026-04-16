import React, { useState, useEffect } from 'react';
import { api, formatAmount } from '../lib/apiService';
import { FileText, Plus, Trash2, Download, Eye, CheckCircle, XCircle, Clock, Send } from 'lucide-react';

const STAGES = ['Brouillon', 'Envoyé', 'Accepté', 'Refusé', 'Expiré'];
const STAGE_COLORS = {
  'Brouillon': 'text-gray-400 bg-gray-500/10 border-gray-500/30',
  'Envoyé': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  'Accepté': 'text-green-400 bg-green-500/10 border-green-500/30',
  'Refusé': 'text-red-400 bg-red-500/10 border-red-500/30',
  'Expiré': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
};

export default function Devis({ user }) {
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewQuote, setViewQuote] = useState(null);
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState({ clientId: '', title: '', validUntil: '', notes: '', items: [], itemInput: { desc: '', qty: 1, price: '' } });

  useEffect(() => {
    const unsub = api.subscribeClients(setClients);
    const handleUpdate = () => loadQuotes();
    window.addEventListener('flow-db-update', handleUpdate);
    loadQuotes();
    api.getSettings().then(setSettings);
    return () => { unsub(); window.removeEventListener('flow-db-update', handleUpdate); };
  }, []);

  const loadQuotes = () => {
    const lsdb = JSON.parse(localStorage.getItem('flow_os_db_v2') || '{}');
    setQuotes((lsdb.quotes || []).sort((a, b) => b.createdAt?.localeCompare(a.createdAt)));
  };

  const addItem = () => {
    if (!form.itemInput.desc || !form.itemInput.price) return;
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { id: `item_${Date.now()}`, desc: prev.itemInput.desc, qty: parseFloat(prev.itemInput.qty) || 1, price: parseFloat(prev.itemInput.price) || 0 }],
      itemInput: { desc: '', qty: 1, price: '' }
    }));
  };

  const removeItem = (id) => setForm(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));

  const totalHT = (items) => items.reduce((s, i) => s + i.qty * i.price, 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    const client = clients.find(c => c.id === form.clientId);
    const id = `DEV_${Date.now()}`;
    const num = `${settings.quotePrefix || 'DEV'}-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`;
    const quote = {
      id, num,
      clientId: form.clientId,
      clientName: client?.name || '',
      title: form.title,
      validUntil: form.validUntil,
      notes: form.notes,
      items: form.items,
      total: totalHT(form.items),
      status: 'Brouillon',
      createdAt: new Date().toISOString()
    };
    await api.updateCRMLead({ id, ...quote, colName: 'quotes' });
    // Save directly to quotes collection
    const lsdb = JSON.parse(localStorage.getItem('flow_os_db_v2') || '{}');
    if (!lsdb.quotes) lsdb.quotes = [];
    lsdb.quotes.push(quote);
    localStorage.setItem('flow_os_db_v2', JSON.stringify(lsdb));
    setShowModal(false);
    setForm({ clientId: '', title: '', validUntil: '', notes: '', items: [], itemInput: { desc: '', qty: 1, price: '' } });
    loadQuotes();
  };

  const updateStatus = (quoteId, status) => {
    const lsdb = JSON.parse(localStorage.getItem('flow_os_db_v2') || '{}');
    if (!lsdb.quotes) return;
    lsdb.quotes = lsdb.quotes.map(q => q.id === quoteId ? { ...q, status } : q);
    localStorage.setItem('flow_os_db_v2', JSON.stringify(lsdb));
    loadQuotes();
  };

  const deleteQuote = (id) => {
    if (!confirm('Supprimer ce devis ?')) return;
    const lsdb = JSON.parse(localStorage.getItem('flow_os_db_v2') || '{}');
    lsdb.quotes = (lsdb.quotes || []).filter(q => q.id !== id);
    localStorage.setItem('flow_os_db_v2', JSON.stringify(lsdb));
    loadQuotes();
  };

  const printQuote = (quote) => {
    const client = clients.find(c => c.id === quote.clientId);
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Devis ${quote.num}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#111}
      h1{color:#111}table{width:100%;border-collapse:collapse;margin:20px 0}
      th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f5f5f5}
      .total{text-align:right;font-size:1.2em;font-weight:bold;margin-top:20px}</style>
      </head><body>
      <h2>${settings.studioName || 'Studio'}</h2>
      <p>${settings.studioAddress || ''} | ${settings.studioEmail || ''} | ${settings.studioPhone || ''}</p>
      <hr/>
      <h1>DEVIS N° ${quote.num}</h1>
      <p>Date: ${new Date(quote.createdAt).toLocaleDateString('fr-FR')}</p>
      <p>Valide jusqu'au: ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('fr-FR') : 'N/A'}</p>
      <h3>Client: ${quote.clientName}</h3>
      <h3>Objet: ${quote.title}</h3>
      <table><tr><th>Description</th><th>Qté</th><th>Prix Unit.</th><th>Total</th></tr>
      ${quote.items.map(i => `<tr><td>${i.desc}</td><td>${i.qty}</td><td>${i.price} €</td><td>${(i.qty * i.price).toFixed(2)} €</td></tr>`).join('')}
      </table>
      <div class="total">TOTAL HT: ${quote.total?.toFixed(2)} €</div>
      ${quote.notes ? `<p><em>Notes: ${quote.notes}</em></p>` : ''}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const totalQuotes = quotes.reduce((s, q) => s + (q.total || 0), 0);
  const acceptedQuotes = quotes.filter(q => q.status === 'Accepté');

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Devis & <span className="text-cyber-neon">Propositions</span></h1>
          <p className="text-cyber-muted text-sm mt-1 uppercase tracking-widest">{quotes.length} devis • {formatAmount(totalQuotes)} total</p>
        </div>
        {user.role === 'admin' && (
          <button onClick={() => setShowModal(true)} className="neon-button-primary flex items-center gap-2">
            <Plus size={18} /> Nouveau Devis
          </button>
        )}
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAGES.map(s => {
          const count = quotes.filter(q => q.status === s).length;
          const val = quotes.filter(q => q.status === s).reduce((sum, q) => sum + (q.total || 0), 0);
          return (
            <div key={s} className={`glass-card p-4 border ${STAGE_COLORS[s]}`}>
              <p className="text-xs uppercase tracking-widest opacity-70">{s}</p>
              <p className="text-2xl font-black mt-1">{count}</p>
              <p className="text-xs opacity-60">{formatAmount(val)}</p>
            </div>
          );
        })}
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {quotes.length === 0 ? (
          <div className="glass-card p-16 text-center text-cyber-muted border-dashed border">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <p>Aucun devis créé. Commencez par créer votre premier devis client.</p>
          </div>
        ) : quotes.map(q => (
          <div key={q.id} className="glass-card p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-cyber-neon/10 border border-cyber-neon/20 flex items-center justify-center">
                <FileText size={20} className="text-cyber-neon" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white truncate">{q.num} — {q.title}</p>
                <p className="text-sm text-cyber-muted">{q.clientName} • Créé le {new Date(q.createdAt).toLocaleDateString('fr-FR')}</p>
                {q.validUntil && <p className="text-xs text-cyber-muted">Valide jusqu'au {new Date(q.validUntil).toLocaleDateString('fr-FR')}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-cyber-neon">{formatAmount(q.total)}</span>
              <span className={`text-xs px-2 py-1 rounded-full border ${STAGE_COLORS[q.status]}`}>{q.status}</span>
              {user.role === 'admin' && (
                <div className="flex gap-1">
                  <button onClick={() => setViewQuote(q)} className="p-2 text-cyber-muted hover:text-cyber-neon"><Eye size={16} /></button>
                  <button onClick={() => printQuote(q)} className="p-2 text-cyber-muted hover:text-green-400"><Download size={16} /></button>
                  <button onClick={() => deleteQuote(q.id)} className="p-2 text-cyber-muted hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Création */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-2xl mx-4 border border-cyber-neon/30 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-cyber-neon uppercase tracking-widest">Nouveau Devis</h2>
              <button onClick={() => setShowModal(false)} className="text-cyber-muted hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Client *</label>
                  <select required value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}
                    className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none">
                    <option value="">Sélectionner...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Valide jusqu'au</label>
                  <input type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Titre / Objet *</label>
                <input required type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none" placeholder="Ex: Production vidéo promotionnelle" />
              </div>

              <div>
                <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-2">Lignes de Devis</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="Description" value={form.itemInput.desc} onChange={e => setForm({ ...form, itemInput: { ...form.itemInput, desc: e.target.value } })}
                    className="flex-1 bg-black/50 border border-cyber-border text-white p-2 rounded-lg focus:border-cyber-neon outline-none text-sm" />
                  <input type="number" placeholder="Qté" value={form.itemInput.qty} onChange={e => setForm({ ...form, itemInput: { ...form.itemInput, qty: e.target.value } })}
                    className="w-16 bg-black/50 border border-cyber-border text-white p-2 rounded-lg focus:border-cyber-neon outline-none text-sm text-center" />
                  <input type="number" placeholder="Prix" value={form.itemInput.price} onChange={e => setForm({ ...form, itemInput: { ...form.itemInput, price: e.target.value } })}
                    className="w-24 bg-black/50 border border-cyber-border text-white p-2 rounded-lg focus:border-cyber-neon outline-none text-sm" />
                  <button type="button" onClick={addItem} className="neon-button-secondary px-3 text-sm">+</button>
                </div>
                <div className="space-y-1">
                  {form.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-black/30 p-2 rounded text-sm">
                      <span className="text-gray-300">{item.desc}</span>
                      <span className="text-cyber-muted">{item.qty} × {item.price} € = <span className="text-cyber-neon font-bold">{(item.qty * item.price).toFixed(2)} €</span></span>
                      <button type="button" onClick={() => removeItem(item.id)} className="text-red-400"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {form.items.length > 0 && (
                    <div className="text-right text-cyber-neon font-bold text-sm pt-2 border-t border-cyber-border/30">
                      TOTAL : {formatAmount(totalHT(form.items))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none resize-none" rows="2" />
              </div>
              <button type="submit" className="w-full neon-button-primary py-3 uppercase tracking-widest font-bold">Créer le Devis</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Vue Devis */}
      {viewQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-xl mx-4 border border-cyber-neon/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-cyber-neon">{viewQuote.num} — {viewQuote.title}</h2>
              <button onClick={() => setViewQuote(null)} className="text-cyber-muted hover:text-white">✕</button>
            </div>
            <p className="text-cyber-muted text-sm mb-4">Client: <span className="text-white">{viewQuote.clientName}</span></p>
            <div className="space-y-1 mb-4">
              {viewQuote.items.map(i => (
                <div key={i.id} className="flex justify-between text-sm bg-black/30 p-2 rounded">
                  <span>{i.desc} (×{i.qty})</span>
                  <span className="font-mono">{formatAmount(i.qty * i.price)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-cyber-neon pt-2 border-t border-cyber-border/30">
                <span>TOTAL HT</span><span>{formatAmount(viewQuote.total)}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {STAGES.filter(s => s !== viewQuote.status).map(s => (
                <button key={s} onClick={() => { updateStatus(viewQuote.id, s); setViewQuote({ ...viewQuote, status: s }); }}
                  className={`text-xs px-3 py-2 rounded-lg border ${STAGE_COLORS[s]} hover:opacity-80 transition-opacity`}>
                  → {s}
                </button>
              ))}
              <button onClick={() => printQuote(viewQuote)} className="text-xs px-3 py-2 rounded-lg border border-green-500/30 text-green-400 flex items-center gap-1">
                <Download size={12} /> Imprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
