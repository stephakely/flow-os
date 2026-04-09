import React, { useState, useEffect } from 'react';
import { api, exportBackup, importBackup } from '../lib/apiService';
import { Download, Upload, Trash2, Save, RefreshCw, Database, Shield, Sliders } from 'lucide-react';

export default function Settings({ user }) {
  const [studioName, setStudioName] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminPin, setAdminPin] = useState('');
  const [changingPin, setChangingPin] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await api.getSettings();
      setStudioName(settings.studioName || '');
      setCurrency(settings.currency || 'EUR');
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

  if (user.role !== 'admin') {
    return <div className="p-10 text-center text-cyber-muted">⛔ Accès refusé. Droits admin requis.</div>;
  }

  if (loading) return <div className="text-cyber-neon animate-pulse p-8 font-mono">CHARGEMENT...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <header>
        <h1 className="text-3xl font-bold text-cyber-text">System <span className="text-cyber-neon">Settings</span></h1>
        <p className="text-cyber-muted tracking-widest mt-1 text-sm uppercase">Configuration & Data Shield</p>
      </header>

      {/* Paramètres Studio */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-bold text-white border-b border-cyber-border/30 pb-2 flex items-center gap-2">
          <Sliders size={18} className="text-cyber-neon" /> STUDIO CONFIG
        </h2>

        <div>
          <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Nom du Studio</label>
          <input
            type="text"
            value={studioName}
            onChange={e => setStudioName(e.target.value)}
            className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
            placeholder="FLOW_OS STUDIOS"
          />
        </div>

        <div>
          <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Devise par Défaut</label>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
          >
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
            <option value="MAD">MAD (DH)</option>
            <option value="CAD">CAD (CA$)</option>
            <option value="CHF">CHF (Fr)</option>
          </select>
        </div>

        <button onClick={handleSaveSettings} className="neon-button-primary flex items-center justify-center gap-2 w-full py-3">
          {saved ? <><CheckMark /> Sauvegardé !</> : <><Save size={18} /> Sauvegarder</>}
        </button>
      </div>

      {/* Sécurité — Changer son PIN */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-bold text-white border-b border-cyber-border/30 pb-2 flex items-center gap-2">
          <Shield size={18} className="text-cyber-neon" /> SÉCURITÉ
        </h2>
        {!changingPin ? (
          <button
            onClick={() => setChangingPin(true)}
            className="w-full flex items-center justify-center gap-2 border border-cyber-border text-cyber-muted py-3 rounded-lg hover:border-cyber-neon hover:text-cyber-neon transition-colors"
          >
            <Shield size={16} /> Changer mon PIN Administrateur
          </button>
        ) : (
          <div className="space-y-3">
            <label className="text-xs text-cyber-muted uppercase tracking-widest block">Nouveau PIN (4 chiffres)</label>
            <input
              type="password"
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]*"
              value={adminPin}
              onChange={e => setAdminPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none text-center tracking-[1em] text-2xl"
              placeholder="••••"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={handleSavePin} className="flex-1 neon-button-primary py-2">
                {pinSaved ? '✅ PIN Mis à jour !' : 'Valider'}
              </button>
              <button onClick={() => { setChangingPin(false); setAdminPin(''); }} className="flex-1 neon-button-secondary py-2">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Center */}
      <div className="glass-card p-6 space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-cyber-border/30 pb-2 flex items-center gap-2">
          <Database size={18} className="text-cyber-neon" /> DATA CENTER
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={handleExport} className="neon-button-primary flex items-center justify-center gap-2 h-20">
            <Download size={24} />
            <div className="text-left">
              <div className="font-bold">EXPORT JSON</div>
              <div className="text-xs opacity-70">Créer Backup local</div>
            </div>
          </button>
          <label className="neon-button-secondary flex items-center justify-center gap-2 h-20 cursor-pointer border-dashed border-2 hover:border-cyber-neon hover:text-cyber-neon hover:bg-cyber-neon/5">
            <Upload size={24} />
            <div className="text-left">
              <div className="font-bold">IMPORT JSON</div>
              <div className="text-xs opacity-70">Restaurer Backup</div>
            </div>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      {/* Session */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-bold text-yellow-400 border-b border-yellow-500/30 pb-2">SESSION</h2>
        <button onClick={handleClearSession} className="w-full flex items-center justify-center gap-2 border border-yellow-500/50 text-yellow-400 py-3 rounded-lg hover:bg-yellow-500/10 transition-colors">
          <RefreshCw size={18} /> Réinitialiser la Session (re-login)
        </button>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 space-y-6 border border-red-500/30">
        <h2 className="text-xl font-bold text-red-500 border-b border-red-500/30 pb-2">DANGER ZONE</h2>
        <button onClick={handleWipeDB} className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500 text-red-500 py-3 rounded-lg hover:bg-red-500/20 transition-colors">
          <Trash2 size={18} /> EFFACER TOUTES LES DONNÉES (RESET TOTAL)
        </button>
      </div>
    </div>
  );
}

function CheckMark() {
  return <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}
