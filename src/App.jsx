import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Film, Users, BookOpen, Settings as SettingsIcon, Briefcase, Clock, Shield, Sun, Moon } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { getDB } from './lib/apiService';
// Ultimate Version 1.0.1 - Force Refresh

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
import MessengerWidget from './components/MessengerWidget';

import { motion, AnimatePresence } from 'framer-motion';

const RoleBasedIndex = ({ user }) => {
  if (user.role === 'admin') return <Dashboard user={user} />;
  if (user.role === 'editor') return <EditorDashboard user={user} />;
  return <ClientDashboard user={user} />;
};

const Sidebar = ({ onLogout, user }) => {
  const location = useLocation();
  const navigate = useNavigate();

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
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 h-screen border-r border-cyber-border bg-cyber-card flex flex-col backdrop-blur-md relative z-10"
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold text-cyber-neon tracking-tighter flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyber-neon shadow-neon animate-pulse"></div>
          FLOW_OS
        </h1>
        <div className="mt-3 flex flex-col gap-1">
          <span className="text-[10px] text-cyber-muted uppercase tracking-[0.2em] font-bold">{user?.name}</span>
          <span className="text-[9px] text-cyber-neon/50 uppercase tracking-widest bg-cyber-neon/5 w-fit px-2 py-0.5 rounded border border-cyber-neon/10">
            {userRole}
          </span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link, idx) => {
          const isActive = location.pathname === link.path;
          return (
            <button
              key={`${link.path}-${idx}`}
              onClick={() => navigate(link.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                isActive 
                  ? 'text-cyber-neon' 
                  : 'text-cyber-muted hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-link"
                  className="absolute inset-0 bg-cyber-neon/10 border-r-2 border-cyber-neon z-0"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <link.icon size={18} className="relative z-10" />
              <span className="font-semibold text-sm relative z-10">{link.name}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-cyber-border/30 space-y-2">
        <ThemeToggle />
        <button 
          onClick={onLogout}
          className="w-full neon-button-secondary text-xs flex items-center justify-center gap-2"
        >
          Déconnexion
        </button>
      </div>
    </motion.div>
  );
};

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button 
      onClick={toggleTheme}
      className="w-full h-10 rounded-xl border border-cyber-border/30 bg-white/5 flex items-center justify-between px-4 text-cyber-muted hover:text-white transition-all group overflow-hidden"
    >
      <span className="text-[10px] font-black uppercase tracking-widest">
        {theme === 'dark' ? 'Neural Night' : 'Studio Light'}
      </span>
      {theme === 'dark' ? <Moon size={14} className="group-hover:rotate-12 transition-transform" /> : <Sun size={14} className="group-hover:scale-110 transition-transform" />}
    </button>
  );
};



const AppLayout = ({ user, onLogout }) => {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-grid-cyber">
      <Sidebar onLogout={onLogout} user={user} />
      <main className="flex-1 overflow-y-auto p-8 relative z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Routes location={location} key={location.pathname}>
              <Route index element={<RoleBasedIndex user={user} />} />
              <Route path="/production" element={<Production user={user} />} />
              <Route path="/crm" element={<CRM user={user} />} />
              <Route path="/team" element={<Team user={user} />} />
              <Route path="/access" element={<AccessControl user={user} />} />
              <Route path="/archives" element={<Archives user={user} />} />
              <Route path="/settings" element={<Settings user={user} />} />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <MessengerWidget user={user} />
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifiedEmail, setVerifiedEmail] = useState(null);

  useEffect(() => {
    // BOOT INSTANTANÉ - localStorage uniquement, Firestore en arrière-plan
    try {
      const savedUser = localStorage.getItem('flow_os_user');
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (e) {
      localStorage.removeItem('flow_os_user');
    }
    // Firestore sync en arrière-plan (ne bloque jamais le boot)
    getDB().catch(console.error);
    setLoading(false);
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

  if (loading) return (
    <div className="h-screen bg-cyber-dark flex flex-col items-center justify-center font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-cyber opacity-20" />
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-cyber-neon text-4xl font-bold tracking-[0.5em] z-10"
      >
        FLOW_OS
      </motion.div>
      <div className="mt-8 w-48 h-1 bg-cyber-border rounded-full overflow-hidden z-10">
        <motion.div 
          animate={{ x: [-200, 200] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-full h-full bg-cyber-neon shadow-neon"
        />
      </div>
      <div className="mt-4 text-[10px] text-cyber-muted uppercase tracking-widest z-10">Initializing core systems...</div>
    </div>
  );

  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}
