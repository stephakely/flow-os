import React, { useState, useEffect } from 'react';
import { Camera, BatteryCharging, Wrench, AlertTriangle, Trash2, Plus, PenTool } from 'lucide-react';

export default function GearTracker({ user }) {
  const [gear, setGear] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'Camera', status: 'Available', value: '' });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadGear();
  }, []);

  const loadGear = () => {
    const lsdb = JSON.parse(localStorage.getItem('flow_os_db_v2') || '{}');
    setGear(lsdb.gear || []);
  };

  const saveGearItem = (e) => {
    e.preventDefault();
    const lsdb = JSON.parse(localStorage.getItem('flow_os_db_v2') || '{}');
    if (!lsdb.gear) lsdb.gear = [];
    lsdb.gear.push({ id: `gear_${Date.now()}`, ...form, value: parseFloat(form.value) || 0, addedAt: new Date().toISOString() });
    localStorage.setItem('flow_os_db_v2', JSON.stringify(lsdb));
    setShowModal(false);
    setForm({ name: '', type: 'Camera', status: 'Available', value: '' });
    loadGear();
  };

  const deleteGearItem = (id) => {
    if (!confirm('Supprimer ce matériel du studio ?')) return;
    const lsdb = JSON.parse(localStorage.getItem('flow_os_db_v2') || '{}');
    lsdb.gear = (lsdb.gear || []).filter(g => g.id !== id);
    localStorage.setItem('flow_os_db_v2', JSON.stringify(lsdb));
    loadGear();
  };

  const toggleStatus = (id, currentStatus) => {
    const lsdb = JSON.parse(localStorage.getItem('flow_os_db_v2') || '{}');
    const newStatus = currentStatus === 'Available' ? 'In Use' : currentStatus === 'In Use' ? 'Maintenance' : 'Available';
    const idx = lsdb.gear.findIndex(g => g.id === id);
    if (idx >= 0) {
      lsdb.gear[idx].status = newStatus;
      localStorage.setItem('flow_os_db_v2', JSON.stringify(lsdb));
      loadGear();
    }
  };

  const totalValue = gear.reduce((acc, g) => acc + (g.value || 0), 0);
  const maintCount = gear.filter(g => g.status === 'Maintenance').length;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white uppercase italic">Gear <span className="text-cyber-neon">Tracker</span></h1>
          <p className="text-cyber-muted tracking-widest mt-1 text-[10px] uppercase font-mono">
            {gear.length} Assets • Val. {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalValue)}
          </p>
        </div>
        {user.role === 'admin' && (
          <button onClick={() => setShowModal(true)} className="neon-button-primary flex items-center gap-2">
            <Plus size={16} /> Ajouter Matériel
          </button>
        )}
      </header>

      {maintCount > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-3 animate-pulse">
          <AlertTriangle size={18} />
          <span className="text-xs uppercase font-bold tracking-widest">{maintCount} équipements nécessitent une maintenance !</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gear.map(g => (
          <div key={g.id} className="glass-card p-6 border-white/5 relative group hover:border-cyber-neon/30 transition-colors">
            {user.role === 'admin' && (
              <button onClick={() => deleteGearItem(g.id)} className="absolute top-4 right-4 text-red-500/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={16} />
              </button>
            )}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-cyber-neon shadow-neon-small">
                {g.type === 'Camera' ? <Camera size={20} /> : g.type === 'Lumières' ? <BatteryCharging size={20} /> : <PenTool size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-white">{g.name}</h3>
                <span className="text-[9px] text-cyber-muted uppercase tracking-[0.2em]">{g.type}</span>
              </div>
            </div>
            
            <button 
              onClick={() => user.role === 'admin' && toggleStatus(g.id, g.status)}
              className={`w-full py-2 rounded-lg text-xs font-black uppercase tracking-widest border transition-all ${
                g.status === 'Available' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                g.status === 'In Use' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {g.status} {g.status === 'Maintenance' && <Wrench size={10} className="inline ml-1 mb-0.5" />}
            </button>
            <div className="mt-4 text-center">
              <span className="text-[10px] uppercase font-mono text-cyber-muted">Valeur Parc : </span>
              <span className="text-xs font-mono font-bold text-cyber-neon">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(g.value)}</span>
            </div>
          </div>
        ))}
        {gear.length === 0 && (
          <div className="col-span-full py-20 text-center text-cyber-muted border border-dashed border-white/5 rounded-3xl">
            L'inventaire du Parc Matériel est vide.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-md mx-4 border-cyber-neon/30">
            <h2 className="text-xl font-bold text-cyber-neon uppercase tracking-widest mb-6">Nouvel Équipement</h2>
            <form onSubmit={saveGearItem} className="space-y-4">
              <div>
                <label className="text-xs text-cyber-muted block mb-1">Nom / Modèle *</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-cyber" placeholder="Sony FX6..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-cyber-muted block mb-1">Catégorie</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-cyber">
                    <option>Camera</option>
                    <option>Objectifs</option>
                    <option>Lumières</option>
                    <option>Audio</option>
                    <option>Drone</option>
                    <option>Accessoires</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-cyber-muted block mb-1">Valeur Assurée (€) *</label>
                  <input required type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})} className="input-cyber font-mono" placeholder="5000" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 neon-button-secondary">Annuler</button>
                <button type="submit" className="flex-1 neon-button-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
