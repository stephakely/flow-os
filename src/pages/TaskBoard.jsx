import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, FolderOpen, AlignLeft, Layout } from 'lucide-react';

export default function TaskBoard({ user }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = api.subscribeProjects((data) => {
      if (user.role === 'admin') setProjects(data);
      else setProjects(data.filter(p => p.assigneeId === user.id));
      setLoading(false);
    });
    return () => unsub();
  }, [user.id, user.role]);

  const toggleSubtask = async (projectId, subtaskId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const updatedSubtasks = project.subtasks.map(t =>
      t.id === subtaskId ? { ...t, done: !t.done } : t
    );
    await api.saveProject({ ...project, subtasks: updatedSubtasks });
  };

  // Group subtasks into columns based on their state (To Do vs Done)
  const TODO_TASKS = [];
  const DONE_TASKS = [];

  // Assuming active projects
  const activeProjects = projects.filter(p => p.payment_status !== 'ARCHIVED'); // Example filter

  activeProjects.forEach(p => {
    p.subtasks?.forEach(t => {
      const taskObj = { ...t, projectId: p.id, projectTitle: p.title };
      if (t.done) DONE_TASKS.push(taskObj);
      else TODO_TASKS.push(taskObj);
    });
  });

  if (loading) return <div className="p-8 text-center text-cyber-neon font-mono animate-pulse">LOADING GLOBAL PIPELINE...</div>;

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <header>
        <h1 className="text-3xl font-black text-white uppercase italic">Task <span className="text-cyber-neon">Board</span></h1>
        <p className="text-cyber-muted text-xs tracking-widest uppercase mt-1">Supervision Globale des Pipelines (Kanban)</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[75vh]">
        
        {/* TO DO COLUMN */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-4">
            <div className="w-3 h-3 rounded-full bg-cyber-gold shadow-neon"></div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest">In Progress</h2>
            <span className="ml-auto text-xs font-mono bg-cyber-gold/20 text-cyber-gold px-2 py-0.5 rounded">{TODO_TASKS.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
            <AnimatePresence>
              {TODO_TASKS.map(task => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  key={task.id}
                  onClick={() => toggleSubtask(task.projectId, task.id)}
                  className="glass-card p-4 cursor-pointer hover:border-cyber-neon/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-cyber-muted uppercase tracking-[0.2em] font-bold border border-white/10 px-1.5 py-0.5 rounded bg-white/5">
                      {task.projectTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Circle size={16} className="text-cyber-gold group-hover:text-cyber-neon transition-colors" />
                    <span className="text-sm text-white font-bold">{task.title}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {TODO_TASKS.length === 0 && <div className="text-center text-cyber-muted text-xs italic py-10">Toutes les tâches sont terminées.</div>}
          </div>
        </div>

        {/* DONE COLUMN */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col h-full bg-gradient-to-b from-green-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-4">
            <div className="w-3 h-3 rounded-full bg-cyber-neon shadow-neon"></div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Completed</h2>
            <span className="ml-auto text-xs font-mono bg-cyber-neon/20 text-cyber-neon px-2 py-0.5 rounded">{DONE_TASKS.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
            <AnimatePresence>
              {DONE_TASKS.map(task => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  key={task.id}
                  onClick={() => toggleSubtask(task.projectId, task.id)}
                  className="bg-black/50 border border-cyber-neon/20 p-4 rounded-xl cursor-pointer hover:border-cyber-neon/50 transition-all opacity-70 hover:opacity-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-cyber-muted uppercase tracking-[0.2em] font-bold border border-white/10 px-1.5 py-0.5 rounded">
                      {task.projectTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-cyber-neon drop-shadow-neon" />
                    <span className="text-sm text-cyber-muted line-through">{task.title}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
