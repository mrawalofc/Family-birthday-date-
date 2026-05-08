import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  emoji: string;
  text: string;
  tag: string;
  tagText: string;
  detail: string;
}

const messagesData: Record<'bn' | 'en', Message[]> = {
  bn: [
    // Romantic
    { emoji: "💖", text: "তুমি আমার জীবনের সবচেয়ে সুন্দর উপহার। প্রতিদিন তোমাকে ভালোবাসি আরও বেশি।", tag: "romantic", tagText: "ভালোবাসা", detail: "তুমি আমার জীবনের সবচেয়ে বড় আশীর্বাদ। তোমার হাসি দেখলে আমার সব দুঃখ উড়ে যায়। চিরকাল তোমার পাশে থাকতে চাই। 💕" },
    { emoji: "🌙", text: "চাঁদের আলোয় যত তারা জ্বলে, তোমার চেয়ে সুন্দর কিছুই নেই এই পৃথিবীতে।", tag: "romantic", tagText: "রোমান্টিক", detail: "প্রতি রাতে চাঁদের দিকে তাকালে তোমার কথা মনে পড়ে। তুমি আমার চাঁদ, তুমি আমার তারা, তুমি আমার সবকিছু। 🌙✨" },
    { emoji: "🌹", text: "হাজার গোলাপ ফুটুক, কিন্তু তোমার মতো সুন্দর কেউ হবে না। তুমি আমার একমাত্র গোলাপ।", tag: "romantic", tagText: "প্রশংসা", detail: "গোলাপের সৌন্দর্য কাঁটা সহ্য করে ফোটে। তোমার মতো সুন্দর হতে হলে কিছু কষ্ট সহ্য করতেই হয়। তুমি আমার গোলাপ। 🌹" },
    { emoji: "💫", text: "তোমার চোখে যে জাদু আছে, তাতে আমি হারিয়ে যাই বারবার। তুমি আমার স্বপ্নের রানী।", tag: "romantic", tagText: "রোমান্টিক", detail: "তোমার চোখে আমি আমার ভবিষ্যৎ দেখি। সেই চোখে আমি হারিয়ে যেতে চাই চিরকাল। তুমি আমার রানী। 👑💕" },
    { emoji: "🔥", text: "তুমি আমার হৃদয়ের আগুন। তোমার ছোঁয়ায় আমার সব ঠাণ্ডা হৃদয় গরম হয়ে ওঠে।", tag: "romantic", tagText: "আবেগ", detail: "তোমার প্রতি আমার ভালোবাসা কখনো ঠান্ডা হবে না। এটা চিরকাল জ্বলবে, চিরকাল পোড়াবে, চিরকাল আলো দেবে। 🔥💖" },
    { emoji: "💍", text: "তোমার সাথে প্রতিটা মুহূর্ত আমার জীবনের সেরা মুহূর্ত। চিরকাল তোমার হতে চাই।", tag: "romantic", tagText: "চিরকাল", detail: "প্রতি মুহূর্ত তোমার সাথে আমার জন্য অমূল্য। চিরকাল তোমার হাত ধরে হাঁটতে চাই। তুমি আমার চিরকাল। 💍💕" },
    { emoji: "🎵", text: "তোমার হাসি আমার প্রিয় সঙ্গীত। তোমার কণ্ঠ আমার প্রিয় গান। তুমি আমার সবকিছু।", tag: "romantic", tagText: "সঙ্গীত", detail: "তোমার হাসি শুনলে পৃথিবীর সব গান ফিকে লাগে। তুমি আমার প্রিয় সুর, তুমি আমার প্রিয় গান। 🎵💖" },
    { emoji: "✨", text: "তুমি ছাড়া আমার জীবন অন্ধকার। তুমি আমার আলো, তুমি আমার সব।", tag: "romantic", tagText: "আলো", detail: "তুমি ছাড়া আমার জীবনের কোনো রং নেই। তুমি আমার সব রং, তুমি আমার আলো, তুমি আমার জীবন। ✨💕" },
    { emoji: "🦋", text: "তোমার কথা ভাবলেই পেটের মধ্যে প্রজাপতি উড়তে শুরু করে। এটাই কি ভালোবাসা?", tag: "romantic", tagText: "মিষ্টি", detail: "হ্যাঁ, এটাই ভালোবাসা। তোমার কথা ভাবলেই হৃদয় দ্রুত ধড়ফড় করে। তুমি আমার প্রথম এবং শেষ ভালোবাসা। 🦋💕" },
    { emoji: "🌧️", text: "বৃষ্টির দিনে তোমার হাত ধরে হাঁটার স্বপ্ন দেখি। তুমি ছাড়া বৃষ্টিও ফাঁকা লাগে।", tag: "romantic", tagText: "স্বপ্ন", detail: "বৃষ্টির শব্দ শুনলে তোমার কথা মনে পড়ে। তোমার সাথে বৃষ্টিতে ভিজতে চাই। তুমি আমার বৃষ্টির দিনের সঙ্গী। 🌧️💕" },
    // Emotional
    { emoji: "😢", text: "তুমি যখন কাঁদো, আমার চোখেও জল আসে। তোমার কষ্ট আমি নিজের কষ্ট বলে মনে করি।", tag: "emotional", tagText: "আবেগ", detail: "তোমার কান্না আমাকে ভেঙে দেয়। তোমার মুখে হাসি ফোটানোর জন্য আমি সবকিছু করতে পারি। তুমি আমার সব। 😢💕" },
    { emoji: "💔", text: "তুমি ছাড়া একটা মুহূর্তও কাটে না। তোমার অভাব আমার হৃদয়ে একটা ফাঁকা জায়গা তৈরি করে।", tag: "emotional", tagText: "অনুপস্থিতি", detail: "তুমি দূরে থাকলে সময় যেন থেমে যায়। প্রতিটা সেকেন্ড তোমাকে ছাড়া কষ্টকর। তাড়াতাড়ি ফিরে এসো। 💔💕" },
    { emoji: "🥺", text: "তুমি জানো? তোমার একটা মেসেজের জন্য আমি সারাদিন অপেক্ষা করি। তুমি আমার সবকিছু।", tag: "emotional", tagText: "অপেক্ষা", detail: "তোমার একটা মেসেজ পেলে আমার দিন উজ্জ্বল হয়ে ওঠে। তুমি ছাড়া আমার কিছুই ভালো লাগে না। 🥺💕" },
    { emoji: "😔", text: "যখন তুমি রাগ করো, আমার পৃথিবী থেমে যায়। তোমার রাগের চেয়ে বড় কিছু নেই আমার কাছে।", tag: "emotional", tagText: "রাগ", detail: "তোমার রাগ দেখলে আমার হৃদয় ভেঙে যায়। তোমার সাথে কখনো ঝগড়া করতে চাই না। তুমি আমার শান্তি। 😔💕" },
    { emoji: "💌", text: "তোমাকে ছাড়া আমার কোনো অস্তিত্ব নেই। তুমি আমার শ্বাস, তুমি আমার হৃদয়স্পন্দন।", tag: "emotional", tagText: "অস্তিত্ব", detail: "তুমি ছাড়া আমি অসম্পূর্ণ। তুমি আমার প্রতিটা শ্বাসে, প্রতিটা হৃদয়স্পন্দনে। তুমি ছাড়া বাঁচতে পারবো না। 💌💕" },
    { emoji: "🌙", text: "রাতে ঘুমাতে যাওয়ার আগে শুধু একটাই কাজ করি — তোমার ছবি দেখি আর কাঁদি।", tag: "emotional", tagText: "রাত", detail: "তোমার কথা ভেবে রাতে ঘুম আসে না। চোখ বন্ধ করলেই তোমার মুখ ভেসে ওঠে। তুমি আমার স্বপ্ন, তুমি আমার জাগরণ। 🌙😢" },
    { emoji: "🤍", text: "তুমি আমার প্রথম ভালোবাসা, আর শেষ ভালোবাসাও তুমিই হবে। এই প্রতিজ্ঞা আমার।", tag: "emotional", tagText: "প্রতিজ্ঞা", detail: "পৃথিবীর কেউ বদলাতে পারে, কিন্তু আমার ভালোবাসা কখনো বদলাবে না। তুমি আমার প্রথম এবং শেষ। 🤍💕" },
    { emoji: "💫", text: "তোমাকে ছাড়া আমার জীবনের কোনো অর্থ নেই। তুমি ছাড়া সবকিছু ফাঁকা, সবকিছু শূন্য।", tag: "emotional", tagText: "শূন্যতা", detail: "তুমি ছাড়া পৃথিবীর সব সৌন্দর্য ম্লান। তুমি আমার জীবনের অর্থ, তুমি আমার সবকিছু। 💫💕" },
    // Jokes
    { emoji: "😂", text: "তুমি আমাকে ভালোবাসো কেন? — কারণ তুমি ছাড়া আমার কোনো বিকল্প নেই! 😜", tag: "joke", tagText: "মজা", detail: "সত্যি কথা বলতে কি, তুমি ছাড়া আমার কোনো প্ল্যান বি নেই! তুমি আমার একমাত্র অপশন, আর সেটাই আমার সেরা চয়েস। 😂💕" },
    { emoji: "🍕", text: "তুমি আর পিজ্জার মধ্যে পার্থক্য কী? — পিজ্জা ৩০ মিনিটে আসে, তুমি আমার হৃদয়ে চিরকাল!", tag: "joke", tagText: "মজা", detail: "পিজ্জা তো শেষ হয়ে যায়, কিন্তু তুমি আমার হৃদয়ে চিরকাল থাকবে। তুমি আমার প্রিয় 'ফুড' নও, তুমি আমার প্রিয় 'মুড'! 🍕💕" },
    { emoji: "📱", text: "তুমি আমার ফোনের ব্যাটারির মতো — তুমি ছাড়া আমি চলতে পারি না! 🔋", tag: "joke", tagText: "মজা", detail: "ফোনের ব্যাটারি শেষ হলে চার্জ দেওয়া যায়, কিন্তু তুমি ছাড়া আমার কোনো চার্জার কাজ করে না! তুমি আমার পাওয়ার ব্যাংক। 📱💕" },
    { emoji: "🐻", text: "তুমি टेডি বিয়ারের চেয়েও নরম। কিন্তু তোমাকে জড়িয়ে ধরলে আমি ঘুমিয়ে পড়ি না, বরং জেগে থাকি!", tag: "joke", tagText: "মজা", detail: "টেডি বিয়ার তো ঘুম পাড়ায়, কিন্তু তুমি তো আমার ঘুম কেড়ে নাও! তোমার কথা ভেবে রাত জেগে থাকি। 🐻💕" },
    { emoji: "🍫", text: "তুমি চকোলেটের চেয়েও মিষ্টি। কিন্তু তোমাকে খেতে পারি না, কারণ তুমি তো আমার GF!", tag: "joke", tagText: "মজা", detail: "চকোলেট তো মুখে দিলেই শেষ, কিন্তু তুমি তো আমার হৃদয়ে চিরকাল। তুমি আমার সবচেয়ে মিষ্টি 'ফরবিডেন' ফ্রুট! 🍫💕" },
    { emoji: "😴", text: "আমি যখন ঘুমাই, তখন স্বপ্নে তোমাকে দেখি। আর যখন জেগে থাকি, তখন তোমাকে মিস করি। কোনো ছুটি নেই!", tag: "joke", tagText: "মজা", detail: "২৪ ঘন্টা, ৭ দিন, ৩৬৫ দিন — কোনো ছুটি নেই! তোমাকে ভাবা আমার ফুলটাইম জব। স্যালারি? তোমার একটা হাসি! 😴💕" },
    { emoji: "🤓", text: "তুমি আমাকে পাগল বলো? হ্যাঁ, আমি পাগল — তোমার ভালোবাসায় পাগল!", tag: "joke", tagText: "মজা", detail: "ডাক্তার বলেছে আমি পাগল। কারণ বলেছি আমি তোমাকে ছাড়া বাঁচতে পারবো না! ডাক্তারও হেসে বলেছে — 'এটা পাগলামি নয়, এটা ভালোবাসা!' 🤓💕" },
    { emoji: "🍔", text: "তুমি বার্গারের চেয়েও জুসি। কিন্তু তোমাকে কামড়ালে আমার দাঁত নয়, হৃদয় ভাঙে!", tag: "joke", tagText: "মজা", detail: "বার্গার তো পেটে যায়, কিন্তু তুমি তো আমার হৃদয়ে। তোমাকে কামড়ানোর চেয়ে বরং জড়িয়ে ধরতে চাই! 🍔💕" },
    // Morning
    { emoji: "☕", text: "সকালের প্রথম চায়ের মতো তুমি — গরম, মিষ্টি, আর আমার দিন শুরুর সেরা অংশ।", tag: "morning", tagText: "সুপ্রভাত", detail: "প্রতি সকাল তোমার কথা ভেবে শুরু করি। তুমি ছাড়া সকালও অন্ধকার লাগে। তুমি আমার সূর্যোদয়। ☀️💕" },
    { emoji: "🌅", text: "সূর্যোদয়ের আলো তোমার মুখে পড়লে পৃথিবী থেমে যায়। তুমি আমার সূর্য।", tag: "morning", tagText: "সুপ্রভাত", detail: "তোমার হাসি আমার দিনের প্রথম আলো। তুমি ছাড়া সকাল শুরু হয় না। তুমি আমার সূর্য, তুমি আমার আলো। ☀️💖" },
    { emoji: "🌻", text: "সুপ্রভাত প্রিয়তমা! তোমার দিনটা যেন ফুলের মতো সুন্দর হয়। আমি তোমাকে ভালোবাসি!", tag: "morning", tagText: "সুপ্রভাত", detail: "প্রতিটা সকাল তোমার জন্য একটা নতুন সুযোগ। তোমার হাসি দিয়ে দিন শুরু করো। আমি সবসময় তোমার পাশে আছি। 🌻💕" },
    { emoji: "☀️", text: "সূর্য উঠেছে কিন্তু তোমার চেয়ে উজ্জ্বল কিছুই নেই। গুড মর্নিং আমার সূর্য!", tag: "morning", tagText: "সুপ্রভাত", detail: "সূর্যের আলো তোমার মুখে পড়লে মনে হয় সূর্য নিজেই লজ্জা পায়। তুমি আমার সবচেয়ে উজ্জ্বল সকাল। ☀️💕" },
    // Night
    { emoji: "🌙", text: "চাঁদের আলোয় যত তারা জ্বলে, তুমি আমার সবচেয়ে সুন্দর স্বপ্ন। শুভ রাত্রি প্রিয়তমা।", tag: "night", tagText: "শুভ রাত্রি", detail: "রাতের আকাশে চাঁদ উঠেছে, কিন্তু তোমার চেয়ে সুন্দর কিছু নেই। তোমাকে নিয়ে স্বপ্ন দেখবো আজ রাতে। 🌙💕" },
    { emoji: "😴", text: "তুমি ছাড়া ঘুম আসে না। তোমার কথা ভেবে রাত জেগে থাকি। শুভ রাত্রি আমার জান।", tag: "night", tagText: "শুভ রাত্রি", detail: "তোমার কথা না ভেবে ঘুমাতে গেলে ঘুম আসে না। তোমাকে নিয়ে স্বপ্ন দেখতেই ভালো লাগে। শুভ রাত্রি। 😴💕" },
    { emoji: "⭐", text: "তারারা জ্বলে তোমাকে দেখতে। কারণ তারাও জানে তুমি পৃথিবীর সবচেয়ে সুন্দর। গুড নাইট!", tag: "night", tagText: "শুভ রাত্রি", detail: "তারারা রাতে জ্বলে কিন্তু তোমার চেয়ে উজ্জ্বল কিছু নেই। তোমাকে নিয়ে সুন্দর স্বপ্ন দেখো। আমি তোমাকে ভালোবাসি। ⭐💕" },
    { emoji: "🌌", text: "রাতের আকাশ যেমন তারায় ভরা, আমার হৃদয় তেমনি তোমার ভালোবাসায় ভরা। শুভ রাত্রি!", tag: "night", tagText: "শুভ রাত্রি", detail: "রাতের আকাশে হাজার তারা, কিন্তু আমার হৃদয়ে শুধু তুমি। তোমাকে নিয়ে স্বপ্ন দেখবো আজ। শুভ রাত্রি প্রিয়তমা। 🌌💕" }
  ],
  en: [
    // Romantic
    { emoji: "💖", text: "You are the most beautiful gift in my life. I love you more with each passing day.", tag: "romantic", tagText: "Love", detail: "You are the biggest blessing in my life. Your smile makes all my sorrows fly away. I want to be by your side forever. 💕" },
    { emoji: "🌙", text: "As many stars shine in the moonlight, nothing is more beautiful than you in this world.", tag: "romantic", tagText: "Romantic", detail: "Every night when I look at the moon, I think of you. You are my moon, you are my star, you are my everything. 🌙✨" },
    { emoji: "🌹", text: "Let a thousand roses bloom, but no one will be as beautiful as you. You are my only rose.", tag: "romantic", tagText: "Praise", detail: "A rose's beauty comes from enduring thorns. To be as beautiful as you, one must endure some pain. You are my rose. 🌹" },
    { emoji: "💫", text: "The magic in your eyes makes me lose myself again and again. You are the queen of my dreams.", tag: "romantic", tagText: "Romantic", detail: "In your eyes, I see my future. I want to get lost in those eyes forever. You are my queen. 👑💕" },
    { emoji: "🔥", text: "You are the fire of my heart. Your touch warms my cold heart completely.", tag: "romantic", tagText: "Passion", detail: "My love for you will never cool down. It will burn forever, forever warm, forever light up my life. 🔥💖" },
    { emoji: "💍", text: "Every moment with you is the best moment of my life. I want to be yours forever.", tag: "romantic", tagText: "Forever", detail: "Every moment with you is priceless to me. I want to walk holding your hand forever. You are my forever. 💍💕" },
    { emoji: "🎵", text: "Your smile is my favorite music. Your voice is my favorite song. You are my everything.", tag: "romantic", tagText: "Music", detail: "Your laugh makes all the songs in the world sound dull. You are my favorite tune, you are my favorite song. 🎵💖" },
    { emoji: "✨", text: "My life is dark without you. You are my light, you are my everything.", tag: "romantic", tagText: "Light", detail: "Without you, my life has no color. You are all my colors, you are my light, you are my life. ✨💕" },
    { emoji: "🦋", text: "Butterflies start flying in my stomach when I think of you. Is this what love is?", tag: "romantic", tagText: "Sweet", detail: "Yes, this is love. My heart races when I think of you. You are my first and last love. 🦋💕" },
    { emoji: "🌧️", text: "I dream of walking holding your hand on a rainy day. Even rain feels empty without you.", tag: "romantic", tagText: "Dream", detail: "The sound of rain reminds me of you. I want to get wet in the rain with you. You are my rainy day companion. 🌧️💕" },
    // Emotional
    { emoji: "😢", text: "When you cry, tears come to my eyes too. I feel your pain as my own pain.", tag: "emotional", tagText: "Emotion", detail: "Your tears break me. I would do anything to bring a smile to your face. You are my everything. 😢💕" },
    { emoji: "💔", text: "I can't spend a moment without you. Your absence creates an empty space in my heart.", tag: "emotional", tagText: "Absence", detail: "When you are far away, time seems to stop. Every second without you is painful. Come back soon. 💔💕" },
    { emoji: "🥺", text: "You know? I wait all day for just one message from you. You are my everything.", tag: "emotional", tagText: "Waiting", detail: "One message from you brightens my entire day. Without you, nothing feels good. 🥺💕" },
    { emoji: "😔", text: "When you get angry, my world stops. Nothing is bigger than your anger to me.", tag: "emotional", tagText: "Anger", detail: "Seeing you angry breaks my heart. I never want to fight with you. You are my peace. 😔💕" },
    { emoji: "💌", text: "I have no existence without you. You are my breath, you are my heartbeat.", tag: "emotional", tagText: "Existence", detail: "Without you, I am incomplete. You are in my every breath, every heartbeat. I cannot live without you. 💌💕" },
    { emoji: "🌙", text: "Before sleeping at night, I do only one thing — look at your picture and cry.", tag: "emotional", tagText: "Night", detail: "I can't sleep thinking of you. When I close my eyes, your face appears. You are my dream, you are my wakefulness. 🌙😢" },
    { emoji: "🤍", text: "You are my first love, and you will be my last love too. This is my promise.", tag: "emotional", tagText: "Promise", detail: "The world may change, but my love for you will never change. You are my first and last. 🤍💕" },
    { emoji: "💫", text: "Without you, my life has no meaning. Without you, everything is empty, everything is void.", tag: "emotional", tagText: "Void", detail: "Without you, all the beauty of the world fades. You are the meaning of my life, you are my everything. 💫💕" },
    // Jokes
    { emoji: "😂", text: "Why do you love me? — Because I have no other option without you! 😜", tag: "joke", tagText: "Funny", detail: "Truth be told, I have no plan B without you! You are my only option, and that's my best choice. 😂💕" },
    { emoji: "🍕", text: "What's the difference between you and pizza? — Pizza comes in 30 minutes, you are in my heart forever!", tag: "joke", tagText: "Funny", detail: "Pizza finishes, but you will stay in my heart forever. You are not my favorite 'food', you are my favorite 'mood'! 🍕💕" },
    { emoji: "📱", text: "You are like my phone battery — I can't function without you! 🔋", tag: "joke", tagText: "Funny", detail: "Phone battery can be recharged, but without you, no charger works for me! You are my power bank. 📱💕" },
    { emoji: "🐻", text: "You are softer than a teddy bear. But when I hug you, I don't fall asleep, I stay awake!", tag: "joke", tagText: "Funny", detail: "Teddy bear puts me to sleep, but you steal my sleep! I stay awake all night thinking of you. 🐻💕" },
    { emoji: "🍫", text: "You are sweeter than chocolate. But I can't eat you, because you are my GF!", tag: "joke", tagText: "Funny", detail: "Chocolate finishes in the mouth, but you stay in my heart forever. You are my sweetest 'forbidden' fruit! 🍫💕" },
    { emoji: "😴", text: "When I sleep, I see you in dreams. When I'm awake, I miss you. No vacation!", tag: "joke", tagText: "Funny", detail: "24 hours, 7 days, 365 days — no vacation! Thinking of you is my full-time job. Salary? Your one smile! 😴💕" },
    { emoji: "🤓", text: "You call me crazy? Yes, I am crazy — crazy in love with you!", tag: "joke", tagText: "Funny", detail: "The doctor said I'm crazy. Because I said I can't live without you! The doctor laughed and said — 'That's not madness, that's love!' 🤓💕" },
    { emoji: "🍔", text: "You are juicier than a burger. But if I bite you, not my teeth, my heart breaks!", tag: "joke", tagText: "Funny", detail: "Burger goes to the stomach, but you go to my heart. Instead of biting you, I want to hug you! 🍔💕" },
    // Morning
    { emoji: "☕", text: "You are like my first morning tea — warm, sweet, and the best part of starting my day.", tag: "morning", tagText: "Good Morning", detail: "I start every morning thinking of you. Without you, even mornings feel dark. You are my sunrise. ☀️💕" },
    { emoji: "🌅", text: "When sunrise light falls on your face, the world stops. You are my sun.", tag: "morning", tagText: "Good Morning", detail: "Your smile is the first light of my day. Without you, morning doesn't begin. You are my sun, you are my light. ☀️💖" },
    { emoji: "🌻", text: "Good morning my love! May your day be as beautiful as flowers. I love you!", tag: "morning", tagText: "Good Morning", detail: "Every morning is a new opportunity for you. Start your day with your smile. I am always by your side. 🌻💕" },
    { emoji: "☀️", text: "The sun has risen but nothing is brighter than you. Good morning my sunshine!", tag: "morning", tagText: "Good Morning", detail: "When sunlight falls on your face, it seems the sun itself feels shy. You are my brightest morning. ☀️💕" },
    // Night
    { emoji: "🌙", text: "As many stars shine in the moonlight, you are my most beautiful dream. Good night my love.", tag: "night", tagText: "Good Night", detail: "The moon has risen in the night sky, but nothing is more beautiful than you. I will dream of you tonight. 🌙💕" },
    { emoji: "😴", text: "I can't sleep without you. I stay awake at night thinking of you. Good night my dear.", tag: "night", tagText: "Good Night", detail: "I can't sleep without thinking of you. I love dreaming about you. Good night. 😴💕" },
    { emoji: "⭐", text: "The stars shine to see you. Because they too know you are the most beautiful. Good night!", tag: "night", tagText: "Good Night", detail: "Stars shine at night but nothing is brighter than you. Have beautiful dreams about you. I love you. ⭐💕" },
    { emoji: "🌌", text: "The night sky is full of stars, and my heart is full of your love. Good night!", tag: "night", tagText: "Good Night", detail: "Thousands of stars in the night sky, but in my heart, only you. I will dream of you tonight. Good night my love. 🌌💕" }
  ]
};

