import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import Dexie, { type Table } from 'dexie';
import { type NewTransaction } from '@/db/schema';

// --- BROWSER DB (DEXIE) ---
class StudentOSWebDB extends Dexie {
  transactions!: Table<any>;
  constructor() {
    super('studentos_web_db');
    this.version(1).stores({
      transactions: '++id, title, amount, type, category, date, synced'
    });
  }
}

const webDb = new StudentOSWebDB();

// --- DB SERVICE MANAGER ---
class DatabaseService {
  private static instance: DatabaseService;
  private sqlite: SQLiteConnection | null = null;
  private dbNative: SQLiteDBConnection | null = null;
  private isNative = Capacitor.isNativePlatform();
  private dbName = 'studentos_db';

  private constructor() {
    if (this.isNative) {
      this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async init() {
    if (!this.isNative) {
      console.log(">>> [Web] Using IndexedDB (Dexie)");
      return; // IndexedDB otomatis siap
    }

    try {
      const ret = await this.sqlite!.checkConnectionsConsistency();
      const isConn = (await this.sqlite!.isConnection(this.dbName, false)).result;

      if (ret.result && isConn) {
        this.dbNative = await this.sqlite!.retrieveConnection(this.dbName, false);
      } else {
        this.dbNative = await this.sqlite!.createConnection(this.dbName, false, 'no-encryption', 1, false);
      }

      await this.dbNative.open();

      const query = `
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          amount INTEGER NOT NULL,
          type TEXT NOT NULL,
          category TEXT DEFAULT 'Uncategorized',
          date TEXT NOT NULL,
          synced INTEGER DEFAULT 0
        );
      `;
      await this.dbNative.execute(query);
      console.log(">>> [Native] SQLite Ready");
    } catch (e) {
      console.error("Native DB Init Error", e);
    }
  }

  public async addTransaction(tx: NewTransaction) {
    if (this.isNative) {
      const query = `INSERT INTO transactions (title, amount, type, category, date, synced) VALUES (?, ?, ?, ?, ?, ?)`;
      await this.dbNative?.run(query, [tx.title, tx.amount, tx.type, tx.category, tx.date, 0]);
    } else {
      await webDb.transactions.add({ ...tx, synced: 0 });
    }
  }

  public async getTransactions() {
    if (this.isNative) {
      const res = await this.dbNative?.query("SELECT * FROM transactions ORDER BY date DESC");
      return res?.values || [];
    } else {
      return await webDb.transactions.orderBy('date').reverse().toArray();
    }
  }

  public async getBalance() {
    let txs = await this.getTransactions();
    let income = 0;
    let expense = 0;

    txs.forEach((tx: any) => {
      if (tx.type === 'INCOME') income += Number(tx.amount);
      if (tx.type === 'EXPENSE') expense += Number(tx.amount);
    });

    return { income, expense, total: income - expense };
  }

  public async updateSyncStatus(id: number, status: boolean) {
    if (this.isNative) {
      const query = `UPDATE transactions SET synced = ? WHERE id = ?`;
      await this.dbNative?.run(query, [status ? 1 : 0, id]);
    } else {
      // @ts-ignore - webDb didefinisikan di luar class
      await webDb.transactions.update(id, { synced: status ? 1 : 0 });
    }
  }
}

export const dbService = DatabaseService.getInstance();