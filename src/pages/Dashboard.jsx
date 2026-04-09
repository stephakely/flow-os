import React, { useEffect, useState } from 'react';
import { api, formatAmount } from '../lib/apiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, Activity, Users, Star } from 'lucide-react';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({ revenue: 0, projects: 0, crmValue: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [velocityData, setVelocityData] = useState([]);
  const [clientProfitData, setClientProfitData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Subscriptions for real-time dashboard
    const unsubProjects = api.subscribeProjects(setProjects);
    const unsubCRM = api.subscribeCRMLeads(setLeads);
    const unsubArchives = api.subscribeArchives((data) => {
      setArchives(data);
      setLoading(false);
    });

    return () => {
      unsubProjects();
      unsubCRM();
      unsubArchives();
    };
  }, []);

  useEffect(() => {
    // Stats rapides
    const revenue = archives.reduce((acc, a) => acc + a.price, 0);
    const crmValue = leads.reduce((acc, l) => acc + l.value, 0);
    setStats({ revenue, projects: projects.length, crmValue });

    // Génération de données réelles pour Recharts basées sur les archives
    if (archives.length > 0) {
      const monthlyStats = {};
      archives.forEach(arch => {
        const date = new Date(arch.archivedAt || Date.now());
        const monthName = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const key = `${monthName} ${year}`;
        
        if (!monthlyStats[key]) {
          monthlyStats[key] = { name: key, value: 0, count: 0 };
        }
        monthlyStats[key].value += (arch.price || 0);
        monthlyStats[key].count += 1;
      });
      
      const statsArray = Object.values(monthlyStats);
      setMonthlyData(statsArray.map(s => ({ name: s.name, value: s.value })));
      setVelocityData(statsArray.map(s => ({ name: s.name, count: s.count })));
    } else {
      setMonthlyData([]);
      setVelocityData([]);
    }
  }, [archives, leads, projects]);

  const Widget = ({ title, value, icon: Icon, colorClass }) => (
    <div className="glass-card p-6 flex flex-col justify-between hover:shadow-neon-hover transition-all">
      <div className="flex justify-between items-center mb-4">
        <span className="text-cyber-muted text-sm font-semibold tracking-wider uppercase">{title}</span>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
      <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold text-cyber-text">System <span className="text-cyber-neon">Dashboard</span></h1>
        <p className="text-cyber-muted tracking-widest mt-1 text-sm uppercase">Welcome back, {user?.name}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Widget title="Chiffre d'Affaires" value={formatAmount(stats.revenue)} icon={DollarSign} colorClass="text-cyber-neon" />
        <Widget title="Projets en cours" value={stats.projects} icon={Activity} colorClass="text-purple-400" />
        <Widget title="Valeur CRM" value={formatAmount(stats.crmValue)} icon={Star} colorClass="text-yellow-400" />
        <Widget title="Rentabilité Moy." value="~84%" icon={Users} colorClass="text-green-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6 h-96">
          <h2 className="text-cyber-muted mb-6 uppercase tracking-wider text-sm font-semibold">Mensual Revenue</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip cursor={{fill: 'rgba(0, 242, 255, 0.1)'}} contentStyle={{ backgroundColor: '#111827', borderColor: '#00f2ff' }} />
              <Bar dataKey="value" fill="#00f2ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6 h-96">
          <h2 className="text-cyber-muted mb-6 uppercase tracking-wider text-sm font-semibold">Production Velocity (Proj/Month)</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip cursor={{fill: 'rgba(167, 139, 250, 0.1)'}} contentStyle={{ backgroundColor: '#111827', borderColor: '#a78bfa' }} />
              <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
