// src/lib/apiService.js
// Cerveau de FLOW_OS - Gère les données locales, backups et logiques métier.
// Prêt pour une migration vers Firebase/Supabase avec architecture asynchrone factice.

const STORAGE_KEY = 'flow_os_db';

const initialData = {
  settings: {
    studioName: 'FLOW_OS STUDIOS',
    currency: '€',
    monthlyResetDate: null
  },
  clients: [
    { id: 'C1', name: 'CyberCorp', currency: '€', email: 'contact@cybercorp.com', pin: '1111', role: 'client' }
  ],
  team: [
    { id: 'T1', name: 'Monteur Alpha', email: 'alpha@flowos.com', pin: '0000', role: 'editor', totalEarned: 0 },
    { id: 'TAdmin', name: 'Director', email: 'director@flowos.com', pin: '4444', role: 'admin', totalEarned: 0 }
  ],
  projects: [
    { 
      id: 'P1', 
      title: 'Promo Cyberpunk 2077', 
      clientId: 'C1', 
      assigneeId: 'T1', 
      price: 1500, // Prix client TTC
      currency: '€',
      priority: 'URGENCE', 
      payment_status: 'EN ATTENTE', 
      link_rushes: 'http://gdrive.link/rush', 
      link_review: 'http://review.link/1',
      platform_fee_pct: 2,
      subtasks: [
        { id: 't1', title: 'Dérushage', done: true },
        { id: 't2', title: 'Montage Cut', done: false },
        { id: 't3', title: 'Color Grading', done: false }
      ],
      timeLogs: [] // Sessions de chronomètre : { isRunning, start, end, duration }
    }
  ],
  archives: [],
  crmLeads: [
    { id: 'L1', title: 'Clip Neon Nights', source: 'Instagram', stage: 'contact', value: 800, nextAction: 'Rappel mardi', notes: '' }
  ],
  chatMessages: []
};

// --- DAL (Data Access Layer) ---

export const getDB = async () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  const parsed = JSON.parse(data);
  return { ...initialData, ...parsed };
};

export const saveDB = async (db) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  // Notifier les listeners si on veut du multi-onglets
  window.dispatchEvent(new Event('flow-db-update'));
};

// --- Fonctionnalités Métier ---

export const computeNetNet = (price, feePct, isTeamCalculation = false) => {
  // Calcul du prix net : Prix - Frais Plateforme
  const netPlatform = price - (price * (feePct / 100));
  
  if (isTeamCalculation) {
    // La remarque utilisateur stipule : Team : rentabilité calcule sans TVA 20%
    const netWithoutVat = netPlatform / 1.20;
    return netWithoutVat;
  }
  
  return netPlatform;
};

export const formatAmount = (amount, currency = 'EUR') => {
  const safeCurrency = currency === '€' ? 'EUR' : currency === '$' ? 'USD' : currency;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: safeCurrency }).format(amount || 0);
};

export const exportBackup = async () => {
  const db = await getDB();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `flow_os_backup_${new Date().toISOString().split('T')[0]}.json`);
  dlAnchorElem.click();
};

export const importBackup = async (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (data && data.settings && data.projects) {
      await saveDB(data);
      return true;
    }
    return false;
  } catch(e) {
    console.error("Format invalide", e);
    return false;
  }
};

// Utilitaires de simulation de requêtes
export const api = {
  getProjects: async () => (await getDB()).projects || [],
  saveProject: async (project) => {
    const db = await getDB();
    if (!db.projects) db.projects = [];
    const idx = db.projects.findIndex(p => p.id === project.id);
    if(idx >= 0) db.projects[idx] = project;
    else db.projects.push(project);
    await saveDB(db);
  },
  deleteProject: async (id) => {
    const db = await getDB();
    if (!db.projects) db.projects = [];
    db.projects = db.projects.filter(p => p.id !== id);
    await saveDB(db);
  },
  archiveProject: async (project) => {
    const db = await getDB();
    if (!db.projects) db.projects = [];
    if (!db.archives) db.archives = [];
    db.projects = db.projects.filter(p => p.id !== project.id);
    db.archives.push({...project, archivedAt: new Date().toISOString()});
    // On peut appliquer les gains au team member ici aussi
    if(project.payment_status === 'PAYÉ') {
       if (!db.team) db.team = [];
       const userIdx = db.team.findIndex(t => t.id === project.assigneeId);
       if(userIdx >= 0) {
         // Ajout aux gains, sans la TVA
         db.team[userIdx].totalEarned = (db.team[userIdx].totalEarned || 0) + computeNetNet(project.price, project.platform_fee_pct, true);
       }
    }
    await saveDB(db);
  },
  
  // CRM, Team, Clients, Settings : Helpers génériques...
  getClients: async () => (await getDB()).clients || [],
  getTeam: async () => (await getDB()).team || [],
  getArchives: async () => (await getDB()).archives || [],
  getCRMLeads: async () => (await getDB()).crmLeads || [],
  getSettings: async () => (await getDB()).settings || {},
  updateCRMLead: async (lead) => {
     const db = await getDB();
     const idx = db.crmLeads.findIndex(l => l.id === lead.id);
     if(idx >= 0) db.crmLeads[idx] = lead;
     else db.crmLeads.push(lead);
     await saveDB(db);
  },
  updateTeam: async (member) => {
     const db = await getDB();
     const idx = db.team.findIndex(t => t.id === member.id);
     if(idx >= 0) db.team[idx] = member;
     else db.team.push(member);
     await saveDB(db);
  },
  addClient: async (client) => {
     const db = await getDB();
     if(!db.clients) db.clients = [];
     const idx = db.clients.findIndex(c => c.id === client.id);
     if(idx >= 0) db.clients[idx] = client;
     else db.clients.push(client);
     await saveDB(db);
  },
  deleteCRMLead: async (id) => {
     const db = await getDB();
     if (!db.crmLeads) db.crmLeads = [];
     db.crmLeads = db.crmLeads.filter(l => l.id !== id);
     await saveDB(db);
  },
  deleteTeamMember: async (id) => {
     const db = await getDB();
     if (!db.team) db.team = [];
     db.team = db.team.filter(t => t.id !== id);
     await saveDB(db);
  },
  deleteClient: async (id) => {
     const db = await getDB();
     if (!db.clients) db.clients = [];
     db.clients = db.clients.filter(c => c.id !== id);
     await saveDB(db);
  },
  updateSettings: async (settings) => {
     const db = await getDB();
     db.settings = { ...db.settings, ...settings };
     await saveDB(db);
  },
  getMessages: async () => {
     const db = await getDB();
     return db.chatMessages || [];
  },
  sendMessage: async (message) => {
     const db = await getDB();
     if (!db.chatMessages) db.chatMessages = [];
     db.chatMessages.push(message);
     // Garder les 200 derniers messages max
     if (db.chatMessages.length > 200) db.chatMessages = db.chatMessages.slice(-200);
     await saveDB(db);
  }
};
