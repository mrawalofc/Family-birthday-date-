import React from 'react';

const emojis = [
  { symbol: '🌹', top: '15%', left: '10%', delay: '0s' },
  { symbol: '💕', top: '25%', right: '15%', delay: '2s' },
  { symbol: '💖', bottom: '20%', left: '20%', delay: '4s' },
  { symbol: '🌸', bottom: '30%', right: '10%', delay: '6s' },
  { symbol: '✨', top: '60%', left: '5%', delay: '3s' },
  { symbol: '💫', top: '40%', right: '5%', delay: '5s' },
  { symbol: '💘', top: '10%', right: '25%', delay: '1s' },
  { symbol: '🦋', top: '80%', left: '30%', delay: '7s' },
  { symbol: '💌', bottom: '10%', right: '40%', delay: '8s' },
  { symbol: '💍', top: '70%', right: '15%', delay: '9s' },
  { symbol: '🧸', bottom: '50%', left: '15%', delay: '1.5s' },
  { symbol: '💝', top: '30%', left: '40%', delay: '2.5s' },
];

export const FloatingEmojis: React.FC<{ symbol?: string }> = ({ symbol }) => {
  const displayEmojis = symbol ? emojis.map(e => ({ ...e, symbol })) : emojis;
  return (
    <>
      {displayEmojis.map((emoji, index) => (
        <div
          key={index}
          className="fixed text-2xl pointer-events-none z-[5] animate-float-emoji"
          style={{
            ...emoji,
            animationDelay: emoji.delay,
          }}
        >
          {emoji.symbol}
        </div>
      ))}
    </>
  );
};
