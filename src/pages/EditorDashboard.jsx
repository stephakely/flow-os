import React, { useState, useEffect } from 'react';
import { api, computeNetNet } from '../lib/apiService';
import { 
  CheckCircle, Circle, Euro, Film, TrendingUp, 
  Calendar, RefreshCw, Info, Link as LinkIcon, 
  Copy, HardDrive, Layout, ChevronRight, 
  Play, Pause, Clock, CheckSquare, MessageSquare, 
  FileText, Palette, Music, Zap, CircleHelp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Sub-composants pour l'Espace de Travail ---

const BriefingPanel = ({ project }) => (
  <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4">
    <div className="flex items-center gap-2 text-cyber-neon mb-2">
      <Info size={16} /> 
      <span className="text-[10px] uppercase font-black tracking-widest">Neural Briefing</span>
    </div>
    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
      <span className="text-[10px] text-cyber-muted uppercase font-bold text-[9px]">Style Visuel</span>
      <span className="text-xs font-black text-white italic">{project.style || 'Minimalist'}</span>
    </div>
    <div className="text-xs text-cyber-text leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 italic">
      "{project.briefing || 'Aucun briefing spécifique fourni.'}"
    </div>
    {project.referenceLinks && (
      <div className="flex flex-col gap-2">
        <span className="text-[9px] text-cyber-muted uppercase font-bold px-1">Références / Inspiration</span>
        <div className="flex flex-wrap gap-2">
          {project.referenceLinks.split(',').map((link, i) => (
            <a key={i} href={link.trim()} target="_blank" rel="noreferrer" className="text-[10px] px-3 py-1 bg-cyber-neon/10 border border-cyber-neon/30 text-cyber-neon rounded hover:bg-cyber-neon/20 transition-all flex items-center gap-1">
              <LinkIcon size={10} /> Ref {i+1}
            </a>
          ))}
        </div>
      </div>
    )}
  </div>
);

const BrandKitPanel = ({ clientId }) => {
  const [kit, setKit] = useState(null);
  useEffect(() => {
    api.getBrandKit(clientId).then(setKit);
  }, [clientId]);

  if (!kit) return null;

  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-cyber-gold mb-4">
        <Palette size={16} /> 
        <span className="text-[10px] uppercase font-black tracking-widest text-cyber-gold">Directives Graphiques</span>
      </div>
      <div className="flex gap-2 mb-4">
        {kit.colors?.map((c, i) => (
          <div key={i} className="w-6 h-6 rounded border border-white/10" style={{ backgroundColor: c }} title={c} />
        )) || <div className="text-[10px] text-cyber-muted italic">Aucune palette définie.</div>}
      </div>
      <div className="space-y-2">
         <div className="text-[9px] text-cyber-muted uppercase font-bold">Typographies</div>
         <div className="text-xs text-white font-mono">{kit.fonts?.join(', ') || 'Browser Standard'}</div>
      </div>
    </div>
  );
};

const QCPanel = ({ project, onUpdate }) => {
  const toggleQC = async (id) => {
    const updated = project.qcChecklist.map(i => i.id === id ? { ...i, done: !i.done } : i);
    await api.saveProject({ ...project, qcChecklist: updated });
  };

  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-cyber-red mb-4">
        <CheckSquare size={16} /> 
        <span className="text-[10px] uppercase font-black tracking-widest text-cyber-red">Quality Control (QC)</span>
      </div>
      <div className="space-y-2">
        {project.qcChecklist?.map(item => (
          <button 
            key={item.id} 
            onClick={() => toggleQC(item.id)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left ${item.done ? 'bg-cyber-neon/10 border-cyber-neon/30 text-cyber-neon' : 'bg-white/5 border-white/5 text-cyber-muted grayscale'}`}
          >
            {item.done ? <CheckCircle size={14} /> : <Circle size={14} />}
            <span className="text-[10px] font-bold uppercase">{item.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const FeedbackPanel = ({ versions = [] }) => {
  const handleResolve = async (vid, cid) => {
    await api.resolveComment(vid, cid);
  };

  const allComments = versions.flatMap(v => (v.comments || []).map(c => ({ ...c, versionTitle: v.title, versionId: v.id })));

  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-cyber-neon">
          <MessageSquare size={16} /> 
          <span className="text-[10px] uppercase font-black tracking-widest">Client Feedbacks</span>
        </div>
        <span className="text-[9px] text-cyber-muted font-bold font-mono">{allComments.filter(c => !c.resolved).length} UNRESOLVED</span>
      </div>
      <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {allComments.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(c => (
          <div key={c.id} className={`p-3 rounded-xl border transition-all ${c.resolved ? 'bg-green-500/5 border-green-500/10 opacity-40' : 'bg-white/5 border-white/10 hover:border-cyber-neon/30'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9px] font-mono text-cyber-neon">{c.timecode} • {c.versionTitle}</span>
              {!c.resolved && (
                 <button onClick={() => handleResolve(c.versionId, c.id)} className="text-[8px] bg-cyber-neon text-black px-1.5 py-0.5 rounded font-black hover:scale-105 transition-transform">RESOLVE</button>
              )}
            </div>
            <p className="text-[11px] text-white leading-tight">{c.text}</p>
          </div>
        ))}
        {allComments.length === 0 && <div className="text-center py-10 text-[10px] text-cyber-muted italic opacity-50">En attente de transmissions client...</div>}
      </div>
    </div>
  );
}

