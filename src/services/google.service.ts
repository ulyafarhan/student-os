import { useUserStore } from '@/lib/store';

const GOOGLE_DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest",
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
  "https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest",
  "https://www.googleapis.com/discovery/v1/apis/classroom/v1/rest"
];

const GOOGLE_SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/drive.readonly";

export const googleService = {
  async initClient() {
    return new Promise((resolve, reject) => {
      window.gapi.load('client:auth2', async () => {
        try {
          await window.gapi.client.init({
            apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            discoveryDocs: GOOGLE_DISCOVERY_DOCS,
            scope: GOOGLE_SCOPES,
          });
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });
    });
  },

  async listClassroomCourses() {
    try {
      const response = await window.gapi.client.classroom.courses.list({
        courseStates: 'ACTIVE'
      });
      return response.result.courses || [];
    } catch (error) {
      console.error("Failed to fetch Classroom courses:", error);
      throw error;
    }
  },

  async syncClassroomMaterials(courseId: string) {
    try {
      const workResponse = await window.gapi.client.classroom.courses.courseWork.list({
        courseId: courseId
      });
      
      const announcementResponse = await window.gapi.client.classroom.courses.announcements.list({
        courseId: courseId
      });

      return {
        work: workResponse.result.courseWork || [],
        announcements: announcementResponse.result.announcements || []
      };
    } catch (error) {
      console.error("Classroom Materials Sync Error:", error);
      throw error;
    }
  },

  async syncToSheets(transaction: any) {
    try {
      const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID;
      const range = "Sheet1!A1";
      const values = [
        [
          new Date(transaction.date).toLocaleString(),
          transaction.title,
          transaction.amount,
          transaction.type,
          transaction.category
        ]
      ];

      return await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: "USER_ENTERED",
        resource: { values: values },
      });
    } catch (error) {
      console.error("GSheets Sync Error:", error);
      throw error;
    }
  },

  async syncToCalendar(course: any) {
    try {
      const event = {
        'summary': course.name,
        'location': course.room,
        'description': `Mata Kuliah Semester ${course.semester}`,
        'start': {
          'dateTime': this.getDateTime(course.day, course.time.split('-')[0]),
          'timeZone': 'Asia/Jakarta',
        },
        'end': {
          'dateTime': this.getDateTime(course.day, course.time.split('-')[1]),
          'timeZone': 'Asia/Jakarta',
        },
        'recurrence': ['RRULE:FREQ=WEEKLY;COUNT=16'],
      };

      return await window.gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': event,
      });
    } catch (error) {
      console.error("GCalendar Sync Error:", error);
      throw error;
    }
  },

  getDateTime(dayName: string, timeStr: string) {
    const days: any = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 0 };
    const targetDay = days[dayName];
    const now = new Date();
    const resultDate = new Date(now.getTime());
    resultDate.setDate(now.getDate() + (targetDay + 7 - now.getDay()) % 7);
    const [hours, minutes] = timeStr.trim().split(':');
    resultDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return resultDate.toISOString();
  },

  async createCourseTask(course: any) {
    try {
      const task = {
        title: `Kuliah: ${course.name}`,
        notes: `Ruang: ${course.room} | Dosen: ${course.lecturer || 'TBA'} | Waktu: ${course.day}, ${course.time}`,
        status: 'needsAction'
      };

      return await window.gapi.client.tasks.tasks.insert({
        tasklist: '@default',
        resource: task
      });
    } catch (error) {
      console.error("Google Tasks Sync Error:", error);
      throw error;
    }
  },

  async syncClassroomMaterials(courseId: string) {
    try {
      const response = await window.gapi.client.classroom.courses.courseWork.list({
        courseId: courseId
      });
      return response.result.courseWork;
    } catch (error) {
      console.error("Classroom Sync Error:", error);
      throw error;
    }
  },

  async downloadDriveFile(fileId: string): Promise<Blob> {
    try {
      const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });
      
      return new Blob([response.body], { type: response.headers['Content-Type'] });
    } catch (error) {
      console.error("GDrive Download Error:", error);
      throw error;
    }
  }
};