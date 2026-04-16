// src/lib/apiService.js
// FLOW_OS - DAL Hybride : Firestore (online) + localStorage (fallback)
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  addDoc
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Données vides (aucune donnée démo) ────────────────────────────────────────
const initialData = {
  settings: {
    studioName: 'MON STUDIO',
    currency: 'EUR',
    monthlyResetDate: null,
    defaultPlatformFee: 2,
    invoicePrefix: 'FAC',
    quotePrefix: 'DEV',
    studioAddress: '',
    studioPhone: '',
    studioEmail: '',
    studioSiret: '',
    studioLogo: ''
  },
  clients: [],
  team: [],
  projects: [],
  archives: [],
  crmLeads: [],
  chatMessages: [],
  expenses: [],
  quotes: [],
  deliveries: [],
  notifications: []
};

// ─── LocalStorage Fallback ────────────────────────────────────────────────────
const LS_KEY = 'flow_os_db_v2';

const getLocalDB = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* */ }
  // Premier boot : seed les données
  localStorage.setItem(LS_KEY, JSON.stringify(initialData));
  return JSON.parse(JSON.stringify(initialData));
};

const saveLocalDB = (db) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(db));
  } catch (e) { console.error('LocalStorage save error:', e); }
};

const getLocalCollection = (name) => {
  const db = getLocalDB();
  return db[name] || [];
};

const saveLocalItem = (colName, id, data) => {
  const db = getLocalDB();
  if (!db[colName]) db[colName] = [];
  const idx = db[colName].findIndex(i => i.id === id);
  if (idx >= 0) db[colName][idx] = { id, ...data };
  else db[colName].push({ id, ...data });
  saveLocalDB(db);
};

const deleteLocalItem = (colName, id) => {
  const db = getLocalDB();
  if (!db[colName]) return;
  db[colName] = db[colName].filter(i => i.id !== id);
  saveLocalDB(db);
};

// ─── Firestore helpers ────────────────────────────────────────────────────────
const isFirestoreAvailable = () => !!db;

const firestoreGet = async (colName) => {
  const snap = await getDocs(collection(db, colName));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

const firestoreSet = async (colName, id, data) => {
  await setDoc(doc(db, colName, id), data);
};

const firestoreDelete = async (colName, id) => {
  await deleteDoc(doc(db, colName, id));
};

// ─── Unified Collection Access (Firestore + LS fallback) ─────────────────────
export const getCollection = async (colName) => {
  if (!isFirestoreAvailable()) {
    console.info(`[DAL] Using LocalStorage for ${colName} (Firestore inactive)`);
    return getLocalCollection(colName);
  }
  
  try {
    // Timeout augmenté à 10s pour éviter les faux négatifs sur "cold starts"
    const data = await Promise.race([
      firestoreGet(colName),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
    ]);
    
    console.info(`[DAL] Firestore synced: ${colName} (${data.length} items)`);
    
    // Sync vers LS pour offline
    const lsdb = getLocalDB();
    lsdb[colName] = data;
    saveLocalDB(lsdb);
    return data;
  } catch (e) {
    console.warn(`[DAL] Firestore [${colName}] fallback to LS:`, e.message);
    return getLocalCollection(colName);
  }
};

const setItem = async (colName, id, data) => {
  // Toujours sauvegarder en local d'abord
  saveLocalItem(colName, id, data);
  // Puis syncer Firestore si dispo
  if (isFirestoreAvailable()) {
    firestoreSet(colName, id, data).catch(e =>
      console.warn(`Firestore write [${colName}/${id}] failed:`, e.message)
    );
  }
};

const deleteItem = async (colName, id) => {
  deleteLocalItem(colName, id);
  if (isFirestoreAvailable()) {
    firestoreDelete(colName, id).catch(e =>
      console.warn(`Firestore delete [${colName}/${id}] failed:`, e.message)
    );
  }
};

const forceSetCollection = async (colName, data) => {
  const lsdb = getLocalDB();
  lsdb[colName] = data;
  saveLocalDB(lsdb);
  if (isFirestoreAvailable()) {
    // Note: Pour une collection complète, on devrait normalement faire un batch ou écraser les items un par un
    // Ici on sync les items existants pour simplifier
    for (const item of data) {
       firestoreSet(colName, item.id, item).catch(() => {});
    }
  }
  window.dispatchEvent(new Event('flow-db-update'));
};

// ─── Logiques Métier ─────────────────────────────────────────────────────────
export const computeNetNet = (price, feePct = 2) => {
  return price - (price * (feePct / 100));
};

export const formatAmount = (amount, currency = 'EUR') => {
  const safe = currency === '€' ? 'EUR' : currency === '$' ? 'USD' : (currency || 'EUR');
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: safe }).format(amount || 0);
  } catch (e) {
    return `${amount || 0} ${safe}`;
  }
};

