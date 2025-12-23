import { useUserStore } from '@/lib/store';

export const aiHybridService = {
  async analyzeText(text: string, prompt: string) {
    const isOnline = navigator.onLine;

    if (isOnline) {
      return await this.fetchOnlineAI(text, prompt);
    } else {
      return this.processOfflineAI(text, prompt);
    }
  },

  async fetchOnlineAI(text: string, prompt: string) {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${prompt}\n\nKontek teks:\n${text}` }] }]
        })
      });
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      return this.processOfflineAI(text, prompt); // Fallback ke offline jika API gagal
    }
  },

  processOfflineAI(text: string, prompt: string) {
    // Logika NLP sederhana berbasis regex/rule untuk mode offline
    if (prompt.toLowerCase().includes('ringkas')) {
      return text.substring(0, 300) + "... (Ringkasan offline terbatas)";
    }
    return "Analisis kompleks memerlukan koneksi internet untuk mengakses Multi-Engine AI.";
  }
};