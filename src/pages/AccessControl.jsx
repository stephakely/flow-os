import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiService';
import { Shield, Plus, Key, Copy, CheckCircle, Trash2, UserX, FileText } from 'lucide-react';

export default function AccessControl({ user }) {
  const [team, setTeam] = useState([]);
  const [clients, setClients] = useState([]);
  
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('editor');
  const [generatedPin, setGeneratedPin] = useState('');
  const [copied, setCopied] = useState(false);
  const [contractType, setContractType] = useState('per_video');

  useEffect(() => {
    loadUsers();
    const handleDbUpdate = () => loadUsers();
    window.addEventListener('flow-db-update', handleDbUpdate);
    return () => window.removeEventListener('flow-db-update', handleDbUpdate);
  }, []);

  const loadUsers = async () => {
    setTeam(await api.getTeam());
    setClients(await api.getClients());
  };

  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedPin(pin);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAccess = async (e) => {
    e.preventDefault();
    if (!newEmail || !newName || !generatedPin) return;

    const newUser = {
      id: `U_${Date.now()}`,
      name: newName,
      email: newEmail,
      pin: generatedPin,
      role: newRole,
      totalEarned: 0
    };

    if (newRole === 'client') {
      newUser.currency = 'EUR';
      newUser.contractType = contractType;
      await api.addClient(newUser);
    } else {
      await api.updateTeam(newUser);
    }

    setNewEmail('');
    setNewName('');
    setGeneratedPin('');
    setContractType('per_video');
    alert(`✅ Accès créé pour ${newName} (${newRole}) – PIN: ${generatedPin}`);
    loadUsers();
  };

  const handleDeleteTeamMember = async (member) => {
    if (member.id === user.id) {
      alert("Impossible de supprimer votre propre accès !");
      return;
    }
    if (confirm(`Révoquer l'accès de ${member.name} ?`)) {
      await api.deleteTeamMember(member.id);
      loadUsers();
    }
  };

  const handleDeleteClient = async (client) => {
    if (confirm(`Révoquer l'accès client de ${client.name} ?`)) {
      await api.deleteClient(client.id);
      loadUsers();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <header>
        <h1 className="text-3xl font-bold text-cyber-text flex items-center gap-3">
          <Shield className="text-cyber-neon" size={32} />
          Accès & <span className="text-cyber-neon">Sécurité</span>
        </h1>
        <p className="text-cyber-muted tracking-widest mt-1 text-sm uppercase">Générateur d'Accès ERP ({team.length} équipe | {clients.length} clients)</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULAIRE DE CRÉATION */}
        <div className="lg:col-span-1 glass-card p-6 border border-cyber-neon/30 h-fit">
          <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <Plus size={18} className="text-cyber-neon" />
            Nouveau Profil
          </h2>
          
          <form onSubmit={handleCreateAccess} className="space-y-4">
            <div>
              <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Rôle / Type</label>
              <select 
                value={newRole} 
                onChange={e => setNewRole(e.target.value)}
                className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
              >
                <option value="editor">Monteur (Éditeur)</option>
                <option value="client">Client</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Nom / Pseudo</label>
              <input 
                type="text" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                required
                className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
                placeholder="Ex: John Doe"
              />
            </div>

            <div>
              <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Email Google</label>
              <input 
                type="email" 
                value={newEmail} 
                onChange={e => setNewEmail(e.target.value)}
                required
                className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
                placeholder="email@gmail.com"
              />
            </div>

            {/* Type de contrat (uniquement pour les clients) */}
            {newRole === 'client' && (
              <div>
                <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Type de Contrat</label>
                <select 
                  value={contractType} 
                  onChange={e => setContractType(e.target.value)}
                  className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
                >
                  <option value="per_video">📹 Par Vidéo</option>
                  <option value="per_week">📅 Par Semaine</option>
                  <option value="per_month">🗓️ Par Mois</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Code PIN Sécurité</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={generatedPin} 
                  required
                  placeholder="----"
                  className="w-full bg-cyber-dark text-center text-xl tracking-[0.5em] border border-cyber-border text-cyber-neon p-2 rounded-lg font-mono"
                />
                <button type="button" onClick={generatePin} className="neon-button-secondary px-4 flex items-center justify-center whitespace-nowrap">
                  <Key size={14} className="mr-1" /> Générer
                </button>
              </div>
            </div>

            {generatedPin && (
              <button 
                type="button" 
                onClick={handleCopy}
                className="w-full flex justify-center items-center gap-2 text-xs text-cyber-muted hover:text-cyber-text transition-colors p-2 bg-black/20 rounded"
              >
                {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                {copied ? "PIN Copié !" : "Copier le PIN pour l'envoyer"}
              </button>
            )}

            <button 
              type="submit" 
              disabled={!generatedPin}
              className="w-full neon-button-primary py-3 mt-4 flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-40"
            >
              <Key size={18} />
              Créer Accès
            </button>
          </form>
        </div>

        {/* LISTE DES ACCÈS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">Équipe Autorisée</h2>
            <div className="space-y-3">
              {team.map(t => (
                <div key={t.id} className="flex justify-between items-center bg-black/30 p-3 rounded border border-cyber-border/30 group hover:border-cyber-border/60 transition-colors">
                  <div>
                    <div className="font-bold text-white">
                      {t.name} 
                      <span className={`text-xs ml-2 uppercase px-2 py-0.5 rounded ${
                        t.role === 'admin' ? 'bg-red-500/10 text-red-400' : 'bg-cyber-neon/10 text-cyber-neon'
                      }`}>{t.role}</span>
                    </div>
                    <div className="text-xs text-cyber-muted">{t.email}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-cyber-muted uppercase tracking-widest">PIN</div>
                      <div className="font-mono text-cyber-pulse tracking-widest">{t.pin}</div>
                    </div>
                    {t.id !== user.id && (
                      <button 
                        onClick={() => handleDeleteTeamMember(t)}
                        className="text-red-500/30 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <UserX size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {team.length === 0 && <div className="text-sm text-cyber-muted italic">Aucun membre d'équipe.</div>}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">Clients Autorisés</h2>
            <div className="space-y-3">
              {clients.map(c => (
                <div key={c.id} className="flex justify-between items-center bg-black/30 p-3 rounded border border-cyber-border/30 group hover:border-cyber-border/60 transition-colors">
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {c.name}
                      {c.contractType && (
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                          <FileText size={10} />
                          {c.contractType === 'per_video' ? 'Par Vidéo' : c.contractType === 'per_week' ? 'Par Semaine' : 'Par Mois'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-cyber-muted">{c.email}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-cyber-muted uppercase tracking-widest">PIN</div>
                      <div className="font-mono text-cyber-pulse tracking-widest">{c.pin || '----'}</div>
                    </div>
                    <button 
                      onClick={() => handleDeleteClient(c)}
                      className="text-red-500/30 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <UserX size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {clients.length === 0 && <div className="text-sm text-cyber-muted italic">Aucun client configuré.</div>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
