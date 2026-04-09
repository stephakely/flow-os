import React, { useState, useEffect } from 'react';
import { api, formatAmount, computeNetNet } from '../lib/apiService';
import { Briefcase, Zap, ShieldAlert, Trash2, Edit } from 'lucide-react';

export default function Team({ user }) {
  const [team, setTeam] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);

  useEffect(() => {
    loadData();
    const handleDbUpdate = () => loadData();
    window.addEventListener('flow-db-update', handleDbUpdate);
    return () => window.removeEventListener('flow-db-update', handleDbUpdate);
  }, []);

  const loadData = async () => {
    setTeam(await api.getTeam());
    setActiveProjects(await api.getProjects());
  };

  const handleDelete = async (member) => {
    if (member.id === user.id) {
      alert("Vous ne pouvez pas supprimer votre propre compte !");
      return;
    }
    if (confirm(`Supprimer ${member.name} de l'équipe ?`)) {
      await api.deleteTeamMember(member.id);
      loadData();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cyber-text">Team <span className="text-cyber-neon">Workload</span></h1>
          <p className="text-cyber-muted tracking-widest mt-1 text-sm uppercase">Performance & Profits ({team.length} membres)</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map(member => {
          const wProjects = activeProjects.filter(p => p.assigneeId === member.id);
          const urgencies = wProjects.filter(p => p.priority === 'URGENCE').length;
          const loadPct = Math.min((wProjects.length / 5) * 100, 100);
          
          return (
            <div key={member.id} className="glass-card p-6 flex flex-col gap-4 group relative">
              {/* Bouton supprimer */}
              {user.role === 'admin' && member.id !== user.id && (
                <button 
                  onClick={() => handleDelete(member)}
                  className="absolute top-3 right-3 text-red-500/30 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <div className="flex items-center gap-4 border-b border-cyber-border/30 pb-4">
                <div className="w-12 h-12 rounded-full bg-cyber-dark border-2 border-cyber-neon flex items-center justify-center font-bold text-xl text-cyber-neon shadow-neon">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{member.name}</h3>
                  <span className="text-xs uppercase tracking-wider text-cyber-muted">{member.role}</span>
                  <span className="text-xs text-cyber-muted ml-2">({member.email})</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Charge de Travail</span>
                  <span className="font-bold text-white">{wProjects.length} Proj.</span>
                </div>
                
                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-cyber-border/20">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${loadPct >= 80 ? 'bg-red-500' : loadPct >= 50 ? 'bg-yellow-500' : 'bg-cyber-neon shadow-neon'}`} 
                    style={{ width: `${loadPct}%` }}
                  ></div>
                </div>

                {/* Liste de projets */}
                {wProjects.length > 0 && (
                  <div className="space-y-1">
                    {wProjects.map(p => (
                      <div key={p.id} className="text-xs flex items-center gap-2 text-cyber-muted bg-black/20 px-2 py-1 rounded">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.priority === 'URGENCE' ? 'bg-red-500 animate-pulse' : 'bg-cyber-neon'}`}></span>
                        {p.title}
                      </div>
                    ))}
                  </div>
                )}

                {urgencies > 0 && (
                  <div className="flex items-center gap-2 text-xs text-red-500 font-bold tracking-wider bg-red-500/10 p-2 rounded border border-red-500/30 animate-pulse">
                    <ShieldAlert size={14} />
                    {urgencies} URGENCE{urgencies > 1 ? 'S' : ''} EN COURS
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-cyber-border/30">
                <p className="text-xs text-cyber-muted mb-1 uppercase tracking-wider">Total Net Earned</p>
                <div className="text-2xl font-black text-green-400 flex items-center gap-2">
                  <Zap size={20} />
                  {formatAmount(member.totalEarned, 'EUR')}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
