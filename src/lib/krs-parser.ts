import Tesseract from 'tesseract.js';

export const parseKRS = async (imageSrc: string) => {
  const worker = await Tesseract.createWorker('ind');
  
  const { data: { text } } = await worker.recognize(imageSrc);
  await worker.terminate();

  const lines = text.split('\n');
  const extractedCourses: any[] = [];

  const schedulePattern = /(.*)\s+(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu)\s+(\d{2}[:.]\d{2}.*\d{2}[:.]\d{2})/i;

  lines.forEach(line => {
    const match = line.match(schedulePattern);
    if (match) {
      extractedCourses.push({
        name: match[1].trim(),
        day: match[2].trim(),
        time: match[3].trim().replace('.', ':'),
        room: 'TBA',
        lecturer: 'TBA'
      });
    }
  });

  return extractedCourses;
};