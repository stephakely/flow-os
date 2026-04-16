import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiService';
import { Play, Square, Clock, AlertTriangle, ShieldAlert, X, Plus, CheckCircle, Circle, Trash2, DollarSign, RefreshCw, Lock, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Étapes de montage par défaut
const getDefaultSubtasks = () => [
  { id: `st_1_${Date.now()}`, title: 'Dérushage', done: false },
  { id: `st_2_${Date.now()}`, title: 'Montage Cut', done: false },
  { id: `st_3_${Date.now()}`, title: 'Sound Design & Mix', done: false },
  { id: `st_4_${Date.now()}`, title: 'Étalonnage', done: false },
  { id: `st_5_${Date.now()}`, title: 'Habillage & VFX', done: false },
  { id: `st_6_${Date.now()}`, title: 'Export & Livraison', done: false }
];

// Composant Status Indicator
const ServiceStatus = ({ type = 'database' }) => (
  <div className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-cyber-border/30 rounded-full">
    <div className="w-1.5 h-1.5 rounded-full bg-cyber-neon shadow-neon animate-pulse"></div>
    <span className="text-[9px] uppercase tracking-widest text-cyber-muted font-bold">{type} online</span>
  </div>
);

// Composant Timer avec persistance Firestore
const TimerBlock = ({ project, onUpdate }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(project.totalTime || 0);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning && elapsed !== project.totalTime) {
      api.saveProject({ ...project, totalTime: elapsed }).catch(console.error);
    }
  }, [isRunning]);

  const resetTimer = async () => {
    if (confirm('Réinitialiser le chrono ?')) {
      setElapsed(0);
      setIsRunning(false);
      await api.saveProject({ ...project, totalTime: 0 });
    }
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-black/60 p-2 rounded-xl border border-white/5">
      <Clock size={16} className="text-cyber-neon" />
      <span className="font-mono text-lg font-bold text-glow-neon">{formatTime(elapsed)}</span>
      <div className="flex gap-1 ml-2">
        <button onClick={() => setIsRunning(!isRunning)} className={`p-2 rounded-lg transition-all ${isRunning ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-cyber-neon/10 text-cyber-neon hover:bg-cyber-neon/20'}`}>
          {isRunning ? <Square size={14} /> : <Play size={14} />}
        </button>
        <button onClick={resetTimer} className="p-2 rounded-lg bg-white/5 text-cyber-muted hover:text-white transition-colors" title="Reset Chrono">
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );
};

