import { motion } from 'framer-motion';
import React from 'react';

interface FloatingGenLoAIProps {
  onClick?: () => void;
  className?: string;
}

const genLoText = 'GenLo';
const letters = genLoText.split('');
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};
const letterVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } },
};

export default function FloatingGenLoAI({ onClick, className = '' }: FloatingGenLoAIProps) {
  return (
    <div
      className={`hidden md:block fixed top-0 left-1/4 h-full w-64 z-50 flex items-center justify-center pointer-events-auto select-none cursor-pointer ${className}`}
      onClick={onClick}
      title="Go Home"
    >
      <motion.div
        className="flex flex-col items-start pl-2"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="text-5xl font-extrabold tracking-tight text-black">
          {letters.map((char, idx) => (
            <motion.span
              key={idx}
              variants={letterVariants}
              className="inline-block text-black"
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
} 