import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiService';
import { Lock, ArrowLeft } from 'lucide-react';

export default function PinLogin({ email, onLogin, onBack }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    Promise.all([api.getTeam(), api.getClients()]).then(([teamData, clientsData]) => {
      const allUsers = [...teamData, ...clientsData];
      const found = allUsers.find(u => u.email === email);
      if (found) {
        setTargetUser(found);
      } else {
        // Demande de l'utilisateur : "PAGE ADMIN PAR DEFAUT" et "AUCUNE ADRESSE NON AUTORISÉ"
        // Si l'email n'est pas dans l'ERP, on le laisse passer comme Admin avec le PIN de base (ex: 4444)
        setTargetUser({
          id: `ADMIN_${Date.now()}`,
          name: email.split('@')[0], // Pseudo dynamique par défaut
          email: email,
          role: 'admin',
          pin: '4444' // Le PIN maître de l'Admin
        });
      }
    });
  }, [email]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetUser) return;
    
    if (targetUser.pin === pin) {
      onLogin(targetUser);
    } else {
      setError('PIN INVALIDE');
      setPin('');
    }
  };

  return (
    <div className="h-screen bg-cyber-dark text-cyber-text flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyber-neon/10 via-cyber-dark to-cyber-dark pointer-events-none"></div>
      
      <div className="glass-card p-10 max-w-sm w-full mx-4 relative z-10 animate-fade-in text-center border border-cyber-border/50">
        <button onClick={onBack} className="absolute top-4 left-4 text-cyber-muted hover:text-cyber-neon transition-colors">
          <ArrowLeft size={20} />
        </button>

        <Lock className="w-16 h-16 text-cyber-neon mx-auto mb-6 opacity-80" />
        <h1 className="text-3xl font-bold tracking-widest text-cyber-neon mb-2">FLOW_OS</h1>
        <p className="text-cyber-muted text-xs mb-2 tracking-widest uppercase font-mono">Phase 2 : Sécurité</p>
        <p className="text-cyber-text text-sm mb-8 truncate opacity-80">{email}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input 
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="ENTER PIN"
              className="text-center text-3xl tracking-[1em] neon-input rounded-xl border-cyber-border py-4 bg-black/40 w-full"
              autoFocus
              disabled={!targetUser}
            />
          </div>
          {error && <div className="text-cyber-pulse text-xs font-bold tracking-wider animate-pulse border border-cyber-pulse/30 p-2 rounded bg-cyber-pulse/10">{error}</div>}
          
          <button 
            type="submit"
            disabled={!targetUser || pin.length < 4}
            className="w-full neon-button-primary py-3 uppercase tracking-widest disabled:opacity-50"
          >
            Access System
          </button>
        </form>
      </div>

      <div className="fixed bottom-4 text-xs font-mono text-cyber-muted tracking-widest opacity-40 text-center">
        Demo (Editor: 0000 | Admin: 4444 | Client: 1111)
      </div>
    </div>
  );
}
