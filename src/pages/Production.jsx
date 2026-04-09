import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiService';
import { Play, Square, Clock, AlertTriangle, ShieldAlert, X, Plus, CheckCircle, Circle, Trash2, DollarSign, RefreshCw, Lock } from 'lucide-react';

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
    <div className="flex items-center gap-3 bg-black/40 p-2 rounded-lg border border-cyber-border/30">
      <Clock size={16} className="text-cyber-neon" />
      <span className="font-mono text-lg font-bold">{formatTime(elapsed)}</span>
      <div className="flex gap-1">
        <button onClick={() => setIsRunning(!isRunning)} className={`p-2 rounded-lg ${isRunning ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
          {isRunning ? <Square size={16} /> : <Play size={16} />}
        </button>
        <button onClick={resetTimer} className="p-2 rounded-lg bg-gray-500/20 text-gray-400 hover:text-white" title="Reset Chrono">
          <RefreshCw size={16} />
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
      <div className="flex justify-between text-xs text-cyber-muted mb-1">
        <span>{done}/{subtasks.length} tâches</span>
        <span className={pct === 100 ? 'text-green-400 font-bold' : ''}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-cyber-border/20">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-cyber-neon shadow-neon'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default function Production({ user }) {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [team, setTeam] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: '', clientId: '', assigneeId: '', price: '', priority: 'NORMAL',
    link_rushes: '', link_review: '', platform_fee_pct: 2,
    subtaskInput: '', subtasks: [], notes: ''
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
      totalTime: 0,
      timeLogs: [],
      createdAt: new Date().toISOString()
    };
    try {
      await api.saveProject(newProject);
      setShowModal(false);
      setForm({ title: '', clientId: '', assigneeId: '', price: '', priority: 'NORMAL', link_rushes: '', link_review: '', platform_fee_pct: 2, subtaskInput: '', subtasks: [], notes: '' });
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
    <div className="text-cyber-neon animate-pulse p-8 font-mono tracking-widest">
      CHARGEMENT DU PIPELINE...
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cyber-text">Production <span className="text-cyber-neon">Pipeline</span></h1>
          <p className="text-cyber-muted tracking-widest mt-1 text-sm uppercase">Active Workloads ({projects.length})</p>
        </div>
        {user.role === 'admin' && (
          <div className="flex gap-3">
            <button onClick={async () => {
              if (confirm('Archiver TOUS les projets 100% terminés et payés ?')) {
                const count = await api.archiveCompletedProjects();
                alert(`${count} projet(s) archivé(s).`);
              }
            }} className="neon-button-secondary flex items-center gap-2 border-dashed">
              <RefreshCw size={16} /> Clean
            </button>
            <button onClick={() => setShowModal(true)} className="neon-button-primary flex items-center gap-2">
              <Plus size={18} /> Nouveau Projet
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map(p => (
          <div key={p.id} className={`glass-card p-6 relative overflow-hidden flex flex-col justify-between ${p.priority === 'URGENCE' ? 'emergency-pulse border-red-500/50' : ''}`}>

            {/* Watermark */}
            {p.payment_status === 'EN ATTENTE' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 rotate-[-15deg]">
                <ShieldAlert size={120} className="text-yellow-500 mr-2" />
                <span className="text-5xl font-black text-yellow-500 tracking-tighter uppercase text-center leading-tight">
                  PROPRIÉTÉ DU STUDIO<br />EN ATTENTE DE PAIEMENT
                </span>
              </div>
            )}

            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">{p.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-1 bg-cyber-neon/10 text-cyber-neon rounded-full border border-cyber-border/30">
                      👤 {getClientName(p.clientId)}
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/30">
                      🎬 {getMemberName(p.assigneeId)}
                    </span>
                    {p.priority === 'URGENCE' && (
                      <span className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded-full flex items-center gap-1">
                        <AlertTriangle size={12} /> URGENCE
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  {/* Bouton paiement — ADMIN ONLY */}
                  <div className="relative group">
                    <button
                      onClick={() => togglePaymentStatus(p)}
                      disabled={user.role !== 'admin'}
                      className={`text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold transition-all ${
                        p.payment_status === 'PAYÉ'
                          ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                      } ${user.role !== 'admin' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-105'}`}
                    >
                      {user.role !== 'admin' && <Lock size={10} className="inline mr-1" />}
                      <DollarSign size={12} className="inline mr-1" />
                      {p.payment_status}
                    </button>
                    {user.role !== 'admin' && (
                      <span className="absolute -top-8 right-0 text-[10px] bg-black border border-cyber-border px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        Admin uniquement
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-bold text-cyber-neon font-mono">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(p.price || 0)}
                  </span>
                </div>
              </div>

              {/* Progression */}
              <ProgressBar subtasks={p.subtasks} />

              {/* Notes */}
              {p.notes && (
                <div className="text-xs text-cyber-muted bg-black/20 border border-cyber-border/20 rounded p-2 italic">
                  📝 {p.notes}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-semibold text-cyber-muted uppercase tracking-wider">Sous-tâches</h4>
                  {(user.role === 'admin' || p.assigneeId === user.id) && (
                    <button onClick={() => resetAllSubtasks(p)} className="text-[10px] text-cyber-muted hover:text-cyber-neon uppercase tracking-tighter flex items-center gap-1 opacity-50 hover:opacity-100">
                      <RefreshCw size={10} /> Reset
                    </button>
                  )}
                </div>
                {p.subtasks?.map(t => (
                  <div
                    key={t.id}
                    onClick={() => (user.role === 'admin' || p.assigneeId === user.id) && toggleSubtask(p, t.id)}
                    className={`flex items-center gap-3 bg-black/30 p-2 rounded hover:bg-black/50 transition-colors border border-transparent hover:border-cyber-border/30 group ${(user.role === 'admin' || p.assigneeId === user.id) ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {t.done ? <CheckCircle size={18} className="text-green-400" /> : <Circle size={18} className="text-cyber-muted group-hover:text-cyber-neon" />}
                    <span className={t.done ? 'line-through text-cyber-muted' : 'text-gray-200'}>{t.title}</span>
                  </div>
                ))}
                {(!p.subtasks || p.subtasks.length === 0) && (
                  <p className="text-xs text-cyber-muted italic">Aucune sous-tâche.</p>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-cyber-border/30">
                <TimerBlock project={p} onUpdate={() => {}} />
                <div className="flex gap-2">
                  {p.link_rushes && <a href={p.link_rushes} target="_blank" rel="noreferrer" className="neon-button-secondary text-xs">Rushes</a>}
                  {p.link_review && <a href={p.link_review} target="_blank" rel="noreferrer" className="neon-button-secondary text-sm">Review</a>}
                  {user.role === 'admin' && (
                    <>
                      <button onClick={() => handleArchive(p)} className="neon-button-primary text-sm bg-green-500/10 border-green-500 text-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)]">Archiver</button>
                      <button onClick={() => handleDelete(p)} className="p-2 text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full py-20 text-center text-cyber-muted border border-dashed border-cyber-border/30 rounded-xl bg-black/20">
            Aucun projet actif détecté.
          </div>
        )}
      </div>

      {/* MODAL NOUVEAU PROJET */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-8 w-full max-w-lg mx-4 border border-cyber-neon/30 shadow-[0_0_50px_-12px_rgba(0,255,170,0.3)] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-cyber-neon uppercase tracking-widest">Nouveau Projet</h2>
              <button onClick={() => setShowModal(false)} className="text-cyber-muted hover:text-white transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Titre du Projet *</label>
                <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none" placeholder="Ex: Montage Clip Promo" />
              </div>

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
                  <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Monteur Assigné *</label>
                  <select required value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })}
                    className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none">
                    <option value="">Sélectionner...</option>
                    {team.filter(t => t.role === 'editor' || t.role === 'admin').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Prix (€) *</label>
                  <input type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none" placeholder="1500" />
                </div>
                <div>
                  <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Priorité</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none">
                    <option value="NORMAL">Normal</option>
                    <option value="URGENCE">🔴 Urgence</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Frais Plateforme %</label>
                  <input type="number" value={form.platform_fee_pct} onChange={e => setForm({ ...form, platform_fee_pct: e.target.value })}
                    className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none" placeholder="2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Lien Rushes</label>
                  <input type="url" value={form.link_rushes} onChange={e => setForm({ ...form, link_rushes: e.target.value })}
                    className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none" placeholder="https://drive.google.com/..." />
                </div>
                <div>
                  <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Lien Review</label>
                  <input type="url" value={form.link_review} onChange={e => setForm({ ...form, link_review: e.target.value })}
                    className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none" placeholder="https://frame.io/..." />
                </div>
              </div>

              <div>
                <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Notes Internes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none resize-none" rows="2" placeholder="Remarques, consignes..." />
              </div>

              <div>
                <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Sous-tâches</label>
                <div className="flex gap-2">
                  <input type="text" value={form.subtaskInput} onChange={e => setForm({ ...form, subtaskInput: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtaskToForm())}
                    className="flex-1 bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none" placeholder="Ex: Dérushage" />
                  <button type="button" onClick={addSubtaskToForm} className="neon-button-secondary px-4">+</button>
                </div>
                <div className="mt-2 space-y-1">
                  {form.subtasks.map(s => (
                    <div key={s.id} className="flex justify-between items-center bg-black/30 p-2 rounded text-sm text-gray-300">
                      <span>{s.title}</span>
                      <button type="button" onClick={() => removeSubtaskFromForm(s.id)} className="text-red-500/50 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full neon-button-primary py-3 uppercase tracking-widest font-bold mt-4">
                Lancer la Production
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
