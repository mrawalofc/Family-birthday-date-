import React from 'react';

export const Letter: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  return (
    <div className="w-full max-w-3xl mx-auto py-10 px-5">
      <div className="text-center mb-10">
        <h2 className="font-serif text-5xl text-white mb-4 drop-shadow-[0_0_20px_rgba(255,105,180,0.6)]">
          My Love Letter
        </h2>
        <p className="text-white/70 italic text-lg">Words straight from my heart 💌</p>
      </div>

      <div className="bg-gradient-to-br from-white/12 to-white/5 backdrop-blur-xl rounded-[25px] p-10 md:p-14 border border-white/20 shadow-2xl relative overflow-hidden">
        {/* Rainbow top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 via-pink-600 to-yellow-500 animate-[rainbow_3s_linear_infinite]" style={{ backgroundSize: '300% 100%' }} />

        <div className="text-7xl text-center mb-8 animate-bounce">💌</div>

        {lang === 'bn' ? (
          <div>
            <div className="font-serif text-3xl text-[#ffb3d1] mb-5 text-right md:text-left">প্রিয়তমা,</div>
            <div className="font-sans text-xl md:text-2xl leading-[2.2] text-white/90 text-justify">
              <p className="mb-6">আমি জানি এই চিঠি লেখার মাধ্যমে আমার সব অনুভূতি প্রকাশ করা সম্ভব নয়। তবুও চেষ্টা করছি, কারণ তোমাকে ছাড়া আমার কথাগুলো অসম্পূর্ণ থেকে যায়।</p>
              <p className="mb-6">প্রথম দিন থেকেই তুমি আমার জীবনের সবচেয়ে সুন্দর অংশ। তোমার হাসি আমার দিনের আলো, তোমার কথা আমার প্রিয় সঙ্গীত, আর তোমার ছোঁয়া আমার শান্তি।</p>
              <p className="mb-6">যখন তুমি অভিমান করো, আমার পৃথিবী থেমে যায়। তোমার কষ্ট আমার কষ্ট, তোমার আনন্দ আমার আনন্দ। তুমি ছাড়া আমি অসম্পূর্ণ।</p>
              <p className="mb-6">আমি প্রতিজ্ঞা করছি — প্রতিটা দিন তোমাকে আরও বেশি ভালোবাসবো। তোমার সব অভিমান মুছে দেবো, তোমার সব স্বপ্ন পূরণ করবো। তুমি আমার একমাত্র।</p>
              <p className="text-right italic">চিরকাল তোমার,</p>
            </div>
            <div className="font-serif text-4xl text-[#ff6b9d] text-right mt-10 drop-shadow-md">তোমার প্রেমিক</div>
            <div className="text-right text-white/50 text-sm mt-2">২৭ এপ্রিল, ২০২৬</div>
          </div>
        ) : (
          <div>
            <div className="font-serif text-3xl text-[#ffb3d1] mb-5">My Dearest,</div>
            <div className="font-sans text-xl md:text-2xl leading-[2.2] text-white/90 text-justify">
              <p className="mb-6">I know it's impossible to express all my feelings through this letter. Yet I am trying, because without you, my words remain incomplete.</p>
              <p className="mb-6">From the very first day, you have been the most beautiful part of my life. Your smile is the light of my day, your voice is my favorite music, and your touch is my peace.</p>
              <p className="mb-6">When you are upset, my world stops. Your pain is my pain, your joy is my joy. Without you, I am incomplete.</p>
              <p className="mb-6">I promise — every day I will love you even more. I will wipe away all your sorrows, and fulfill all your dreams. You are my only one.</p>
              <p className="text-right italic">Forever yours,</p>
            </div>
            <div className="font-serif text-4xl text-[#ff6b9d] text-right mt-10 drop-shadow-md">Your Lover</div>
            <div className="text-right text-white/50 text-sm mt-2">April 27, 2026</div>
          </div>
        )}

        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#c44569] to-[#ff6b9d] mx-auto mt-10 flex items-center justify-center text-3xl shadow-lg border-2 border-white/20 animate-pulse">
          💕
        </div>
      </div>
    </div>
  );
};
