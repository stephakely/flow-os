// src/lib/apiService.js
// Cerveau de FLOW_OS - Migration Firestore pour collaboration temps réel.
import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  onSnapshot,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";

// --- Configuration Initiale (Seeding) ---

const initialData = {
  settings: {
    studioName: 'FLOW_OS STUDIOS',
    currency: 'EUR',
    monthlyResetDate: null
  },
  clients: [
    { id: 'C1', name: 'CyberCorp', currency: 'EUR', email: 'contact@cybercorp.com', pin: '1111', role: 'client' }
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
      price: 1500,
      currency: 'EUR',
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
      timeLogs: []
    }
  ],
  archives: [],
  crmLeads: [
    { id: 'L1', title: 'Clip Neon Nights', source: 'Instagram', stage: 'contact', value: 800, nextAction: 'Rappel mardi', notes: '' }
  ],
  chatMessages: []
};

// --- DAL (Data Access Layer) Firestore ---

const getCollection = async (collName) => {
  if (!db) return [];
  try {
    const snapshot = await getDocs(collection(db, collName));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Seeding automatique si la liste d'équipe est vide
    if (collName === 'team' && data.length === 0) {
        console.log("Seeding initial data to Firestore...");
        for (const member of initialData.team) {
            const { id, ...rest } = member;
            await setDoc(doc(db, 'team', id), rest);
        }
        return initialData.team;
    }
    return data;
  } catch (e) {
    console.error(`Erreur lors de la lecture de la collection ${collName}:`, e);
    return [];
  }
};

export const getDB = async () => {
    // getDB est maintenu pour la compatibilité avec l'initialisation App.jsx
    const projects = await getCollection('projects');
    const team = await getCollection('team');
    const clients = await getCollection('clients');
    const archives = await getCollection('archives');
    const crmLeads = await getCollection('crmLeads');
    
    let settings = initialData.settings;
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'main'));
        if (settingsDoc.exists()) settings = settingsDoc.data();
    } catch (e) {}
    
    return { projects, team, clients, archives, crmLeads, settings };
};

// --- Logiques Métier ---

export const computeNetNet = (price, feePct, isTeamCalculation = false) => {
  const netPlatform = price - (price * (feePct / 100));
  if (isTeamCalculation) {
    const netWithoutVat = netPlatform / 1.20;
    return netWithoutVat;
  }
  return netPlatform;
};

export const formatAmount = (amount, currency = 'EUR') => {
  const safeCurrency = currency === '€' ? 'EUR' : currency === '$' ? 'USD' : currency;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: safeCurrency }).format(amount || 0);
};

// --- API Service Firestore ---

export const api = {
  getProjects: async () => await getCollection('projects'),
  
  saveProject: async (project) => {
    const { id, ...data } = project;
    await setDoc(doc(db, 'projects', id), data);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  deleteProject: async (id) => {
    await deleteDoc(doc(db, 'projects', id));
    window.dispatchEvent(new Event('flow-db-update'));
  },

  archiveProject: async (project) => {
    const { id, ...data } = project;
    await deleteDoc(doc(db, 'projects', id));
    await setDoc(doc(db, 'archives', id), {
        ...data,
        archivedAt: new Date().toISOString()
    });
    
    if (project.payment_status === 'PAYÉ') {
        const teamDoc = await getDoc(doc(db, 'team', project.assigneeId));
        if (teamDoc.exists()) {
            const currentEarned = teamDoc.data().totalEarned || 0;
            const gain = computeNetNet(project.price, project.platform_fee_pct, true);
            await updateDoc(doc(db, 'team', project.assigneeId), {
                totalEarned: currentEarned + gain
            });
        }
    }
    window.dispatchEvent(new Event('flow-db-update'));
  },

  getClients: async () => await getCollection('clients'),
  getTeam: async () => await getCollection('team'),
  getArchives: async () => await getCollection('archives'),
  getCRMLeads: async () => await getCollection('crmLeads'),
  
  getSettings: async () => {
    const sDoc = await getDoc(doc(db, 'settings', 'main'));
    return sDoc.exists() ? sDoc.data() : initialData.settings;
  },

  updateCRMLead: async (lead) => {
    const { id, ...data } = lead;
    if (data.email) data.email = data.email.trim().toLowerCase();
    await setDoc(doc(db, 'crmLeads', id), data);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  updateTeam: async (member) => {
    const { id, ...data } = member;
    if (data.email) data.email = data.email.trim().toLowerCase();
    await setDoc(doc(db, 'team', id), data);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  addClient: async (client) => {
    const { id, ...data } = client;
    if (data.email) data.email = data.email.trim().toLowerCase();
    await setDoc(doc(db, 'clients', id), data);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  deleteCRMLead: async (id) => {
    await deleteDoc(doc(db, 'crmLeads', id));
    window.dispatchEvent(new Event('flow-db-update'));
  },

  deleteTeamMember: async (id) => {
    await deleteDoc(doc(db, 'team', id));
    window.dispatchEvent(new Event('flow-db-update'));
  },

  deleteClient: async (id) => {
    await deleteDoc(doc(db, 'clients', id));
    window.dispatchEvent(new Event('flow-db-update'));
  },

  updateSettings: async (settings) => {
    await setDoc(doc(db, 'settings', 'main'), settings);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  getMessages: async () => await getCollection('chatMessages'),
  
  subscribeMessages: (callback) => {
    const q = query(collection(db, 'chatMessages'), orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(msgs);
    });
  },
  
  sendMessage: async (message) => {
    await addDoc(collection(db, 'chatMessages'), {
        ...message,
        timestamp: new Date().toISOString()
    });
    window.dispatchEvent(new Event('flow-db-update'));
  }
};
