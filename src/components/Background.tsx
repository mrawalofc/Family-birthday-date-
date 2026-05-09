import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export const Background: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#0f0a1a]">
      {/* Animated Mesh Gradients */}
      <div className="absolute inset-0 opacity-40">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-[1000px] h-[1000px] bg-[#c5a059]/10 blur-[150px] rounded-full"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -right-1/4 w-[1000px] h-[1000px] bg-rose-500/10 blur-[150px] rounded-full"
        />
        <motion.div
          animate={{
            x: [mousePos.x / 10, mousePos.x / 5],
            y: [mousePos.y / 10, mousePos.y / 5],
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full"
        />
      </div>

      {/* Floating Light Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 2000, 
              y: Math.random() * 2000, 
              opacity: Math.random() * 0.3,
              scale: Math.random() * 2
            }}
            animate={{
              y: ['0px', '-100px', '0px'],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 10
            }}
            className="absolute w-1 h-1 bg-white rounded-full bg-glow shadow-[0_0_10px_white]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Grainy Texture */}
      <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};
