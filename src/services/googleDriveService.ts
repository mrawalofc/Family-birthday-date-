import { auth, runWithPopupGuard } from '../lib/firebase';
import { GoogleAuthProvider, reauthenticateWithPopup, linkWithPopup } from 'firebase/auth';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export interface DriveBackup {
  id: string;
  name: string;
  modifiedTime: string;
}

export class GoogleDriveService {
  private static accessToken: string | null = null;
  private static authPromise: Promise<string> | null = null;

  private static async getAccessToken(forcePopup: boolean = true): Promise<string> {
    if (this.accessToken) return this.accessToken;

    if (this.authPromise) return this.authPromise;

    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    if (!forcePopup) {
      throw new Error('Interaction Required: Token expired');
    }

    this.authPromise = this.link().finally(() => {
      this.authPromise = null;
    });
    return this.authPromise;
  }

  static async link(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const provider = new GoogleAuthProvider();
    provider.addScope(DRIVE_SCOPE);
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      // Direct prompt for scopes/link
      const result = await runWithPopupGuard(() => linkWithPopup(user, provider));
      const credential = GoogleAuthProvider.credentialFromResult(result);
      this.accessToken = credential?.accessToken || null;
      if (!this.accessToken) throw new Error('Failed to obtain access token');
      return this.accessToken;
    } catch (error: any) {
      if (error.code === 'auth/credential-already-in-use') {
        // User already linked, re-authenticate to get token with scopes
        const result = await runWithPopupGuard(() => reauthenticateWithPopup(user, provider));
        const credential = GoogleAuthProvider.credentialFromResult(result);
        this.accessToken = credential?.accessToken || null;
        if (!this.accessToken) throw new Error('Failed to obtain access token');
        return this.accessToken;
      }
      
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        throw new Error('Authentication window was closed. Please try again.');
      }
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup blocked! Please allow popups for this site and try again.');
      }
      throw error;
    }
  }

  static async listBackups(): Promise<DriveBackup[]> {
    // On load, we try to get token WITHOUT forcing popup
    const token = await this.getAccessToken(false).catch(() => null);
    if (!token) return []; 
    
    const query = encodeURIComponent("name contains 'love_world_backup_' and mimeType = 'application/json'");
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      this.accessToken = null;
      throw new Error('Failed to list backups from Google Drive');
    }
    const data = await response.json();
    return data.files || [];
  }

  static async isLinked(): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;
    return user.providerData.some(p => p.providerId === 'google.com');
  }

  static async uploadBackup(data?: any, isBackground: boolean = false): Promise<void> {
    const token = await this.getAccessToken(!isBackground);
    
    // If no data provided, gather everything from localStorage
    const backupData = data || {
      version: '2.0',
      timestamp: new Date().toISOString(),
      localStorage: { ...localStorage }
    };

    const metadata = {
      name: `family_birthday_full_backup_${new Date().toISOString().split('T')[0]}.json`,
      mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(backupData)], { type: 'application/json' }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });

    if (!response.ok) throw new Error('Failed to upload backup to Google Drive');
  }

  static async downloadBackup(fileId: string): Promise<any> {
    const token = await this.getAccessToken(true); // User triggered
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to download backup from Google Drive');
    const backupData = await response.json();
    return backupData;
  }

  static applyBackupToLocal(backupData: any): void {
    if (!backupData.localStorage) return;
    
    // Clear current local storage for relevant keys or all if it's a full backup
    // For safer approach, we overwrite keys present in backup
    Object.keys(backupData.localStorage).forEach(key => {
      localStorage.setItem(key, backupData.localStorage[key]);
    });
  }
}
