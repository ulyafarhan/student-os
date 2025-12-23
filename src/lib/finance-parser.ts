export interface ParsedTransaction {
  title: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  category: string;
}

const CATEGORY_MAP: Record<string, string[]> = {
  'Makanan': ['makan', 'minum', 'kopi', 'nasi', 'bakso', 'ayam', 'jajan', 'snack'],
  'Transport': ['ojek', 'grab', 'gojek', 'bensin', 'parkir', 'bus', 'kereta', 'mrt'],
  'Pendidikan': ['buku', 'ukt', 'print', 'fotokopi', 'kursus', 'seminar'],
  'Hiburan': ['nonton', 'game', 'netflix', 'spotify', 'jalan'],
  'Lainnya': []
};

const INCOME_KEYWORDS = ['gaji', 'dikasih', 'transfer', 'masuk', 'bonus', 'untung', 'pemasukan'];

export const parseFinanceInput = (input: string): ParsedTransaction => {
  const lowInput = input.toLowerCase();
  let amount = 0;
  const numMatch = lowInput.match(/(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/);
  
  if (numMatch) {
    const value = parseFloat(numMatch[1].replace(',', '.'));
    const unit = numMatch[2];
    
    if (unit === 'k' || unit === 'rb' || unit === 'ribu') amount = value * 1000;
    else if (unit === 'jt' || unit === 'juta') amount = value * 1000000;
    else amount = value;
  }

  const type = INCOME_KEYWORDS.some(key => lowInput.includes(key)) ? 'INCOME' : 'EXPENSE';

  let category = 'Umum';
  for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(key => lowInput.includes(key))) {
      category = cat;
      break;
    }
  }

  const title = input.replace(numMatch ? numMatch[0] : '', '').trim() || (type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran');

  return { title, amount, type, category };
};

export const extractAmountFromText = (text: string): number | null => {
  const currencyRegex = /(?:Rp\.?|IDR)\s?([\d.,]+)|(?:\s|^)([\d]{1,3}(?:[.,]\d{3})+|[\d]{4,})(?:\s|$)/gi;
  const matches = [...text.matchAll(currencyRegex)];
  
  if (matches.length > 0) {
    const rawAmount = matches[matches.length - 1][1] || matches[matches.length - 1][2];
    return parseInt(rawAmount.replace(/[.,]/g, ''), 10);
  }
  return null;
};