// src/lib/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { api } from "./apiService";

// Note: Dans un environnement de production, la clé API ne devrait pas être exposée côté client.
// Pour FLOW_OS, on permet à l'utilisateur de la configurer ou d'utiliser une variable d'env.
const getApiKey = () => localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;

export const geminiAssistant = {
  async generateResponse(prompt, history = []) {
    const apiKey = getApiKey();
    if (!apiKey) {
      return "Erreur : Clé API Gemini manquante. Veuillez configurer votre clé dans les paramètres ou via VITE_GEMINI_API_KEY.";
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Récupérer le contexte du studio pour "nourrir" l'IA
      const studioData = await api.getDB();
      const contextPrompt = `
        Tu es l'assistant IA de FLOW_OS, un ERP cyberpunk pour studios de production vidéo.
        Voici les données actuelles du studio pour t'aider à répondre :
        - Projets en cours: ${studioData.projects.length} (${studioData.projects.map(p => p.title).join(', ')})
        - Équipe: ${studioData.team.map(t => t.name).join(', ')}
        - Leads CRM: ${studioData.crmLeads.length}
        Réponds de manière concise, professionnelle et avec une touche cyberpunk si approprié.
        Si l'utilisateur demande du code, utilise des blocs de code Markdown.
      `;

      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: contextPrompt }] },
          { role: "model", parts: [{ text: "Compris. Je suis prêt à vous assister dans la gestion de FLOW_OS." }] },
          ...history
        ],
      });

      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Désolé, j'ai rencontré une erreur technique en traitant votre demande. Vérifiez votre connexion et votre clé API.";
    }
  }
};
