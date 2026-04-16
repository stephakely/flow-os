import React, { useEffect, useState } from 'react';
import { api, formatAmount } from '../lib/apiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, Activity, Users, Star } from 'lucide-react';

import { motion } from 'framer-motion';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({ revenue: 0, projects: 0, crmValue: 0, activeTeam: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [velocityData, setVelocityData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [archives, setArchives] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubProjects = api.subscribeProjects(setProjects);
    const unsubCRM = api.subscribeCRMLeads(setLeads);
    const unsubTeam = api.subscribeTeam(setTeam);
    const unsubArchives = api.subscribeArchives((data) => {
      setArchives(data);
      setLoading(false);
    });

    return () => {
      unsubProjects();
      unsubCRM();
      unsubTeam();
      unsubArchives();
    };
  }, []);

  useEffect(() => {
    const revenue = archives.reduce((acc, a) => acc + (a.price || 0), 0);
    const crmValue = leads.reduce((acc, l) => acc + (l.value || 0), 0);
    setStats({ revenue, projects: projects.length, crmValue, activeTeam: team.length });

    if (archives.length > 0) {
      const monthlyStats = {};
      archives.forEach(arch => {
        const date = new Date(arch.archivedAt || Date.now());
        const monthName = date.toLocaleString('default', { month: 'short' });
        const key = `${monthName}`;
        
        if (!monthlyStats[key]) {
          monthlyStats[key] = { name: key, value: 0, count: 0 };
        }
        monthlyStats[key].value += (arch.price || 0);
        monthlyStats[key].count += 1;
      });
      
      const statsArray = Object.values(monthlyStats);
      setMonthlyData(statsArray);
      setVelocityData(statsArray);
    }
  }, [archives, leads, projects, team]);

  const Widget = ({ title, value, icon: Icon, color, delay }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-6 border-l-4"
      style={{ borderColor: color }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyber-muted font-bold mb-1">{title}</p>
          <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
        </div>
        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </motion.div>
  );

  if (loading) return (
    <div className="text-cyber-neon animate-pulse p-8 font-mono tracking-[0.5em] text-center w-full mt-20">
      DECRYPTING ANALYTICS...
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="flex justify-between items-end border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">System <span className="text-cyber-neon">Overview</span></h1>
          <p className="text-cyber-muted tracking-[0.3em] font-mono text-[10px] uppercase mt-2">Operator: {user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyber-neon animate-pulse" />
            <span className="text-[10px] font-bold text-cyber-neon uppercase tracking-widest">Live Link Active</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Widget title="Total Revenue" value={formatAmount(stats.revenue)} icon={DollarSign} color="#00ffaa" delay={0.1} />
        <Widget title="Active Workloads" value={stats.projects} icon={Activity} color="#bc13fe" delay={0.2} />
        <Widget title="Lead Pipeline" value={formatAmount(stats.crmValue)} icon={Star} color="#ffd700" delay={0.3} />
        <Widget title="Neural Assets" value={stats.activeTeam} icon={Users} color="#1326ff" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-8 min-h-[400px]"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-[10px] font-black text-cyber-muted uppercase tracking-[0.3em]">Revenue Flux</h2>
            <div className="text-[10px] text-cyber-neon font-bold uppercase">Archive Data</div>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val/1000}k`} />
                <Tooltip 
                  cursor={{fill: 'rgba(255, 255, 255, 0.05)'}} 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="value" fill="#00ffaa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-8 min-h-[400px]"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-[10px] font-black text-cyber-muted uppercase tracking-[0.3em]">Recent Decrypted Events</h2>
            <button className="text-[10px] text-cyber-blue font-bold uppercase hover:text-white transition-colors">Clear Log</button>
          </div>
          <div className="space-y-4">
            {archives.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5 group hover:border-cyber-neon/30 transition-all">
                <div className="w-8 h-8 rounded-lg bg-cyber-neon/10 flex items-center justify-center text-cyber-neon">
                  <Activity size={14} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-cyber-neon transition-colors">{a.title}</div>
                  <div className="text-[9px] text-cyber-muted uppercase mt-0.5 font-mono">{new Date(a.archivedAt).toLocaleDateString()} • {formatAmount(a.price)}</div>
                </div>
                <div className="ml-auto text-[9px] text-cyber-neon font-bold font-mono">ARCHIVED</div>
              </div>
            ))}
            {archives.length === 0 && (
              <div className="text-center py-20 text-cyber-muted text-[10px] uppercase font-bold tracking-widest opacity-30 italic">No events recorded in current cycle</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
