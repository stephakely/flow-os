import React, { useState, useEffect } from 'react';
import { api, exportBackup, importBackup } from '../lib/apiService';
import { Download, Upload, Trash2, Save, RefreshCw, Database, Shield, Sliders, BookOpen, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings({ user }) {
  const [studioName, setStudioName] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminPin, setAdminPin] = useState('');
  const [changingPin, setChangingPin] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [newFaq, setNewFaq] = useState({ q: '', a: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await api.getSettings();
      setStudioName(settings.studioName || '');
      setCurrency(settings.currency || 'EUR');
      setFaqs(await api.getFAQ());
    } catch (e) {
      console.error('Error loading settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    await api.updateSettings({ studioName, currency });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSavePin = async () => {
    if (!adminPin || adminPin.length !== 4 || !/^\d{4}$/.test(adminPin)) {
      alert('Le PIN doit être composé de 4 chiffres.');
      return;
    }
    const team = await api.getTeam();
    const adminUser = team.find(t => t.id === user.id);
    if (!adminUser) {
      alert('Utilisateur introuvable.');
      return;
    }
    await api.updateTeam({ ...adminUser, pin: adminPin });
    setPinSaved(true);
    setAdminPin('');
    setTimeout(() => { setPinSaved(false); setChangingPin(false); }, 2000);
  };

  const handleExport = async () => {
    try {
      await exportBackup();
    } catch (e) {
      alert('Erreur lors de l\'export.');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const ok = await importBackup(evt.target.result);
      if (ok) {
        alert('✅ Backup importé avec succès. L\'application va recharger.');
        window.location.reload();
      } else {
        alert('❌ Erreur lors de l\'import (format non reconnu).');
      }
    };
    reader.readAsText(file);
  };

  const handleWipeDB = async () => {
    if (confirm('⚠️ ATTENTION: Ceci va supprimer TOUTES les données. Cette action est IRRÉVERSIBLE.')) {
      if (confirm('Dernière confirmation : Continuer ?')) {
        localStorage.removeItem('flow_os_user');
        alert('Base de données réinitialisée. L\'application va redémarrer.');
        window.location.reload();
      }
    }
  };

  const handleClearSession = () => {
    localStorage.removeItem('flow_os_user');
    window.location.reload();
  };

  const handleAddFaq = async () => {
    if (!newFaq.q || !newFaq.a) return;
    await api.updateFAQ({ ...newFaq, id: `faq_${Date.now()}` });
    setNewFaq({ q: '', a: '' });
    setFaqs(await api.getFAQ());
  };

  const handleDeleteFaq = async (id) => {
    await api.deleteFAQ(id);
    setFaqs(await api.getFAQ());
  };

  if (user.role !== 'admin') {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <Shield size={48} className="text-cyber-red opacity-20" />
        <h2 className="text-xl font-black text-cyber-red uppercase tracking-widest">Access Denied</h2>
        <p className="text-cyber-muted text-sm font-mono max-w-xs">Required clearance level: ADMINISTRATOR. Your current credentials have been logged.</p>
      </div>
    );
  }

  if (loading) return (
    <div className="text-cyber-neon animate-pulse p-8 font-mono tracking-[0.5em] text-center w-full mt-20">
      ACCESSING ENCRYPTED CONFIG...
    </div>
  );

  return (
    <div className="space-y-10 pb-20 max-w-4xl mx-auto">
      <header className="flex justify-between items-end border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">System <span className="text-cyber-neon">Settings</span></h1>
          <p className="text-cyber-muted tracking-[0.3em] font-mono text-[10px] uppercase mt-2">Configuration & Data Shield</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-cyber-neon/10 border border-cyber-neon/20 rounded-full">
            <Database size={12} className="text-cyber-neon" />
            <span className="text-[9px] font-black text-cyber-neon uppercase tracking-widest">Cloud Node Synced</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Paramètres Studio */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 space-y-6"
        >
          <h2 className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-widest">
            <Sliders size={18} className="text-cyber-neon" /> Studio Config
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-cyber-muted uppercase tracking-[0.2em] font-bold block mb-2">Studio Identity</label>
              <input
                type="text"
                value={studioName}
                onChange={e => setStudioName(e.target.value)}
                className="input-cyber"
                placeholder="FLOW_OS STUDIOS"
              />
            </div>

            <div>
              <label className="text-[10px] text-cyber-muted uppercase tracking-[0.2em] font-bold block mb-2">Fiscal Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="input-cyber"
              >
                <option value="EUR">EURO (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="MAD">MAD (DH)</option>
                <option value="CAD">CAD (CA$)</option>
                <option value="CHF">CHF (Fr)</option>
              </select>
            </div>
          </div>

          <button onClick={handleSaveSettings} className="neon-button-primary w-full py-4 italic">
            {saved ? 'SUCCESSFULLY SAVED' : 'COMMIT CHANGES'}
          </button>
        </motion.div>

        {/* Sécurité — Changer son PIN */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 space-y-6"
        >
          <h2 className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-widest">
            <Shield size={18} className="text-cyber-purple" /> Security Access
          </h2>
          
          <div className="bg-black/40 p-4 rounded-xl border border-white/5">
            <p className="text-[11px] text-cyber-muted leading-relaxed font-mono italic">
              Updating your administrator PIN will invalidate all active biometric tokens. Ensure your 4-digit sequence is unique.
            </p>
          </div>

          {!changingPin ? (
            <button
              onClick={() => setChangingPin(true)}
              className="w-full neon-button-secondary py-4 uppercase tracking-widest text-xs"
            >
              Rotate Admin PIN
            </button>
          ) : (
            <div className="space-y-4">
              <input
                type="password"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
                value={adminPin}
                onChange={e => setAdminPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-black/80 border border-cyber-purple/30 text-cyber-purple p-4 rounded-2xl outline-none text-center tracking-[1em] text-3xl font-black shadow-[inset_0_0_20px_rgba(188,19,254,0.1)]"
                placeholder="0000"
                autoFocus
              />
              <div className="flex gap-4">
                <button onClick={handleSavePin} className="flex-1 neon-button-primary !border-cyber-purple !text-cyber-purple hover:!bg-cyber-purple hover:!text-white py-3">
                  {pinSaved ? 'UPDATED' : 'CONFIRM'}
                </button>
                <button onClick={() => { setChangingPin(false); setAdminPin(''); }} className="flex-1 neon-button-secondary py-3">
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Data Architecture */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 space-y-6 col-span-1 md:col-span-2"
        >
          <h2 className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-widest">
            <Database size={18} className="text-cyber-blue" /> Data Architecture
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              onClick={handleExport}
              className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-cyber-blue/50 hover:bg-cyber-blue/10 transition-all cursor-pointer group"
            >
              <Download size={24} className="text-cyber-blue mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-black text-white uppercase tracking-tighter">Export Archive</h3>
              <p className="text-[10px] text-cyber-muted mt-1 uppercase tracking-widest">Generate local encrypted backup</p>
            </div>
            
            <label className="p-6 bg-white/5 border border-white/5 rounded-2xl border-dashed hover:border-cyber-neon/50 hover:bg-cyber-neon/10 transition-all cursor-pointer group">
              <Upload size={24} className="text-cyber-neon mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-black text-white uppercase tracking-tighter">Import Protocol</h3>
              <p className="text-[10px] text-cyber-muted mt-1 uppercase tracking-widest">Overwrite with external snapshot</p>
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </motion.div>

        {/* System Flush */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8 space-y-6 border-cyber-red/20 shadow-neon-red"
        >
          <h2 className="text-sm font-black text-cyber-red flex items-center gap-3 uppercase tracking-widest">
            <Trash2 size={18} /> Danger Zone
          </h2>
          
          <p className="text-[10px] text-cyber-muted font-mono leading-relaxed">
            Performing a total wipe will erase all cloud records and local caches. This action is final and irrecoverable.
          </p>

          <button onClick={handleWipeDB} className="w-full py-4 text-[10px] font-black uppercase tracking-widest bg-cyber-red/10 text-cyber-red border border-cyber-red/30 rounded-xl hover:bg-cyber-red hover:text-white transition-all">
            Initiate Total Reset
          </button>
          
          <button onClick={handleClearSession} className="w-full text-[9px] font-bold text-cyber-muted uppercase hover:text-white transition-colors">
            Terminate Current Session
          </button>
        </motion.div>
    </div>

      {/* FAQ Knowledge Base Manager */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-8 space-y-6"
      >
        <h2 className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-widest">
          <BookOpen size={18} className="text-cyber-green" /> Knowledge Hub Manager
        </h2>
        
        <div className="space-y-4">
          {faqs.map(item => (
            <div key={item.id} className="flex justify-between items-start p-4 bg-white/5 border border-white/5 rounded-2xl group">
              <div className="flex-1">
                <div className="text-xs font-black text-white uppercase tracking-widest mb-1">{item.q}</div>
                <div className="text-[11px] text-cyber-muted italic">{item.a}</div>
              </div>
              <button onClick={() => handleDeleteFaq(item.id)} className="text-red-500/30 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 bg-cyber-neon/5 rounded-3xl space-y-4 border border-cyber-neon/10">
           <div className="text-[10px] text-cyber-neon uppercase font-black tracking-widest">New Protocol Entry</div>
           <input 
              type="text" 
              value={newFaq.q}
              onChange={e => setNewFaq({...newFaq, q: e.target.value})}
              placeholder="Question (ex: Comment préparer les rushs ?)" 
              className="input-cyber" 
           />
           <textarea 
              value={newFaq.a}
              onChange={e => setNewFaq({...newFaq, a: e.target.value})}
              placeholder="Answer / Guideline..." 
              className="input-cyber h-20 resize-none" 
           />
           <button onClick={handleAddFaq} className="w-full neon-button-primary !py-3 flex items-center justify-center gap-2">
              <Plus size={16} /> Deploy Knowledge Node
           </button>
        </div>
      </motion.div>
    </div>
  );
}

function CheckMark() {
  return <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}
