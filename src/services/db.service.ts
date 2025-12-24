import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import Dexie, { type Table } from 'dexie';
import { type NewTransaction } from '@/db/schema';
import { supabase } from '@/lib/supabase';

export const supabaseService = {
  async signIn(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  },
  async syncTransactionMeta(transaction: any) {
    const { data, error } = await supabase
      .from('transactions_meta')
      .upsert({
        id: transaction.id,
        title: transaction.title,
        amount: transaction.amount,
        category: transaction.category,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    return data;
  }
};

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
      return;
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
    } catch (e) {
      console.error(e);
    }
  }

  public async addTransaction(tx: NewTransaction) {
    let result;
    if (this.isNative) {
      const query = `INSERT INTO transactions (title, amount, type, category, date, synced) VALUES (?, ?, ?, ?, ?, ?)`;
      result = await this.dbNative?.run(query, [tx.title, tx.amount, tx.type, tx.category, tx.date, 0]);
    } else {
      const id = await webDb.transactions.add({ ...tx, synced: 0 });
      result = { changes: { lastId: id } };
    }

    if (navigator.onLine) {
      try {
        await supabaseService.syncTransactionMeta({
          ...tx,
          id: result?.changes?.lastId
        });
      } catch (e) {
        console.error(e);
      }
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
    const txs = await this.getTransactions();
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
      await webDb.transactions.update(id, { synced: status ? 1 : 0 });
    }
  }
}

export const dbService = DatabaseService.getInstance();