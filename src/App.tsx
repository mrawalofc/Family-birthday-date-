/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Background } from './components/Background';
import { Navbar } from './components/Navbar';
import { FloatingEmojis } from './components/FloatingEmojis';
import { Popup } from './components/Popup';
import { Gallery } from './components/Gallery';
import { Messages } from './components/Messages';
import { Letter } from './components/Letter';
import { Countdown } from './components/Countdown';
import { Family } from './components/Family';
import { Quiz } from './components/Quiz';
import { PublicInfo } from './components/PublicInfo';
import { LivePreviewDesigner } from './components/LivePreviewDesigner';
import { NetworkStatus } from './components/NetworkStatus';
import { Slideshow } from './components/Slideshow';
import { MusicPlayer } from './components/MusicPlayer';
import { Moments } from './components/Moments';
import { SyncTab } from './components/SyncTab';
import { Weather } from './components/Weather';
import { Heart, Users, Cloud } from 'lucide-react';
import { sounds } from './lib/sounds';

export default function App() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [activeTab, setActiveTab] = useState('home');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [customMessages, setCustomMessages] = useState<{bn: string, en: string}>({
    bn: localStorage.getItem('love_world_msg_bn') || 'আমাদের পরিবারের প্রতিটি জন্মদিন যেন সবার জন্য আনন্দ আর ভালোবাসা বয়ে আনে। চলো আমরা একসাথে এই বিশেষ দিনগুলো উদযাপন করি এবং সুন্দর স্মৃতি তৈরি করি।',
    en: localStorage.getItem('love_world_msg_en') || "I hope every birthday in our family brings joy and love to everyone. Let's celebrate these special days together and create beautiful memories."
  });
  const [recipientName, setRecipientName] = useState(localStorage.getItem('love_world_recipient') || 'Our Family');
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(localStorage.getItem('love_world_emoji') || '🏠');
  const [floatingEmoji, setFloatingEmoji] = useState(localStorage.getItem('love_world_float_emoji') || '✨');
  const [signature, setSignature] = useState(localStorage.getItem('love_world_sig') || 'Family Forever');
  const [isEditingSig, setIsEditingSig] = useState(false);

  // Track auth state
  useEffect(() => {
    // Cleanup legacy localStorage keys that might cause quota issues
    const legacyKeys = ['love_world_albums', 'love_world_gallery_v1'];
    legacyKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`Cleaning up legacy key: ${key}`);
        localStorage.removeItem(key);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Potential migration check if needed
        const migrated = localStorage.getItem('love_world_migrated_v2');
        if (!migrated) {
          localStorage.setItem('love_world_migrated_v2', 'true');
          // We could fetch from Firestore here if we wanted to migrate old data
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Auto-sync logic on reconnect
  useEffect(() => {
    const handleSyncOnReconnect = async () => {
      if (navigator.onLine && user) {
        const isAutoSyncEnabled = localStorage.getItem('auto_sync_drive') === 'true';
        if (!isAutoSyncEnabled) return;

        console.log('Reconnected! Attempting auto-sync to Google Drive...');
        try {
          const allData: Record<string, string | null> = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) allData[key] = localStorage.getItem(key);
          }
          
          const { GoogleDriveService } = await import('./services/googleDriveService');
          const linked = await GoogleDriveService.isLinked();
          if (linked) {
            // We attempt to upload. We set isBackground=true to avoid popups.
            await GoogleDriveService.uploadBackup({ data: allData, timestamp: new Date().toISOString() }, true);
            console.log('Auto-sync successful!');
          }
        } catch (e) {
          console.error('Auto-sync failed:', e);
          // We don't alert the user here to avoid annoying popups during background tasks
        }
      }
    };
    window.addEventListener('online', handleSyncOnReconnect);
    return () => window.removeEventListener('online', handleSyncOnReconnect);
  }, [user]);

  const handleSaveMessage = () => {
    localStorage.setItem('love_world_msg_bn', customMessages.bn);
    localStorage.setItem('love_world_msg_en', customMessages.en);
    sounds.play('success');
    setIsEditingMessage(false);
  };

  const handleSaveName = () => {
    localStorage.setItem('love_world_recipient', recipientName);
    localStorage.setItem('love_world_emoji', selectedEmoji);
    sounds.play('success');
    setIsEditingName(false);
  };

  const words = {
    bn: customMessages.bn.split(/\s+/),
    en: customMessages.en.split(/\s+/)
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'gallery': return <Gallery lang={lang} />;
      case 'messages': return <Messages lang={lang} />;
      case 'letter': return <Letter lang={lang} />;
      case 'countdown': return <Countdown lang={lang} />;
      case 'family': return <Family lang={lang} />;
      case 'monitoring': return <Family lang={lang} defaultViewMode="monitoring" />;
      case 'public-info': return <PublicInfo lang={lang} />;
      case 'quiz': return <Quiz lang={lang} />;
      case 'designer': return <LivePreviewDesigner lang={lang} />;
      case 'moments': return <Moments lang={lang} />;
      case 'sync': return <SyncTab lang={lang} />;
      default:
        return (
          <div className="w-full max-w-3xl flex flex-col items-center mt-10">
            <div className="relative group mb-2.5">
              {isEditingName ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex flex-wrap justify-center gap-3 mb-2">
                    {['💝', '💖', '💗', '💓', '❤️', '🔥', '✨', '🌸', '🧸'].map(emoji => (
                      <button 
                        key={emoji}
                        onClick={() => { sounds.play('click'); setSelectedEmoji(emoji); }}
                        className={`text-2xl p-2 rounded-xl transition-all ${selectedEmoji === emoji ? 'bg-pink-500 scale-125 shadow-lg' : 'bg-white/5 hover:bg-white/10'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder={lang === 'bn' ? 'নাম লিখুন...' : 'Enter name...'}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 text-white text-center font-serif text-3xl outline-none focus:border-pink-500 transition-all w-64"
                    autoFocus
                  />
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{lang === 'bn' ? 'ফ্লোটিং ইমোজি' : 'Floating Emoji'}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['💖', '💕', '✨', '🌸', '💘', '🌹'].map(emoji => (
                        <button 
                          key={emoji}
                          onClick={() => {
                            sounds.play('click');
                            setFloatingEmoji(emoji);
                            localStorage.setItem('love_world_float_emoji', emoji);
                          }}
                          className={`text-lg p-1.5 rounded-lg transition-all ${floatingEmoji === emoji ? 'bg-white/20 scale-110' : 'bg-white/5'}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button 
                      onClick={handleSaveName}
                      className="px-8 py-3 bg-pink-500 text-white rounded-2xl font-bold hover:bg-pink-600 transition-all shadow-lg active:scale-95"
                    >
                      {lang === 'bn' ? 'পরিবর্তন সেভ করুন' : 'Save Changes'}
                    </button>
                    <button 
                      onClick={() => {
                        setRecipientName('Our Family');
                        setSelectedEmoji('🏠');
                        setFloatingEmoji('✨');
                        localStorage.setItem('love_world_recipient', 'Our Family');
                        localStorage.setItem('love_world_emoji', '🏠');
                        localStorage.setItem('love_world_float_emoji', '✨');
                        setIsEditingName(false);
                      }}
                      className="px-4 py-3 bg-white/10 text-white/60 rounded-2xl font-bold hover:bg-white/20 transition-all"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <h1 
                  onClick={() => setIsEditingName(true)}
                  className="font-serif text-6xl md:text-7xl text-white drop-shadow-[0_0_20px_rgba(255,105,180,0.8)] animate-[glow_2s_ease-in-out_infinite_alternate] text-center px-4 cursor-pointer hover:scale-105 transition-transform group"
                >
                  <span className="inline-block mr-2 group-hover:rotate-12 transition-transform">{selectedEmoji}</span>
                  For {recipientName}
                </h1>
              )}
            </div>
            <p className="text-white/80 text-lg mb-10 font-light italic text-center">
              {lang === 'bn' ? 'আমাদের পরিবারের সকল জন্মদিন এবং বিশেষ মুহূর্ত ট্র্যাকার' : 'Tracking all the birthdays and special moments of our family'}
            </p>

            <Slideshow />

            <div className="bg-white/10 backdrop-blur-xl rounded-[30px] p-10 md:p-14 w-full border border-white/20 shadow-[0_25px_50px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] relative overflow-hidden group">
              <div className="absolute top-4 left-4 text-2xl opacity-60 animate-corner-pulse">💗</div>
              <div className="absolute top-4 right-4 text-2xl opacity-60 animate-corner-pulse delay-500">💗</div>
              <div className="absolute bottom-4 left-4 text-2xl opacity-60 animate-corner-pulse delay-1000">💗</div>
              <div className="absolute bottom-4 right-4 text-2xl opacity-60 animate-corner-pulse delay-1500">💗</div>

              <div className="relative z-[2] text-center">
                <div className="w-12 h-12 flex items-center justify-center mx-auto mb-6 text-pink-300 animate-[heartbeat_1.5s_infinite] relative group">
                  <span className="text-5xl">💌</span>
                </div>
                
                {isEditingMessage ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex flex-wrap justify-center gap-2 mb-4 w-full">
                       {(lang === 'bn' ? [
                         'শুভ জন্মদিন!', 
                         'অনেক অনেক দোয়া রইলো', 
                         'দিনটি অনেক ভালো কাটুক', 
                         'সবাই একসাথে খুশি থেকো',
                         'পরিবারই সব'
                       ] : [
                         'Happy Birthday!', 
                         'Best wishes to you!', 
                         'Have a wonderful day!', 
                         'Stay happy together!', 
                         'Family is everything'
                       ]).map(preset => (
                         <button 
                           key={preset}
                           onClick={() => setCustomMessages({...customMessages, [lang]: preset})}
                           className="text-[10px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/20 hover:text-white transition-all hover:scale-105 active:scale-95"
                         >
                           {preset}
                         </button>
                       ))}
                    </div>
                    <div className="relative w-full">
                      <textarea 
                        value={customMessages[lang]}
                        onChange={(e) => setCustomMessages({...customMessages, [lang]: e.target.value})}
                        className="w-full h-44 bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-5 text-white text-lg leading-relaxed outline-none focus:border-pink-500 transition-all resize-none shadow-inner"
                        placeholder={lang === 'bn' ? 'তোমার বার্তা লিখো...' : 'Write your message...'}
                      />
                      {customMessages[lang] && (
                        <button 
                          onClick={() => setCustomMessages({...customMessages, [lang]: ''})}
                          className="absolute bottom-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white/40 hover:text-white rounded-xl transition-all"
                        >
                          {lang === 'bn' ? 'মুছে ফেলুন' : 'Clear'}
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3 w-full">
                      <button 
                        onClick={handleSaveMessage}
                        className="flex-1 py-4 bg-pink-500 text-white rounded-2xl font-bold shadow-lg hover:bg-pink-600 active:scale-95 transition-all shadow-[0_10px_20px_rgba(236,72,153,0.3)]"
                      >
                        {lang === 'bn' ? 'বার্তা সেভ করুন' : 'Save Message'}
                      </button>
                      <button 
                        onClick={() => {
                          const defaults = {
                            bn: 'আমাদের পরিবারের প্রতিটি জন্মদিন যেন সবার জন্য আনন্দ আর ভালোবাসা বয়ে আনে। চলো আমরা একসাথে এই বিশেষ দিনগুলো উদযাপন করি এবং সুন্দর স্মৃতি তৈরি করি।',
                            en: "I hope every birthday in our family brings joy and love to everyone. Let's celebrate these special days together and create beautiful memories."
                          };
                          setCustomMessages({ ...customMessages, [lang]: defaults[lang] });
                        }}
                        className="px-6 py-4 bg-white/10 text-white/60 rounded-2xl font-bold hover:bg-white/20 transition-all active:scale-95"
                      >
                        {lang === 'bn' ? 'রিসেট' : 'Reset'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xl md:text-2xl leading-[2.2] flex flex-wrap justify-center gap-x-2 gap-y-3 drop-shadow-sm">
                    {words[lang].map((word, i) => (
                      <span 
                        key={i} 
                        className="inline-block animate-color-wave font-semibold hover:scale-110 transition-transform cursor-default"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                )}

                <div 
                  onClick={() => setIsEditingMessage(!isEditingMessage)}
                  className="cursor-pointer group relative inline-block mt-10 mb-6"
                >
                  <Heart 
                    className={`mx-auto text-red-500 transition-all duration-300 ${isEditingMessage ? 'scale-125 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'animate-[heartbeat_1.5s_infinite] hover:scale-125'}`} 
                    fill="currentColor" 
                    size={32} 
                  />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md text-[10px] text-white px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {lang === 'bn' ? 'বার্তা এডিট করুন' : 'Click to Edit Message'}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <button
                    onClick={() => { sounds.play('notification'); setIsPopupOpen(true); }}
                    className="text-7xl cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-300 drop-shadow-[0_0_20px_rgba(255,20,147,0.7)] animate-love-glow select-none bg-transparent border-none"
                  >
                    💝
                  </button>
                  <span className="text-sm text-white/60 mt-4 animate-pulse uppercase tracking-widest font-medium">
                    {lang === 'bn' ? '✨ হার্টে ক্লিক করো ✨' : '✨ Click the heart ✨'}
                  </span>
                </div>

                <div className="mt-16 relative">
                  {isEditingSig ? (
                    <div className="flex flex-col items-center gap-2">
                      <input 
                        type="text"
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                        className="bg-white/5 border border-white/20 rounded-xl px-4 py-1 text-white/70 italic text-2xl text-center outline-none focus:border-pink-500 w-48"
                        autoFocus
                        onBlur={() => {
                          localStorage.setItem('love_world_sig', signature);
                          setIsEditingSig(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            localStorage.setItem('love_world_sig', signature);
                            setIsEditingSig(false);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div 
                      onClick={() => setIsEditingSig(true)}
                      className="font-serif text-4xl text-white/70 italic cursor-pointer hover:text-white transition-colors group"
                    >
                      {signature}
                      <span className="ml-2 opacity-0 group-hover:opacity-100 text-xs text-white/30 italic">edit</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative font-sans pt-20 pb-20 px-5 flex flex-col items-center min-h-screen selection:bg-pink-500/30">
      <Background />
      <Weather lang={lang} />
      <NetworkStatus lang={lang} />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} />
      <FloatingEmojis symbol={floatingEmoji} />
      <MusicPlayer lang={lang} />
      <Popup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />

      {/* Language & Auth Toggles */}
      <div className="fixed top-20 right-5 z-[100] flex flex-col items-end gap-3">
        <div className="bg-black/30 backdrop-blur-md rounded-full p-1 flex gap-1 border border-white/20 shadow-xl">
          <button
            onClick={() => { sounds.play('click'); setLang('bn'); }}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              lang === 'bn' ? 'bg-pink-500 text-white shadow-lg' : 'bg-transparent text-white/60 hover:text-white'
            }`}
          >
            বাংলা
          </button>
          <button
            onClick={() => { sounds.play('click'); setLang('en'); }}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              lang === 'en' ? 'bg-pink-500 text-white shadow-lg' : 'bg-transparent text-white/60 hover:text-white'
            }`}
          >
            English
          </button>
        </div>

        {/* Quick Auth Info */}
        <AnimatePresence>
          {!authLoading && (
            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={() => { sounds.play('click'); setActiveTab('sync'); }}
              className="bg-black/30 backdrop-blur-md rounded-2xl p-2 pr-4 flex items-center gap-3 border border-white/20 shadow-xl hover:bg-black/40 transition-all group"
            >
              {user && !user.isAnonymous ? (
                <>
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-pink-500 flex items-center justify-center text-xs font-bold text-white">
                        {user.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-[10px] text-white font-bold leading-none truncate max-w-[80px]">{user.displayName || 'User'}</p>
                    <p className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Cloud Synced</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/40 group-hover:text-pink-400 transition-colors">
                    <Cloud size={16} />
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-[10px] text-white/60 font-bold leading-none">{lang === 'bn' ? 'ব্যাকআপ' : 'Sync & Backup'}</p>
                    <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest mt-0.5">Local Mode</p>
                  </div>
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <main className="relative z-10 w-full max-w-6xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + lang}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer / Quick Nav (Mobile focus) */}
      <footer className="fixed bottom-0 left-0 w-full lg:hidden bg-black/40 backdrop-blur-lg border-t border-white/10 z-[200] pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {['home', 'family', 'gallery', 'moments', 'sync'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === tab ? 'text-pink-400 scale-110' : 'text-white/40'
              }`}
            >
              <div className="relative">
                {tab === 'home' && <Heart size={20} fill={activeTab === tab ? 'currentColor' : 'none'} />}
                {tab === 'messages' && <span className="text-xl">💌</span>}
                {tab === 'gallery' && <span className="text-xl">🖼️</span>}
                {tab === 'moments' && <span className="text-xl">✨</span>}
                {tab === 'family' && <Users size={20} />}
                {tab === 'sync' && <Cloud size={20} />}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-tighter">{tab}</span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
