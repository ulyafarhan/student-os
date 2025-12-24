import { aiHybridService } from './ai-hybrid.service';

const AI_LAYERS = [
  { id: 'GEMINI', priority: 1, name: 'Google Gemini Pro' },
  { id: 'OPENROUTER', priority: 2, name: 'OpenRouter (Claude/GPT)' },
  { id: 'GROQ', priority: 3, name: 'Groq (Llama 3 High Speed)' },
  { id: 'ALIBABA', priority: 4, name: 'Alibaba Qwen Cloud' },
  { id: 'OFFLINE', priority: 5, name: 'Local Hybrid Mode' }
];

export const aiFailoverService = {
  async processWithFailover(text: string, prompt: string): Promise<string> {
    let lastError = null;

    for (const layer of AI_LAYERS) {
      try {
        switch (layer.id) {
          case 'GEMINI':
            return await aiHybridService.analyzeText(text, prompt);
          
          case 'OPENROUTER':
            return await this.callExternalProvider(
              'https://openrouter.ai/api/v1/chat/completions',
              import.meta.env.VITE_OPENROUTER_KEY,
              'google/gemini-pro-1.5',
              text, 
              prompt
            );
          
          case 'GROQ':
            return await this.callExternalProvider(
              'https://api.groq.com/openai/v1/chat/completions',
              import.meta.env.VITE_GROQ_KEY,
              'llama3-70b-8192',
              text, 
              prompt
            );

          case 'ALIBABA':
            return await this.callExternalProvider(
              'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
              import.meta.env.VITE_ALIBABA_KEY,
              'qwen-plus',
              text,
              prompt
            );

          case 'OFFLINE':
            return aiHybridService.processOfflineAI(text, prompt);

          default:
            continue;
        }
      } catch (error) {
        console.warn(`Layer ${layer.id} gagal:`, error);
        lastError = error;
      }
    }

    throw new Error(`Seluruh sistem AI gagal merespons. Error terakhir: ${lastError}`);
  },

  async callExternalProvider(
    endpoint: string, 
    apiKey: string, 
    model: string, 
    text: string, 
    prompt: string
  ): Promise<string> {
    if (!apiKey) throw new Error("API Key tidak ditemukan");

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { 
            role: "system", 
            content: "Anda adalah asisten akademik cerdas StudentOS. Analisis teks berikut dengan akurat." 
          },
          { 
            role: "user", 
            content: `${prompt}\n\nKonteks Teks:\n${text}` 
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
};