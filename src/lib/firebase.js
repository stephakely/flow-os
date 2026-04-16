// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration Firebase de FLOW_OS
const firebaseConfig = {
  apiKey: "AIzaSyAmnuIwb7ijINTl8gEm03Xjq03P-cui0ks",
  authDomain: "flow-os-71e38.firebaseapp.com",
  projectId: "flow-os-71e38",
  storageBucket: "flow-os-71e38.firebasestorage.app",
  messagingSenderId: "457689762033",
  appId: "1:457689762033:web:2abca42ee5e9b607580150",
  measurementId: "G-5YX6M3VNDT"
};

let app, auth, db, googleProvider, analytics;

try {
  if(firebaseConfig.apiKey && firebaseConfig.apiKey !== "REPLACE_ME_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // On supporte le nom de base de donnée custom (ex: flowos200220) si fourni, sinon (default)
    const dbName = import.meta.env?.VITE_FIREBASE_DB_NAME || "(default)";
    db = getFirestore(app, dbName);
    googleProvider = new GoogleAuthProvider();
    console.log(`🚀 Firebase initialized [Project: ${firebaseConfig.projectId}] [DB: ${dbName}]`);
  }
} catch (e) {
  console.error("❌ Configuration Firebase critique:", e);
}

// Fonction de secours (mock) si Firebase n'est pas encore configuré (ex. pour te laisser tester l'UI en attendant !)
const mockSignInGoogle = async () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                user: { email: 'mock_user@flowos.com', displayName: 'Mock User' }
            });
        }, 1000);
    });
};

const mockSignInEmail = async (email, password) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve({ user: { email } }), 800);
    });
};

export const loginWithGoogle = async () => {
  if (!auth) {
     console.warn("Firebase n'est pas configuré. Utilisation du Mock.");
     return mockSignInGoogle();
  }
  return signInWithPopup(auth, googleProvider);
};

export const loginWithEmail = async (email, password) => {
  if (!auth) {
     console.warn("Firebase n'est pas configuré. Utilisation du Mock.");
     return mockSignInEmail(email, password);
  }
  return signInWithEmailAndPassword(auth, email, password);
};

export { auth, db };