export const Messages: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  const [filter, setFilter] = useState('all');
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);

  const filteredData = filter === 'all' 
    ? messagesData[lang] 
    : messagesData[lang].filter(m => m.tag === filter);

  const filters = [
    { id: 'all', label: 'All', emoji: '' },
    { id: 'romantic', label: 'Romantic', emoji: '💕' },
    { id: 'emotional', label: 'Emotional', emoji: '😢' },
    { id: 'joke', label: 'Jokes', emoji: '😂' },
    { id: 'morning', label: 'Good Morning', emoji: '☀️' },
    { id: 'night', label: 'Good Night', emoji: '🌙' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-10">
      <div className="text-center mb-10">
        <h2 className="font-serif text-5xl text-white mb-4 drop-shadow-[0_0_20px_rgba(255,105,180,0.6)]">
          Romantic Messages
        </h2>
        <p className="text-white/70 italic text-lg">Beautiful words for your special someone 💕</p>
      </div>

      <div className="flex justify-center flex-wrap gap-2.5 mb-10">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-5 py-2 rounded-full font-sans text-sm transition-all border-2 ${
              filter === f.id
                ? 'bg-pink-500/30 border-pink-500/50 text-white'
                : 'bg-white/10 border-white/20 text-white hover:bg-pink-500/20'
            }`}
          >
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedMsg(msg)}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/15 shadow-lg cursor-pointer hover:-translate-y-2 hover:scale-105 hover:border-pink-400/40 transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="text-5xl mb-4 block">{msg.emoji}</span>
            <p className="font-sans text-lg md:text-xl leading-relaxed text-white/90">
              {msg.text}
            </p>
            <span className={`inline-block mt-4 px-3.5 py-1 rounded-full text-xs border ${
              msg.tag === 'romantic' ? 'bg-pink-500/25 text-pink-200 border-pink-500/30' :
              msg.tag === 'emotional' ? 'bg-blue-500/25 text-blue-200 border-blue-500/30' :
              msg.tag === 'joke' ? 'bg-yellow-500/25 text-yellow-200 border-yellow-500/30' :
              msg.tag === 'morning' ? 'bg-orange-500/25 text-orange-200 border-orange-500/30' :
              'bg-purple-500/25 text-purple-200 border-purple-500/30'
            }`}>
              {msg.tagText}
            </span>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[1000] p-5"
            onClick={() => setSelectedMsg(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-gradient-to-br from-[#ff6b9d] via-[#c44569] to-[#f8b500] rounded-[30px] p-10 md:p-12 max-w-lg w-full text-center border-2 border-white/30 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-6xl mb-4 animate-bounce">{selectedMsg.emoji}</div>
              <h3 className="font-serif text-4xl text-white mb-4">{selectedMsg.tagText}</h3>
              <p className="font-sans text-lg md:text-xl text-white/95 leading-relaxed mb-6">
                {selectedMsg.detail}
              </p>
              <div className="flex justify-center gap-1 text-2xl mb-6 animate-pulse">
                <span>💖</span><span>💗</span><span>💖</span>
              </div>
              <button 
                onClick={() => setSelectedMsg(null)}
                className="bg-white/20 border-2 border-white/50 text-white px-10 py-2.5 rounded-full hover:bg-white/30 transition-all font-sans"
              >
                Close 💕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
