import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiService';
import { Lock, ArrowLeft } from 'lucide-react';

export default function PinLogin({ email, onLogin, onBack }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [targetUser, setTargetUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([api.getTeam(), api.getClients()]).then(([teamData, clientsData]) => {
      const allUsers = [...teamData, ...clientsData];
      const dbMatches = allUsers.filter(u => u.email.toLowerCase() === email.trim().toLowerCase());
      
      // Fallback Admin Master (Toujours disponible pour l'Admin via PIN 4444)
      const fallbackAdmin = {
        id: `ADMIN_${Date.now()}`,
        name: email.split('@')[0],
        email: email.trim().toLowerCase(),
        role: 'admin',
        pin: '4444'
      };

      // On combine les profils Firestore avec le Master Admin par défaut
      setTargetUser([fallbackAdmin, ...dbMatches]);
    }).finally(() => {
      setIsLoading(false);
    });
  }, [email]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetUser) return;
    
    // Si targetUser est une liste (cas multi-rôles) ou un objet unique (cas normal/fallback)
    const usersToTry = Array.isArray(targetUser) ? targetUser : [targetUser];
    
    // On cherche un match exact entre le PIN tapé et l'un des profilsFirestore
    const authenticatedUser = usersToTry.find(u => u.pin === pin);

    if (authenticatedUser) {
      // ✅ SUCCÈS : Le PIN correspond à un profil Firestore pour cet email.
      // On connecte l'utilisateur avec ce rôle précis.
      onLogin(authenticatedUser);
    } else {
      // ❌ ÉCHEC : Aucun profil pour cet email n'utilise ce PIN.
      setError('CODE PIN INVALIDE');
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
            {isLoading ? (
              <div className="py-4 text-cyber-neon animate-pulse font-mono tracking-widest text-sm bg-black/20 rounded-xl border border-cyber-border/30">
                DÉCRYPTAGE DES ACCÈS...
              </div>
            ) : (
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
            )}
          </div>
          {error && <div className="text-cyber-pulse text-xs font-bold tracking-wider animate-pulse border border-cyber-pulse/30 p-2 rounded bg-cyber-pulse/10">{error}</div>}
          
          <button 
            type="submit"
            disabled={isLoading || !targetUser || pin.length < 4}
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
