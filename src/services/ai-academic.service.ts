export interface Flashcard {
  question: string;
  answer: string;
}

export const aiAcademicService = {
  generateCitation(text: string, format: 'APA' | 'MLA' = 'APA'): string {
    const lines = text.split('\n');
    const title = lines[0] || 'Judul Tidak Diketahui';
    const author = lines[1] || 'Penulis Tidak Diketahui';
    const year = text.match(/\b(19|20)\d{2}\b/)?.[0] || 'n.d.';

    if (format === 'APA') {
      return `${author}. (${year}). ${title}. StudentOS Vault.`;
    }
    return `${author}. "${title}." StudentOS Vault, ${year}.`;
  },

  generateFlashcards(text: string): Flashcard[] {
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 5).map(s => {
      const words = s.trim().split(' ');
      const middle = Math.floor(words.length / 2);
      return {
        question: words.slice(0, middle).join(' ') + ' ...?',
        answer: words.slice(middle).join(' ')
      };
    });
  }
};