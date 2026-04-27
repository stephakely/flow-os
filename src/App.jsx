import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Film, Users, BookOpen, Settings as SettingsIcon,
  Briefcase, Shield, Sun, Moon, FileText, TrendingUp, Calendar,
  LogOut, ChevronRight
} from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { api, getDB, apiContext } from './lib/apiService';
import { motion, AnimatePresence } from 'framer-motion';

import { Suspense, lazy } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Production = lazy(() => import('./pages/Production'));
const CRM = lazy(() => import('./pages/CRM'));
const Team = lazy(() => import('./pages/Team'));
const Archives = lazy(() => import('./pages/Archives'));
const Settings = lazy(() => import('./pages/Settings'));
const PinLogin = lazy(() => import('./pages/PinLogin'));
const EmailLogin = lazy(() => import('./pages/EmailLogin'));
const EditorDashboard = lazy(() => import('./pages/EditorDashboard'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const AccessControl = lazy(() => import('./pages/AccessControl'));
const Devis = lazy(() => import('./pages/Devis'));
const Finances = lazy(() => import('./pages/Finances'));
const Planning = lazy(() => import('./pages/Planning'));
const JoinStudio = lazy(() => import('./pages/JoinStudio'));
const TaskBoard = lazy(() => import('./pages/TaskBoard'));
const GearTracker = lazy(() => import('./pages/GearTracker'));

import { ErrorBoundary } from './components/ErrorBoundary';
import MessengerWidget from './components/MessengerWidget';

const ALL_LINKS = [
  // Admin
  { name: 'Dashboard', icon: LayoutDashboard, path: '/app', roles: ['admin'], exact: true },
  { name: 'Production', icon: Film, path: '/app/production', roles: ['admin'] },
  { name: 'CRM', icon: Briefcase, path: '/app/crm', roles: ['admin'] },
  { name: 'Devis', icon: FileText, path: '/app/devis', roles: ['admin'] },
  { name: 'Finances', icon: TrendingUp, path: '/app/finances', roles: ['admin'] },
  { name: 'Planning', icon: Calendar, path: '/app/planning', roles: ['admin'] },
  { name: 'Équipe', icon: Users, path: '/app/team', roles: ['admin'] },
  { name: 'Archives', icon: BookOpen, path: '/app/archives', roles: ['admin'] },
  { name: 'Accès & Sécu.', icon: Shield, path: '/app/access', roles: ['admin'] },
  { name: 'Paramètres', icon: SettingsIcon, path: '/app/settings', roles: ['admin'] },
  { name: 'Matériel', icon: SettingsIcon, path: '/app/gear', roles: ['admin'] }, // Replace with a better icon if possible, but SettingsIcon is fine
  // Editor
  { name: 'Mon Espace', icon: LayoutDashboard, path: '/app', roles: ['editor'], exact: true },
  { name: 'Kanban', icon: Briefcase, path: '/app/kanban', roles: ['editor', 'admin'] },
  { name: 'Planning', icon: Calendar, path: '/app/planning', roles: ['editor'] },
  // Client
  { name: 'Mes Projets', icon: LayoutDashboard, path: '/app', roles: ['client'], exact: true },
];

const RoleBasedIndex = ({ user }) => {
  if (user.role === 'admin') return <Dashboard user={user} />;
  if (user.role === 'editor') return <EditorDashboard user={user} />;
  return <ClientDashboard user={user} />;
};

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="w-full h-9 rounded-xl border border-cyber-border/20 bg-white/5 flex items-center justify-between px-3 text-cyber-muted hover:text-white transition-all group"
    >
      <span className="text-[9px] font-black uppercase tracking-widest">
        {theme === 'dark' ? 'Mode Nuit' : 'Mode Jour'}
      </span>
      {theme === 'dark'
        ? <Moon size={13} className="group-hover:rotate-12 transition-transform" />
        : <Sun size={13} className="group-hover:scale-110 transition-transform" />}
    </button>
  );
};

