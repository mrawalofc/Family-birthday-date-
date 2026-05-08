import React, { useEffect, useState } from 'react';

export const Background: React.FC = () => {
  const [hearts, setHearts] = useState<{ id: number; left: string; delay: string; duration: string; size: string; symbol: string }[]>([]);
  const [sparkles, setSparkles] = useState<{ id: number; left: string; top: string; delay: string; duration: string }[]>([]);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const heartSymbols = ['❤️', '💕', '💖', '💗', '💓', '💝', '💘', '💞'];
    const newHearts = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${Math.random() * 10 + 8}s`,
      size: `${Math.random() * 20 + 15}px`,
      symbol: heartSymbols[Math.floor(Math.random() * heartSymbols.length)],
    }));
    setHearts(newHearts);

    const newSparkles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${Math.random() * 2 + 2}s`,
    }));
    setSparkles(newSparkles);

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <div 
        className="fixed inset-0 z-0 transition-all duration-1000 ease-out"
        style={{
          background: 'linear-gradient(135deg, #1a0a2e 0%, #4a1942 25%, #893168 50%, #c44569 75%, #f8b500 100%)',
          backgroundSize: '400% 400%',
          backgroundPosition: `${mousePos.x / 2}% ${mousePos.y / 2}%`,
          animation: 'gradient-bg 15s ease infinite alternate',
        }}
      />
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
        {hearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute bottom-[-50px] animate-float-up opacity-80"
            style={{
              left: heart.left,
              animationDelay: heart.delay,
              animationDuration: heart.duration,
              fontSize: heart.size,
            }}
          >
            {heart.symbol}
          </div>
        ))}
        {sparkles.map((sparkle) => (
          <div
            key={sparkle.id}
            className="absolute w-1 h-1 bg-white rounded-full animate-sparkle"
            style={{
              left: sparkle.left,
              top: sparkle.top,
              animationDelay: sparkle.delay,
              animationDuration: sparkle.duration,
            }}
          />
        ))}
      </div>
    </>
  );
};
