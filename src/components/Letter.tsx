import React from 'react';
import { motion } from 'motion/react';
import { Heart, Feather, Sparkles } from 'lucide-react';

export const Letter: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  return (
    <div className="w-full max-w-4xl mx-auto py-24 px-6 relative">
      <div className="text-center mb-16 space-y-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass-card luxury-text text-[#c5a059] mb-4 shadow-xl"
        >
          <Feather size={14} className="fill-[#c5a059]" />
          {lang === 'bn' ? 'হৃদয় হতে কিছু কথা' : 'Soul Reflections'}
        </motion.div>
        
        <h2 className="font-display font-black text-7xl md:text-[100px] text-gradient italic leading-[0.8] tracking-tighter">
          {lang === 'bn' ? 'ভালোবাসার চিঠি' : 'The Letter'}
        </h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="luxury-text pt-6 max-w-xl mx-auto leading-relaxed opacity-60"
        >
          {lang === 'bn' ? 'আমার মনের গোপন কথাগুলো তোমার জন্য' : 'A devoted message from the depths of my soul'}
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white/[0.02] backdrop-blur-3xl rounded-[60px] p-12 md:p-20 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden group"
      >
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#c5a059]/5 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-rose-500/5 blur-[100px] rounded-full" />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-16">
            <div className="text-5xl opacity-80 filter grayscale brightness-200">💌</div>
            <div className="text-right">
              <p className="luxury-text text-[#c5a059] text-[10px]">{lang === 'bn' ? '২৭ এপ্রিল, ২০২৬' : 'April 27, 2026'}</p>
              <div className="w-12 h-0.5 bg-[#c5a059]/30 ml-auto mt-2 rounded-full" />
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <h3 className="font-display italic text-4xl text-white mb-10 tracking-tight">
                {lang === 'bn' ? 'প্রিয়তমা,' : 'My Dearest,'}
              </h3>
              
              <div className="font-sans text-xl md:text-2xl leading-[2.4] text-white/70 space-y-8 font-light italic">
                {lang === 'bn' ? (
                  <>
                    <p>আমি জানি এই চিঠি লেখার মাধ্যমে আমার সব অনুভূতি প্রকাশ করা সম্ভব নয়। তবুও চেষ্টা করছি, কারণ তোমাকে ছাড়া আমার কথাগুলো অসম্পূর্ণ থেকে যায়।</p>
                    <p>প্রথম দিন থেকেই তুমি আমার জীবনের সবচেয়ে সুন্দর অংশ। তোমার হাসি আমার দিনের আলো, তোমার কথা আমার প্রিয় সঙ্গীত, আর তোমার ছোঁয়া আমার শান্তি।</p>
                    <p>যখন তুমি অভিমান করো, আমার পৃথিবী থেমে যায়। তোমার কষ্ট আমার কষ্ট, তোমার আনন্দ আমার আনন্দ। তুমি ছাড়া আমি অসম্পূর্ণ।</p>
                    <p>আমি প্রতিজ্ঞা করছি — প্রতিটা দিন তোমাকে আরও বেশি ভালোবাসবো। তোমার সব অভিমান মুছে দেবো, তোমার সব স্বপ্ন পূরণ করবো। তুমি আমার একমাত্র।</p>
                  </>
                ) : (
                  <>
                    <p>I know it's impossible to express all my feelings through this letter. Yet I am trying, because without you, my words remain incomplete.</p>
                    <p>From the very first day, you have been the most beautiful part of my life. Your smile is the light of my day, your voice is my favorite music, and your touch is my peace.</p>
                    <p>When you are upset, my world stops. Your pain is my pain, your joy is my joy. Without you, I am incomplete.</p>
                    <p>I promise — every day I will love you even more. I will wipe away all your sorrows, and fulfill all your dreams. You are my only one.</p>
                  </>
                )}
              </div>
            </div>

            <div className="pt-12 border-t border-white/5 flex flex-col items-end gap-2">
              <p className="luxury-text opacity-40 text-sm italic">{lang === 'bn' ? 'চিরকাল তোমার,' : 'Forever yours,'}</p>
              <h4 className="font-display italic text-5xl text-gradient pr-2">
                {lang === 'bn' ? 'তোমার প্রেমিক' : 'Your Lover'}
              </h4>
            </div>
          </div>
        </div>

        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-24 h-24 rounded-full bg-white text-black mx-auto mt-20 flex items-center justify-center text-3xl shadow-[0_20px_40px_rgba(255,255,255,0.1)] border border-white/20"
        >
          <Heart size={32} fill="black" className="animate-pulse text-rose-500" />
        </motion.div>
      </motion.div>
    </div>
  );
};
