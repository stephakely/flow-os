import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiService';
import { Shield, Plus, Key, Copy, CheckCircle, Trash2, UserX, FileText, Edit2, Save, X, RefreshCw } from 'lucide-react';

function PinEditor({ currentPin, onSave, onCancel }) {
  const [pin, setPin] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      alert('Le PIN doit être composé de 4 chiffres.');
      return;
    }
    onSave(pin);
  };
  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus type="password" maxLength={4} inputMode="numeric" pattern="[0-9]*"
        value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
        className="w-20 bg-black/50 border border-cyber-neon text-white p-1.5 rounded text-center tracking-[0.5em] font-mono text-sm focus:outline-none"
        placeholder="••••"
      />
      <button type="submit" className="text-green-400 hover:text-green-300 p-1"><Save size={14} /></button>
      <button type="button" onClick={onCancel} className="text-red-400 hover:text-red-300 p-1"><X size={14} /></button>
    </form>
  );
}

export default function AccessControl({ user }) {
  const [team, setTeam] = useState([]);
  const [clients, setClients] = useState([]);
  const [editingPin, setEditingPin] = useState(null); // { id, type: 'team'|'client' }

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('editor');
  const [generatedPin, setGeneratedPin] = useState('');
  const [copied, setCopied] = useState(false);
  const [contractType, setContractType] = useState('per_video');
  const [contractAmount, setContractAmount] = useState('');
  const [customPin, setCustomPin] = useState('');
  const [useCustomPin, setUseCustomPin] = useState(false);

  useEffect(() => {
    const unsubTeam = api.subscribeTeam(setTeam);
    const unsubClients = api.subscribeClients(setClients);
    return () => { unsubTeam(); unsubClients(); };
  }, []);

  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedPin(pin);
    setCopied(false);
  };

  const activePin = useCustomPin ? customPin : generatedPin;

  const handleCopy = () => {
    navigator.clipboard.writeText(activePin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAccess = async (e) => {
    e.preventDefault();
    if (!newEmail || !newName || !activePin) {
      alert('Tous les champs sont requis. Générez ou saisissez un PIN.');
      return;
    }
    if (activePin.length !== 4 || !/^\d{4}$/.test(activePin)) {
      alert('Le PIN doit être exactement 4 chiffres.');
      return;
    }

    const newUser = {
      id: `U_${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      pin: activePin,
      role: newRole,
      totalEarned: 0,
      createdAt: new Date().toISOString()
    };

    if (newRole === 'client') {
      newUser.currency = 'EUR';
      newUser.contractType = contractType;
      if (contractType !== 'per_video') newUser.contractAmount = parseFloat(contractAmount) || 0;
      await api.addClient(newUser);
    } else {
      await api.updateTeam(newUser);
    }

    setNewEmail(''); setNewName(''); setGeneratedPin(''); setCustomPin('');
    setContractType('per_video'); setContractAmount(''); setUseCustomPin(false);
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
      <header>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Shield className="text-cyber-neon" size={28} /> Accès & <span className="text-cyber-neon">Sécurité</span>
        </h1>
        <p className="text-cyber-muted text-sm mt-1 uppercase tracking-widest">
          {team.length} membres équipe · {clients.length} clients autorisés
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="glass-card p-6 border border-cyber-neon/20 h-fit">
          <h2 className="text-base font-bold text-white mb-5 uppercase tracking-wider flex items-center gap-2">
            <Plus size={16} className="text-cyber-neon" /> Créer un Accès
          </h2>
          <form onSubmit={handleCreateAccess} className="space-y-4">
            <div>
              <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Rôle</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)}
                className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none">
                <option value="editor">🎬 Monteur (Éditeur)</option>
                <option value="client">👤 Client</option>
                <option value="admin">👑 Administrateur</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Nom *</label>
              <input required type="text" value={newName} onChange={e => setNewName(e.target.value)}
                className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
                placeholder="Nom complet ou entreprise" />
            </div>
            <div>
              <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Email *</label>
              <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
                placeholder="exemple@domaine.com" />
            </div>

            {newRole === 'client' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Contrat</label>
                  <select value={contractType} onChange={e => setContractType(e.target.value)}
                    className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none">
                    <option value="per_video">📹 Par Vidéo</option>
                    <option value="per_week">📅 Par Semaine</option>
                    <option value="per_month">🗓️ Par Mois</option>
                  </select>
                </div>
                {contractType !== 'per_video' && (
                  <div>
                    <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Montant Forfait (€)</label>
                    <input type="number" value={contractAmount} onChange={e => setContractAmount(e.target.value)} required
                      className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
                      placeholder="Ex: 500" />
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-cyber-muted uppercase tracking-widest">PIN (4 chiffres) *</label>
                <button type="button" onClick={() => setUseCustomPin(!useCustomPin)}
                  className="text-xs text-cyber-muted hover:text-cyber-neon transition-colors">
                  {useCustomPin ? 'Générer auto' : 'Saisir manuellement'}
                </button>
              </div>
              {useCustomPin ? (
                <input type="password" maxLength={4} inputMode="numeric" pattern="[0-9]*"
                  value={customPin} onChange={e => setCustomPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none text-center tracking-[1em] text-xl font-mono"
                  placeholder="••••" />
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 bg-cyber-dark border border-cyber-border text-cyber-neon p-3 rounded-lg font-mono text-center text-xl tracking-[0.5em]">
                    {generatedPin || '----'}
                  </div>
                  <button type="button" onClick={generatePin} className="neon-button-secondary px-4 flex items-center gap-1 text-sm">
                    <RefreshCw size={14} />
                  </button>
                </div>
              )}
            </div>

            {activePin && (
              <button type="button" onClick={handleCopy}
                className="w-full flex justify-center items-center gap-2 text-xs text-cyber-muted hover:text-cyber-neon transition-colors p-2 bg-black/20 rounded border border-cyber-border/20">
                {copied ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
                {copied ? 'PIN copié !' : `Copier le PIN${activePin ? ` : ${activePin}` : ''}`}
              </button>
            )}

            <button type="submit" disabled={!activePin}
              className="w-full neon-button-primary py-3 uppercase tracking-widest font-bold disabled:opacity-40">
              Créer l'Accès
            </button>
          </form>
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
                      {editingPin?.id === t.id && editingPin.type === 'team' ? (
                        <PinEditor
                          currentPin={t.pin}
                          onSave={(pin) => handleSavePin(t.id, 'team', pin)}
                          onCancel={() => setEditingPin(null)}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-[9px] text-cyber-muted uppercase tracking-widest">PIN</div>
                            <div className="font-mono text-cyber-neon tracking-widest text-sm">{t.pin}</div>
                          </div>
                          <button onClick={() => setEditingPin({ id: t.id, type: 'team' })}
                            className="p-1.5 text-cyber-muted hover:text-cyber-neon opacity-0 group-hover:opacity-100 transition-all">
                            <Edit2 size={13} />
                          </button>
                        </div>
                      )}
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
                      {editingPin?.id === c.id && editingPin.type === 'client' ? (
                        <PinEditor
                          currentPin={c.pin}
                          onSave={(pin) => handleSavePin(c.id, 'client', pin)}
                          onCancel={() => setEditingPin(null)}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-[9px] text-cyber-muted uppercase tracking-widest">PIN</div>
                            <div className="font-mono text-purple-400 tracking-widest text-sm">{c.pin || '----'}</div>
                          </div>
                          <button onClick={() => setEditingPin({ id: c.id, type: 'client' })}
                            className="p-1.5 text-cyber-muted hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all">
                            <Edit2 size={13} />
                          </button>
                        </div>
                      )}
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
