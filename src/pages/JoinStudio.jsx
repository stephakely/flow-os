import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, apiContext } from '../lib/apiService';
import { Shield, Sparkles } from 'lucide-react';

export default function JoinStudio({ onLogin }) {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const role = searchParams.get('role');
  const studioId = searchParams.get('studio_id');
  
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!email || !role || !studioId) {
    return <div className="h-screen bg-cyber-dark text-center text-red-500 py-20">Lien d'invitation invalide ou corrompu.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('Le PIN doit faire 4 chiffres.');
      return;
    }
    if (!name) {
      setError('Veuillez entrer votre nom.');
      return;
    }
    setLoading(true);

    try {
      // 1. Activer le contexte du studio ciblé
      apiContext.setStudioId(studioId);

      // 2. Créer l'utilisateur dans l'annuaire global (ou le lier s'il existe déjà)
      await api.registerGlobalUser(email, studioId);

      const newUser = {
        id: `U_${Date.now()}`,
        name: name.trim(),
        email: email.toLowerCase(),
        role: role,
        pin: pin,
        studioId: studioId,
        createdAt: new Date().toISOString()
      };

      // 3. Ajouter l'utilisateur dans l'équipe du studio
      if (role === 'client') {
        newUser.contractType = 'invite';
        await api.addClient(newUser);
      } else {
        await api.updateTeam(newUser);
      }

      // 4. Connecter
      onLogin(newUser);

    } catch (e) {
      setError('Erreur réseau lors de la création de votre profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-cyber-dark text-cyber-text flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-cyber opacity-20 pointer-events-none"></div>
      
      <div className="glass-card p-10 max-w-sm w-full mx-4 relative z-10 animate-fade-in text-center border border-cyber-neon/30 shadow-[0_0_80px_-20px_rgba(0,255,170,0.2)]">
        <Shield className="w-16 h-16 text-cyber-neon mx-auto mb-6 opacity-80" />
        <h1 className="text-xl font-bold tracking-widest text-white mb-2">Rejoindre L'Équipe</h1>
        <p className="text-cyber-muted text-xs mb-8 tracking-widest uppercase font-mono bg-black/40 py-2 px-4 rounded border border-white/5">
          {email} <br/> <span className="text-cyber-neon mt-1 block">Role assigné : {role}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left">
             <label className="text-xs text-cyber-muted tracking-widest uppercase mb-2 block">Comment vous appelez-vous ?</label>
             <input 
                type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full neon-input rounded-xl border-cyber-border py-3 px-4 bg-black/40 text-sm"
                placeholder="ex: Jean Dupont" required
              />
          </div>

          <div className="text-left">
            <label className="text-xs text-cyber-muted tracking-widest uppercase mb-2 block">Choisissez votre PIN (4 chiffres)</label>
            <input 
              type="password" pattern="[0-9]*" inputMode="numeric" maxLength={4}
              value={pin} onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="text-center text-3xl tracking-[1em] neon-input rounded-xl border-cyber-border py-4 bg-black/40 w-full"
              autoFocus required
            />
          </div>
          
          {error && <div className="text-red-500 text-xs font-bold">{error}</div>}
          
          <button type="submit" disabled={loading} className="w-full neon-button-primary py-3 uppercase tracking-widest flex items-center justify-center gap-2">
            <Sparkles size={16} /> Initier l'accès
          </button>
        </form>
      </div>
    </div>
  );
}
