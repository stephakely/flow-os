import React, { useState, useEffect } from 'react';
import { api, formatAmount } from '../lib/apiService';
import { Star, MessageCircle, ArrowRight, Plus, X, Zap, Rocket, Palette } from 'lucide-react';
import { motion } from 'framer-motion';

const stages = [
  { id: 'contact', title: '1. Nouveaux Contacts', color: 'border-blue-500/50', text: 'text-blue-400', bg: 'bg-blue-500' },
  { id: 'negociation', title: '2. En Négociation', color: 'border-yellow-500/50', text: 'text-yellow-400', bg: 'bg-yellow-500' },
  { id: 'won', title: '3. Deal Gagné', color: 'border-green-500/50', text: 'text-green-400', bg: 'bg-green-500' }
];

const stageOrder = ['contact', 'negociation', 'won'];

export default function CRM({ user }) {
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [team, setTeam] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(null); // lead à convertir
  const [showBrandKitModal, setShowBrandKitModal] = useState(null); // client ID
  const [activeTab, setActiveTab] = useState('pipeline');

  // Formulaire nouveau lead
  const [form, setForm] = useState({
    title: '', source: 'Instagram', value: '', notes: '', nextAction: ''
  });

  // Formulaire conversion lead -> projet
  const [convertForm, setConvertForm] = useState({
    clientId: '', assigneeId: '', price: '', priority: 'NORMAL'  
  });

  useEffect(() => {
    loadData();
    const handleDbUpdate = () => loadData();
    window.addEventListener('flow-db-update', handleDbUpdate);
    return () => window.removeEventListener('flow-db-update', handleDbUpdate);
  }, []);

  const loadData = async () => {
    setLeads(await api.getCRMLeads());
    setClients(await api.getClients());
    setTeam(await api.getTeam());
  };

  const advanceStage = async (lead) => {
    const currentIdx = stageOrder.indexOf(lead.stage);
    if (currentIdx < stageOrder.length - 1) {
      const updatedLead = { ...lead, stage: stageOrder[currentIdx + 1] };
      await api.updateCRMLead(updatedLead);
      loadData();
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    const newLead = {
      id: `L_${Date.now()}`,
      title: form.title,
      source: form.source,
      stage: 'contact',
      value: parseFloat(form.value) || 0,
      nextAction: form.nextAction,
      notes: form.notes,
      createdAt: new Date().toISOString()
    };
    await api.updateCRMLead(newLead);
    setShowModal(false);
    setForm({ title: '', source: 'Instagram', value: '', notes: '', nextAction: '' });
    loadData();
  };

  // Convertir un lead gagné en projet de production !
  const handleConvertToProject = async (e) => {
    e.preventDefault();
    const lead = showConvertModal;
    const newProject = {
      id: `P_${Date.now()}`,
      title: lead.title,
      clientId: convertForm.clientId,
      assigneeId: convertForm.assigneeId,
      price: parseFloat(convertForm.price) || lead.value,
      currency: 'EUR',
      priority: convertForm.priority,
      payment_status: 'EN ATTENTE',
      link_rushes: '',
      link_review: '',
      platform_fee_pct: 2,
      subtasks: [
        { id: `st_${Date.now()}_1`, title: 'Dérushage', done: false },
        { id: `st_${Date.now()}_2`, title: 'Montage', done: false },
        { id: `st_${Date.now()}_3`, title: 'Color Grading', done: false },
        { id: `st_${Date.now()}_4`, title: 'Export Final', done: false },
      ],
      timeLogs: [],
      createdAt: new Date().toISOString()
    };
    await api.saveProject(newProject);
    // Marquer le lead comme converti dans ses notes
    await api.updateCRMLead({ ...lead, notes: `${lead.notes || ''}\n[CONVERTI EN PROJET ${newProject.id}]` });
    setShowConvertModal(null);
    setConvertForm({ clientId: '', assigneeId: '', price: '', priority: 'NORMAL' });
    alert('🚀 Lead converti en Projet de Production !');
    loadData();
  };

  const deleteLead = async (lead) => {
    if (confirm("Supprimer ce prospect ?")) {
      await api.deleteCRMLead(lead.id);
      loadData();
    }
  };

  const PipelineCard = ({ lead }) => {
    const isWon = lead.stage === 'won';
    return (
      <div className="bg-black/40 border border-cyber-border/30 rounded-lg p-4 hover:border-cyber-neon hover:shadow-neon-hover transition-all group">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-white text-sm">{lead.title}</h4>
          <div className="flex items-center text-xs text-cyber-muted gap-1">
            <Star size={12} className="text-yellow-500" />
            {formatAmount(lead.value, 'EUR')}
          </div>
        </div>
        <p className="text-xs text-gray-400 line-clamp-2 mb-1">{lead.notes || 'Aucune note'}</p>
        {lead.nextAction && (
          <div className="text-xs text-cyber-neon/70 mb-3 italic">▸ {lead.nextAction}</div>
        )}
        
        <div className="flex justify-between items-center text-xs text-cyber-muted pt-2 border-t border-cyber-border/20">
          <span className="bg-cyber-dark px-2 py-0.5 rounded">{lead.source}</span>
          <div className="flex items-center gap-2">
            {isWon && (
              <button 
                onClick={() => { setShowConvertModal(lead); setConvertForm({ ...convertForm, price: lead.value.toString() }); }}
                className="text-green-400 flex items-center gap-1 hover:text-white bg-green-500/10 px-2 py-1 rounded"
              >
                <Rocket size={14} /> Convertir
              </button>
            )}
            {!isWon && (
              <button onClick={() => advanceStage(lead)} className="text-cyber-neon flex items-center gap-1 hover:text-white">
                <ArrowRight size={14} /> Avancer
              </button>
            )}
            <button onClick={() => deleteLead(lead)} className="text-red-500/40 hover:text-red-500 ml-1">✕</button>
          </div>
        </div>
      </div>
    );
  };

  const [brandKitForm, setBrandKitForm] = useState({ colors: '', fonts: '', logos: '' });

  const loadBrandKit = async (clientId) => {
    const kit = await api.getBrandKit(clientId);
    setBrandKitForm({
      colors: kit.colors?.join(', ') || '',
      fonts: kit.fonts?.join(', ') || '',
      logos: kit.logos?.join(', ') || ''
    });
    setShowBrandKitModal(clientId);
  };

  const handleSaveBrandKit = async (e) => {
    e.preventDefault();
    await api.updateBrandKit({
      clientId: showBrandKitModal,
      colors: brandKitForm.colors.split(',').map(c => c.trim()).filter(c => c),
      fonts: brandKitForm.fonts.split(',').map(f => f.trim()).filter(f => f),
      logos: brandKitForm.logos.split(',').map(l => l.trim()).filter(l => l)
    });
    setShowBrandKitModal(null);
    alert('Brand Kit mis à jour !');
  };

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-6rem)] flex flex-col">
      <header className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="text-3xl font-bold text-cyber-text tracking-tighter uppercase italic">CRM <span className="text-cyber-neon">Manager</span></h1>
          </div>
          <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
            <button 
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'pipeline' ? 'bg-cyber-neon text-black shadow-neon' : 'text-cyber-muted hover:text-white'}`}
            >
              PIPELINE DEALS
            </button>
            <button 
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'clients' ? 'bg-cyber-neon text-black shadow-neon' : 'text-cyber-muted hover:text-white'}`}
            >
              CLIENT IDENTITY
            </button>
          </div>
        </div>
        {activeTab === 'pipeline' && (
          <button onClick={() => setShowModal(true)} className="neon-button-primary flex items-center gap-2">
            <Plus size={18} /> Nouveau Prospect
          </button>
        )}
      </header>

      {activeTab === 'pipeline' ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-6 h-full min-w-max pb-4">
          {stages.map(stage => {
            const columnLeads = leads.filter(l => l.stage === stage.id);
            const totalValue = columnLeads.reduce((acc, l) => acc + l.value, 0);

            return (
              <div key={stage.id} className={`w-80 h-full flex flex-col glass-card border-t-4 ${stage.color}`}>
                <div className="p-4 border-b border-cyber-border/30 flex justify-between items-center shrink-0">
                  <h3 className={`font-bold tracking-wider uppercase text-sm ${stage.text}`}>{stage.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${stage.bg} text-black px-2 py-0.5 rounded-full font-bold`}>{columnLeads.length}</span>
                    <div className="text-xs bg-black/50 px-2 py-1 rounded-full text-cyber-muted">
                      {formatAmount(totalValue, 'EUR')}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {columnLeads.map(lead => (
                    <PipelineCard key={lead.id} lead={lead} />
                  ))}
                  
                  {columnLeads.length === 0 && (
                    <div className="text-center py-10 text-cyber-muted text-xs uppercase tracking-widest border border-dashed border-cyber-border/20 rounded-lg">
                      Aucun prospect
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 custom-scrollbar">
          {clients.map(client => (
            <div key={client.id} className="glass-card p-6 border-white/5 hover:border-cyber-neon/30 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyber-neon/10 flex items-center justify-center text-cyber-neon border border-cyber-neon/20">
                    <Star size={24} />
                  </div>
                  <span className="text-[10px] text-cyber-muted font-mono">{client.contractType || 'Par Vidéo'}</span>
                </div>
                <h3 className="text-xl font-black text-white italic uppercase mb-2">{client.name}</h3>
                <p className="text-xs text-cyber-muted mb-4">{client.email}</p>
              </div>
              <button 
                onClick={() => loadBrandKit(client.id)}
                className="w-full neon-button-secondary !py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border-dashed opacity-70 group-hover:opacity-100"
              >
                <Palette size={14} /> Gérer le Brand Kit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* =================== MODAL BRAND KIT =================== */}
      {showBrandKitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card p-8 w-full max-w-md border-cyber-gold/30">
            <h2 className="text-xl font-black text-white uppercase italic mb-6 flex items-center gap-2">
              <Palette size={24} className="text-cyber-gold" /> Client Identity Kit
            </h2>
            <form onSubmit={handleSaveBrandKit} className="space-y-4">
              <div>
                <label className="text-[10px] text-cyber-muted uppercase font-bold block mb-1">Color Palette (Hex values, comma separated)</label>
                <input type="text" value={brandKitForm.colors} onChange={e => setBrandKitForm({...brandKitForm, colors: e.target.value})} className="input-cyber text-cyber-gold" placeholder="#00FFAA, #000000, #FFFFFF" />
              </div>
              <div>
                <label className="text-[10px] text-cyber-muted uppercase font-bold block mb-1">Brand Fonts</label>
                <input type="text" value={brandKitForm.fonts} onChange={e => setBrandKitForm({...brandKitForm, fonts: e.target.value})} className="input-cyber" placeholder="Inter, Outfit, Roboto" />
              </div>
              <div>
                <label className="text-[10px] text-cyber-muted uppercase font-bold block mb-1">Logo Assets (URLs)</label>
                <textarea value={brandKitForm.logos} onChange={e => setBrandKitForm({...brandKitForm, logos: e.target.value})} className="input-cyber h-20 resize-none" placeholder="https://cdn/logo_white.png, ..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowBrandKitModal(null)} className="flex-1 neon-button-secondary py-2 uppercase font-bold text-xs">Fermer</button>
                <button type="submit" className="flex-1 neon-button-primary !border-cyber-gold !text-cyber-gold py-2 uppercase font-bold text-xs">Enregistrer</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* =================== MODAL NOUVEAU LEAD =================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-8 w-full max-w-md mx-4 border border-cyber-neon/30 shadow-[0_0_50px_-12px_rgba(0,255,170,0.3)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-cyber-neon uppercase tracking-widest">Nouveau Prospect</h2>
              <button onClick={() => setShowModal(false)} className="text-cyber-muted hover:text-white transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Titre du Deal *</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none" placeholder="Ex: Clip Musical Neon Nights" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Source</label>
                  <select value={form.source} onChange={e => setForm({...form, source: e.target.value})}
                    className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none">
                    <option>Instagram</option>
                    <option>LinkedIn</option>
                    <option>Bouche à oreille</option>
                    <option>Email</option>
                    <option>Site Web</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Valeur Estimée (€)</label>
                  <input type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})}
                    className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none" placeholder="800" />
                </div>
              </div>

              <div>
                <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Prochaine Action</label>
                <input type="text" value={form.nextAction} onChange={e => setForm({...form, nextAction: e.target.value})}
                  className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none" placeholder="Ex: Rappeler mardi" />
              </div>

              <div>
                <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3}
                  className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none resize-none" placeholder="Détails supplémentaires..." />
              </div>

              <button type="submit" className="w-full neon-button-primary py-3 uppercase tracking-widest font-bold mt-2">
                Ajouter au Pipeline
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =================== MODAL CONVERSION LEAD -> PROJET =================== */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-8 w-full max-w-md mx-4 border border-green-500/30 shadow-[0_0_50px_-12px_rgba(34,197,94,0.3)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                <Rocket size={22} /> Convertir en Projet
              </h2>
              <button onClick={() => setShowConvertModal(null)} className="text-cyber-muted hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <p className="text-sm text-cyber-muted mb-6">Transformer "<span className="text-white font-bold">{showConvertModal.title}</span>" en projet de production.</p>

            <form onSubmit={handleConvertToProject} className="space-y-4">
              <div>
                <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Client Associé *</label>
                <select required value={convertForm.clientId} onChange={e => setConvertForm({...convertForm, clientId: e.target.value})}
                  className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-green-500 outline-none">
                  <option value="">Sélectionner un client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Monteur Assigné *</label>
                <select required value={convertForm.assigneeId} onChange={e => setConvertForm({...convertForm, assigneeId: e.target.value})}
                  className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-green-500 outline-none">
                  <option value="">Sélectionner un monteur...</option>
                  {team.filter(t => t.role === 'editor' || t.role === 'admin').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Prix (€)</label>
                  <input type="number" value={convertForm.price} onChange={e => setConvertForm({...convertForm, price: e.target.value})}
                    className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-green-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Priorité</label>
                  <select value={convertForm.priority} onChange={e => setConvertForm({...convertForm, priority: e.target.value})}
                    className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-green-500 outline-none">
                    <option value="NORMAL">Normal</option>
                    <option value="URGENCE">🔴 Urgence</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-3 uppercase tracking-widest font-bold mt-2 border border-green-500 text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                🚀 Lancer la Production
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
