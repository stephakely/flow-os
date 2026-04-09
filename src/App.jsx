import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Film, Users, BookOpen, Settings as SettingsIcon, Briefcase, Clock, Shield } from 'lucide-react';
import { getDB } from './lib/apiService';

// Vues Placholders et Nouvelles Vues
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
import { ErrorBoundary } from './components/ErrorBoundary';
import ChatWidget from './components/ChatWidget';

const Sidebar = ({ onLogout, user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Définition des liens selon les rôles
  const allLinks = [
    { name: 'Vue d\'Ensemble', icon: LayoutDashboard, path: '/app', roles: ['admin'] },
    { name: 'Mon Espace', icon: Film, path: '/app', roles: ['editor'] },
    { name: 'Mes Projets', icon: LayoutDashboard, path: '/app', roles: ['client'] },
    
    { name: 'CRM', icon: Briefcase, path: '/app/crm', roles: ['admin'] },
    { name: 'Production', icon: Film, path: '/app/production', roles: ['admin'] },
    { name: 'Équipe', icon: Users, path: '/app/team', roles: ['admin'] },
    { name: 'Accès & Sécurité', icon: Shield, path: '/app/access', roles: ['admin'] },
    { name: 'Archives', icon: BookOpen, path: '/app/archives', roles: ['admin'] },
    { name: 'Paramètres', icon: SettingsIcon, path: '/app/settings', roles: ['admin'] },
  ];

  const userRole = user?.role || 'client';
  const links = allLinks.filter(link => link.roles.includes(userRole));

  return (
    <div className="w-64 h-screen border-r border-cyber-border bg-cyber-card flex flex-col backdrop-blur-sm relative z-10">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-cyber-neon tracking-wider flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-cyber-neon shadow-neon animate-pulse"></div>
          FLOW_OS
        </h1>
        <div className="mt-2 text-xs text-cyber-muted uppercase tracking-widest">{user?.name}</div>
        <div className="mt-1 text-[10px] text-cyber-neon/50 uppercase tracking-widest bg-cyber-neon/10 inline-block px-2 py-0.5 rounded border border-cyber-neon/20">
          Role: {userRole}
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link, idx) => {
          const isActive = location.pathname === link.path;
          return (
            <button
              key={`${link.path}-${idx}`}
              onClick={() => navigate(link.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-cyber-neon/10 text-cyber-neon shadow-neon-hover border border-cyber-neon/30' 
                  : 'text-cyber-muted hover:text-cyber-text hover:bg-gray-800/50'
              }`}
            >
              <link.icon size={20} />
              <span className="font-medium text-sm">{link.name}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-cyber-border/50">
        <button 
          onClick={onLogout}
          className="w-full neon-button-secondary text-sm"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
};

const RoleBasedIndex = ({ user }) => {
  const role = user?.role || 'client';
  if (role === 'admin') return <Dashboard user={user} />;
  if (role === 'editor') return <EditorDashboard user={user} />;
  if (role === 'client') return <ClientDashboard user={user} />;
  return <Navigate to="/login" />;
};

const AppLayout = ({ user, onLogout }) => {
  const role = user?.role || 'client';

  return (
    <div className="flex h-screen bg-cyber-dark text-cyber-text overflow-hidden">
      <Sidebar onLogout={onLogout} user={user} />
      <main className="flex-1 overflow-y-auto p-8 relative z-0">
        <Routes>
          <Route index element={<RoleBasedIndex user={user} />} />
          
          {/* Routes réservées Admin */}
          {role === 'admin' && (
            <>
              <Route path="/production" element={<Production user={user} />} />
              <Route path="/crm" element={<CRM user={user} />} />
              <Route path="/team" element={<Team user={user} />} />
              <Route path="/access" element={<AccessControl user={user} />} />
              <Route path="/archives" element={<Archives user={user} />} />
              <Route path="/settings" element={<Settings user={user} />} />
            </>
          )}

          {/* Redirection fallback */}
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </main>
      <ChatWidget user={user} />
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifiedEmail, setVerifiedEmail] = useState(null);

  useEffect(() => {
    // Initialisation DB
    getDB().then((data) => {
      try {
        const savedUser = localStorage.getItem('flow_os_user');
        if (savedUser) setUser(JSON.parse(savedUser));
      } catch(e) {
        console.error("Local storage error:", e);
        localStorage.removeItem('flow_os_user');
      }
      
      // Vérification et Exécution du Reset Mensuel Automatique
      try {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const lastReset = data?.settings?.monthlyResetDate;
        
        if (!lastReset) {
            import('./lib/apiService').then(({ api }) => {
                api.updateSettings({ ...data.settings, monthlyResetDate: currentMonth }).catch(console.error);
            });
        } else if (lastReset !== currentMonth) {
            import('./lib/apiService').then(({ api }) => {
                api.performMonthlyReset().catch(console.error);
            });
        }
      } catch(e) {
        console.error("Reset check error:", e);
      }

      setLoading(false);
    }).catch((e) => {
      console.error("FATAL BOOT ERROR:", e);
      setLoading(false);
    });
  }, []);

  const handleLogin = (userObj) => {
    localStorage.setItem('flow_os_user', JSON.stringify(userObj));
    setUser(userObj);
  };

  const handleLogout = () => {
    localStorage.removeItem('flow_os_user');
    setUser(null);
    setVerifiedEmail(null);
  };

  if (loading) return <div className="h-screen bg-cyber-dark text-cyber-neon flex items-center justify-center font-mono">INIT BOOT SEQUENCE...</div>;

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
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
          <Route path="*" element={<Navigate to={user ? "/app" : "/login"} />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
