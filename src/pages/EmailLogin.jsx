import React, { useState } from 'react';
import { Mail, Compass } from 'lucide-react';
import { loginWithGoogle, loginWithEmail } from '../lib/firebase';

export default function EmailLogin({ onEmailValidated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123'); // Preset for mock demonstration
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loginWithGoogle();
      if (result && result.user) {
        onEmailValidated(result.user.email);
      }
    } catch (e) {
      console.error(e);
      setError("Erreur Auth Google. Vérifie ta console.");
    }
    setLoading(false);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      // Pour une authentification email véritable, Firebase a besoin d'un password.
      // Dans le cadre de ce test, si ce compte n'est pas dans Firebase, ça va thrower.
      // On wrap ça via notre service (qui mocke par défaut).
      const result = await loginWithEmail(email.trim(), password);
      if (result && result.user) {
        onEmailValidated(result.user.email);
      }
    } catch (e) {
      console.error(e);
      setError('ERREUR D\'IDENTIFICATION');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-cyber-dark text-cyber-text flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyber-neon/15 via-cyber-dark to-black pointer-events-none"></div>
      
      <div className="glass-card p-10 max-w-sm w-full mx-4 relative z-10 animate-fade-in text-center flex flex-col items-center border border-cyber-border/50 shadow-[0_0_50px_-12px_rgba(0,255,170,0.2)]">
        <Compass className="w-16 h-16 text-cyber-neon mx-auto mb-4 opacity-90 animate-spin-slow" />
        <h1 className="text-3xl font-bold tracking-[0.2em] text-white drop-shadow-[0_0_10px_var(--tw-colors-cyber-neon)] mb-2">FLOW_OS</h1>
        <p className="text-cyber-muted text-xs mb-8 tracking-widest uppercase font-mono">Phase 1 : Identification</p>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/20 hover:border-cyber-neon hover:bg-cyber-neon/10 hover:text-cyber-neon hover:shadow-[0_0_20px_-5px_rgba(0,255,170,0.5)] transition-all duration-300 py-3 rounded-lg uppercase tracking-widest text-sm text-gray-300 mb-6 group"
        >
          {/* Logo 'G' SVG */}
          <svg className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(0,255,170,0.8)] transition-all duration-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
          </svg>
          <span className="font-bold">Login G-Corp</span>
        </button>

        <div className="w-full flex items-center gap-4 mb-6 opacity-30">
          <div className="flex-1 h-px bg-cyber-border"></div>
          <span className="text-xs uppercase tracking-widest text-cyber-muted">Ou Protocole Manuel</span>
          <div className="flex-1 h-px bg-cyber-border"></div>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-5 w-full">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyber-muted group-focus-within:text-cyber-neon transition-colors" />
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="OPERATIVE EMAIL"
              className="w-full text-center text-sm tracking-[0.2em] neon-input rounded-lg border-cyber-border py-4 pl-12 bg-black/40 focus:bg-cyber-dark/80 transition-all font-mono placeholder:opacity-50"
              required
            />
          </div>
          
          {error && <div className="text-cyber-pulse text-xs font-bold tracking-wider animate-pulse border border-cyber-pulse/30 p-2 rounded bg-cyber-pulse/10">{error}</div>}
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full neon-button-primary py-3 uppercase tracking-[0.3em] font-bold text-sm"
          >
            {loading ? "Decrypting..." : "Initialiser"}
          </button>
        </form>
      </div>

       <div className="fixed bottom-4 text-xs font-mono text-cyber-muted tracking-widest opacity-40">
        Serveur: Alpha (En ligne)
      </div>
    </div>
  );
}
