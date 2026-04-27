import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Film, Users, BookOpen, Settings as SettingsIcon,
  Briefcase, Shield, Sun, Moon, FileText, TrendingUp, Calendar,
  LogOut, ChevronRight
} from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { api, getDB, apiContext } from './lib/apiService';

import Dashboard from './pages/Dashboard';
import Production from './pages/Production';
import CRM from './pages/CRM';
import Team from './pages/Team';
import Archives from './pages/Archives';
import Settings from './pages/Settings';
import PinLogin from './pages/PinLogin';
import EmailLogin from './pages/EmailLogin';
import EditorDashboard from './pages/EditorDashboard';
import ClientDashboard from './pages/ClientDashboard';
import AccessControl from './pages/AccessControl';
import Devis from './pages/Devis';
import Finances from './pages/Finances';
import Planning from './pages/Planning';
import JoinStudio from './pages/JoinStudio';
import TaskBoard from './pages/TaskBoard';
import GearTracker from './pages/GearTracker';

import { ErrorBoundary } from './components/ErrorBoundary';
import MessengerWidget from './components/MessengerWidget';

const ALL_LINKS = [
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
  { name: 'Matériel', icon: SettingsIcon, path: '/app/gear', roles: ['admin'] },
  { name: 'Mon Espace', icon: LayoutDashboard, path: '/app', roles: ['editor'], exact: true },
  { name: 'Kanban', icon: Briefcase, path: '/app/kanban', roles: ['editor', 'admin'] },
  { name: 'Planning', icon: Calendar, path: '/app/planning', roles: ['editor'] },
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
      {theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
    </button>
  );
};

const Sidebar = ({ onLogout, user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = user?.role || 'client';
  const links = ALL_LINKS.filter(l => l.roles.includes(userRole));

  return (
    <div className="w-56 h-screen border-r border-cyber-border bg-cyber-card flex flex-col backdrop-blur-md relative z-10 shrink-0">
      <div className="px-5 pt-6 pb-4 border-b border-cyber-border/20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyber-neon shadow-neon animate-pulse" />
          <h1 className="text-xl font-black text-cyber-neon tracking-tighter">FLOW_OS</h1>
        </div>
        <div className="mt-3">
          <p className="text-[10px] font-bold text-white uppercase tracking-widest truncate">{user?.name}</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map((link, idx) => {
          const active = location.pathname === link.path || (!link.exact && location.pathname.startsWith(link.path + '/'));
          return (
            <button
              key={`${link.path}-${idx}`}
              onClick={() => navigate(link.path)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                active ? 'text-cyber-neon bg-cyber-neon/10 border-l-2 border-cyber-neon' : 'text-cyber-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <link.icon size={16} className="shrink-0" />
              <span className="truncate text-xs">{link.name}</span>
            </button>
          );
        })}
      </nav>
      <div className="px-3 pb-4 pt-2 border-t border-cyber-border/20 space-y-2">
        <ThemeToggle />
        <button onClick={onLogout} className="w-full h-9 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center gap-2 px-3 text-red-400/70 hover:text-red-400 text-xs font-semibold">
          <LogOut size={13} /> Déconnexion
        </button>
      </div>
    </div>
  );
};

const AppLayout = ({ user, onLogout }) => {
  const location = useLocation();
  return (
    <div className="flex h-screen overflow-hidden bg-cyber-dark">
      <Sidebar onLogout={onLogout} user={user} />
      <main className="flex-1 overflow-y-auto p-6 xl:p-8 relative z-0">
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
      </main>
      {user.role !== 'client' && <MessengerWidget user={user} />}
    </div>
  );
};

const FirstLaunchScreen = ({ onSetup }) => {
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [studioName, setStudioName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (adminPin.length !== 4) return alert('PIN invalide');
    onSetup({ adminName, adminEmail, adminPin, studioName });
  };

  return (
    <div className="h-screen bg-cyber-dark flex items-center justify-center p-4">
      <div className="glass-card p-10 w-full max-w-md border border-cyber-neon/30">
        <h1 className="text-2xl font-black text-cyber-neon mb-6 text-center tracking-tighter">FLOW_OS CONFIG</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required className="input-cyber" placeholder="Nom du Studio" value={studioName} onChange={e => setStudioName(e.target.value)} />
          <input required className="input-cyber" placeholder="Votre Nom" value={adminName} onChange={e => setAdminName(e.target.value)} />
          <input required className="input-cyber" type="email" placeholder="Email Admin" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
          <input required className="input-cyber" type="password" maxLength={4} placeholder="PIN (4 chiffres)" value={adminPin} onChange={e => setAdminPin(e.target.value)} />
          <button type="submit" className="neon-button-primary w-full py-3 mt-4">LANCER FLOW_OS</button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifiedEmail, setVerifiedEmail] = useState(null);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('flow_os_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      apiContext.setStudioId(parsed.studioId || 'default_studio');
      setUser(parsed);
    }

    api.getCollection('global_users').then(globalUsers => {
       if (!globalUsers || globalUsers.length === 0) {
         if (!window.location.pathname.includes('/join')) setIsFirstLaunch(true);
       }
    }).catch(console.error).finally(() => setLoading(false));

    api.getDB().catch(console.error);
  }, []);

  const handleLogin = (userObj) => {
    apiContext.setStudioId(userObj.studioId || 'default_studio');
    localStorage.setItem('flow_os_user', JSON.stringify(userObj));
    setUser(userObj);
  };

  const handleLogout = () => {
    localStorage.removeItem('flow_os_user');
    setUser(null);
  };

  const handleFirstLaunchSetup = async (data) => {
    const adminUser = {
      id: `admin_${Date.now()}`,
      name: data.adminName,
      email: data.adminEmail.toLowerCase(),
      pin: data.adminPin,
      role: 'admin',
      studioId: `studio_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    apiContext.setStudioId(adminUser.studioId);
    await api.forceSetCollection('global_users', [{ email: adminUser.email, studios: [adminUser.studioId] }]);
    await api.updateTeam(adminUser);
    await api.updateSettings({ studioName: data.studioName, studioEmail: data.adminEmail });
    setIsFirstLaunch(false);
    handleLogin(adminUser);
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center font-mono">
      <h1 className="text-cyber-neon text-2xl animate-pulse">FLOW_OS LOADING...</h1>
    </div>
  );

  return (
    <ErrorBoundary>
      <ThemeProvider>
        {isFirstLaunch && !user ? (
          <FirstLaunchScreen onSetup={handleFirstLaunchSetup} />
        ) : (
          <BrowserRouter>
            <Routes>
              <Route path="/join" element={!user ? <JoinStudio onLogin={handleLogin} /> : <Navigate to="/app" />} />
              <Route path="/login" element={
                !user ? (
                  !verifiedEmail ? (
                    <EmailLogin onEmailValidated={setVerifiedEmail} />
                  ) : (
                    <PinLogin email={verifiedEmail} onLogin={handleLogin} onBack={() => setVerifiedEmail(null)} />
                  )
                ) : <Navigate to="/app" />
              } />
              <Route path="/app/*" element={user ? <AppLayout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
              <Route path="*" element={<Navigate to={user ? '/app' : '/login'} />} />
            </Routes>
          </BrowserRouter>
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
}
