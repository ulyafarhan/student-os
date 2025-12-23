import Dexie, { type Table } from 'dexie';

export interface AcademicFile {
  id?: number;
  name: string;
  blob: Blob;
  type: string;
  semester: number;
  category: string;
  createdAt: string;
}

class AcademicVaultDB extends Dexie {
  files!: Table<AcademicFile>;
  constructor() {
    super('studentos_vault');
    this.version(1).stores({
      files: '++id, name, semester, category, createdAt'
    });
  }
}

export const vaultDb = new AcademicVaultDB();

export const vaultService = {
  async saveFile(file: Omit<AcademicFile, 'id' | 'createdAt'>) {
    return await vaultDb.files.add({
      ...file,
      createdAt: new Date().toISOString()
    });
  },
  async getFilesBySemester(semester: number) {
    if (typeof semester !== 'number') {
        console.warn("Vault: Invalid semester key provided");
        return [];
    }
    return await vaultDb.files.where('semester').equals(semester).toArray();
  },
  async deleteFile(id: number) {
    return await vaultDb.files.delete(id);
  },
  async updateFile(id: number, data: Partial<AcademicFile>) {
    return await vaultDb.files.update(id, data);
  }
};