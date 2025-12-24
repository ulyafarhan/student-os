import Dexie, { type Table } from 'dexie';

export interface Course {
  id?: number;
  name: string;
  day: string;
  time: string;
  room: string;
  lecturer: string;
  semester: number;
  gradeWeight?: string; 
  contactInfo?: string; 
}

export interface Exam {
  id?: number;
  courseId: number;
  courseName: string;
  date: string;
  type: 'UTS' | 'UAS' | 'KUIS';
}

class AcademicDB extends Dexie {
  courses!: Table<Course>;
  exams!: Table<Exam>;

  constructor() {
    super('studentos_academic');
    this.version(2).stores({
      courses: '++id, name, day, semester',
      exams: '++id, courseId, date, type'
    });
  }
}

const db = new AcademicDB();

export const academicService = {
  async getSchedule(semester: number) {
    if (!semester) return [];
    return await db.courses.where('semester').equals(Number(semester)).toArray();
  },

  async saveCourses(courses: Course[]) {
    return await db.courses.bulkAdd(courses);
  },

  async clearSchedule(semester: number) {
    return await db.courses.where('semester').equals(Number(semester)).delete();
  },

  async getUpcomingExams() {
    try {
      const now = new Date().toISOString();
      return await db.exams.where('date').above(now).sortBy('date');
    } catch (e) {
      console.warn("Belum ada data ujian");
      return [];
    }
  },

  async addExam(exam: Exam) {
    return await db.exams.add(exam);
  },

  async addSingleCourse(course: Course) {
    return await db.courses.add(course);
  },

  async updateCourse(id: number, data: Partial<Course>) {
    return await db.courses.update(id, data);
  },
  async getCourseById(id: number) {
    return await db.courses.get(Number(id));
  },
  async deleteCourse(id: number) {
    return await db.courses.delete(id);
  },
  async updateCourseDetails(id: number, data: Partial<Course>) {
    return await db.courses.update(id, data);
  }
};