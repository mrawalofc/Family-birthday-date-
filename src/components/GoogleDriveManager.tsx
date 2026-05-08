import React, { useRef, useState, useEffect } from 'react';
import { Database, Download, Upload, Smartphone, Cloud, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { GoogleDriveService, DriveBackup } from '../services/googleDriveService';
import { auth } from '../lib/firebase';

export const GoogleDriveManager: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backups, setBackups] = useState<DriveBackup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [autoSync, setAutoSync] = useState(localStorage.getItem('auto_sync_drive') === 'true');

  useEffect(() => {
    // Cleanup legacy localStorage keys that might cause quota issues
    const legacyKeys = ['love_world_albums', 'love_world_gallery_v1'];
    legacyKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`Removing legacy key: ${key}`);
        localStorage.removeItem(key);
      }
    });

    const checkLink = async () => {
      const linked = await GoogleDriveService.isLinked();
      setIsLinked(linked);
      if (linked) fetchBackups();
    };
    checkLink();
  }, []);

  const fetchBackups = async () => {
    try {
      setIsLoading(true);
      const list = await GoogleDriveService.listBackups();
      setBackups(list);
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('Interaction Required')) {
        setIsLinked(true); // Still linked but needs token
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLink = async () => {
    try {
      setIsLoading(true);
      await GoogleDriveService.link();
      setIsLinked(true);
      await fetchBackups();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloudBackup = async () => {
    try {
      setIsLoading(true);
      await GoogleDriveService.uploadBackup(); // Uses default full-localStorage gatherer
      await fetchBackups();
      alert(lang === 'bn' ? "ব্যাকআপ সফল হয়েছে!" : "Backup successful!");
    } catch (err: any) {
      if (err.message.includes('Interaction Required')) {
        alert(lang === 'bn' ? "গুগল ড্রাইভ পুনরায় লিঙ্ক করা প্রয়োজন।" : "Google Drive re-authorization required.");
        handleLink();
      } else {
        alert(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreCloudBackup = async (fileId: string) => {
    if (!confirm(lang === 'bn' ? "এটি আপনার লোকাল ডেটা রিপ্লেস করবে এবং অ্যাপটি রিলোড হবে। আপনি কি নিশ্চিত?" : "This will replace your local data and reload the app. Are you sure?")) return;
    try {
      setIsLoading(true);
      const backup = await GoogleDriveService.downloadBackup(fileId);
      GoogleDriveService.applyBackupToLocal(backup);
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutoSync = (val: boolean) => {
    setAutoSync(val);
    localStorage.setItem('auto_sync_drive', val.toString());
  };

  const handleDownloadBackup = () => {
    const allData: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) allData[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify({ version: '2.0', localStorage: allData, timestamp: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `love_world_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm(lang === 'bn' ? "এটি আপনার বর্তমান লোকাল ডেটা ওভাররাইট করবে। আপনি কি নিশ্চিত?" : "This will overwrite your current local data. Are you sure?")) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        
        // Handle both older and newer formats
        const data = backup.localStorage || backup.data;
        
        if (data && typeof data === 'object') {
          Object.keys(data).forEach(key => {
            const value = data[key];
            if (value !== null) {
              localStorage.setItem(key, value);
            }
          });
          window.location.reload();
        } else {
          throw new Error("Invalid format");
        }
      } catch (err) {
        alert(lang === 'bn' ? "ভুল ফাইল ফরমেট!" : "Invalid file format!");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const t = {
    bn: {
      title: "ডেটা ব্যাকআপ ও সিঙ্ক",
      localBackup: "ডিভাইস ব্যাকআপ",
      cloudBackup: "গুগল ড্রাইভ ব্যাকআপ",
      download: "ব্যাকআপ ডাউনলোড করুন",
      upload: "ব্যাকআপ ইম্পোর্ট করুন",
      backupNow: "এখনই ব্যাকআপ নিন",
      autoSync: "অটো-সিঙ্ক (অনলাইন হলে)",
      linked: "লিঙ্ক করা হয়েছে",
      notLinked: "গুগল ড্রাইভ লিঙ্ক করুন",
      history: "ব্যাকআপ হিস্ট্রি",
      restore: "রিস্টোর",
      security: "*আপনার ডেটা অত্যন্ত গোপনীয় এবং আপনার নিজস্ব গুগল ড্রাইভে সংরক্ষিত থাকে।"
    },
    en: {
      title: "Data Backup & Sync",
      localBackup: "Local Device Backup",
      cloudBackup: "Google Drive Backup",
      download: "Download Backup",
      upload: "Import Backup File",
      backupNow: "Backup to Cloud",
      autoSync: "Auto-sync when online",
      linked: "Connected",
      notLinked: "Link Google Drive",
      history: "Backup History",
      restore: "Restore",
      security: "*Your data is private and stored securely in your own Google Drive."
    }
  };

  const l = t[lang];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-white/40 mb-2">
          <Database size={16} />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold">{l.title}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local Device Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-[40px] p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-pink-500/10 group-hover:text-pink-500/20 transition-colors">
            <Smartphone size={60} strokeWidth={1} />
          </div>

          <h4 className="text-white font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-400" />
            {l.localBackup}
          </h4>

          <div className="space-y-3">
            <button
              onClick={handleDownloadBackup}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-95"
            >
              <Download size={16} />
              {l.download}
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white/5 hover:bg-white/10 text-white/60 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-95 border border-white/5"
            >
              <Upload size={16} />
              {l.upload}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportBackup} 
              accept=".json" 
              className="hidden" 
            />
          </div>
        </div>

        {/* Cloud Backup Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-[40px] p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
            <Cloud size={60} strokeWidth={1} />
          </div>

          <h4 className="text-white font-bold mb-6 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isLinked ? 'bg-green-400' : 'bg-yellow-400'}`} />
            {l.cloudBackup}
          </h4>

          {!isLinked ? (
            <button 
              onClick={handleLink}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <RefreshCw size={20} className="animate-spin" /> : <Cloud size={20} />}
              {l.notLinked}
            </button>
          ) : (
            <div className="space-y-4">
              <button 
                onClick={handleCloudBackup}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <RefreshCw size={20} className="animate-spin" /> : <Upload size={20} />}
                {l.backupNow}
              </button>

              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-white/60 font-medium">{l.autoSync}</span>
                <button 
                  onClick={() => toggleAutoSync(!autoSync)}
                  className={`w-10 h-6 rounded-full transition-all relative ${autoSync ? 'bg-green-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoSync ? 'left-5' : 'left-1'}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isLinked && backups.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-white/10">
          <h5 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
            <RefreshCw size={14} />
            {l.history}
          </h5>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {backups.map(file => (
              <div key={file.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs text-white font-medium">{new Date(file.modifiedTime).toLocaleDateString()}</span>
                  <span className="text-[10px] text-white/40">{new Date(file.modifiedTime).toLocaleTimeString()}</span>
                </div>
                <button 
                  onClick={() => handleRestoreCloudBackup(file.id)}
                  className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all"
                >
                  {l.restore}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <p className="max-w-md mx-auto text-[10px] text-white/30 text-center leading-relaxed">
        {l.security}
      </p>
    </div>
  );
};

