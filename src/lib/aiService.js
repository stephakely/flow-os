import Anthropic from '@anthropic-ai/sdk';
import { api } from "./apiService";

const getApiKey = () => localStorage.getItem('ANTHROPIC_API_KEY') || import.meta.env.VITE_ANTHROPIC_API_KEY;

export const aiAssistant = {
  async generateResponse(prompt, history = []) {
    const apiKey = getApiKey();
    if (!apiKey) {
      return "Erreur : Clé API Claude manquante. Veuillez configurer votre clé dans l'outil d'IA.";
    }

    try {
      const anthropic = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      // Récupérer le contexte du studio pour "nourrir" l'IA
      const studioData = await api.getDB();
      const systemPrompt = `
        Tu es l'assistant IA de FLOW_OS, un ERP cyberpunk pour studios de production vidéo.
        Voici les données actuelles du studio pour t'aider à répondre :
        - Projets en cours: ${studioData.projects?.length || 0}
        - Équipe: ${studioData.team?.map(t => t.name).join(', ') || 'Personne'}
        - Leads CRM: ${studioData.crmLeads?.length || 0}
        Réponds de manière concise, professionnelle et avec une touche cyberpunk si approprié.
        Si l'utilisateur demande du code, utilise des blocs de code Markdown.
      `;

      // Convertir l'historique Gemini vers format Anthropic (role: 'user' ou 'assistant')
      const formattedHistory = history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.parts ? msg.parts[0].text : msg.content
      }));

      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...formattedHistory,
          { role: 'user', content: prompt }
        ]
      });

      return msg.content[0].text;
    } catch (error) {
      console.error("Claude Error:", error);
      return "Désolé, j'ai rencontré une erreur technique en traitant votre demande. Vérifiez votre clé API Claude.";
    }
  }
};
