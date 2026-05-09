import React from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, Calendar, Camera } from 'lucide-react';

interface HeroProps {
  lang: 'bn' | 'en';
  onStart: (tab: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ lang, onStart }) => {
  const content = {
    bn: {
      title: "পারিবারিক উদ্‌যাপন",
      subtitle: "স্মৃতিগুলো থাকুক চিরকাল",
      desc: "আমাদের পরিবারের প্রতিটি মুহূর্ত, জন্মদিন এবং আনন্দঘন দিনগুলো সংরক্ষণ করার একটি নিরাপদ জায়গা। চলো আমরা একসাথে এই বিশেষ দিনগুলো উদযাপন করি।",
      cta: "অন্বেষণ শুরু করুন",
      features: [
        { icon: <Calendar size={20} />, label: "জন্মদিন ট্র্যাকার" },
        { icon: <Camera size={20} />, label: "পারিবারিক অ্যালবাম" },
        { icon: <Sparkles size={20} />, label: "স্মৃতি সংরক্ষণ" }
      ]
    },
    en: {
      title: "Family Celebration",
      subtitle: "Where Memories Live Forever",
      desc: "A dedicated sanctuary to preserve every milestone, birthday, and cherished moment of our family. Join us in celebrating these special days together.",
      cta: "Begin Your Journey",
      features: [
        { icon: <Calendar size={20} />, label: "Birthday Tracker" },
        { icon: <Camera size={20} />, label: "Shared Albums" },
        { icon: <Sparkles size={20} />, label: "Moments Captured" }
      ]
    }
  };

  const t = content[lang];

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-40 px-6 overflow-hidden">
      {/* Cinematic Overlays */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#c5a059]/10 blur-[150px] rounded-full" 
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-rose-500/10 blur-[150px] rounded-full" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-6xl relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass-card text-[10px] font-black uppercase tracking-[0.4em] text-[#c5a059] mb-12 shadow-[0_0_40px_rgba(197,160,89,0.1)]"
        >
          <Sparkles size={14} />
          {lang === 'bn' ? 'স্বাগতম আমাদের ভালোবাসার নীড়ে' : 'Welcome to Our Sanctuary of Love'}
        </motion.div>

        <h1 className="text-7xl md:text-[160px] font-display font-black mb-10 text-gradient leading-[0.8] tracking-tighter italic">
          {t.title}
        </h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-2xl md:text-4xl font-display italic font-medium text-[#c5a059] mb-12 leading-tight max-w-4xl mx-auto"
        >
          {t.subtitle}
        </motion.p>

        <div className="w-24 h-px bg-[#c5a059]/30 mx-auto mb-12 shadow-[0_0_10px_rgba(197,160,89,0.5)]" />

        <p className="text-lg md:text-xl text-white/40 max-w-xl mx-auto mb-16 font-sans font-extralight leading-relaxed italic">
          {t.desc}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-40">
          <button
            onClick={() => onStart('family')}
            className="px-12 py-7 rounded-2xl bg-white text-black font-black text-[13px] uppercase tracking-[0.2em] hover:bg-[#c5a059] transition-all transform hover:scale-105 active:scale-95 shadow-[0_32px_64px_-16px_rgba(255,255,255,0.2)] group flex items-center gap-3 premium-btn"
          >
            <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
            {t.cta}
          </button>
          <button
            onClick={() => onStart('gallery')}
            className="px-12 py-7 rounded-2xl bg-white/[0.02] backdrop-blur-xl text-white font-black text-[13px] uppercase tracking-[0.2em] hover:bg-white/[0.05] transition-all transform hover:scale-105 active:scale-95 border border-white/10 group flex items-center gap-3"
          >
            <Camera size={18} className="group-hover:scale-110 transition-transform text-[#c5a059]" />
            {lang === 'bn' ? 'অ্যালবাম দেখুন' : 'View Gallery'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 max-w-4xl mx-auto">
          {t.features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + (i * 0.2) }}
              className="group p-8 rounded-[40px] relative transition-all duration-500 hover:bg-white/[0.02]"
            >
              <div className="w-16 h-16 rounded-3xl bg-white/[0.05] flex items-center justify-center text-[#c5a059] mb-6 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                {f.icon}
              </div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/80 mb-2">{f.label}</h4>
              <div className="w-8 h-0.5 bg-[#c5a059]/20 mx-auto rounded-full" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
