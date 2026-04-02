import React, { useState, useEffect } from 'react';
import { api, computeNetNet } from '../lib/apiService';
import { CheckCircle, Circle, Euro, Film, TrendingUp, Calendar, RefreshCw } from 'lucide-react';

export default function EditorDashboard({ user }) {
  const [projects, setProjects] = useState([]);
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const handleDbUpdate = () => loadData();
    window.addEventListener('flow-db-update', handleDbUpdate);
    return () => window.removeEventListener('flow-db-update', handleDbUpdate);
  }, []);

  const loadData = async () => {
    const allProjects = await api.getProjects();
    const allArchives = await api.getArchives();
    setProjects(allProjects.filter(p => p.assigneeId === user.id));
    setArchives(allArchives.filter(a => a.assigneeId === user.id));
    setLoading(false);
  };

  const toggleSubtask = async (projectId, subtaskId) => {
    const project = projects.find(p => p.id === projectId);
    const updatedSubtasks = project.subtasks.map(t => 
      t.id === subtaskId ? { ...t, done: !t.done } : t
    );
    const updatedProject = { ...project, subtasks: updatedSubtasks };
    await api.saveProject(updatedProject);
    loadData();
  };

  const resetAllSubtasks = async (project) => {
    if(confirm("Réinitialiser toutes les tâches de ce projet ?")) {
      const updatedSubtasks = project.subtasks.map(t => ({ ...t, done: false }));
      const updatedProject = { ...project, subtasks: updatedSubtasks };
      await api.saveProject(updatedProject);
      loadData();
    }
  };

  // Calcul des revenus par mois
  const getMonthlyRevenue = () => {
    const months = {};
    archives.forEach(a => {
      if (a.archivedAt) {
        const date = new Date(a.archivedAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        if (!months[key]) months[key] = { label, total: 0, videos: [] };
        const earned = computeNetNet(a.price, a.platform_fee_pct || 2, true);
        months[key].total += earned;
        months[key].videos.push({ title: a.title, earned });
      }
    });
    return Object.entries(months).sort(([a], [b]) => b.localeCompare(a));
  };

  const monthlyRevenue = getMonthlyRevenue();

  if (loading) return <div className="text-cyber-neon animate-pulse p-8 font-mono">CHARGEMENT DES DONNÉES...</div>;

  return (
    <div className="space-y-8 animate-fade-in relative">
      <header className="flex justify-between items-end border-b border-cyber-border pb-4 relative">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyber-neon/80 to-transparent"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-cyber-neon">ESPACE DE TRAVAIL</h1>
          <p className="text-cyber-muted tracking-widest text-sm mt-1 uppercase">Opérateur: {user.name}</p>
        </div>
      </header>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-xl border border-cyber-neon/20 bg-cyber-neon/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-cyber-neon/10 flex items-center justify-center">
            <Euro size={24} className="text-cyber-neon" />
          </div>
          <div>
            <div className="text-xs text-cyber-muted uppercase tracking-widest">Revenus Cumulés</div>
            <div className="text-2xl font-bold text-cyber-neon">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(user.totalEarned || 0)}</div>
          </div>
        </div>
        <div className="glass-card p-5 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Film size={24} className="text-purple-400" />
          </div>
          <div>
            <div className="text-xs text-cyber-muted uppercase tracking-widest">Projets Actifs</div>
            <div className="text-2xl font-bold text-purple-400">{projects.length}</div>
          </div>
        </div>
        <div className="glass-card p-5 rounded-xl border border-green-500/20 bg-green-500/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <TrendingUp size={24} className="text-green-400" />
          </div>
          <div>
            <div className="text-xs text-cyber-muted uppercase tracking-widest">Vidéos Livrées</div>
            <div className="text-2xl font-bold text-green-400">{archives.length}</div>
          </div>
        </div>
      </div>

      {/* Projets en cours */}
      <div>
        <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
          <Film size={18} className="text-cyber-neon" /> Projets à Réaliser
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {projects.length === 0 ? (
            <div className="glass-card p-8 text-center text-cyber-muted italic border-dashed uppercase tracking-widest col-span-full">
              Aucun projet assigné en ce moment. Bon repos !
            </div>
          ) : (
            projects.map(project => {
              const done = project.subtasks?.filter(t => t.done).length || 0;
              const total = project.subtasks?.length || 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <div key={project.id} className="glass-card p-6 rounded-xl hover:border-cyber-border transition-colors border border-transparent bg-black/40">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-cyber-text tracking-wide">{project.title}</h3>
                      <div className="text-xs text-cyber-muted mt-1 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyber-pulse animate-pulse"></span>
                        Priorité: {project.priority}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {project.link_rushes && (
                        <a href={project.link_rushes} target="_blank" rel="noreferrer" className="neon-button-secondary text-xs px-3 py-1">
                          RUSHES
                        </a>
                      )}
                      {project.link_review && (
                        <a href={project.link_review} target="_blank" rel="noreferrer" className="neon-button-secondary text-xs px-3 py-1">
                          REVIEW
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Barre de complétion */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-cyber-muted mb-1">
                      <span>{done}/{total} tâches</span>
                      <span className={pct === 100 ? 'text-green-400 font-bold' : ''}>{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-cyber-border/20">
                      <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-400' : 'bg-cyber-neon shadow-neon'}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center border-b border-cyber-border/40 pb-2">
                       <h4 className="text-sm font-bold text-cyber-neon/80 uppercase tracking-widest">Sous-tâches</h4>
                       <button 
                        onClick={() => resetAllSubtasks(project)}
                        className="text-[10px] text-cyber-muted hover:text-cyber-neon uppercase tracking-tighter flex items-center gap-1 opacity-50 hover:opacity-100"
                      >
                        <RefreshCw size={10} /> Reset
                      </button>
                    </div>
                    {project.subtasks?.map(task => (
                      <div 
                        key={task.id} 
                        className="flex justify-between items-center p-3 rounded-lg bg-cyber-dark/50 border border-cyber-border/30 hover:border-cyber-neon/50 transition-colors cursor-pointer group"
                        onClick={() => toggleSubtask(project.id, task.id)}
                      >
                        <span className={`text-sm tracking-wider ${task.done ? 'text-cyber-muted line-through' : 'text-cyber-text'}`}>
                          {task.title}
                        </span>
                        <button className="text-cyber-neon group-hover:scale-110 transition-transform">
                          {task.done ? <CheckCircle size={20} className="text-green-400" /> : <Circle size={20} className="opacity-50" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Revenus par mois */}
      <div>
        <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-green-400" /> Revenus par Mois
        </h2>
        {monthlyRevenue.length === 0 ? (
          <div className="glass-card p-6 text-center text-cyber-muted text-sm italic">
            Les revenus apparaîtront ici une fois que des projets seront archivés et comptabilisés.
          </div>
        ) : (
          <div className="space-y-4">
            {monthlyRevenue.map(([key, data]) => (
              <div key={key} className="glass-card p-5 rounded-xl border border-green-500/20">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-bold text-white capitalize">{data.label}</h3>
                  <span className="text-xl font-bold text-green-400 font-mono">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(data.total)}
                  </span>
                </div>
                <div className="space-y-1">
                  {data.videos.map((v, i) => (
                    <div key={i} className="flex justify-between items-center text-sm px-3 py-2 bg-black/30 rounded">
                      <span className="text-cyber-muted">🎬 {v.title}</span>
                      <span className="text-green-400 font-mono">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v.earned)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
