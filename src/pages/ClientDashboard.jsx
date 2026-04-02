import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiService';
import { Play, CheckCircle, Clock } from 'lucide-react';

export default function ClientDashboard({ user }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
    const handleDbUpdate = () => loadProjects();
    window.addEventListener('flow-db-update', handleDbUpdate);
    return () => window.removeEventListener('flow-db-update', handleDbUpdate);
  }, []);

  const loadProjects = async () => {
    const allProjects = await api.getProjects();
    // Le client ne voit que ses projets
    const myProjects = allProjects.filter(p => p.clientId === user.id);
    setProjects(myProjects);
    setLoading(false);
  };

  if (loading) return <div className="text-cyber-neon animate-pulse p-8">CHARGEMENT DES DONNÉES...</div>;

  return (
    <div className="space-y-8 animate-fade-in relative">
      <header className="flex justify-between items-end border-b border-cyber-border pb-4 relative">
         <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyber-neon/80 to-transparent"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-cyber-neon">ESPACE CLIENT</h1>
          <p className="text-cyber-muted tracking-widest text-sm mt-1 uppercase">{user.name}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {projects.length === 0 ? (
           <div className="glass-card p-8 text-center text-cyber-muted italic border-dashed uppercase tracking-widest">
            Aucune production en cours.
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className="glass-card p-6 rounded-xl border border-cyber-border/40 bg-black/40 relative overflow-hidden">
              {/* Indicateur de statut */}
              <div className={`absolute top-0 right-0 px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-bl-lg
                ${project.payment_status === 'PAYÉ' ? 'bg-cyber-neon text-black' : 'bg-cyber-pulse text-white'}
              `}>
                {project.payment_status}
              </div>

              <h3 className="text-xl font-bold text-cyber-text tracking-wide mb-2 mt-4">{project.title}</h3>
              
              <div className="flex items-center gap-4 mt-6">
                {project.link_review && (
                  <a 
                    href={project.link_review} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex-1 flex items-center justify-center gap-2 neon-button-primary text-sm py-2"
                  >
                    <Play size={16} />
                    VOIR LIVRABLE (REVIEW)
                  </a>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-cyber-border/30">
                 <div className="text-xs text-cyber-muted uppercase tracking-widest mb-2">Progression (sous-tâches)</div>
                 <div className="flex flex-col gap-2">
                    {project.subtasks?.map(task => (
                      <div key={task.id} className="flex items-center gap-3">
                         {task.done ? <CheckCircle size={14} className="text-cyber-neon" /> : <Clock size={14} className="text-cyber-muted" />}
                         <span className={`text-sm ${task.done ? 'text-cyber-text' : 'text-cyber-muted'}`}>{task.title}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
