import { dbService } from '@/services/db.service';

export const smartCategorizer = {
  async predictCategory(title: string): Promise<string> {
    const history = await dbService.getTransactions();
    const lowTitle = title.toLowerCase();

    const match = history.find(t => 
      t.title.toLowerCase().includes(lowTitle) || 
      lowTitle.includes(t.title.toLowerCase())
    );

    if (match) return match.category;

    const rules: Record<string, string[]> = {
      'Makanan': ['makan', 'minum', 'kopi', 'nasi', 'resto', 'warung', 'cafe', 'bakso', 'snack'],
      'Transport': ['gojek', 'grab', 'maxim', 'bensin', 'parkir', 'tol', 'tiket', 'kereta'],
      'Pendidikan': ['buku', 'ukt', 'fotokopi', 'print', 'kursus', 'seminar', 'alat tulis'],
      'Hiburan': ['nonton', 'bioskop', 'game', 'topup', 'netflix', 'spotify'],
      'Tagihan': ['listrik', 'pulsa', 'kuota', 'wifi', 'kos', 'air']
    };

    for (const [category, keywords] of Object.entries(rules)) {
      if (keywords.some(key => lowTitle.includes(key))) {
        return category;
      }
    }

    return 'Umum';
  }
};