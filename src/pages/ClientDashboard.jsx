import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiService';
import { 
  Play, CheckCircle, Clock, Plus, X, Link as LinkIcon, 
  FileText, Trash2, ChevronRight, HardDrive, 
  Calendar, Activity, Layers, Download, Check, 
  Monitor, Info, CreditCard, CircleHelp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Sub-components pour une interface modulaire et propre ---

const StatusStepper = ({ subtasks = [] }) => {
  const stages = [
    { label: 'Dérushage', key: 'Dérushage' },
    { label: 'Montage', key: 'Montage' },
    { label: 'Color', key: 'Étalonnage' },
    { label: 'Sound', key: 'Sound' },
    { label: 'VFX', key: 'Habillage' },
    { label: 'Final', key: 'Export' }
  ];

  return (
    <div className="flex items-center justify-between w-full mt-4 mb-2 px-2">
      {stages.map((stage, idx) => {
        const isDone = subtasks.some(t => t.title.includes(stage.key) && t.done);
        const isLast = idx === stages.length - 1;
        
        return (
          <React.Fragment key={stage.label}>
            <div className="flex flex-col items-center gap-2 relative">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isDone ? 'bg-cyber-neon border-cyber-neon text-black shadow-neon' : 'border-white/10 bg-black/40 text-cyber-muted'}`}>
                {isDone ? <Check size={14} strokeWidth={4} /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
              </div>
              <span className={`text-[9px] uppercase font-black tracking-tighter ${isDone ? 'text-cyber-neon' : 'text-cyber-muted'}`}>
                {stage.label}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 h-[2px] mx-2 bg-white/5 relative overflow-hidden">
                {isDone && <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} className="absolute inset-0 bg-cyber-neon" />}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const VersionCard = ({ version }) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between hover:border-cyber-neon/30 transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-cyber-neon/5 rounded-lg text-cyber-neon border border-cyber-neon/10">
        <Monitor size={18} />
      </div>
      <span className="text-[10px] text-cyber-muted font-mono">{new Date(version.createdAt).toLocaleDateString()}</span>
    </div>
    <div>
      <h4 className="text-sm font-bold text-white mb-1 group-hover:text-cyber-neon transition-colors">{version.title}</h4>
      <p className="text-[10px] text-cyber-muted line-clamp-2 italic mb-4">"{version.notes || 'Aucune note'}"</p>
    </div>
    <a 
      href="#" 
      onClick={(e) => { e.preventDefault(); onReview(version); }}
      className="neon-button-primary !py-2 !text-[10px] flex items-center justify-center gap-2"
    >
      <Play size={12} /> OUVRIR LE LECTEUR
    </a>
  </motion.div>
);

const ReviewTheatre = ({ version, onClose, user }) => {
  const [comment, setComment] = useState('');
  const [timecode, setTimecode] = useState('00:00');
  const [marker, setMarker] = useState(null); // { x, y }
  const videoRef = React.useRef(null);
  const containerRef = React.useRef(null);

  const captureTime = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      const mins = Math.floor(time / 60);
      const secs = Math.floor(time % 60);
      setTimecode(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }
  };

  const handleVideoClick = (e) => {
    if (videoRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMarker({ x, y });
      videoRef.current.pause();
      captureTime();
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!comment) return;
    await api.addVersionComment(version.id, {
      text: comment,
      timecode,
      user: user.name,
      x: marker?.x || null,
      y: marker?.y || null
    });
    setComment('');
    setMarker(null);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 md:p-10">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-6xl h-full flex flex-col gap-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Review <span className="text-cyber-neon">Theatre</span> : {version.title}</h2>
            <button onClick={onClose} className="p-2 text-cyber-muted hover:text-white transition-colors"><X size={32} /></button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div 
              ref={containerRef}
              onClick={handleVideoClick}
              className="bg-black rounded-3xl overflow-hidden border border-white/10 aspect-video shadow-2xl relative group cursor-crosshair"
            >
               <video ref={videoRef} onPause={captureTime} controls className="w-full h-full pointer-events-none" src={version.url} />
               
               {/* Current Marker */}
               {marker && (
                 <div 
                    className="absolute w-6 h-6 bg-cyber-neon rounded-full border-2 border-white shadow-neon flex items-center justify-center animate-bounce-short"
                    style={{ left: `${marker.x}%`, top: `${marker.y}%`, transform: 'translate(-50%, -50%)' }}
                 >
                    <span className="text-[10px] font-black text-black">!</span>
                 </div>
               )}

               {/* Existing Markers */}
               {version.comments?.map(c => c.x && (
                  <div 
                    key={c.id}
                    className={`absolute w-4 h-4 rounded-full border border-white shadow-sm flex items-center justify-center transition-all ${c.resolved ? 'bg-green-500 opacity-30 shadow-none' : 'bg-cyber-neon/80 shadow-neon-small hover:scale-125 hover:z-10'}`}
                    style={{ left: `${c.x}%`, top: `${c.y}%`, transform: 'translate(-50%, -50%)' }}
                    title={`${c.timecode}: ${c.text}`}
                  />
               ))}
            </div>
            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <div className="text-[10px] text-cyber-neon uppercase font-black tracking-widest mb-4">Leave Precise Feedback</div>
                <form onSubmit={handlePost} className="flex gap-4">
                   <div className="flex items-center gap-2 px-4 py-2 bg-black border border-cyber-neon/30 text-cyber-neon font-mono text-sm rounded-xl">
                      <Clock size={14} /> {timecode}
                   </div>
                   <input 
                    type="text" 
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Describe the change at this timestamp..." 
                    className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white" 
                   />
                   <button className="neon-button-primary !py-2 !px-6 uppercase font-black text-xs">Post</button>
                </form>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
            <div className="bg-black/40 border border-white/10 rounded-3xl p-6 flex-1 flex flex-col overflow-hidden">
               <div className="text-[10px] text-cyber-muted uppercase font-black tracking-widest mb-6 flex items-center gap-2">
                 <Activity size={14} /> Timecoded History
               </div>
               <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {version.comments?.sort((a,b) => a.timecode.localeCompare(b.timecode)).map(c => (
                    <div key={c.id} className={`p-4 rounded-2xl border transition-all ${c.resolved ? 'bg-green-500/5 border-green-500/20 opacity-50' : 'bg-white/5 border-white/10'}`}>
                       <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-mono text-cyber-neon bg-cyber-neon/5 px-2 py-0.5 rounded border border-cyber-neon/20">{c.timecode}</span>
                          {c.resolved && <span className="text-[8px] color-green-400 border border-green-400/30 px-1 rounded uppercase font-bold">FIXED</span>}
                       </div>
                       <p className="text-xs text-white leading-relaxed">{c.text}</p>
                       <div className="text-[9px] text-cyber-muted mt-2 font-bold uppercase">{c.user} • {new Date(c.createdAt).toLocaleTimeString()}</div>
                    </div>
                  ))}
                  {(!version.comments || version.comments.length === 0) && (
                    <div className="text-center py-20 text-xs text-cyber-muted italic">No feedback nodes yet. Pause the video to capture a marker.</div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function ClientDashboard({ user }) {
  const [projects, setProjects] = useState([]);
  const [assets, setAssets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [versions, setVersions] = useState({}); // { projectId: [versions] }
  const [faq, setFaq] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [reviewVersion, setReviewVersion] = useState(null); // Version object for theatre
  const [newAsset, setNewAsset] = useState({ title: '', url: '' });

  useEffect(() => {
    setLoading(true);
    const unsubP = api.subscribeProjects((data) => {
      const myProjects = data.filter(p => p.clientId === user.id);
      setProjects(myProjects);
      
      // Load versions for each project
      myProjects.forEach(async p => {
        const v = await api.getProjectVersions(p.id);
        setVersions(prev => ({ ...prev, [p.id]: v }));
      });
      
      setLoading(false);
    });

    api.getFAQ().then(setFaq);
    const unsubA = api.subscribeClientAssets(user.id, (data) => setAssets(data));
    const unsubL = api.subscribeActivityLogs(user.id, (data) => setLogs(data.slice(0, 10)));

    return () => { unsubP(); unsubA(); unsubL(); };
  }, [user.id]);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!newAsset.title || !newAsset.url) return;
    await api.addClientAsset({
      clientId: user.id,
      clientName: user.name,
      title: newAsset.title,
      url: newAsset.url,
      type: 'link'
    });
    setNewAsset({ title: '', url: '' });
  };

  const handleDeleteAsset = async (id) => {
    if (confirm('Supprimer ce lien ?')) await api.deleteClientAsset(id);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-cyber-neon animate-pulse font-mono tracking-[0.5em] uppercase">Connecting to Studio Node...</div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 animate-fade-in relative">
      
      {/* HEADER LUXURY */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-5xl font-black tracking-tighter text-white italic">MY <span className="text-cyber-neon">WORKSPACE</span></h1>
            <div className="px-2 py-0.5 bg-cyber-neon/10 border border-cyber-neon/20 rounded text-[9px] text-cyber-neon font-bold uppercase tracking-widest">Client v2.0</div>
          </div>
          <p className="text-cyber-muted tracking-[0.4em] text-[10px] uppercase font-mono">{user.name} • Neutral Secure Protocol</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => setShowSidebar(true)}
            className="neon-button-secondary !py-3 !px-6 border-dashed flex items-center gap-3 group"
          >
            <HardDrive size={16} className="group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Studio Vault ({assets.length})</span>
          </button>

          <div className="flex flex-col items-end bg-white/5 p-4 rounded-2xl border border-white/10 min-w-[240px]">
            <div className="flex items-center gap-2 text-[9px] text-cyber-muted uppercase font-black tracking-widest mb-1">
              <CreditCard size={10} /> Solde en attente
            </div>
            <div className="text-3xl font-black font-mono text-green-400 drop-shadow-neon-strong">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: user.currency || 'EUR' }).format(
                user.contractType === 'per_video' || !user.contractType
                  ? projects.filter(p => p.payment_status === 'EN ATTENTE').reduce((sum, p) => sum + (Number(p.price) || 0), 0)
                  : (user.contractAmount || 0)
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* MAIN FEED: PROJECTS */}
        <div className="lg:col-span-8 space-y-10">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-black text-cyber-muted uppercase tracking-[0.4em] flex items-center gap-3">
              <Monitor size={16} className="text-cyber-neon" /> Active Productions
            </h2>
          </div>

          {projects.length === 0 ? (
            <div className="py-32 text-center text-cyber-muted border-2 border-dashed border-white/5 rounded-3xl bg-black/20">
              <p className="tracking-widest uppercase font-black text-xs">Aucun projet actif dans le pipeline.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {projects.map(project => (
                <div key={project.id} className="glass-card p-0 rounded-3xl overflow-hidden border-cyber-border/40 hover:border-cyber-neon/30 transition-all shadow-2xl">
                  {/* Status Bar */}
                  <div className={`h-1.5 w-full ${project.payment_status === 'PAYÉ' ? 'bg-cyber-neon shadow-neon' : 'bg-cyber-gold shadow-neon-yellow'}`} />
                  
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h3 className="text-3xl font-black text-white tracking-tight">{project.title}</h3>
                          <span className={`text-[9px] px-3 py-1 rounded-full uppercase font-black border ${project.payment_status === 'PAYÉ' ? 'border-cyber-neon text-cyber-neon bg-cyber-neon/5' : 'border-cyber-gold text-cyber-gold bg-cyber-gold/5'}`}>
                            {project.payment_status}
                          </span>
                        </div>
                        <StatusStepper subtasks={project.subtasks} />
                      </div>

                      <div className="bg-black/40 border border-white/5 p-5 rounded-2xl min-w-[200px] text-center">
                        <div className="text-[9px] text-cyber-muted uppercase font-black tracking-widest mb-2 flex items-center justify-center gap-2">
                          <Calendar size={12} /> Livraison Estimée
                        </div>
                        <div className="text-xl font-mono font-black text-white">
                          {project.deliveryDate ? new Date(project.deliveryDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : 'À DÉTERMINER'}
                        </div>
                      </div>
                    </div>

                    {/* Versions Section */}
                    {versions[project.id]?.length > 0 && (
                      <div className="mt-10 pt-8 border-t border-white/5">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Layers size={14} className="text-cyber-neon" /> Livrables & Historique
                          </h4>
                          <span className="text-[9px] text-cyber-muted font-bold uppercase">{versions[project.id].length} Versions disponibles</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {versions[project.id].map(v => <VersionCard key={v.id} version={v} onReview={(v) => setReviewVersion(v)} />)}
                        </div>
                      </div>
                    )}

                    {/* Actions Rapides */}
                    <div className="mt-8 flex items-center gap-4">
                      {project.link_review && (
                        <a href={project.link_review} target="_blank" rel="noreferrer" className="neon-button-primary flex-1 !py-4 flex items-center justify-center gap-3">
                          <Play size={20} /> <span className="text-xs uppercase font-black">Interface de Revue (Annoter)</span>
                        </a>
                      )}
                      <button className="neon-button-secondary !py-4 !px-6 border-cyber-neon/20 hover:border-cyber-neon/50 transition-all">
                        <CheckCircle size={20} className="text-cyber-neon" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR: ACTIVITY & INFO */}
        <div className="lg:col-span-4 space-y-10">
          
          {/* Activity Feed */}
          <div className="glass-card p-6 border-white/5 bg-black/40 rounded-3xl">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <Activity size={16} className="text-cyber-neon shadow-neon" /> Log Activité
            </h3>
            <div className="space-y-6">
              {logs.length === 0 ? (
                <div className="text-xs text-cyber-muted italic pb-4">En attente de nouvelles transmissions...</div>
              ) : (
                logs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.1 }}
                    key={log.id} 
                    className="flex gap-4 relative"
                  >
                    {i !== logs.length - 1 && <div className="absolute left-[7px] top-6 w-[2px] h-full bg-white/5" />}
                    <div className="w-4 h-4 rounded-full bg-cyber-neon flex-shrink-0 mt-1 shadow-neon" />
                    <div>
                      <div className="text-[11px] text-white font-bold leading-tight">{log.message}</div>
                      <div className="text-[9px] text-cyber-muted font-mono mt-1">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Help Hub */}
          <div className="glass-card p-6 bg-cyber-neon/5 border-cyber-neon/20 rounded-3xl">
            <h3 className="text-[10px] font-black text-cyber-neon uppercase tracking-widest mb-4 flex items-center gap-2">
              <CircleHelp size={14} /> Studio Help Hub
            </h3>
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

        </div>
      </div>

      {/* Review Theatre Modal */}
      <AnimatePresence>
        {reviewVersion && (
          <ReviewTheatre 
            version={reviewVersion} 
            user={user} 
            onClose={() => setReviewVersion(null)} 
          />
        )}
      </AnimatePresence>

      {/* Sidebar Assets (Rushes Vault) */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-80 md:w-[450px] h-full bg-[#050505] border-l border-white/10 z-[101] shadow-2xl flex flex-col p-10"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Studio <span className="text-cyber-neon">Vault</span></h2>
                <button onClick={() => setShowSidebar(false)} className="p-3 text-cyber-muted hover:text-white transition-colors">
                  <X size={32} />
                </button>
              </div>

              <div className="mb-10">
                <form onSubmit={handleAddAsset} className="space-y-5 bg-white/5 p-6 rounded-3xl border border-white/10">
                  <div className="text-[10px] text-cyber-neon uppercase tracking-[0.3em] font-black mb-2">Upload Shared Assets</div>
                  <input type="text" placeholder="Title (ex: Drone Footage J1)" value={newAsset.title} onChange={e => setNewAsset({ ...newAsset, title: e.target.value })} className="input-cyber" />
                  <input type="url" placeholder="Source URL (Drive, Dropbox...)" value={newAsset.url} onChange={e => setNewAsset({ ...newAsset, url: e.target.value })} className="input-cyber text-cyber-neon !font-mono text-xs" />
                  <button className="w-full neon-button-primary !py-4 flex items-center justify-center gap-3 uppercase font-black italic">
                    <Plus size={18} /> Deploy to Vault
                  </button>
                </form>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <div className="text-[10px] text-cyber-muted uppercase tracking-[0.3em] font-black mb-6">Archive Vault</div>
                <div className="space-y-4">
                  {assets.map(asset => (
                    <div key={asset.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-cyber-neon/20 transition-all flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-cyber-neon/10 flex items-center justify-center text-cyber-neon"><LinkIcon size={20} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{asset.title}</div>
                        <a href={asset.url} target="_blank" rel="noreferrer" className="text-[10px] text-cyber-neon/60 hover:text-cyber-neon truncate block">Open Link</a>
                      </div>
                      <button onClick={() => handleDeleteAsset(asset.id)} className="p-2 text-red-500/20 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {assets.length === 0 && <div className="text-center py-10 text-xs text-cyber-muted italic opacity-50">Vault empty. Transmit links above.</div>}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
