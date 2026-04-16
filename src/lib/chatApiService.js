// src/lib/chatApiService.js
import { api } from './apiService';
import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  addDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db } from "./firebase";

export const chatApi = {
  // Supprimer un message
  deleteMessage: async (messageId) => {
    if (db) {
      try {
        await deleteDoc(doc(db, 'chatMessages', messageId));
      } catch (e) {
        console.warn("Firestore delete failed, ignoring for local session:", e);
      }
    }
    // Note: Le local cache sera mis à jour via le snapshot
    window.dispatchEvent(new Event('flow-db-update'));
  },

  // Ajouter/Retirer une réaction
  toggleReaction: async (messageId, emoji, userId) => {
    if (!db) return;
    const msgRef = doc(db, 'chatMessages', messageId);
    
    try {
      // Pour simplifier on stocke les réactions comme un objet { emoji: [userIds] }
      // Mais pour Firestore direct on peut simplement mettre à jour le champ reactions
      // On va d'abord lire le message (ou passer l'ancien état)
      // Implementation robuste :
      const snap = await getDocs(query(collection(db, 'chatMessages'))); // On pourrait faire un getDoc direct
      const msgDoc = snap.docs.find(d => d.id === messageId);
      
      if (msgDoc) {
        let reactions = msgDoc.data().reactions || {};
        if (!reactions[emoji]) reactions[emoji] = [];
        
        if (reactions[emoji].includes(userId)) {
          reactions[emoji] = reactions[emoji].filter(id => id !== userId);
        } else {
          reactions[emoji].push(userId);
        }
        
        // Nettoyer les emojis vides
        if (reactions[emoji].length === 0) delete reactions[emoji];
        
        await updateDoc(msgRef, { reactions });
      }
    } catch (e) {
      console.error("Reaction toggle failed:", e);
    }
  },

  // Répondre à un message
  replyToMessage: async (replyData) => {
    // replyData: { text, senderId, senderName, replyTo: { id, text, senderName }, timestamp }
    return api.sendMessage(replyData);
  }
};
