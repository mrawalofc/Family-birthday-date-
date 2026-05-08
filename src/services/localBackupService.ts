import { get, set, keys, del } from 'idb-keyval';

export interface AppData {
  localStorage: Record<string, string>;
  timestamp: string;
  version: string;
}

export class LocalBackupService {
  private static SNAPSHOT_PREFIX = 'love_world_snapshot_';

  /**
   * Collects all relevant data from localStorage
   */
  static async collectAllData(): Promise<AppData> {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('love_world_') || key.startsWith('family_') || key.startsWith('moments_'))) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
    return {
      localStorage: data,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Triggers a download of the app data as a JSON file
   */
  static async exportToFile() {
    const data = await this.collectAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fb_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Restores data from an AppData object
   */
  static applyData(data: AppData) {
    if (!data.localStorage) return;
    Object.entries(data.localStorage).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }

  /**
   * Creates a restore point in IndexedDB
   */
  static async createRestorePoint(label: string = 'Manual Backup') {
    const data = await this.collectAllData();
    const id = `${this.SNAPSHOT_PREFIX}${Date.now()}`;
    await set(id, { ...data, label });
    return id;
  }

  /**
   * Lists all restore points
   */
  static async listRestorePoints() {
    const allKeys = await keys();
    const snapshots = [];
    for (const key of allKeys) {
      if (typeof key === 'string' && key.startsWith(this.SNAPSHOT_PREFIX)) {
         const data = await get(key);
         snapshots.push({ id: key, ...data });
      }
    }
    return snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Deletes a specific restore point
   */
  static async deleteRestorePoint(id: string) {
    await del(id);
  }
}
