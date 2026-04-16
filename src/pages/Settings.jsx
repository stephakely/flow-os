import React, { useState, useEffect } from 'react';
import { api, exportBackup, importBackup } from '../lib/apiService';
import { Download, Upload, Trash2, Save, RefreshCw, Database, Shield, Sliders, Building, Phone, Mail, FileText, CreditCard } from 'lucide-react';

export default function Settings({ user }) {
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinSaved, setPinSaved] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const s = await api.getSettings();
    setSettings(s);
  };

  const update = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    await api.updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSavePin = async () => {
    if (adminPin.length !== 4 || !/^\d{4}$/.test(adminPin)) {
      alert('Le PIN doit être 4 chiffres.');
      return;
    }
    const lsdb = JSON.parse(localStorage.getItem('flow_os_db_v2') || '{}');
    const team = lsdb.team || [];
    const idx = team.findIndex(t => t.id === user.id);
    if (idx >= 0) {
      team[idx].pin = adminPin;
      lsdb.team = team;
      localStorage.setItem('flow_os_db_v2', JSON.stringify(lsdb));
      await api.updateTeam({ ...team[idx] });
    }
    setPinSaved(true);
    setAdminPin('');
    setTimeout(() => { setPinSaved(false); setChangingPin(false); }, 2000);
  };

  const handleExport = async () => {
    try { await exportBackup(); } catch (e) { alert('Erreur export.'); }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const ok = await importBackup(evt.target.result);
      if (ok) { alert('✅ Backup restauré.'); window.location.reload(); }
      else alert('❌ Format invalide.');
    };
    reader.readAsText(file);
  };

  const handleWipe = () => {
    if (confirm('⚠️ EFFACER TOUTES LES DONNÉES — action irréversible. Continuer ?')) {
      if (confirm('Dernière confirmation ?')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  if (user.role !== 'admin') return <div className="p-10 text-center text-cyber-muted">⛔ Accès refusé.</div>;
  if (!settings) return <div className="text-cyber-neon animate-pulse p-8 font-mono">CHARGEMENT...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl pb-10">
      <header>
        <h1 className="text-3xl font-bold text-white">Paramètres <span className="text-cyber-neon">Studio</span></h1>
        <p className="text-cyber-muted text-sm mt-1 uppercase tracking-widest">Configuration globale de l'ERP</p>
      </header>

      {/* Identité Studio */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-bold text-white border-b border-cyber-border/20 pb-2 flex items-center gap-2">
          <Building size={16} className="text-cyber-neon" /> IDENTITÉ DU STUDIO
        </h2>
        <div>
          <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Nom du Studio</label>
          <input type="text" value={settings.studioName || ''} onChange={e => update('studioName', e.target.value)}
            className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
            placeholder="Mon Studio Production" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1 flex items-center gap-1"><Mail size={10} /> Email</label>
            <input type="email" value={settings.studioEmail || ''} onChange={e => update('studioEmail', e.target.value)}
              className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
              placeholder="contact@studio.com" />
          </div>
          <div>
            <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1 flex items-center gap-1"><Phone size={10} /> Téléphone</label>
            <input type="tel" value={settings.studioPhone || ''} onChange={e => update('studioPhone', e.target.value)}
              className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
              placeholder="+33 6 00 00 00 00" />
          </div>
        </div>
        <div>
          <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Adresse</label>
          <input type="text" value={settings.studioAddress || ''} onChange={e => update('studioAddress', e.target.value)}
            className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
            placeholder="123 Rue de la Production, 75001 Paris" />
        </div>
        <div>
          <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1 flex items-center gap-1"><FileText size={10} /> SIRET / Numéro fiscal</label>
          <input type="text" value={settings.studioSiret || ''} onChange={e => update('studioSiret', e.target.value)}
            className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
            placeholder="123 456 789 00010" />
        </div>
      </div>

      {/* Facturation */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-bold text-white border-b border-cyber-border/20 pb-2 flex items-center gap-2">
          <CreditCard size={16} className="text-cyber-neon" /> FACTURATION
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Devise</label>
            <select value={settings.currency || 'EUR'} onChange={e => update('currency', e.target.value)}
              className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none">
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="MAD">MAD (DH)</option>
              <option value="CAD">CAD ($CA)</option>
              <option value="CHF">CHF (Fr.)</option>
              <option value="XOF">XOF (FCFA)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Préfixe Facture</label>
            <input type="text" value={settings.invoicePrefix || 'FAC'} onChange={e => update('invoicePrefix', e.target.value)}
              className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
              placeholder="FAC" />
          </div>
          <div>
            <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Préfixe Devis</label>
            <input type="text" value={settings.quotePrefix || 'DEV'} onChange={e => update('quotePrefix', e.target.value)}
              className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
              placeholder="DEV" />
          </div>
        </div>
        <div>
          <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Frais Plateforme par Défaut (%)</label>
          <input type="number" step="0.1" min="0" max="100" value={settings.defaultPlatformFee || 2} onChange={e => update('defaultPlatformFee', parseFloat(e.target.value))}
            className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none" />
        </div>
        <div>
          <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Mentions légales (pied de facture)</label>
          <textarea value={settings.invoiceFooter || ''} onChange={e => update('invoiceFooter', e.target.value)}
            className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none resize-none text-sm"
            rows="2" placeholder="Ex: TVA non applicable, art. 293 B du CGI." />
        </div>
      </div>

      {/* Bouton sauvegarde */}
      <button onClick={handleSave} className="neon-button-primary flex items-center justify-center gap-2 w-full py-3">
        {saved ? <><CheckMark /> Sauvegardé !</> : <><Save size={18} /> Sauvegarder les Paramètres</>}
      </button>

      {/* Sécurité */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-bold text-white border-b border-cyber-border/20 pb-2 flex items-center gap-2">
          <Shield size={16} className="text-cyber-neon" /> SÉCURITÉ
        </h2>
        {!changingPin ? (
          <button onClick={() => setChangingPin(true)}
            className="w-full flex items-center justify-center gap-2 border border-cyber-border text-cyber-muted py-3 rounded-lg hover:border-cyber-neon hover:text-cyber-neon transition-colors">
            <Shield size={16} /> Changer mon PIN Admin
          </button>
        ) : (
          <div className="space-y-3">
            <label className="text-xs text-cyber-muted uppercase tracking-widest block">Nouveau PIN (4 chiffres)</label>
            <input type="password" maxLength={4} inputMode="numeric" pattern="[0-9]*"
              value={adminPin} onChange={e => setAdminPin(e.target.value.replace(/\D/g, ''))}
              autoFocus
              className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none text-center tracking-[1em] text-2xl"
              placeholder="••••" />
            <div className="flex gap-3">
              <button onClick={handleSavePin} className="flex-1 neon-button-primary py-2 text-sm">
                {pinSaved ? '✅ PIN mis à jour !' : 'Valider'}
              </button>
              <button onClick={() => { setChangingPin(false); setAdminPin(''); }} className="flex-1 neon-button-secondary py-2 text-sm">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Center */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-bold text-white border-b border-cyber-border/20 pb-2 flex items-center gap-2">
          <Database size={16} className="text-cyber-neon" /> DONNÉES
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={handleExport} className="neon-button-primary flex items-center justify-center gap-2 h-16 text-sm">
            <Download size={18} />
            <div className="text-left">
              <div className="font-bold">Export JSON</div>
              <div className="text-xs opacity-70">Backup complet</div>
            </div>
          </button>
          <label className="neon-button-secondary flex items-center justify-center gap-2 h-16 cursor-pointer border-dashed text-sm">
            <Upload size={18} />
            <div className="text-left">
              <div className="font-bold">Import JSON</div>
              <div className="text-xs opacity-70">Restaurer</div>
            </div>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      {/* Session */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-bold text-yellow-400 border-b border-yellow-500/20 pb-2 mb-3 uppercase tracking-widest">SESSION</h2>
        <button onClick={() => { localStorage.removeItem('flow_os_user'); window.location.reload(); }}
          className="w-full flex items-center justify-center gap-2 border border-yellow-500/30 text-yellow-400 py-3 rounded-lg hover:bg-yellow-500/10 transition-colors text-sm">
          <RefreshCw size={16} /> Se Déconnecter (re-login)
        </button>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-5 border border-red-500/30">
        <h2 className="text-sm font-bold text-red-500 border-b border-red-500/20 pb-2 mb-3 uppercase tracking-widest">DANGER ZONE</h2>
        <button onClick={handleWipe}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/50 text-red-400 py-3 rounded-lg hover:bg-red-500/20 transition-colors text-sm">
          <Trash2 size={16} /> EFFACER TOUTES LES DONNÉES
        </button>
      </div>
    </div>
  );
}

function CheckMark() {
  return <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}
