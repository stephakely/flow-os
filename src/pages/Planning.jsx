import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiService';
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, Clock } from 'lucide-react';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function Planning({ user }) {
  const [projects, setProjects] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const unsub = api.subscribeProjects(data => {
      if (user.role === 'admin') setProjects(data);
      else setProjects(data.filter(p => p.assigneeId === user.id));
    });
    return () => unsub();
  }, [user.role, user.id]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = (firstDayOfMonth.getDay() + 6) % 7; // Monday=0
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getProjectsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return projects.filter(p => p.deadline === dateStr || p.createdAt?.startsWith(dateStr));
  };

  const isOverdue = (p) => {
    if (!p.deadline) return false;
    return new Date(p.deadline) < new Date() && p.payment_status !== 'PAYÉ';
  };

  const today = new Date();
  const isToday = (day) => today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  // Projets urgents / overdue
  const overdueProjects = projects.filter(isOverdue);
  const soonProjects = projects.filter(p => {
    if (!p.deadline || isOverdue(p)) return false;
    const diff = (new Date(p.deadline) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  const selectedDayProjects = selectedDay ? getProjectsForDay(selectedDay) : [];

  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold text-white">Planning & <span className="text-cyber-neon">Calendrier</span></h1>
        <p className="text-cyber-muted text-sm mt-1 uppercase tracking-widest">Échéances et organisation des projets</p>
      </header>

      {/* Alertes */}
      {overdueProjects.length > 0 && (
        <div className="glass-card p-4 border border-red-500/40 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-red-400 font-bold text-sm uppercase tracking-widest">{overdueProjects.length} projet(s) en retard</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {overdueProjects.map(p => (
              <span key={p.id} className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">{p.title}</span>
            ))}
          </div>
        </div>
      )}
      {soonProjects.length > 0 && (
        <div className="glass-card p-4 border border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-yellow-400" />
            <span className="text-yellow-400 font-bold text-sm uppercase tracking-widest">{soonProjects.length} échéance(s) dans 7 jours</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {soonProjects.map(p => (
              <span key={p.id} className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">{p.title} — {new Date(p.deadline).toLocaleDateString('fr-FR')}</span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendrier */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={prevMonth} className="p-2 text-cyber-muted hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-white">{MONTHS_FR[month]} {year}</h2>
            <button onClick={nextMonth} className="p-2 text-cyber-muted hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_FR.map(d => (
              <div key={d} className="text-center text-xs text-cyber-muted uppercase tracking-widest py-2 font-bold">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const dayProjects = getProjectsForDay(day);
              const hasOverdue = dayProjects.some(isOverdue);
              const hasSoon = dayProjects.some(p => soonProjects.includes(p));
              const isSelected = selectedDay === day;
              const isTodayDay = isToday(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`relative min-h-[52px] p-2 rounded-xl text-sm transition-all duration-200 flex flex-col items-start ${
                    isSelected ? 'bg-cyber-neon/20 border border-cyber-neon text-cyber-neon' :
                    isTodayDay ? 'bg-purple-500/20 border border-purple-500/50 text-purple-200' :
                    'bg-black/20 border border-transparent hover:border-cyber-border/50 text-gray-300'
                  }`}
                >
                  <span className="font-bold">{day}</span>
                  {dayProjects.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {dayProjects.slice(0, 3).map(p => (
                        <span key={p.id} className={`w-1.5 h-1.5 rounded-full ${
                          isOverdue(p) ? 'bg-red-500' :
                          soonProjects.includes(p) ? 'bg-yellow-400' :
                          'bg-cyber-neon'
                        }`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Légende */}
          <div className="flex gap-4 mt-4 text-xs text-cyber-muted">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyber-neon" /> Projet actif</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Échéance proche</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> En retard</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" /> Aujourd'hui</span>
          </div>
        </div>

        {/* Panel latéral */}
        <div className="space-y-4">
          {selectedDay ? (
            <div className="glass-card p-5">
              <h3 className="font-bold text-cyber-neon mb-3">
                {selectedDay} {MONTHS_FR[month]} — {selectedDayProjects.length} projet(s)
              </h3>
              {selectedDayProjects.length === 0 ? (
                <p className="text-cyber-muted text-sm">Aucun projet ce jour</p>
              ) : selectedDayProjects.map(p => (
                <div key={p.id} className={`p-3 rounded-lg mb-2 border ${isOverdue(p) ? 'border-red-500/30 bg-red-500/5' : 'border-cyber-border/30 bg-black/20'}`}>
                  <p className="font-bold text-white text-sm">{p.title}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${p.priority === 'URGENCE' ? 'bg-red-500/20 text-red-400' : 'bg-cyber-neon/10 text-cyber-neon'}`}>{p.priority}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${p.payment_status === 'PAYÉ' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{p.payment_status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-5 text-center">
              <Calendar size={32} className="mx-auto text-cyber-muted mb-2" />
              <p className="text-cyber-muted text-sm">Clique sur un jour pour voir les projets</p>
            </div>
          )}

          {/* Projets sans date */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-cyber-muted text-sm uppercase tracking-widest mb-3">Sans Échéance</h3>
            {projects.filter(p => !p.deadline).length === 0 ? (
              <p className="text-cyber-muted text-xs">Tous les projets ont une date ✓</p>
            ) : projects.filter(p => !p.deadline).map(p => (
              <div key={p.id} className="flex items-center gap-2 p-2 bg-black/20 rounded mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                <span className="text-xs text-gray-400 truncate">{p.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