// ─── Subscriptions (temps réel ou polling) ────────────────────────────────────
const createSubscription = (colName, callback, orderByField = null) => {
  if (isFirestoreAvailable()) {
    try {
      const q = orderByField
        ? query(collection(db, colName), orderBy(orderByField, 'asc'))
        : collection(db, colName);
        
      return onSnapshot(q,
        (snap) => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const lsdb = getLocalDB();
          lsdb[colName] = data;
          saveLocalDB(lsdb);
          callback(data);
        },
        (err) => {
          console.error(`[DAL] Firestore onSnapshot Error [${colName}]:`, err.message);
          // Fallback silencieux vers LS
          callback(getLocalCollection(colName));
        }
      );
    } catch (e) {
      console.error(`[DAL] Subscription setup failed [${colName}]:`, e.message);
    }
  }
  
  // LS polling fallback (plus lent pour économiser CPU)
  callback(getLocalCollection(colName));
  const interval = setInterval(() => callback(getLocalCollection(colName)), 5000);
  return () => clearInterval(interval);
};

// ─── Export API ───────────────────────────────────────────────────────────────
export const getDB = async () => {
  try {
    const results = await Promise.all([
      getCollection('projects'),
      getCollection('team'),
      getCollection('clients'),
      getCollection('archives'),
      getCollection('crmLeads'),
    ]);

    const [projects, team, clients, archives, crmLeads] = results;

    let settings = initialData.settings;
    if (isFirestoreAvailable()) {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'main'));
        if (settingsDoc.exists()) {
          settings = settingsDoc.data();
        } else {
          console.info('[DAL] Settings missing in Firestore, initiating first seed...');
          await seedInitialData();
        }
      } catch (e) {
        console.warn('[DAL] Settings read error:', e.message);
        settings = getLocalDB().settings || initialData.settings;
      }
    } else {
      settings = getLocalDB().settings || initialData.settings;
    }

    return { projects, team, clients, archives, crmLeads, settings };
  } catch (e) {
    console.error('[DAL] Critical Boot Error:', e);
    const ls = getLocalDB();
    return { ...ls, settings: ls.settings || initialData.settings };
  }
};

const seedInitialData = async () => {
  if (!isFirestoreAvailable()) return;
  console.log('🌱 Seeding database sequence started...');
  try {
    await firestoreSet('settings', 'main', initialData.settings);
    for (const { id, ...rest } of initialData.team) await firestoreSet('team', id, rest);
    for (const { id, ...rest } of initialData.clients) await firestoreSet('clients', id, rest);
    for (const { id, ...rest } of initialData.projects) await firestoreSet('projects', id, rest);
    for (const { id, ...rest } of initialData.crmLeads) await firestoreSet('crmLeads', id, rest);
    console.log('Seed complete.');
  } catch (e) {
    console.warn('Seed error (rules may block):', e.message);
  }
};

export const saveDB = async () => {};

