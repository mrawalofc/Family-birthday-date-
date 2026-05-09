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
import { UserProfile } from './components/UserProfile';
import { Hero } from './components/Hero';
import { Weather } from './components/Weather';
import { About } from './components/About';
import { Heart, Users, User, Clock, Image, Sparkles, LayoutDashboard, Info } from 'lucide-react';
import { sounds } from './lib/sounds';

export default function App() {
  const [lang, setLang] = useState<'bn' | 'en'>(() => (localStorage.getItem('love_world_lang') as 'bn' | 'en') || 'bn');
  const [activeTab, setActiveTab] = useState('home');
  const [showHero, setShowHero] = useState(() => !localStorage.getItem('fb_hero_seen'));
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

  useEffect(() => {
    localStorage.setItem('love_world_lang', lang);
  }, [lang]);

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
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
    if (showHero && activeTab === 'home') {
      return (
        <Hero 
          lang={lang} 
          onStart={(tab) => {
            setShowHero(false);
            setActiveTab(tab);
            localStorage.setItem('fb_hero_seen', 'true');
            sounds.play('click');
          }} 
        />
      );
    }

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
      case 'profile': return <UserProfile lang={lang} setLang={setLang} />;
      case 'about':
        return <About lang={lang} />;
      case 'home':
      default:
        return (
          <div className="w-full max-w-6xl mx-auto flex flex-col items-center mt-10">
            <header className="text-center mb-16 relative">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-block relative cursor-pointer group"
                onClick={() => setIsPopupOpen(true)}
              >
                <div className="absolute inset-0 bg-pink-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
                <span className="text-9xl mb-4 block relative drop-shadow-[0_0_30px_rgba(255,105,180,0.5)] group-hover:scale-110 transition-transform duration-500">
                  {selectedEmoji}
                </span>
                <div className="absolute -bottom-4 right-0 p-2 bg-white/20 backdrop-blur-md rounded-full border border-white/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles size={16} />
                </div>
              </motion.div>
              
              <div className="relative mt-8">
                <h1 className="text-5xl md:text-7xl font-display font-black text-white px-4 leading-tight group">
                  {lang === 'bn' ? 'শুভ জন্মদিন' : 'Happy Birthday'}<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-200">
                    {recipientName}
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-white/40 leading-relaxed px-6 italic font-serif mt-6">
                  "{lang === 'bn' ? customMessages.bn : customMessages.en}"
                </p>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full px-6 mb-20">
              <div className="lg:col-span-8 flex flex-col gap-8">
                <Slideshow />
                <Countdown lang={lang} />
              </div>
              <div className="lg:col-span-4 flex flex-col gap-8">
                <Weather lang={lang} />
                <MusicPlayer lang={lang} />
                <div 
                  onClick={() => setActiveTab('designer')}
                  className="glass-card rounded-[40px] p-10 flex flex-col items-center justify-center text-center gap-6 group cursor-pointer hover:bg-white/[0.06] transition-all"
                >
                  <div className="w-20 h-20 rounded-3xl bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Sparkles size={32} />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold mb-2">
                      {lang === 'bn' ? 'ডিজাইনার মোড' : 'Designer Mode'}
                    </h3>
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">Customize Theme</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0a1a]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 mb-8 border-t-2 border-[#c5a059] rounded-full mx-auto"
          />
          <h2 className="luxury-text tracking-[1em]">Establishing Connection</h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative font-sans pt-20 pb-20 px-5 flex flex-col items-center min-h-screen selection:bg-[#c5a059]/30">
      <Background />
      <NetworkStatus lang={lang} />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} />
      <FloatingEmojis symbol={floatingEmoji} />
      <MusicPlayer lang={lang} />
      <Popup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />

      {/* Language Toggle - Mobile Friendly Refined */}
      <div className="fixed top-20 right-5 z-[100]">
        <button
          onClick={() => { sounds.play('click'); setLang(lang === 'bn' ? 'en' : 'bn'); }}
          className="glass-card px-4 lg:px-6 py-2.5 lg:py-3 rounded-2xl text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-all border border-white/10 shadow-lg"
        >
          {lang === 'bn' ? 'English' : 'বাংলা'}
        </button>
      </div>

      <main className="relative z-10 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (showHero && activeTab === 'home' ? '-hero' : '-content')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Site Footer - New for website feel */}
      <footer className="w-full relative z-10 py-32 px-6 mt-40">
        <div className="max-w-7xl mx-auto">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-24" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#c5a059] flex items-center justify-center text-black">
                  <Heart size={20} fill="currentColor" />
                </div>
                <h2 className="text-3xl font-display font-black tracking-tight">FAMILY CELEBRATION</h2>
              </div>
              <p className="text-white/40 max-w-md font-sans font-light leading-relaxed mb-10 text-lg">
                {lang === 'bn' 
                  ? 'আমাদের পরিবারের সকল মাইলফলক এবং বিশেষ মুহূর্তগুলো ডিজিটাল মাধ্যমে সংরক্ষণ করার একটি নিরাপদ পৃথিবী।' 
                  : 'A dedicated digital sanctuary to preserve every milestone and special moment of our family life.'}
              </p>
              <div className="flex gap-4">
                <button onClick={() => setActiveTab('about')} className="text-[10px] font-bold uppercase tracking-widest text-[#c5a059] hover:text-white transition-colors">Our Story</button>
                <button onClick={() => setActiveTab('profile')} className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors">Settings</button>
              </div>
            </div>
            
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-white/20">Discovery</h4>
              <ul className="space-y-5 text-sm font-medium text-white/50">
                {['home', 'family', 'gallery', 'moments'].map(tab => (
                  <li key={tab}>
                    <button onClick={() => { setActiveTab(tab); setShowHero(false); window.scrollTo(0, 0); }} className="hover:text-white transition-colors flex items-center gap-2 group">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] opacity-0 group-hover:opacity-100 transition-opacity" />
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-white/20">System Status</h4>
              <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-white/40">Database</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <span className="text-[10px] uppercase font-bold text-emerald-500">Live</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-white/40">Cloud Storage</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-500">Active</span>
                </div>
                <div className="mt-2 pt-4 border-t border-white/5">
                   <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest">Version 2.4.0-Editorial</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-32 pt-12 border-t border-white/5 flex flex-col md:row items-center justify-between gap-8 text-center md:text-left">
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em]">
              &copy; {new Date().getFullYear()} Family Memory Site. All Rights Reserved.
            </p>
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-2 text-white/20">
                <LayoutDashboard size={14} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Admin Dashboard</span>
              </div>
              <div className="flex items-center gap-2 text-white/20">
                <Info size={14} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Help Center</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
