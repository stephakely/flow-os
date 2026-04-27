import React, { useState, useEffect } from 'react';
import { api, apiContext } from '../lib/apiService';
import { Shield, Plus, Key, Copy, CheckCircle, Trash2, UserX, FileText, Edit2, Save, X, RefreshCw } from 'lucide-react';

// PinEditor components removed. Users define their own PINs on join.

export default function AccessControl({ user }) {
  const [team, setTeam] = useState([]);
  const [clients, setClients] = useState([]);
  const [editingPin, setEditingPin] = useState(null); // { id, type: 'team'|'client' }

  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('editor');
  const [contractType, setContractType] = useState('per_video');
  const [contractAmount, setContractAmount] = useState('');
  
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubTeam = api.subscribeTeam(setTeam);
    const unsubClients = api.subscribeClients(setClients);
    return () => { unsubTeam(); unsubClients(); };
  }, []);

  const handleGenerateLink = (e) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      alert('Veuillez entrer un email valide pour générer le lien.');
      return;
    }

    const currentStudio = apiContext.getStudioId() || 'default_studio';
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/join?studio_id=${currentStudio}&email=${encodeURIComponent(newEmail.trim().toLowerCase())}&role=${newRole}`;
    
    setInviteLink(link);
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Clear form after copy
      setNewEmail(''); setInviteLink('');
    }
  };

  const handleDeleteTeamMember = async (member) => {
    if (member.id === user.id) { alert('Impossible de supprimer votre propre accès !'); return; }
    if (confirm(`Révoquer l'accès de ${member.name} ?`)) {
      await api.deleteTeamMember(member.id);
    }
  };

  const handleDeleteClient = async (client) => {
    if (confirm(`Révoquer l'accès de ${client.name} ?`)) {
      await api.deleteClient(client.id);
    }
  };

  const handleSavePin = async (id, type, newPin) => {
    if (type === 'team') {
      const member = team.find(t => t.id === id);
      if (member) await api.updateTeam({ ...member, pin: newPin });
    } else {
      const client = clients.find(c => c.id === id);
      if (client) await api.addClient({ ...client, pin: newPin });
    }
    setEditingPin(null);
  };

  const roleColor = (role) => ({
    admin: 'bg-red-500/10 text-red-400 border-red-500/20',
    editor: 'bg-cyber-neon/10 text-cyber-neon border-cyber-neon/20',
    client: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }[role] || 'bg-gray-500/10 text-gray-400');

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-cyber-neon" size={28} /> Accès & <span className="text-cyber-neon">Sécurité</span>
          </h1>
          <p className="text-cyber-muted text-sm mt-1 uppercase tracking-widest">
            {team.length} membres équipe · {clients.length} clients autorisés
          </p>
        </div>
        <button 
           onClick={() => {
             if(confirm("DANGER : Voulez-vous vraiment invalider toutes les sessions actives et forcer la reconnexion de tous les collaborateurs ?")) {
                api.updateSettings({ security_kick: Date.now() })
                  .then(() => alert("Séquence d'expulsion lancée. Tous les appareils seront déconnectés."))
                  .catch(() => alert("Erreur lors de l'expulsion."));
             }
           }}
           className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 transition-colors px-4 py-2 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center gap-2"
        >
          <UserX size={16} /> Panic Button
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire Générateur de Lien Magique */}
        <div className="glass-card p-6 border border-cyber-neon/20 h-fit">
          <h2 className="text-base font-bold text-white mb-5 uppercase tracking-wider flex items-center gap-2">
            <Plus size={16} className="text-cyber-neon" /> Inviter un Membre
          </h2>
          <form onSubmit={handleGenerateLink} className="space-y-4">
            <div>
              <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Rôle assigné</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)}
                className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none">
                <option value="editor">🎬 Monteur (Éditeur)</option>
                <option value="client">👤 Client</option>
                <option value="admin">👑 Administrateur</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Email de l'invité *</label>
              <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
                placeholder="exemple@domaine.com" />
            </div>

            <button type="submit" disabled={!newEmail}
              className="w-full neon-button-primary py-3 uppercase tracking-widest font-bold disabled:opacity-40">
              Générer Lien Magique
            </button>
          </form>

          {/* Affichage du lien généré */}
          {inviteLink && (
            <div className="mt-6 p-4 bg-black/40 border border-cyber-neon/50 rounded-lg animate-fade-in text-center space-y-3">
              <p className="text-[10px] text-cyber-neon uppercase tracking-widest">✅ Lien sécurisé créé :</p>
              <input type="text" readOnly value={inviteLink} className="w-full bg-black border border-cyber-border/50 text-cyber-muted text-xs p-2 rounded truncate" />
              <button type="button" onClick={handleCopyLink}
                className="w-full flex justify-center items-center gap-2 text-xs text-black bg-cyber-neon hover:bg-cyber-neon/80 transition-colors p-2 rounded font-bold">
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied ? 'COPIÉ !' : `COPIER LE LIEN SAAS`}
              </button>
            </div>
          )}
        </div>

        {/* Listes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Équipe */}
          <div className="glass-card p-6">
            <h2 className="text-base font-bold text-white mb-4 uppercase tracking-wider">Équipe Autorisée</h2>
            {team.length === 0 ? (
              <p className="text-cyber-muted text-sm italic py-4 text-center">Aucun membre d'équipe configuré.</p>
            ) : (
              <div className="space-y-2">
                {team.map(t => (
                  <div key={t.id} className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-cyber-border/20 group hover:border-cyber-border/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-cyber-dark flex items-center justify-center text-cyber-neon font-bold border border-cyber-neon/20">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm flex items-center gap-2">
                          {t.name}
                          <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${roleColor(t.role)}`}>{t.role}</span>
                          {t.id === user.id && <span className="text-[10px] text-cyber-muted">(vous)</span>}
                        </div>
                        <div className="text-xs text-cyber-muted">{t.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-[9px] text-cyber-muted uppercase tracking-widest">STATUT</div>
                          <div className="font-mono text-green-400 text-xs flex items-center gap-1 border border-green-500/30 px-2 py-0.5 rounded bg-green-500/10">
                            <Lock size={10} /> SÉCURISÉ
                          </div>
                        </div>
                      </div>
                      {t.id !== user.id && (
                        <button onClick={() => handleDeleteTeamMember(t)}
                          className="text-red-500/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <UserX size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clients */}
          <div className="glass-card p-6">
            <h2 className="text-base font-bold text-white mb-4 uppercase tracking-wider">Clients Autorisés</h2>
            {clients.length === 0 ? (
              <p className="text-cyber-muted text-sm italic py-4 text-center">Aucun client configuré.</p>
            ) : (
              <div className="space-y-2">
                {clients.map(c => (
                  <div key={c.id} className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-cyber-border/20 group hover:border-cyber-border/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold border border-purple-500/20">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm flex items-center gap-2">
                          {c.name}
                          {c.contractType && (
                            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded">
                              {c.contractType === 'per_video' ? 'Par Vidéo' : c.contractType === 'per_week' ? '/Semaine' : '/Mois'}
                              {c.contractAmount ? ` — ${c.contractAmount}€` : ''}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-cyber-muted">{c.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-[9px] text-cyber-muted uppercase tracking-widest">STATUT</div>
                          <div className="font-mono text-green-400 text-xs flex items-center gap-1 border border-green-500/30 px-2 py-0.5 rounded bg-green-500/10">
                            <Lock size={10} /> SÉCURISÉ
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteClient(c)}
                        className="text-red-500/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <UserX size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
