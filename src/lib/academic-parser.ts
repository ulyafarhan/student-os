export interface ParsedSchedule {
  subject: string;
  day: string;
  time: string;
  room: string;
}

export interface ParsedExam {
  courseName: string;
  date: string;
  type: 'UTS' | 'UAS' | 'KUIS';
}

const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

export const extractScheduleFromText = (text: string): ParsedSchedule[] => {
  const lines = text.toLowerCase().split('\n');
  const schedules: ParsedSchedule[] = [];

  lines.forEach(line => {
    const dayMatch = DAYS.find(day => line.includes(day));
    const timeMatch = line.match(/(\d{2}[:.]\d{2})\s*[-–]\s*(\d{2}[:.]\d{2})/);
    
    if (dayMatch && timeMatch) {
      const subject = line
        .replace(dayMatch, '')
        .replace(timeMatch[0], '')
        .replace(/[^a-z\s]/g, '')
        .trim();

      if (subject.length > 3) {
        schedules.push({
          subject: subject.toUpperCase(),
          day: dayMatch.charAt(0).toUpperCase() + dayMatch.slice(1),
          time: timeMatch[0].replace('.', ':'),
          room: line.match(/r\.\d+|lab|aula/g)?.[0]?.toUpperCase() || 'TBA'
        });
      }
    }
  });

  return schedules;
};

export const extractExamsFromText = (text: string): ParsedExam[] => {
  const lines = text.toLowerCase().split('\n');
  const exams: ParsedExam[] = [];
  const dateRegex = /(\d{1,2})[\/\-\s](jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des|\d{1,2})[\/\-\s](\d{2,4})/gi;
  
  lines.forEach(line => {
    const typeMatch = line.match(/uts|uas|kuis|ujian|akhir semester|tengah semester/i);
    const dateMatch = line.match(dateRegex);

    if (typeMatch && dateMatch) {
      let type: 'UTS' | 'UAS' | 'KUIS' = 'UTS';
      if (line.includes('uas') || line.includes('akhir')) type = 'UAS';
      if (line.includes('kuis')) type = 'KUIS';

      const courseName = line
        .replace(dateMatch[0], '')
        .replace(typeMatch[0], '')
        .replace(/[^a-z\s]/gi, '')
        .trim()
        .toUpperCase();

      exams.push({
        courseName: courseName || "Ujian Tanpa Nama",
        date: dateMatch[0],
        type
      });
    }
  });

  return exams;
};