// Barre de progression
const ProgressBar = ({ subtasks }) => {
  if (!subtasks || subtasks.length === 0) return null;
  const done = subtasks.filter(t => t.done).length;
  const pct = Math.round((done / subtasks.length) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-cyber-muted mb-1.5 uppercase font-bold tracking-widest">
        <span>{done}/{subtasks.length} Step Complete</span>
        <span className={pct === 100 ? 'text-cyber-neon' : ''}>{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          className={`h-full rounded-full transition-all duration-1000 ${pct === 100 ? 'bg-cyber-neon shadow-neon-strong' : 'bg-cyber-blue shadow-neon-blue'}`}
        />
      </div>
    </div>
  );
};

export default function Production({ user }) {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [team, setTeam] = useState([]);
  const [clientAssets, setClientAssets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: '', clientId: '', assigneeId: '', price: '', priority: 'NORMAL',
    link_rushes: '', link_review: '', platform_fee_pct: 2,
    subtaskInput: '', subtasks: getDefaultSubtasks(), notes: '',
    deliveryDate: '',
    briefing: '', style: 'Minimalist', referenceLinks: '' 
  });

  useEffect(() => {
    setLoading(true);
    const unsub = api.subscribeProjects((data) => {
      if (user.role === 'admin') {
        setProjects(data);
      } else {
        setProjects(data.filter(x => x.assigneeId === user.id));
      }
      setLoading(false);
    });

    const loadStaticData = async () => {
      try {
        const [c, t] = await Promise.all([api.getClients(), api.getTeam()]);
        setClients(c);
        setTeam(t);
      } catch (e) {
        console.error('Error loading static data:', e);
      }
    };
    loadStaticData();

    return () => unsub();
  }, [user.role, user.id]);

  const [versionModal, setVersionModal] = useState({ show: false, project: null });
  const [vForm, setVForm] = useState({ title: '', url: '', notes: '' });

  const handleAddVersion = async (e) => {
    e.preventDefault();
    if (!vForm.url) return;
    await api.addProjectVersion({
      projectId: versionModal.project.id,
      clientId: versionModal.project.clientId,
      title: vForm.title || `Version ${Date.now()}`,
      url: vForm.url,
      notes: vForm.notes,
      versionNumber: Date.now()
    });
    setVersionModal({ show: false, project: null });
    setVForm({ title: '', url: '', notes: '' });
  };

  useEffect(() => {
    if (form.clientId) {
      api.getClientAssets(form.clientId).then(setClientAssets);
    } else {
      setClientAssets([]);
    }
  }, [form.clientId]);

  const handleArchive = async (p) => {
    if (confirm('Archiver ce projet et le fermer ?')) {
      try {
        await api.archiveProject(p);
      } catch (e) {
        alert('Erreur lors de l\'archivage.');
      }
    }
  };

  const handleDelete = async (p) => {
    if (confirm('Supprimer définitivement ce projet ?')) {
      try {
        await api.deleteProject(p.id);
      } catch (e) {
        alert('Erreur lors de la suppression.');
      }
    }
  };

  const toggleSubtask = async (project, subtaskId) => {
    const updatedSubtasks = project.subtasks.map(t =>
      t.id === subtaskId ? { ...t, done: !t.done } : t
    );
    await api.saveProject({ ...project, subtasks: updatedSubtasks });
  };

  // ✅ Seul l'admin peut valider le paiement
  const togglePaymentStatus = async (project) => {
    if (user.role !== 'admin') {
      alert('⛔ Seul un administrateur peut valider un paiement.');
      return;
    }
    const newStatus = project.payment_status === 'PAYÉ' ? 'EN ATTENTE' : 'PAYÉ';
    await api.saveProject({ ...project, payment_status: newStatus });
  };

  const resetAllSubtasks = async (project) => {
    if (confirm('Réinitialiser toutes les tâches du projet ?')) {
      const updatedSubtasks = project.subtasks.map(t => ({ ...t, done: false }));
      await api.saveProject({ ...project, subtasks: updatedSubtasks });
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const newProject = {
      id: `P_${Date.now()}`,
      title: form.title,
      clientId: form.clientId,
      assigneeId: form.assigneeId,
      price: parseFloat(form.price) || 0,
      currency: 'EUR',
      priority: form.priority,
      payment_status: 'EN ATTENTE',
      link_rushes: form.link_rushes,
      link_review: form.link_review,
      platform_fee_pct: parseFloat(form.platform_fee_pct) || 2,
      subtasks: form.subtasks,
      notes: form.notes,
      deliveryDate: form.deliveryDate,
      briefing: form.briefing,
      style: form.style,
      referenceLinks: form.referenceLinks,
      qcChecklist: [
        { id: 'qc1', title: 'Audio Normalization (-3dB)', done: false },
        { id: 'qc2', title: 'Color Grade & Matching', done: false },
        { id: 'qc3', title: 'Graphics & Titles Checked', done: false },
        { id: 'qc4', title: 'Subtitles & Sync', done: false }
      ],
      totalTime: 0,
      timeLogs: [],
      createdAt: new Date().toISOString()
    };
    try {
      await api.saveProject(newProject);
      // Log initial
      await api.logActivity({
        clientId: newProject.clientId,
        projectId: newProject.id,
        type: 'creation',
        message: `Nouveau projet créé : ${newProject.title}`
      });
      setShowModal(false);
      setForm({ 
        title: '', clientId: '', assigneeId: '', price: '', priority: 'NORMAL', 
        link_rushes: '', link_review: '', platform_fee_pct: 2, 
        subtaskInput: '', subtasks: getDefaultSubtasks(), notes: '',
        deliveryDate: '',
        briefing: '', style: 'Minimalist', referenceLinks: ''
      });
    } catch (e) {
      alert('Erreur lors de la création du projet.');
    }
  };

  const addSubtaskToForm = () => {
    if (!form.subtaskInput.trim()) return;
    setForm(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: `st_${Date.now()}`, title: prev.subtaskInput.trim(), done: false }],
      subtaskInput: ''
    }));
  };

  const removeSubtaskFromForm = (id) => {
    setForm(prev => ({ ...prev, subtasks: prev.subtasks.filter(s => s.id !== id) }));
  };

  const getClientName = (clientId) => {
    const c = clients.find(c => c.id === clientId);
    return c ? c.name : clientId;
  };

  const getMemberName = (memberId) => {
    const m = team.find(t => t.id === memberId);
    return m ? m.name : memberId;
  };

  if (loading) return (
    <div className="text-cyber-neon animate-pulse p-8 font-mono tracking-[0.5em] text-center w-full mt-20">
      DOWNLOADING PIPELINE STATE...
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="flex justify-between items-end border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Production </h1>
            <ServiceStatus type="pipeline" />
          </div>
          <p className="text-cyber-muted tracking-[0.3em] font-mono text-[10px] uppercase">Active Neural Workloads: {projects.length}</p>
        </div>
        {user.role === 'admin' && (
          <div className="flex gap-4">
            <button onClick={async () => {
              if (confirm('Archiver TOUS les projets 100% terminés et payés ?')) {
                const count = await api.archiveCompletedProjects();
                alert(`${count} projet(s) archivé(s).`);
              }
            }} className="neon-button-secondary border-dashed flex items-center gap-2">
              <RefreshCw size={14} className="opacity-50" /> Clean Flush
            </button>
            <button onClick={() => setShowModal(true)} className="neon-button-primary flex items-center gap-2">
              <Plus size={18} /> Deploy Mission
            </button>
          </div>
        )}
      </header>

      <motion.div 
        layout
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <AnimatePresence>
          {projects.map((p, idx) => (
            <motion.div 
              key={p.id} 
              layout
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05 }}
              className={`glass-card p-6 relative group overflow-hidden flex flex-col justify-between ${p.priority === 'URGENCE' ? 'emergency-pulse border-cyber-red/30' : ''}`}
            >
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-scanline pointer-events-none opacity-[0.03]" />

              {/* Watermark Protection */}
              {p.payment_status === 'EN ATTENTE' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                  <span className="text-7xl font-black text-white rotate-[-15deg] uppercase">PROPRIÉTÉ DU STUDIO</span>
                </div>
              )}

              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black text-white group-hover:text-cyber-neon transition-colors tracking-tight">{p.title}</h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[9px] px-2 py-0.5 bg-white/5 text-cyber-muted rounded uppercase font-bold tracking-[0.1em] border border-white/5">
                        Client: {getClientName(p.clientId)}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 bg-cyber-purple/10 text-cyber-purple rounded uppercase font-bold tracking-[0.1em] border border-cyber-purple/20">
                        Agent: {getMemberName(p.assigneeId)}
                      </span>
                      {p.priority === 'URGENCE' && (
                        <span className="text-[9px] px-2 py-0.5 bg-cyber-red/20 text-cyber-red rounded flex items-center gap-1 uppercase font-black animate-pulse">
                          <AlertTriangle size={10} /> Critical
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-3">
                    <button
                      onClick={() => togglePaymentStatus(p)}
                      disabled={user.role !== 'admin'}
                      className={`text-[9px] px-3 py-1 rounded-full uppercase tracking-[0.2em] font-black transition-all border ${
                        p.payment_status === 'PAYÉ'
                          ? 'bg-cyber-neon/10 text-cyber-neon border-cyber-neon/30'
                          : 'bg-cyber-gold/10 text-cyber-gold border-cyber-gold/30'
                      } ${user.role !== 'admin' ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'}`}
                    >
                      <DollarSign size={10} className="inline mb-0.5 mr-1" />
                      {p.payment_status}
                    </button>
                    <span className="text-xl font-black text-white font-mono tracking-tighter">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(p.price || 0)}
                    </span>
                    {p.deliveryDate && (
                      <div className="flex items-center gap-1.5 text-[10px] text-cyber-neon font-black uppercase tracking-widest mt-2">
                        <Clock size={12} /> Dead-line: {new Date(p.deliveryDate).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                </div>

                <ProgressBar subtasks={p.subtasks} />

                {p.notes && (
                  <div className="text-[11px] text-cyber-muted bg-black/40 border-l-2 border-cyber-neon/30 px-3 py-2 italic font-mono leading-relaxed">
                    "{p.notes}"
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-cyber-muted uppercase tracking-[0.3em]">Component Manifest</h4>
                    {(user.role === 'admin' || p.assigneeId === user.id) && (
                      <button onClick={() => resetAllSubtasks(p)} className="text-[9px] text-cyber-muted hover:text-white uppercase font-bold flex items-center gap-1 transition-colors">
                        <RefreshCw size={10} /> Flush Logic
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {p.subtasks?.map(t => (
                      <motion.div
                        key={t.id}
                        whileHover={{ x: 5 }}
                        onClick={() => (user.role === 'admin' || p.assigneeId === user.id) && toggleSubtask(p, t.id)}
                        className={`flex items-center gap-3 bg-black/30 p-2.5 rounded-xl border border-white/5 transition-all ${(user.role === 'admin' || p.assigneeId === user.id) ? 'cursor-pointer hover:bg-black/50 hover:border-white/10' : 'cursor-default'}`}
                      >
                        {t.done ? <CheckCircle size={16} className="text-cyber-neon shadow-neon" /> : <Circle size={16} className="text-cyber-muted" />}
                        <span className={`text-[13px] ${t.done ? 'line-through text-cyber-muted' : 'text-cyber-text font-medium'}`}>{t.title}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap justify-between items-center gap-4 pt-6 border-t border-white/5">
                  <TimerBlock project={p} onUpdate={() => {}} />
                  <div className="flex items-center gap-2">
                    {p.link_rushes && <a href={p.link_rushes} target="_blank" rel="noreferrer" className="neon-button-secondary !px-4 !py-1.5 !text-[10px] !uppercase">Rushes</a>}
                    {p.link_review && <a href={p.link_review} target="_blank" rel="noreferrer" className="neon-button-primary !px-4 !py-1.5 !text-[10px] !uppercase">Review</a>}
                    <button 
                      onClick={() => setVersionModal({ show: true, project: p })}
                      className="neon-button-secondary !px-4 !py-1.5 !text-[10px] !uppercase flex items-center gap-1"
                    >
                      <Plus size={10} /> Version
                    </button>
                    {user.role === 'admin' && (
                      <div className="flex items-center gap-1 ml-2 border-l border-white/10 pl-3">
                        <button onClick={() => handleArchive(p)} className="p-2 text-cyber-neon/50 hover:text-cyber-neon transition-colors" title="Archive"><RefreshCw size={16} /></button>
                        <button onClick={() => handleDelete(p)} className="p-2 text-cyber-red/30 hover:text-cyber-red transition-colors" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {projects.length === 0 && (
          <div className="col-span-full py-32 text-center text-cyber-muted border-2 border-dashed border-white/5 rounded-3xl bg-black/20">
            <div className="text-4xl mb-4 grayscale opacity-20">📡</div>
            <p className="tracking-widest uppercase font-black text-sm">No Active Neural Links Detected</p>
          </div>
        )}
      </motion.div>

      {/* MODAL NOUVEAU PROJET */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-10 w-full max-w-2xl border-cyber-neon/20 shadow-neon-strong max-h-[95vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-white uppercase italic italic tracking-tighter">Deploy New <span className="text-cyber-neon">Mission</span></h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-cyber-muted hover:text-white transition-colors"><X size={28} /></button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-6">
              <div>
                <label className="text-[10px] text-cyber-muted uppercase tracking-[0.3em] font-black block mb-2">Project Designation</label>
                <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="input-cyber" placeholder="Ex: Cyberpunk Promo v2.0" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] text-cyber-muted uppercase tracking-[0.3em] font-black block mb-2">Target Client</label>
                  <select required value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}
                    className="input-cyber">
                    <option value="">Select Entity...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-cyber-muted uppercase tracking-[0.3em] font-black block mb-2">Assigned Agent</label>
                  <select required value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })}
                    className="input-cyber">
                    <option value="">Select Asset...</option>
                    {team.filter(t => t.role === 'editor' || t.role === 'admin').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] text-cyber-muted uppercase tracking-[0.3em] font-black block mb-2">Neural Cost (€)</label>
                  <input type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    className="input-cyber font-mono" placeholder="000.00" />
                </div>
                <div>
                  <label className="text-[10px] text-cyber-muted uppercase tracking-[0.3em] font-black block mb-2">Threat Level</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="input-cyber font-bold text-cyber-neon">
                    <option value="NORMAL" className="text-white">Normal</option>
                    <option value="URGENCE" className="text-cyber-red">🔴 CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-cyber-muted uppercase tracking-[0.3em] font-black block mb-2">Platform Fee %</label>
                  <input type="number" value={form.platform_fee_pct} onChange={e => setForm({ ...form, platform_fee_pct: e.target.value })}
                    className="input-cyber font-mono" />
                </div>
              </div>

              <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                <div className="text-[10px] text-cyber-neon uppercase tracking-[0.3em] font-black mb-4">Creative Briefing</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-cyber-muted uppercase font-bold block mb-1">Visual Style</label>
                    <select value={form.style} onChange={e => setForm({...form, style: e.target.value})} className="input-cyber">
                      <option>Minimalist</option>
                      <option>Luxury / Elegant</option>
                      <option>Dynamic / Hype</option>
                      <option>Corporate</option>
                      <option>Cinematic</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-cyber-muted uppercase font-bold block mb-1">Estimated Delivery Date</label>
                    <input type="date" value={form.deliveryDate} onChange={e => setForm({ ...form, deliveryDate: e.target.value })} className="input-cyber" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-cyber-muted uppercase font-bold block mb-1">Briefing Notes</label>
                  <textarea value={form.briefing} onChange={e => setForm({...form, briefing: e.target.value})} className="input-cyber h-20 resize-none" placeholder="Target audience, main message, specific requirements..." />
                </div>
                <div>
                  <label className="text-[10px] text-cyber-muted uppercase font-bold block mb-1">References (Links)</label>
                  <input type="text" value={form.referenceLinks} onChange={e => setForm({...form, referenceLinks: e.target.value})} className="input-cyber" placeholder="https://youtube.com/..., https://vimeo.com/..." />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] text-cyber-muted uppercase tracking-[0.3em] font-black block mb-2">Rushes Link</label>
                  <input type="url" value={form.link_rushes} onChange={e => setForm({ ...form, link_rushes: e.target.value })}
                    className="input-cyber text-xs" placeholder="https://cloud.matrix/..." />
                  
                  {/* Quick Import Assets */}
                  {clientAssets.length > 0 && (
                    <div className="mt-3 space-y-2">
                       <div className="text-[9px] text-cyber-neon uppercase font-bold tracking-widest">Import from Client Rushes:</div>
                       <div className="flex flex-wrap gap-2">
                          {clientAssets.map(asset => (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => setForm({ ...form, link_rushes: asset.url })}
                              className="text-[10px] px-2 py-1 bg-cyber-neon/10 border border-cyber-neon/20 text-cyber-neon rounded hover:bg-cyber-neon/20 transition-all flex items-center gap-1"
                            >
                              <LinkIcon size={10} /> {asset.title}
                            </button>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-cyber-muted uppercase tracking-[0.3em] font-black block mb-2">Review Link</label>
                  <input type="url" value={form.link_review} onChange={e => setForm({ ...form, link_review: e.target.value })}
                    className="input-cyber text-xs" placeholder="https://frame.io/..." />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-cyber-muted uppercase tracking-[0.3em] font-black block mb-2">Internal Encryption Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="input-cyber resize-none h-20" placeholder="Specific technical requirements..." />
              </div>

              <div>
                <label className="text-[10px] text-cyber-muted uppercase tracking-[0.3em] font-black block mb-2">Manifest Components</label>
                <div className="flex gap-3">
                  <input type="text" value={form.subtaskInput} onChange={e => setForm({ ...form, subtaskInput: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtaskToForm())}
                    className="flex-1 input-cyber" placeholder="Add step..." />
                  <button type="button" onClick={addSubtaskToForm} className="neon-button-secondary px-6">Add</button>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {form.subtasks.map(s => (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={s.id} className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/5 text-[12px] text-gray-300">
                      <span>{s.title}</span>
                      <button type="button" onClick={() => removeSubtaskFromForm(s.id)} className="text-cyber-red/50 hover:text-cyber-red p-1"><X size={14} /></button>
                    </motion.div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full neon-button-primary py-4 uppercase font-black text-lg shadow-neon mt-4 italic">
                Initialize Pipeline
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL AJOUT VERSION */}
      {versionModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card p-8 w-full max-w-md border-cyber-neon/20">
            <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2">
              <Plus size={20} className="text-cyber-neon" /> Push New Version
            </h3>
            <form onSubmit={handleAddVersion} className="space-y-4">
              <div>
                <label className="text-[10px] text-cyber-muted uppercase font-bold block mb-1">Version Title</label>
                <input type="text" placeholder="ex: V1 (Premier Montage)" value={vForm.title} onChange={e => setVForm({...vForm, title: e.target.value})} className="input-cyber" />
              </div>
              <div>
                <label className="text-[10px] text-cyber-muted uppercase font-bold block mb-1">Lien du livrable (Review/Video)</label>
                <input type="url" required placeholder="https://..." value={vForm.url} onChange={e => setVForm({...vForm, url: e.target.value})} className="input-cyber text-cyber-neon" />
              </div>
              <div>
                <label className="text-[10px] text-cyber-muted uppercase font-bold block mb-1">Notes internes (optionnel)</label>
                <textarea value={vForm.notes} onChange={e => setVForm({...vForm, notes: e.target.value})} className="input-cyber h-20 resize-none" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setVersionModal({ show: false, project: null })} className="flex-1 neon-button-secondary py-2 uppercase font-bold text-xs">Annuler</button>
                <button type="submit" className="flex-1 neon-button-primary py-2 uppercase font-bold text-xs shadow-neon">Publier la version</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
