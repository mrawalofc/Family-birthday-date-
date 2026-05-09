import React, { useState, useEffect } from 'react';
import { User, Camera, Edit2, Save, X, LogIn, LogOut, Loader2, Download, Upload, HardDrive, Trash2, Clock, CheckCircle2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, runWithPopupGuard } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { SlideshowManager } from './SlideshowManager';
import { LocalBackupService, AppData } from '../services/localBackupService';
import { sounds } from '../lib/sounds';

interface ProfileData {
  name: string;
  bio: string;
  profilePic: string;
}

export const UserProfile: React.FC<{ lang: 'bn' | 'en', setLang: (l: 'bn' | 'en') => void }> = ({ lang, setLang }) => {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [profile, setProfile] = useState<ProfileData>({
    name: localStorage.getItem('profile_name') || (lang === 'bn' ? 'আমার নাম' : 'My Name'),
    bio: localStorage.getItem('profile_bio') || (lang === 'bn' ? 'আমার সম্পর্কে কিছু কথা...' : 'Something about me...'),
    profilePic: localStorage.getItem('profile_pic') || '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('profile_theme') || 'pink');
  const [tempProfile, setTempProfile] = useState<ProfileData>(profile);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const THEMES = [
    { id: 'pink', name: 'Romantic Pink', color: 'bg-pink-500', accent: 'border-pink-500/50', text: 'text-pink-500' },
    { id: 'blue', name: 'Ocean Blue', color: 'bg-blue-500', accent: 'border-blue-500/50', text: 'text-blue-500' },
    { id: 'orange', name: 'Sunset Orange', color: 'bg-orange-500', accent: 'border-orange-500/50', text: 'text-orange-500' },
    { id: 'purple', name: 'Midnight Purple', color: 'bg-purple-600', accent: 'border-purple-600/50', text: 'text-purple-600' },
    { id: 'green', name: 'Emerald Forest', color: 'bg-emerald-500', accent: 'border-emerald-500/50', text: 'text-emerald-500' },
  ];

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];

  const t = {
    bn: {
      title: 'ইউজার প্রোফাইল',
      themeTitle: 'প্রোফাইল থিম পরিবর্তন করুন',
      languageTitle: 'ভাষা পরিবর্তন করুন',
      edit: 'এডিট প্রোফাইল',
      save: 'সেভ করুন',
      cancel: 'বাতিল',
      name: 'নাম',
      bio: 'বায়ো',
      pic: 'প্রোফাইল পিকচার',
      upload: 'ছবি আপলোড করুন',
      loginTitle: 'Account Status',
      loginSub: 'Sync features require an account.',
      googleBtn: 'Sign in',
      logoutBtn: 'Sign Out',
      authError: 'Authentication failed.',
      backupTitle: 'ফোন ব্যাকআপ (Local Storage)',
      backupSub: 'আপনার ডাটা ফোনের মেমোরিতে সেভ করে রাখুন',
      exportBtn: 'ফাইলে সেভ করুন (Export)',
      importBtn: 'ফাইল থেকে রিস্টোর (Import)',
      snapshots: 'রিস্টোর পয়েন্ট (Internal Copy)',
      createSnap: 'নতুন কপি তৈরি করুন',
      snapHelp: 'এটি ফোনের অ্যাপ মেমোরিতে একটি কপি তৈরি করে রাখবে।',
      snapshotLabel: 'ম্যানুয়াল ব্যাকআপ'
    },
    en: {
      title: 'User Profile',
      themeTitle: 'Change Profile Theme',
      languageTitle: 'Change App Language',
      edit: 'Edit Profile',
      save: 'Save Changes',
      cancel: 'Cancel',
      name: 'Name',
      bio: 'Bio',
      pic: 'Profile Picture',
      upload: 'Upload Picture',
      loginTitle: 'Account Status',
      loginSub: 'Sync features require an account.',
      googleBtn: 'Sign in',
      logoutBtn: 'Sign Out',
      authError: 'Authentication failed.',
      backupTitle: 'Phone Backup (Local)',
      backupSub: 'Save your data to your phone storage',
      exportBtn: 'Export to File',
      importBtn: 'Import from File',
      snapshots: 'Restore Points',
      createSnap: 'Create Restore Point',
      snapHelp: 'This saves a copy in your browser\'s internal memory.',
      snapshotLabel: 'Manual Backup'
    }
  };

  const l = t[lang];

  const [restorePoints, setRestorePoints] = useState<any[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    loadRestorePoints();
  }, []);

  const loadRestorePoints = async () => {
    const points = await LocalBackupService.listRestorePoints();
    setRestorePoints(points);
  };

  useEffect(() => {
    localStorage.setItem('profile_theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem('profile_name', profile.name);
    localStorage.setItem('profile_bio', profile.bio);
    localStorage.setItem('profile_pic', profile.profilePic);
  }, [profile]);

  const handleSave = () => {
    setProfile(tempProfile);
    setIsEditing(false);
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      await runWithPopupGuard(() => signInWithPopup(auth, provider));
      sounds.play('success');
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message);
      }
      sounds.play('error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sounds.play('click');
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    sounds.play('success');
    await LocalBackupService.exportToFile();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as AppData;
        if (confirm(lang === 'bn' ? "আপনি কি ডাটা রিস্টোর করতে চান? বর্তমান ডাটা বদলে যাবে।" : "Do you want to restore? Current data will be replaced.")) {
          LocalBackupService.applyData(data);
          sounds.play('success');
          window.location.reload();
        }
      } catch (err) {
        alert("Invalid file format");
      }
    };
    reader.readAsText(file);
  };

  const handleCreateSnapshot = async () => {
    setIsBackingUp(true);
    sounds.play('click');
    await LocalBackupService.createRestorePoint(lang === 'bn' ? 'ম্যানুয়াল ব্যাকআপ' : 'Manual Backup');
    await loadRestorePoints();
    setIsBackingUp(false);
    sounds.play('success');
  };

  const handleRestoreSnapshot = async (point: any) => {
    if (confirm(lang === 'bn' ? "এই পয়েন্ট থেকে রিস্টোর করতে চান?" : "Restore from this point?")) {
      LocalBackupService.applyData(point);
      sounds.play('success');
      window.location.reload();
    }
  };

  const handleDeleteSnapshot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await LocalBackupService.deleteRestorePoint(id);
    await loadRestorePoints();
    sounds.play('error');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile({ ...tempProfile, profilePic: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-10 px-4 space-y-8">
      {/* Auth Card */}
      {!currentUser ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 text-center shadow-xl"
        >
          <div className={`w-16 h-16 ${currentTheme.color}/20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${currentTheme.text}`}>
            <LogIn size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{l.loginTitle}</h3>
          <p className="text-white/40 text-sm mb-6">{l.loginSub}</p>
          
          <button 
            disabled={authLoading}
            onClick={handleGoogleLogin}
            className={`w-full py-4 ${currentTheme.color} text-white rounded-2xl font-bold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3`}
          >
            {authLoading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            {l.googleBtn}
          </button>

          {authError && (
            <p className="mt-4 text-xs text-red-400 font-medium">
              {l.authError}
            </p>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <LogOut size={14} />
            {l.logoutBtn}
          </button>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-xl rounded-[40px] border border-white/20 p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-white">
          <User size={120} />
        </div>

        <div className="flex flex-col items-center gap-6 relative z-10">
          {/* Profile Picture */}
          <div className="relative group">
            <div className={`w-32 h-32 rounded-full border-4 ${currentTheme.accent} overflow-hidden bg-black/20 flex items-center justify-center shadow-xl`}>
              {profile.profilePic || currentUser?.photoURL ? (
                <img src={profile.profilePic || currentUser?.photoURL || ''} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={64} className="text-white/20" />
              )}
            </div>
            {!isEditing && (
              <button 
                onClick={() => {
                  setTempProfile(profile);
                  setIsEditing(true);
                }}
                className={`absolute bottom-0 right-0 ${currentTheme.color} p-2 rounded-full text-white shadow-lg hover:scale-110 active:scale-95 transition-all`}
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">{profile.name}</h2>
            <p className="text-white/60 max-w-md italic">{profile.bio}</p>
            {currentUser && <p className="text-[10px] text-white/20 font-mono tracking-widest uppercase">{currentUser.email}</p>}
          </div>

          {!isEditing && (
            <button 
              onClick={() => {
                setTempProfile(profile);
                setIsEditing(true);
              }}
              className="mt-4 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all flex items-center gap-2 border border-white/10"
            >
              <Edit2 size={18} />
              {l.edit}
            </button>
          )}
        </div>
      </motion.div>

      {/* Local Backup & Snapshots Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 shadow-xl space-y-8"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <HardDrive size={24} className={currentTheme.text} />
              {l.backupTitle}
            </h3>
          </div>
          <p className="text-white/40 text-sm mb-6">{l.backupSub}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold transition-all border border-white/10 active:scale-95"
            >
              <Download size={20} />
              {l.exportBtn}
            </button>
            <label className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold transition-all border border-white/10 cursor-pointer active:scale-95">
              <Upload size={20} />
              {l.importBtn}
              <input type="file" className="hidden" accept=".json" onChange={handleImport} />
            </label>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-white/40">{l.snapshots}</h4>
            <button
              disabled={isBackingUp}
              onClick={handleCreateSnapshot}
              className={`text-xs font-bold ${currentTheme.text} hover:opacity-80 transition-opacity flex items-center gap-1`}
            >
              {isBackingUp ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              {l.createSnap}
            </button>
          </div>
          <p className="text-[10px] text-white/20 mb-4">{l.snapHelp}</p>
          
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {restorePoints.length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <Clock className="mx-auto mb-2 text-white/10" size={24} />
                <p className="text-xs text-white/20 italic">{lang === 'bn' ? 'কোনো রিস্টোর পয়েন্ট নেই' : 'No restore points yet'}</p>
              </div>
            ) : (
              restorePoints.map((point) => (
                <div
                  key={point.id}
                  onClick={() => handleRestoreSnapshot(point)}
                  className="bg-white/5 hover:bg-white/10 rounded-2xl p-4 border border-white/10 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${currentTheme.color}/20 flex items-center justify-center ${currentTheme.text}`}>
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{point.label}</p>
                      <p className="text-[10px] text-white/40 font-mono tracking-tighter">
                        {new Date(point.timestamp).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSnapshot(point.id, e)}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-white/10 shadow-xl"
      >
        <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">{l.themeTitle}</h4>
        <div className="flex flex-wrap gap-4">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`group flex flex-col items-center gap-2 transition-all ${theme === t.id ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
            >
              <div className={`w-10 h-10 rounded-full ${t.color} border-2 ${theme === t.id ? 'border-white' : 'border-transparent'} shadow-lg group-active:scale-90 transition-all`} />
              <span className={`text-[10px] font-bold ${theme === t.id ? 'text-white' : 'text-white/40'}`}>{t.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-white/10 shadow-xl"
      >
        <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">{l.languageTitle}</h4>
        <div className="flex gap-4">
          {[
            { id: 'bn', label: 'বাংলা' },
            { id: 'en', label: 'English' }
          ].map(lang_opt => (
            <button
              key={lang_opt.id}
              onClick={() => { sounds.play('click'); setLang(lang_opt.id as 'bn' | 'en'); }}
              className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${
                lang === lang_opt.id 
                  ? `${currentTheme.color} text-white border-transparent shadow-lg` 
                  : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
              }`}
            >
              {lang_opt.label}
            </button>
          ))}
        </div>
      </motion.div>
      
      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-[32px] p-8 relative shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Edit2 size={24} className={currentTheme.text} />
                  {l.edit}
                </h3>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-white/40 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Pic Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-2 border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
                      {tempProfile.profilePic ? (
                        <img src={tempProfile.profilePic} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User size={40} className="text-white/20" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-white text-black p-2 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg">
                      <Camera size={14} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{l.pic}</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">{l.name}</label>
                    <input 
                      type="text" 
                      value={tempProfile.name}
                      onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})}
                      className={`w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:ring-2 focus:ring-${theme === 'purple' ? 'purple-600' : theme === 'pink' ? 'pink-500' : theme === 'blue' ? 'blue-500' : theme === 'orange' ? 'orange-500' : 'emerald-500'} outline-none transition-all`}
                      placeholder={l.name}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">{l.bio}</label>
                    <textarea 
                      value={tempProfile.bio}
                      onChange={(e) => setTempProfile({...tempProfile, bio: e.target.value})}
                      className={`w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:ring-2 focus:ring-${theme === 'purple' ? 'purple-600' : theme === 'pink' ? 'pink-500' : theme === 'blue' ? 'blue-500' : theme === 'orange' ? 'orange-500' : 'emerald-500'} outline-none transition-all h-24 resize-none`}
                      placeholder={l.bio}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
                  >
                    {l.cancel}
                  </button>
                  <button 
                    onClick={handleSave}
                    className={`flex-1 py-4 ${currentTheme.color} text-white rounded-2xl font-bold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2`}
                  >
                    <Save size={18} />
                    {l.save}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="pt-10 border-t border-white/5">
        <SlideshowManager lang={lang} />
      </div>
    </div>
  );
};