export const exportBackup = async () => {
  const dbData = getLocalDB();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbData, null, 2));
  const a = document.createElement('a');
  a.setAttribute("href", dataStr);
  a.setAttribute("download", `flow_os_backup_${Date.now()}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export const importBackup = async (jsonStr) => {
  try {
    const data = JSON.parse(jsonStr);
    saveLocalDB(data);
    if (isFirestoreAvailable()) {
      for (const [col, items] of Object.entries(data)) {
        if (Array.isArray(items)) {
          for (const { id, ...rest } of items) {
            if (id) firestoreSet(col, id, rest).catch(() => {});
          }
        }
      }
      if (data.settings) firestoreSet('settings', 'main', data.settings).catch(() => {});
    }
    return true;
  } catch (e) {
    console.error('Import error:', e);
    return false;
  }
};

export const api = {
  // ── Projects ──────────────────────────────────────────────────────────────
  getProjects: async () => getCollection('projects'),

  saveProject: async (project) => {
    const { id, ...data } = project;
    await setItem('projects', id, data);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  deleteProject: async (id) => {
    await deleteItem('projects', id);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  archiveProject: async (project) => {
    const { id, ...data } = project;
    await deleteItem('projects', id);
    await setItem('archives', id, { ...data, archivedAt: new Date().toISOString() });

    if (project.payment_status === 'PAYÉ') {
      const team = getLocalCollection('team');
      const member = team.find(t => t.id === project.assigneeId);
      if (member) {
        const gain = computeNetNet(project.price, project.platform_fee_pct);
        await setItem('team', member.id, { ...member, totalEarned: (member.totalEarned || 0) + gain });
      }
      if (isFirestoreAvailable()) {
        try {
          const teamDoc = await getDoc(doc(db, 'team', project.assigneeId));
          if (teamDoc.exists()) {
            const gain = computeNetNet(project.price, project.platform_fee_pct);
            await updateDoc(doc(db, 'team', project.assigneeId), {
              totalEarned: (teamDoc.data().totalEarned || 0) + gain
            });
          }
        } catch (e) { /* no-op */ }
      }
    }
    window.dispatchEvent(new Event('flow-db-update'));
  },

  archiveCompletedProjects: async () => {
    const projects = getLocalCollection('projects');
    let count = 0;
    for (const p of projects) {
      const allDone = p.subtasks?.length > 0 && p.subtasks.every(t => t.done);
      if (allDone && p.payment_status === 'PAYÉ') {
        await api.archiveProject(p);
        count++;
      }
    }
    return count;
  },

  performMonthlyReset: async () => {
    await api.archiveCompletedProjects();
    const team = getLocalCollection('team');
    for (const member of team) {
      if ((member.totalEarned || 0) > 0) {
        await setItem('team', member.id, { ...member, totalEarned: 0 });
      }
    }
    const currentMonth = new Date().toISOString().slice(0, 7);
    const settings = await api.getSettings();
    await api.updateSettings({ ...settings, monthlyResetDate: currentMonth });
  },

  subscribeProjects: (callback) => createSubscription('projects', callback),
  subscribeArchives: (callback) => createSubscription('archives', callback),

  // ── Clients ───────────────────────────────────────────────────────────────
  getClients: async () => getCollection('clients'),

  addClient: async (client) => {
    const { id, ...data } = client;
    if (data.email) data.email = data.email.trim().toLowerCase();
    await setItem('clients', id, data);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  deleteClient: async (id) => {
    await deleteItem('clients', id);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  subscribeClients: (callback) => createSubscription('clients', callback),

  // ── Team ───────────────────────────────────────────────────────────────────
  getTeam: async () => getCollection('team'),

  updateTeam: async (member) => {
    const { id, ...data } = member;
    if (data.email) data.email = data.email.trim().toLowerCase();
    await setItem('team', id, data);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  deleteTeamMember: async (id) => {
    await deleteItem('team', id);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  subscribeTeam: (callback) => createSubscription('team', callback),

  // ── CRM ────────────────────────────────────────────────────────────────────
  getCRMLeads: async () => getCollection('crmLeads'),

  updateCRMLead: async (lead) => {
    const { id, ...data } = lead;
    await setItem('crmLeads', id, data);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  deleteCRMLead: async (id) => {
    await deleteItem('crmLeads', id);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  subscribeCRMLeads: (callback) => createSubscription('crmLeads', callback),

  // ── Archives ───────────────────────────────────────────────────────────────
  getArchives: async () => getCollection('archives'),

  // ── Settings ───────────────────────────────────────────────────────────────
  getSettings: async () => {
    try {
      if (isFirestoreAvailable()) {
        const snap = await getDoc(doc(db, 'settings', 'main'));
        if (snap.exists()) return snap.data();
      }
    } catch (e) { /* no-op */ }
    return getLocalDB().settings || initialData.settings;
  },

  updateSettings: async (settings) => {
    const lsdb = getLocalDB();
    lsdb.settings = settings;
    saveLocalDB(lsdb);
    if (isFirestoreAvailable()) {
      firestoreSet('settings', 'main', settings).catch(() => {});
    }
    window.dispatchEvent(new Event('flow-db-update'));
  },

  // ── Chat ───────────────────────────────────────────────────────────────────
  getMessages: async () => {
    const msgs = getLocalCollection('chatMessages');
    return msgs.sort((a, b) => a.timestamp?.localeCompare(b.timestamp));
  },

  sendMessage: async (message) => {
    const msg = { ...message, timestamp: new Date().toISOString() };
    if (isFirestoreAvailable()) {
      try {
        await addDoc(collection(db, 'chatMessages'), msg);
      } catch (e) {
        // fallback local
        const id = `msg_${Date.now()}`;
        saveLocalItem('chatMessages', id, msg);
      }
    } else {
      const id = `msg_${Date.now()}`;
      saveLocalItem('chatMessages', id, msg);
    }
    window.dispatchEvent(new Event('flow-db-update'));
  },

  subscribeMessages: (callback) => createSubscription('chatMessages', callback, 'timestamp'),

  // ── Client Assets ──────────────────────────────────────────────────────────
  getClientAssets: async (clientId) => {
    const assets = await getCollection('clientAssets');
    return assets.filter(a => a.clientId === clientId);
  },

  addClientAsset: async (asset) => {
    const id = `asset_${Date.now()}`;
    await setItem('clientAssets', id, { ...asset, createdAt: new Date().toISOString() });
    window.dispatchEvent(new Event('flow-db-update'));
  },

  deleteClientAsset: async (id) => {
    await deleteItem('clientAssets', id);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  subscribeClientAssets: (clientId, callback) => {
    return createSubscription('clientAssets', (data) => {
      callback(data.filter(a => a.clientId === clientId));
    }, 'createdAt');
  },

  // ── Activity Logs ──────────────────────────────────────────────────────────
  logActivity: async (log) => {
    const id = `log_${Date.now()}`;
    await setItem('activityLogs', id, { ...log, timestamp: new Date().toISOString() });
    window.dispatchEvent(new Event('flow-db-update'));
  },

  subscribeActivityLogs: (clientId, callback) => {
    return createSubscription('activityLogs', (data) => {
      callback(data.filter(l => l.clientId === clientId).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
    }, 'timestamp');
  },

  // ── Project Versions ────────────────────────────────────────────────────────
  getProjectVersions: async (projectId) => {
    const versions = await getCollection('projectVersions');
    return versions.filter(v => v.projectId === projectId).sort((a,b) => b.versionNumer - a.versionNumer);
  },

  addProjectVersion: async (version) => {
    const id = `v_${Date.now()}`;
    await setItem('projectVersions', id, { ...version, createdAt: new Date().toISOString() });
    window.dispatchEvent(new Event('flow-db-update'));
    // Auto-log
    await api.logActivity({
      clientId: version.clientId,
      projectId: version.projectId,
      type: 'version',
      message: `Nouvelle version disponible : ${version.title}`
    });
  },

  subscribeProjectVersions: (projectId, callback) => {
    return createSubscription('projectVersions', (data) => {
      callback(data.filter(v => v.projectId === projectId));
    }, 'createdAt');
  },

  // ── Brand Kits & Resources ────────────────────────────────────────────────
  getBrandKit: async (clientId) => {
    const kits = await getCollection('brandKits');
    return kits.find(k => k.clientId === clientId) || { colors: [], fonts: [], logos: [] };
  },

  getSharedResources: async () => {
    return await getCollection('sharedResources');
  },

  updateBrandKit: async (kit) => {
    await setItem('brandKits', kit.clientId, kit);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  // ── Comments (Feedback) ──────────────────────────────────────────────────
  addVersionComment: async (versionId, comment) => {
    const versions = await getCollection('projectVersions');
    const vIdx = versions.findIndex(v => v.id === versionId);
    if (vIdx !== -1) {
      const v = versions[vIdx];
      const comments = v.comments || [];
      const newComment = { 
        ...comment, 
        id: `c_${Date.now()}`, 
        createdAt: new Date().toISOString(), 
        resolved: false,
        x: comment.x || null,
        y: comment.y || null
      };
      versions[vIdx] = { ...v, comments: [...comments, newComment] };
      await forceSetCollection('projectVersions', versions);
      
      // Log feed
      await api.logActivity({
        clientId: v.clientId,
        projectId: v.projectId,
        type: 'comment',
        message: `Nouveau commentaire sur ${v.title} à ${newComment.timecode || '00:00'}`
      });
    }
  },

  resolveComment: async (versionId, commentId) => {
    const versions = await getCollection('projectVersions');
    const vIdx = versions.findIndex(v => v.id === versionId);
    if (vIdx !== -1) {
      const v = versions[vIdx];
      const comments = v.comments.map(c => c.id === commentId ? { ...c, resolved: true } : c);
      versions[vIdx] = { ...v, comments };
      await forceSetCollection('projectVersions', versions);
    }
  },

  // ── FAQ ──────────────────────────────────────────────────────────────────
  getFAQ: async () => {
    return await getCollection('faq');
  },

  updateFAQ: async (item) => {
    await setItem('faq', item.id, item);
    window.dispatchEvent(new Event('flow-db-update'));
  },

  deleteFAQ: async (id) => {
    await deleteItem('faq', id);
    window.dispatchEvent(new Event('flow-db-update'));
  }
};
