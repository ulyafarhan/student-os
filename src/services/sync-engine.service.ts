import { dbService } from './db.service';
import { googleService } from './google.service';

export const syncEngine = {
  async performSync() {
    try {
      const gapi = (window as any).gapi;
      const isSignedIn = gapi?.auth2?.getAuthInstance()?.isSignedIn?.get();

      if (!isSignedIn) return;

      const allTransactions = await dbService.getTransactions();
      const unsynced = allTransactions.filter((t: any) => !t.synced);

      if (unsynced.length === 0) return;

      for (const tx of unsynced) {
        try {
          await googleService.syncToSheets(tx);
          await dbService.updateSyncStatus(tx.id, true);
        } catch (err) {
          console.error(`Sync failed for ID ${tx.id}:`, err);
        }
      }
    } catch (error) {
      console.error("Sync Engine Error:", error);
    }
  }
};