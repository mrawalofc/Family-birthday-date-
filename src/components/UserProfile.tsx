import React, { useState, useEffect } from 'react';
import { User, Camera, Edit2, Save, X, LogIn, LogOut, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, runWithPopupGuard } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { GoogleDriveManager } from './GoogleDriveManager';
import { SlideshowManager } from './SlideshowManager';

interface ProfileData {
  name: string;
  bio: string;
  profilePic: string;
}

export const UserProfile: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
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
      edit: 'এডিট প্রোফাইল',
      save: 'সেভ করুন',
      cancel: 'বাতিল',
      name: 'নাম',
      bio: 'বায়ো',
      pic: 'প্রোফাইল পিকচার',
      upload: 'ছবি আপলোড করুন',
      loginTitle: 'লিঙ্ক অ্যাকাউন্ট',
      loginSub: 'আপনার তথ্যাদি ক্লাউডে সুরক্ষিত রাখতে গুগল দিয়ে লগইন করুন।',
      googleBtn: 'গুগল দিয়ে লগইন',
      logoutBtn: 'লগআউট',
      authError: 'লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
    },
    en: {
      title: 'User Profile',
      themeTitle: 'Change Profile Theme',
      edit: 'Edit Profile',
      save: 'Save Changes',
      cancel: 'Cancel',
      name: 'Name',
      bio: 'Bio',
      pic: 'Profile Picture',
      upload: 'Upload Picture',
      loginTitle: 'Link Account',
      loginSub: 'Sign in with Google to sync your data securely across devices.',
      googleBtn: 'Sign in with Google',
      logoutBtn: 'Sign Out',
      authError: 'Authentication failed. Please try again.'
    }
  };

  const l = t[lang];

  useEffect(() => {
    localStorage.setItem('profile_theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setCurrentUser(u);
      if (u) {
        // If logged in, update profile pic/name from Google if local is empty
        setProfile(prev => ({
          name: prev.name === 'আমার নাম' || prev.name === 'My Name' ? (u.displayName || prev.name) : prev.name,
          bio: prev.bio,
          profilePic: prev.profilePic || u.photoURL || '',
        }));
      }
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
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await runWithPopupGuard(() => signInWithPopup(auth, provider));
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError(lang === 'bn' ? 'লগইন উইন্ডোটি বন্ধ করা হয়েছে।' : 'Login window was closed.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError(lang === 'bn' ? 'পপআপ ব্লক করা হয়েছে! দয়া করে ব্রাউজারে পপআপ অনুমতি দিন।' : 'Popup blocked! Please allow popups in your browser settings.');
      } else {
        setAuthError(l.authError);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
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
          
          {authError && (
            <p className="text-xs text-red-400 mb-4 bg-red-400/10 py-2 rounded-lg">{authError}</p>
          )}

          <button 
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/90 transition-all active:scale-95 disabled:opacity-50"
          >
            {authLoading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
            {l.googleBtn}
          </button>
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
