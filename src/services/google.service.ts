import { useUserStore } from '@/lib/store';

const GOOGLE_DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest",
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
];
const GOOGLE_SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar.events";

export const googleService = {
  // 1. Inisialisasi Google API Client
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

  // 2. Sinkronisasi Transaksi ke Google Sheets
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

      const response = await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: "USER_ENTERED",
        resource: { values: values },
      });

      return response;
    } catch (error) {
      console.error("GSheets Sync Error:", error);
      throw error;
    }
  },

  // 3. Sinkronisasi Jadwal ke Google Calendar
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

      const request = window.gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': event,
      });

      return await request;
    } catch (error) {
      console.error("GCalendar Sync Error:", error);
      throw error;
    }
  },

  // Helper untuk menentukan ISO String waktu kuliah
  getDateTime(dayName: string, timeStr: string) {
    const days: any = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 0 };
    const targetDay = days[dayName];
    const now = new Date();
    const resultDate = new Date(now.getTime());
    resultDate.setDate(now.getDate() + (targetDay + 7 - now.getDay()) % 7);
    const [hours, minutes] = timeStr.trim().split(':');
    resultDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return resultDate.toISOString();
  }
};