export default function EditorDashboard({ user }) {
  const [projects, setProjects] = useState([]);
  const [archives, setArchives] = useState([]);
  const [resources, setResources] = useState([]);
  const [faq, setFaq] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(null);
  const [projectVersions, setProjectVersions] = useState([]);
  const [handoff, setHandoff] = useState('');
  const [timerActive, setTimerActive] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  useEffect(() => {
    if (activeProject) {
      const unsub = api.subscribeProjectVersions(activeProject, setProjectVersions);
      const p = projects.find(it => it.id === activeProject);
      if (p) {
        setHandoff(p.handoffNotes || '');
        setSeconds(0);
        setTimerActive(false);
      }
      return () => unsub();
    }
  }, [activeProject, projects]);

  useEffect(() => {
    setLoading(true);
    const unsubP = api.subscribeProjects((data) => {
      const myProjects = data.filter(p => p.assigneeId === user.id);
      setProjects(myProjects);
      if (myProjects.length > 0 && !activeProject) setActiveProject(myProjects[0].id);
      setLoading(false);
    });

    const unsubA = api.subscribeArchives((data) => setArchives(data.filter(a => a.assigneeId === user.id)));
    api.getSharedResources().then(setResources);
    api.getFAQ().then(setFaq);

    return () => { unsubP(); unsubA(); };
  }, [user.id]);

  const toggleSubtask = async (p, tid) => {
    const updated = p.subtasks.map(t => t.id === tid ? { ...t, done: !t.done } : t);
    await api.saveProject({ ...p, subtasks: updated });
  };

  const currentProject = projects.find(p => p.id === activeProject);

  const copyFolderStructure = () => {
    const struct = "01_RUSHES\n02_AUDIO\n03_ASSETS\n04_PROJETS\n05_EXPORTS\n06_REFERENCES";
    navigator.clipboard.writeText(struct);
    alert('Structure de dossiers copiée dans le presse-papier !');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-cyber-neon animate-pulse font-mono tracking-[0.5em] uppercase italic">Initializing Workspace...</div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-fade-in">
      
      {/* HEADER: OPERATOR PROFILE */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white italic uppercase">Operator <span className="text-cyber-neon">Node</span></h1>
          <p className="text-cyber-muted tracking-[0.4em] text-[10px] uppercase font-mono mt-2">{user.name} • Master Editor</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex flex-col items-end bg-cyber-neon/5 p-4 rounded-2xl border border-cyber-neon/20 min-w-[200px]">
              <div className="text-[9px] text-cyber-neon uppercase font-black tracking-widest mb-1 italic">Total Cumulative Gains</div>
              <div className="text-3xl font-black font-mono text-cyber-neon drop-shadow-neon-strong">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(user.totalEarned || 0)}
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: PROJECT NAVIGATION */}
        <div className="lg:col-span-3 space-y-6">
          <h3 className="text-[10px] font-black text-cyber-muted uppercase tracking-[0.4em] px-2 flex items-center gap-2">
            <Layout size={14} /> Active Stacks
          </h3>
          <div className="space-y-2">
            {projects.map(p => (
              <button 
                key={p.id}
                onClick={() => setActiveProject(p.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all border flex flex-col gap-2 ${activeProject === p.id ? 'bg-cyber-neon/10 border-cyber-neon/50 shadow-neon-small ring-1 ring-cyber-neon/30' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black text-white truncate max-w-[150px]">{p.title}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-sm font-bold ${p.priority === 'URGENCE' ? 'bg-cyber-red text-white' : 'bg-white/10 text-cyber-muted'}`}>{p.priority}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex -space-x-1">
                     {p.subtasks?.slice(0, 5).map(t => <div key={t.id} className={`w-1.5 h-1.5 rounded-full ${t.done ? 'bg-cyber-neon shadow-neon' : 'bg-white/10'}`} />)}
                  </div>
                  <ChevronRight size={14} className={activeProject === p.id ? 'text-cyber-neon' : 'text-cyber-muted'} />
                </div>
              </button>
            ))}
            {projects.length === 0 && <div className="text-xs text-cyber-muted italic p-4 border border-dashed border-white/5 rounded-2xl text-center">Aucun projet actif.</div>}
          </div>

          {/* Quick Tools */}
          <div className="bg-white/5 p-6 rounded-3xl space-y-4 border border-white/5 mt-10">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-cyber-gold" /> Toolbox
            </h4>
            <button onClick={copyFolderStructure} className="w-full neon-button-secondary !py-3 flex items-center justify-center gap-2 text-[10px] uppercase font-black tracking-widest">
              <HardDrive size={14} /> Folder Template
            </button>
            <div className="pt-2 space-y-2 border-t border-white/5">
              <span className="text-[9px] text-cyber-muted uppercase font-bold">Shared Resources</span>
              {resources.map(res => (
                <a key={res.id} href={res.url} className="flex items-center gap-2 text-[10px] text-cyber-muted hover:text-cyber-neon transition-colors">
                  {res.type === 'music' ? <Music size={12} /> : <Zap size={12} />} {res.title}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: ACTIVE WORKSPACE */}
        <div className="lg:col-span-6">
          <AnimatePresence mode="wait">
            {currentProject ? (
              <motion.div 
                key={currentProject.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Project Focus Card */}
                <div className="glass-card p-8 rounded-3xl border-cyber-border/40 bg-black/60 shadow-2xl overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-neon/5 blur-3xl -z-10 rounded-full" />
                   
                   <div className="flex justify-between items-start mb-10">
                     <div>
                       <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase mb-2">{currentProject.title}</h2>
                       <div className="flex items-center gap-3">
                          <span className="text-[10px] text-cyber-neon font-black uppercase tracking-[0.2em]">{currentProject.style || 'Minimalist'}</span>
                          <span className="text-white/10">|</span>
                          <span className="text-[10px] text-cyber-muted font-bold flex items-center gap-1"><Calendar size={12} /> Deadline: {currentProject.deliveryDate || 'N/A'}</span>
                       </div>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                        <button 
                          onClick={() => timerActive ? stopTimer() : setTimerActive(true)}
                          className={`neon-button-primary !px-6 !py-3 flex items-center gap-3 group transition-all ${timerActive ? '!border-cyber-red !text-cyber-red' : ''}`}
                        >
                           {timerActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                           <span className="text-xs font-black uppercase tracking-widest">{timerActive ? 'Stop Session' : 'Start Session'}</span>
                        </button>
                        <div className={`text-[9px] uppercase font-bold tracking-widest ${timerActive ? 'text-cyber-neon animate-pulse' : 'text-cyber-muted'}`}>Session Time: {formatTime(seconds)}</div>
                     </div>
                   </div>

                   {/* Subtasks Tracker */}
                   <div className="space-y-4 mb-10">
                     <div className="flex justify-between items-center text-[10px] text-cyber-muted uppercase font-black px-2">
                       <span>Pipeline Tasks</span>
                       <span>{currentProject.subtasks?.filter(t => t.done).length || 0} / {currentProject.subtasks?.length || 0} Complete</span>
                     </div>
                     <div className="grid grid-cols-1 gap-2">
                       {currentProject.subtasks?.map(t => (
                         <div 
                           key={t.id} 
                           onClick={() => toggleSubtask(currentProject, t.id)}
                           className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${t.done ? 'bg-cyber-neon/5 border-cyber-neon/20' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                         >
                            <div className="flex items-center gap-4">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${t.done ? 'bg-cyber-neon border-cyber-neon text-black' : 'border-white/10 group-hover:border-cyber-neon/50'}`}>
                                {t.done && <CheckCircle size={14} />}
                              </div>
                              <span className={`text-sm font-bold tracking-wide ${t.done ? 'text-cyber-muted line-through' : 'text-white'}`}>{t.title}</span>
                            </div>
                            <span className="text-[9px] text-cyber-muted uppercase font-bold opacity-0 group-hover:opacity-100 transition-opacity">Mark {t.done ? 'Pending' : 'Done'}</span>
                         </div>
                       ))}
                     </div>
                   </div>

                   {/* Project Actions */}
                   <div className="flex items-center gap-4 pt-8 border-t border-white/5">
                      <a href={currentProject.link_rushes} target="_blank" rel="noreferrer" className="flex-1 neon-button-secondary !py-4 flex items-center justify-center gap-3">
                        <HardDrive size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Rushes Node</span>
                      </a>
                      <a href={currentProject.link_review} target="_blank" rel="noreferrer" className="flex-1 neon-button-secondary !py-4 flex items-center justify-center gap-3">
                        <Layout size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Review Portal</span>
                      </a>
                   </div>
                </div>

                {/* Hand-off Section */}
                <div className="glass-card p-6 bg-purple-500/5 border-purple-500/20 rounded-3xl">
                   <div className="flex items-center gap-2 text-purple-400 mb-4">
                     <MessageSquare size={16} /> 
                     <span className="text-[10px] uppercase font-black tracking-widest">Hand-off & Team Notes</span>
                   </div>
                   <textarea 
                    value={handoff}
                    onChange={e => setHandoff(e.target.value)}
                    placeholder="Leave notes for the next operator or editor here..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white h-24 resize-none mb-4"
                   />
                   <div className="flex justify-end">
                      <button 
                        onClick={updateHandoff}
                        className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-white transition-colors"
                      >
                        Save Notes
                      </button>
                   </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-[60vh] flex flex-col items-center justify-center text-cyber-muted space-y-4 border-2 border-dashed border-white/5 rounded-[40px] bg-black/20">
                <div className="p-6 bg-white/5 rounded-full"><Layout size={40} className="grayscale opacity-20" /></div>
                <p className="uppercase font-black text-[10px] tracking-[0.4em]">Select a Project stack to begin operation</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: RECAP & DETAILS */}
        <div className="lg:col-span-3 space-y-8">
          
          {currentProject ? (
            <>
              <BriefingPanel project={currentProject} />
              <FeedbackPanel versions={projectVersions} />
              <BrandKitPanel clientId={currentProject.clientId} />
              <QCPanel project={currentProject} />
            </>
          ) : (
             <>
                <div className="glass-card p-8 border-white/5 bg-black/40 rounded-3xl text-center space-y-4">
                  <TrendingUp size={30} className="mx-auto text-cyber-muted opacity-20" />
                  <p className="text-[9px] text-cyber-muted uppercase font-black tracking-[0.2em]">Select a project to see neural briefing and brand kit assets.</p>
                </div>
             </>
          )}

          {/* Help Hub */}
          <div className="glass-card p-6 bg-cyber-neon/5 border-cyber-neon/20 rounded-3xl">
             <div className="flex items-center gap-2 text-cyber-neon mb-6">
                <CircleHelp size={16} /> 
                <span className="text-[10px] uppercase font-black tracking-widest">Editor Help Hub</span>
             </div>
             <div className="space-y-3">
                {faq.map((item, i) => (
                  <details key={item.id} className="group">
                    <summary className="w-full text-left p-3 text-xs text-cyber-muted bg-black/40 rounded-xl hover:text-white transition-colors flex items-center justify-between cursor-pointer list-none">
                      {item.q} <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="p-4 text-xs text-cyber-muted leading-relaxed border-l border-cyber-neon/20 ml-4 mt-2">
                      {item.a}
                    </div>
                  </details>
                ))}
             </div>
          </div>

          {/* Monthly Recap Summary */}
          <div className="glass-card p-6 border-green-500/20 bg-green-500/5 rounded-3xl">
             <div className="flex items-center gap-2 text-green-400 mb-6">
                <Euro size={16} /> 
                <span className="text-[10px] uppercase font-black tracking-widest">Monthly Performance</span>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <span className="text-[10px] text-cyber-muted uppercase font-bold">Videos Delivered</span>
                   <span className="text-xl font-black text-white font-mono">{archives.length}</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-green-400 w-2/3 shadow-neon-green" />
                </div>
                <button className="w-full text-[9px] text-cyber-muted hover:text-white transition-colors uppercase font-bold flex items-center justify-center gap-2 pt-2 border-t border-white/5">
                   View Full Financial Grid <ChevronRight size={10} />
                </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