const Sidebar = ({ onLogout, user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const userRole = user?.role || 'client';
  const links = ALL_LINKS.filter(l => l.roles.includes(userRole));

  const isActive = (link) =>
    link.exact ? location.pathname === link.path : location.pathname.startsWith(link.path) && link.path !== '/app';

  const activeLink = links.find(l => isActive(l)) || (location.pathname === '/app' ? links[0] : null);

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-56 h-screen border-r border-cyber-border bg-cyber-card flex flex-col backdrop-blur-md relative z-10 shrink-0"
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-cyber-border/20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyber-neon shadow-neon animate-pulse" />
          <h1 className="text-xl font-black text-cyber-neon tracking-tighter">FLOW_OS</h1>
        </div>
        <div className="mt-3">
          <p className="text-[10px] font-bold text-white uppercase tracking-widest truncate">{user?.name}</p>
          <span className="text-[8px] text-cyber-neon/60 uppercase tracking-[0.2em] bg-cyber-neon/5 px-1.5 py-0.5 rounded border border-cyber-neon/10 mt-1 inline-block">
            {userRole}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        {links.map((link, idx) => {
          const active = activeLink === link || (link.exact && location.pathname === '/app' && idx === 0 && !links.some(l => !l.exact && location.pathname.startsWith(l.path)));
          const trueActive = location.pathname === link.path || (!link.exact && location.pathname.startsWith(link.path + '/'));
          
          return (
            <button
              key={`${link.path}-${idx}`}
              onClick={() => navigate(link.path)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative group ${
                trueActive
                  ? 'text-cyber-neon bg-cyber-neon/10'
                  : 'text-cyber-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {trueActive && (
                <motion.div
                  layoutId="active-sidebar"
                  className="absolute inset-0 bg-cyber-neon/10 border-l-2 border-cyber-neon rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <link.icon size={16} className="relative z-10 shrink-0" />
              <span className="relative z-10 truncate text-xs">{link.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 border-t border-cyber-border/20 space-y-2">
        <ThemeToggle />
        <button
          onClick={onLogout}
          className="w-full h-9 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center gap-2 px-3 text-red-400/70 hover:text-red-400 hover:border-red-500/40 transition-all text-xs font-semibold"
        >
          <LogOut size={13} />
          Déconnexion
        </button>
      </div>
    </motion.div>
  );
};

const AppLayout = ({ user, onLogout }) => {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-cyber-dark">
      <Sidebar onLogout={onLogout} user={user} />
      <main className="flex-1 overflow-y-auto p-6 xl:p-8 relative z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="min-h-full"
          >
            <Suspense fallback={
              <div className="h-full min-h-[50vh] flex flex-col items-center justify-center font-mono">
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-cyber-neon/50 text-sm font-black tracking-[0.4em]"
                >
                  LOADING MODULE...
                </motion.div>
              </div>
            }>
              <Routes location={location} key={location.pathname}>
                <Route index element={<RoleBasedIndex user={user} />} />
                <Route path="/production" element={<Production user={user} />} />
                <Route path="/crm" element={<CRM user={user} />} />
                <Route path="/devis" element={<Devis user={user} />} />
                <Route path="/finances" element={<Finances user={user} />} />
                <Route path="/planning" element={<Planning user={user} />} />
                <Route path="/team" element={<Team user={user} />} />
                <Route path="/access" element={<AccessControl user={user} />} />
                <Route path="/archives" element={<Archives user={user} />} />
                <Route path="/settings" element={<Settings user={user} />} />
                <Route path="/gear" element={<GearTracker user={user} />} />
                <Route path="/kanban" element={<TaskBoard user={user} />} />
                <Route path="*" element={<Navigate to="/app" replace />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      {user.role !== 'client' && <MessengerWidget user={user} />}
    </div>
  );
};

// ── Écran de premier lancement (aucun accès créé) ───────────────────────────
const FirstLaunchScreen = ({ onSetup }) => {
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [studioName, setStudioName] = useState('');
  const [step, setStep] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (adminPin.length !== 4 || !/^\d{4}$/.test(adminPin)) {
      alert('Le PIN doit être exactement 4 chiffres.');
      return;
    }
    onSetup({ adminName, adminEmail, adminPin, studioName });
  };

  return (
    <div className="h-screen bg-cyber-dark flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-cyber opacity-10" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 w-full max-w-md mx-4 border border-cyber-neon/30 shadow-[0_0_80px_-20px_rgba(0,255,170,0.3)] relative z-10"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-cyber-neon shadow-neon animate-pulse" />
            <h1 className="text-2xl font-black text-cyber-neon tracking-tighter">FLOW_OS</h1>
          </div>
          <h2 className="text-white font-bold text-xl">Configuration Initiale</h2>
          <p className="text-cyber-muted text-sm mt-2">Créez votre compte administrateur pour commencer</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Nom du Studio *</label>
            <input
              required type="text" value={studioName} onChange={e => setStudioName(e.target.value)}
              className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
              placeholder="Ex: Studio Visuel Paris"
            />
          </div>
          <div>
            <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Votre Nom *</label>
            <input
              required type="text" value={adminName} onChange={e => setAdminName(e.target.value)}
              className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
              placeholder="Ex: Jean Dupont"
            />
          </div>
          <div>
            <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">Email Admin *</label>
            <input
              required type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
              className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none"
              placeholder="admin@votrestudio.com"
            />
          </div>
          <div>
            <label className="text-xs text-cyber-muted uppercase tracking-widest block mb-1">PIN (4 chiffres) *</label>
            <input
              required type="password" maxLength={4} inputMode="numeric" pattern="[0-9]*"
              value={adminPin} onChange={e => setAdminPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-black/50 border border-cyber-border text-white p-3 rounded-lg focus:border-cyber-neon outline-none text-center tracking-[1em] text-xl"
              placeholder="••••"
            />
          </div>
          <button type="submit" className="w-full neon-button-primary py-3 uppercase tracking-widest font-bold mt-2">
            Lancer FLOW_OS →
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifiedEmail, setVerifiedEmail] = useState(null);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    // BOOT INSTANTANÉ - localStorage only
    try {
      const savedUser = localStorage.getItem('flow_os_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        
        // SESSION TIMEOUT LOGIC
        const lastActivity = localStorage.getItem('flow_os_last_activity') || Date.now();
        const now = Date.now();
        const hoursInactive = (now - parseInt(lastActivity, 10)) / (1000 * 60 * 60);

        const timeoutLimit = parsed.role === 'client' ? 24 : (24 * 7); // 24h client, 7 days staff

        if (hoursInactive > timeoutLimit) {
          alert('Session expirée pour des raisons de sécurité.');
          localStorage.removeItem('flow_os_user');
          setUser(null);
        } else {
          apiContext.setStudioId(parsed.studioId || 'default_studio');
          setUser(parsed);
          localStorage.setItem('flow_os_last_activity', now.toString()); // Refresh
        }
      }
    } catch (e) {
      localStorage.removeItem('flow_os_user');
    }

    // Activity tracking loop (update every 5 minutes while open)
    const interval = setInterval(() => {
      localStorage.setItem('flow_os_last_activity', Date.now().toString());
    }, 5 * 60 * 1000);

    // Track user active actions
    const handleUserActivity = () => {
      localStorage.setItem('flow_os_last_activity', Date.now().toString());
    };
    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });

    // Vérifier si c'est le premier lancement (aucun compte global)
    // On ne déclenche setIsFirstLaunch que si global_users est explicitement vide.
    api.getCollection('global_users').then(globalUsers => {
       const hasAnyUser = globalUsers && globalUsers.length > 0;
       
       // Si on est sur une route publique comme /join, on ne force pas le First Launch
       const isPublicRoute = window.location.pathname.includes('/join');
       
       if (!hasAnyUser && !isPublicRoute) {
         setIsFirstLaunch(true);
       }
    }).catch(err => {
      console.error('[BOOT] Erreur lors de la vérification du premier lancement:', err);
    }).finally(() => {
      setLoading(false);
    });

    // Firestore sync en arrière-plan
    api.getDB().catch(console.error);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, []);

  const handleFirstLaunchSetup = async (data) => {
    const { adminName, adminEmail, adminPin, studioName } = data;
    const lsdb = JSON.parse(localStorage.getItem('flow_os_db_v2') || '{}');

    const adminId = `admin_${Date.now()}`;
    const adminUser = {
      id: adminId,
      name: adminName,
      email: adminEmail.trim().toLowerCase(),
      pin: adminPin,
      role: 'admin',
      studioId: `studio_${Date.now()}`,
      totalEarned: 0,
      createdAt: new Date().toISOString()
    };
    
    // Create the global user entry
    apiContext.setStudioId(adminUser.studioId);
    api.forceSetCollection('global_users', [{ email: adminUser.email, studios: [adminUser.studioId] }]);
    // Add to specific studio team
    api.updateTeam(adminUser);
    api.updateSettings({ studioName, studioEmail: adminEmail, currency: 'EUR' });

    setIsFirstLaunch(false);
    handleLogin(adminUser);
  };

  const handleLogin = (userObj) => {
    // Si l'utilisateur n'a pas de studio_id (anciens comptes), on lui assigne le default
    if (!userObj.studioId) userObj.studioId = 'default_studio';

    apiContext.setStudioId(userObj.studioId);
    localStorage.setItem('flow_os_user', JSON.stringify(userObj));
    localStorage.setItem('flow_os_last_activity', Date.now().toString());
    
    // Welcome Back Toast mechanism
    api.logActivity({
      action: 'LOGIN',
      userId: userObj.id,
      userName: userObj.name,
      role: userObj.role
    }).catch(() => {});
    
    setUser(userObj);
  };

  const handleLogout = () => {
    localStorage.removeItem('flow_os_user');
    setUser(null);
    setVerifiedEmail(null);
  };

  if (loading) return (
    <div className="h-screen bg-cyber-dark flex flex-col items-center justify-center font-mono">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-cyber-neon text-3xl font-black tracking-[0.4em]"
      >
        FLOW_OS
      </motion.div>
    </div>
  );

  // Premier lancement sans admin (Sauf si on est en train de rejoindre un studio sur invitation)
  if (isFirstLaunch && !user && !window.location.pathname.includes('/join')) {
    return (
      <ThemeProvider>
        <ErrorBoundary>
          <FirstLaunchScreen onSetup={handleFirstLaunchSetup} />
        </ErrorBoundary>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={
            <div className="h-screen bg-cyber-dark flex flex-col items-center justify-center font-mono">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-cyber-neon text-3xl font-black tracking-[0.4em]"
              >
                FLOW_OS
              </motion.div>
            </div>
          }>
            <Routes>
              <Route path="/join" element={!user ? <JoinStudio onLogin={handleLogin} /> : <Navigate to="/app" />} />
              <Route path="/login" element={
                !user ? (
                  !verifiedEmail ? (
                    <EmailLogin onEmailValidated={setVerifiedEmail} />
                  ) : (
                    <PinLogin email={verifiedEmail} onLogin={handleLogin} onBack={() => setVerifiedEmail(null)} />
                  )
                ) : (
                  <Navigate to="/app" />
                )
              } />
              <Route path="/app/*" element={user ? <AppLayout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
              <Route path="*" element={<Navigate to={user ? '/app' : '/login'} />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
