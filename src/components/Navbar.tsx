import React from 'react';
import { Home, Mail, Image, FileText, Timer, User, HelpCircle, Sparkles, MessageSquare, Clock, Users, Heart } from 'lucide-react';
import { sounds } from '../lib/sounds';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: 'bn' | 'en';
}

const labels = {
  bn: {
    home: 'হোম',
    messages: 'মেসেজ',
    gallery: 'অ্যালবাম',
    letter: 'চিঠি',
    countdown: 'কাউন্টডাউন',
    family: 'ফ্যামিলি',
    nextFamily: 'পরবর্তী উৎসব',
    monitoring: 'মনিটরিং',
    designer: 'ডিজাইনার',
    'public-info': 'ফরম',
    quiz: 'কুইজ',
    profile: 'প্রোফাইল',
    about: 'আমাদের গল্প',
  },
  en: {
    home: 'Home',
    messages: 'Messages',
    gallery: 'Albums',
    letter: 'Letter',
    countdown: 'Countdown',
    family: 'Family',
    nextFamily: 'Next Family',
    monitoring: 'Monitoring',
    designer: 'Designer',
    'public-info': 'Form',
    quiz: 'Quiz',
    profile: 'Profile',
    about: 'Story',
  }
};

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, lang }) => {
  const l = labels[lang];
  const links = [
    { id: 'home', label: l.home, icon: <Home size={16} /> },
    { id: 'family', label: l.family, icon: <Users size={16} /> },
    { id: 'gallery', label: l.gallery, icon: <Image size={16} /> },
    { id: 'moments', label: lang === 'bn' ? 'মুহূর্ত' : 'Moments', icon: <Clock size={16} /> },
    { id: 'about', label: l.about, icon: <HelpCircle size={16} /> },
    { id: 'profile', label: l.profile, icon: <User size={16} /> },
  ];

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-48px)] max-w-5xl transition-all duration-300">
      <div className="glass-card rounded-[32px] px-6 lg:px-8 h-16 lg:h-20 flex items-center justify-between shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border border-white/10">
        <button
          onClick={() => { sounds.play('click'); setActiveTab('home'); }}
          className="font-display font-black text-lg lg:text-xl text-white flex items-center gap-3 hover:scale-105 transition-transform tracking-tight min-w-fit"
        >
          <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-xl bg-[#c5a059] flex items-center justify-center text-black shadow-[0_0_20px_rgba(197,160,89,0.3)]">
            <Heart size={18} fill="currentColor" className="lg:scale-110" />
          </div>
          <span className="hidden sm:inline">FAMILY CELEBRATION</span>
        </button>
        
        <div className="hidden lg:flex gap-2">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => { sounds.play('transition'); setActiveTab(link.id); }}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-400 border-none cursor-pointer ${
                activeTab === link.id
                  ? 'bg-[#c5a059] text-black shadow-lg shadow-[#c5a059]/20 translate-y-[-2px]'
                  : 'bg-transparent text-white/30 hover:bg-white/5 hover:text-white uppercase'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
        
        {/* Mobile icons container */}
        <div className="flex lg:hidden gap-1.5 items-center">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => { sounds.play('transition'); setActiveTab(link.id); }}
              className={`p-3 rounded-xl transition-all border-none shrink-0 ${
                activeTab === link.id ? 'bg-[#c5a059] text-black shadow-lg' : 'text-white/40 hover:bg-white/5'
              }`}
            >
              {React.cloneElement(link.icon as React.ReactElement, { size: 18 })}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
