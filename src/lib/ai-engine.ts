import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

class AIEngine {
  static instance: AIEngine;
  private classifier: any = null;

  private constructor() {}

  public static getInstance(): AIEngine {
    if (!AIEngine.instance) {
      AIEngine.instance = new AIEngine();
    }
    return AIEngine.instance;
  }

  public async initFinanceModel() {
    if (!this.classifier) {
      console.log("Loading AI Model via WebGPU...");
      this.classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli', {
        device: 'webgpu', 
      });
    }
  }

  public async categorizeTransaction(text: string): Promise<string> {
    await this.initFinanceModel();
    const categories = ['Food', 'Transport', 'Tuition', 'Entertainment', 'Books'];
    
    try {
      const output = await this.classifier(text, categories);
      return output.labels[0]; 
    } catch (e) {
      console.error("AI Inference Failed, fallback to default", e);
      return 'Uncategorized';
    }
  }
}

export const aiEngine = AIEngine.getInstance();