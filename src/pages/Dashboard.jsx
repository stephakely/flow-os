import React, { useState, useEffect } from 'react';
import { api, formatAmount } from '../lib/apiService';
import { TrendingUp, Film, Users, Briefcase, AlertTriangle, CheckCircle, Clock, DollarSign, BarChart2, ArrowUpRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function StatCard({ label, value, sub, icon: Icon, color = 'cyber-neon', onClick }) {
  const colorMap = {
    'cyber-neon': 'border-cyber-neon/20 bg-cyber-neon/5 text-cyber-neon',
    'green': 'border-green-500/20 bg-green-500/5 text-green-400',
    'red': 'border-red-500/20 bg-red-500/5 text-red-400',
    'yellow': 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400',
    'purple': 'border-purple-500/20 bg-purple-500/5 text-purple-400',
    'blue': 'border-blue-500/20 bg-blue-500/5 text-blue-400',
  };
  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 border ${colorMap[color]} flex items-center gap-4 ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]} border shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-cyber-muted uppercase tracking-widest truncate">{label}</p>
        <p className={`text-2xl font-black mt-0.5 ${colorMap[color].split(' ').pop()}`}>{value}</p>
        {sub && <p className="text-xs text-cyber-muted mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard({ user }) {
  const [projects, setProjects] = useState([]);
  const [archives, setArchives] = useState([]);
  const [team, setTeam] = useState([]);
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [settings, setSettings] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const u1 = api.subscribeProjects(setProjects);
    const u2 = api.subscribeArchives(setArchives);
    const u3 = api.subscribeTeam(setTeam);
    const u4 = api.subscribeClients(setClients);
    const u5 = api.subscribeCRMLeads(setLeads);
    api.getSettings().then(setSettings);
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, []);

  // KPIs
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyRevenue = archives
    .filter(a => a.archivedAt?.startsWith(currentMonth))
    .reduce((s, a) => s + (a.price || 0), 0);

  const totalRevenue = archives.reduce((s, a) => s + (a.price || 0), 0);
  const pendingPayment = projects.filter(p => p.payment_status !== 'PAYÉ').reduce((s, p) => s + (p.price || 0), 0);
  const urgentProjects = projects.filter(p => p.priority === 'URGENCE');
  const paidProjects = projects.filter(p => p.payment_status === 'PAYÉ').length;
  const overdueProjects = projects.filter(p => p.deadline && new Date(p.deadline) < new Date() && p.payment_status !== 'PAYÉ');

  const pipelineValue = leads.reduce((s, l) => s + (l.value || 0), 0);

  // Completion % global
  const avgCompletion = projects.length > 0
    ? Math.round(projects.reduce((s, p) => {
        const done = p.subtasks?.filter(t => t.done).length || 0;
        const total = p.subtasks?.length || 0;
        return s + (total > 0 ? done / total : 0);
      }, 0) / projects.length * 100)
    : 0;

  // Top éditors par gains
  const topEditors = [...team]
    .filter(t => t.role === 'editor')
    .sort((a, b) => (b.totalEarned || 0) - (a.totalEarned || 0))
    .slice(0, 5);

  // Revenus 6 derniers mois
  const revenueByMonth = {};
  archives.forEach(a => {
    const m = a.archivedAt?.slice(0, 7);
    if (!m) return;
    revenueByMonth[m] = (revenueByMonth[m] || 0) + (a.price || 0);
  });
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toISOString().slice(0, 7);
  });
  const maxMonthly = Math.max(...last6Months.map(m => revenueByMonth[m] || 0), 1);

  // Activité récente (archives)
  const recentArchives = [...archives]
    .sort((a, b) => b.archivedAt?.localeCompare(a.archivedAt))
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {settings.studioName || 'FLOW_OS'} <span className="text-cyber-neon">Dashboard</span>
          </h1>
          <p className="text-cyber-muted text-sm mt-1 uppercase tracking-widest">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {urgentProjects.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg animate-pulse">
            <AlertTriangle size={14} />
            {urgentProjects.length} URGENCE{urgentProjects.length > 1 ? 'S' : ''}
          </div>
        )}
      </header>

      {/* Row 1 — KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="CA Ce Mois" value={formatAmount(monthlyRevenue)} sub={`Total: ${formatAmount(totalRevenue)}`} icon={TrendingUp} color="green" onClick={() => navigate('/app/finances')} />
        <StatCard label="En Attente Paiement" value={formatAmount(pendingPayment)} sub={`${projects.length - paidProjects} projets`} icon={DollarSign} color="yellow" onClick={() => navigate('/app/production')} />
        <StatCard label="Projets Actifs" value={projects.length} sub={`${avgCompletion}% complétion moy.`} icon={Film} color="cyber-neon" onClick={() => navigate('/app/production')} />
        <StatCard label="Pipeline CRM" value={formatAmount(pipelineValue)} sub={`${leads.length} opportunités`} icon={Briefcase} color="purple" onClick={() => navigate('/app/crm')} />
      </div>

      {/* Row 2 — infos secondaires */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Membres Équipe" value={team.length} sub={`${clients.length} clients`} icon={Users} color="blue" onClick={() => navigate('/app/team')} />
        <StatCard label="Vidéos Livrées" value={archives.length} icon={CheckCircle} color="green" />
        <StatCard label="URGENCES" value={urgentProjects.length} icon={AlertTriangle} color={urgentProjects.length > 0 ? 'red' : 'green'} onClick={() => navigate('/app/production')} />
        <StatCard label="Retards" value={overdueProjects.length} icon={Clock} color={overdueProjects.length > 0 ? 'red' : 'green'} onClick={() => navigate('/app/planning')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenus 6 mois */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-sm font-bold text-cyber-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <BarChart2 size={16} /> Revenus — 6 Derniers Mois
          </h2>
          <div className="flex items-end gap-2 h-28">
            {last6Months.map(m => {
              const rev = revenueByMonth[m] || 0;
              const pct = Math.max((rev / maxMonthly) * 100, 2);
              const isCurrentMonth = m === currentMonth;
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-cyber-muted">{rev > 0 ? formatAmount(rev).replace('EUR', '').trim() : '—'}</span>
                  <div className="w-full rounded-t-lg transition-all duration-700" style={{
                    height: `${pct}%`,
                    background: isCurrentMonth
                      ? 'linear-gradient(to top, #00ffaa, #00ffaa88)'
                      : 'linear-gradient(to top, #4ade8055, #4ade8022)',
                    boxShadow: isCurrentMonth ? '0 0 12px rgba(0,255,170,0.4)' : 'none'
                  }} />
                  <span className="text-[9px] text-cyber-muted">{m.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Éditeurs */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-bold text-cyber-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users size={16} /> Top Éditeurs
          </h2>
          {topEditors.length === 0 ? (
            <p className="text-cyber-muted text-xs text-center py-6">Aucun éditeur configuré</p>
          ) : (
            <div className="space-y-3">
              {topEditors.map((e, i) => (
                <div key={e.id} className="flex items-center gap-3">
                  <span className="text-xs font-black text-cyber-muted w-4">#{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-cyber-neon/10 border border-cyber-neon/20 flex items-center justify-center text-cyber-neon font-bold text-xs">
                    {e.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{e.name}</p>
                    <div className="w-full h-1 bg-black/50 rounded-full mt-1">
                      <div className="h-full bg-cyber-neon rounded-full" style={{
                        width: `${topEditors[0].totalEarned > 0 ? (e.totalEarned / topEditors[0].totalEarned) * 100 : 0}%`
                      }} />
                    </div>
                  </div>
                  <span className="text-xs font-mono text-green-400">{formatAmount(e.totalEarned || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projets urgents */}
        {urgentProjects.length > 0 && (
          <div className="glass-card p-6 border border-red-500/20">
            <h2 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertTriangle size={16} /> Projets Urgents
            </h2>
            <div className="space-y-2">
              {urgentProjects.slice(0, 4).map(p => {
                const done = p.subtasks?.filter(t => t.done).length || 0;
                const total = p.subtasks?.length || 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const member = team.find(t => t.id === p.assigneeId);
                return (
                  <div key={p.id} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-semibold text-white">{p.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${p.payment_status === 'PAYÉ' ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>
                        {p.payment_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {member && <span className="text-xs text-cyber-muted">🎬 {member.name}</span>}
                      <div className="flex-1 h-1 bg-black/50 rounded-full">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-red-400">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Activité Récente */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-bold text-cyber-muted uppercase tracking-widest mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" /> Dernières Livraisons
          </h2>
          {recentArchives.length === 0 ? (
            <p className="text-cyber-muted text-xs text-center py-6">Aucune livraison encore</p>
          ) : (
            <div className="space-y-2">
              {recentArchives.map(a => (
                <div key={a.id} className="flex justify-between items-center p-2.5 bg-black/20 rounded-lg border border-cyber-border/20">
                  <div>
                    <p className="text-sm font-semibold text-white">{a.title}</p>
                    <p className="text-xs text-cyber-muted">{a.archivedAt ? new Date(a.archivedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}</p>
                  </div>
                  <span className="font-mono text-green-400 text-sm font-bold">{formatAmount(a.price || 0)}</span>
                </div>
              ))}
              <button onClick={() => navigate('/app/archives')} className="w-full text-xs text-cyber-muted hover:text-cyber-neon flex items-center justify-center gap-1 mt-2 transition-colors">
                Voir toutes les archives <ArrowUpRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
