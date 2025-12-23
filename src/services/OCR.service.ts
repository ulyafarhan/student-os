import { createWorker } from 'tesseract.js';

export const ocrService = {
  async recognizeText(imageBlob: Blob): Promise<string> {
    const worker = await createWorker('ind+eng'); // Mendukung bahasa Indonesia dan Inggris
    const { data: { text } } = await worker.recognize(imageBlob);
    await worker.terminate();
    return text;
  }
};