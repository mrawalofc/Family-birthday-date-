import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Send, Trash2, Copy, Check } from 'lucide-react';

interface PreviewTheme {
  name: string;
  gradient: string;
  accent: string;
  emoji: string;
}

const themes: PreviewTheme[] = [
  { name: 'Romantic Pink', gradient: 'from-pink-500 via-rose-500 to-pink-600', accent: '#ff6b9d', emoji: '💖' },
  { name: 'Midnight Love', gradient: 'from-[#1a0a2e] via-[#4a1942] to-[#893168]', accent: '#893168', emoji: '🌙' },
  { name: 'Sunset Glow', gradient: 'from-orange-400 via-pink-500 to-purple-600', accent: '#f8b500', emoji: '🌅' },
  { name: 'Pure White', gradient: 'from-white/20 via-white/10 to-transparent', accent: '#ffffff', emoji: '🤍' },
  { name: 'Emerald Heart', gradient: 'from-emerald-400 via-teal-500 to-cyan-600', accent: '#10b981', emoji: '💚' },
];

export const LivePreviewDesigner: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  const [text, setText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💕');
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [author, setAuthor] = useState('');
  const [copied, setCopied] = useState(false);

  const t = {
    bn: {
      title: "লাইভ প্রিভিউ ডিজাইনার",
      subtitle: "তোমার নিজস্ব রোমান্টিক মেসেজ তৈরি করো এবং রিয়েল-টাইমে দেখো ✨",
      editorTitle: "মেসেজ এডিটর",
      previewTitle: "লাইভ প্রিভিউ",
      textPlaceholder: "এখানে তোমার অনুভূতি লেখো...",
      authorPlaceholder: "তোমার নাম...",
      emojiLabel: "ইমোজি সিলেক্ট করো",
      themeLabel: "থিম সিলেক্ট করো",
      copyBtn: "কপি মেসেজ",
      resetBtn: "মুছে ফেলো",
    },
    en: {
      title: "Live Preview Designer",
      subtitle: "Create your own romantic message and see it in real-time ✨",
      editorTitle: "Message Editor",
      previewTitle: "Live Preview",
      textPlaceholder: "Write your feelings here...",
      authorPlaceholder: "Your name...",
      emojiLabel: "Select Emoji",
      themeLabel: "Select Theme",
      copyBtn: "Copy Message",
      resetBtn: "Clear",
    }
  };

  const l = t[lang];

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = () => {
    const fullMessage = `${selectedEmoji} ${text} \n\n— ${author}`;
    navigator.clipboard.writeText(fullMessage);
    setCopied(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-5">
      <div className="text-center mb-12">
        <h2 className="font-serif text-5xl text-white mb-4 drop-shadow-[0_0_20px_rgba(255,105,180,0.6)]">
          {l.title}
        </h2>
        <p className="text-white/70 italic text-lg">{l.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Editor Section */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-[30px] p-8 border border-white/20 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <Heart className="text-pink-400 animate-pulse" fill="#f472b6" size={24} />
            <h3 className="font-serif text-2xl text-white">{l.editorTitle}</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-white/60 text-sm mb-2 ml-2">{l.textPlaceholder}</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={lang === 'bn' ? "তোমার মেসেজ..." : "Type your message..."}
                className="w-full bg-black/30 border border-white/10 rounded-2xl p-5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all min-h-[150px] resize-none"
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2 ml-2">{l.authorPlaceholder}</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-3 ml-2">{l.emojiLabel}</label>
              <div className="flex flex-wrap gap-2">
                {['💕', '💖', '💌', '🌹', '🦋', '✨', '🔥', '👑', '💍', '🧸'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`text-2xl p-2 rounded-xl transition-all ${
                      selectedEmoji === emoji ? 'bg-pink-500 scale-110' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-3 ml-2">{l.themeLabel}</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {themes.map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => setSelectedTheme(theme)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-all border ${
                      selectedTheme.name === theme.name 
                        ? 'border-white/50 bg-white/20' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${theme.gradient}`} />
                    <span className="truncate">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleCopy}
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold group"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? (lang === 'bn' ? "কপি হয়েছে!" : "Copied!") : l.copyBtn}
              </button>
              <button
                onClick={() => { setText(''); setAuthor(''); }}
                className="p-3 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 rounded-xl transition-all"
                title={l.resetBtn}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Preview Section */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-6 ml-2">
            <Sparkles className="text-yellow-400 animate-pulse" size={24} />
            <h3 className="font-serif text-2xl text-white">{l.previewTitle}</h3>
          </div>

          <div className="flex-1 bg-black/40 backdrop-blur-sm rounded-[40px] p-6 md:p-10 border border-white/10 shadow-2xl flex items-center justify-center relative overflow-hidden">
            {/* Background decoration */}
            <div className={`absolute top-0 left-0 w-full h-full opacity-10 bg-gradient-to-br ${selectedTheme.gradient}`} />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTheme.name + text + selectedEmoji}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full max-w-sm rounded-[30px] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-white/20 relative z-10 bg-gradient-to-br ${selectedTheme.gradient}`}
              >
                <div className="absolute top-4 left-4 text-white/20">✨</div>
                <div className="absolute bottom-4 right-4 text-white/20">✨</div>
                
                <div className="text-center">
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-6xl mb-6 inline-block"
                  >
                    {selectedEmoji}
                  </motion.div>
                  
                  <div className="min-h-[100px] flex items-center justify-center">
                    <p className="font-sans text-xl md:text-2xl leading-relaxed text-white font-medium drop-shadow-md">
                      {text || (lang === 'bn' ? "তোমার মেসেজ এখানে দেখা যাবে..." : "Your message will appear here...")}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-col items-center">
                    <div className="w-12 h-0.5 bg-white/30 mb-4" />
                    <p className="font-serif text-2xl text-white/90 italic drop-shadow-sm">
                      {author ? `With Love, ${author}` : (lang === 'bn' ? "তোমার নাম" : "Your Name")}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute bottom-10 left-10 text-4xl opacity-20 pointer-events-none"
            >
              ❤️
            </motion.div>
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4, delay: 1 }}
              className="absolute top-10 right-10 text-4xl opacity-20 pointer-events-none"
            >
              🌹
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
