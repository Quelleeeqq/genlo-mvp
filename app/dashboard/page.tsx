"use client";

import React, { useState, useRef, useEffect } from 'react';
import DashboardChat from '@/components/DashboardChat';
import MultiSceneVideoGenerator from '@/components/MultiSceneVideoGenerator';
import Link from 'next/link';

const LOGO = ['G', 'e', 'n', 'L', 'o'];

// Assume you have a user object from context or props
import { useUser } from '@supabase/auth-helpers-react';

export default function Dashboard() {
  const [showVideoGen, setShowVideoGen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const user = useUser();

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const rate = scrolled * -0.5;
      
      if (bgRef.current) {
        bgRef.current.style.setProperty('--parallax1', `${rate}px`);
        bgRef.current.style.setProperty('--parallax2', `${rate * 0.8}px`);
        bgRef.current.style.setProperty('--parallax3', `${rate * 1.2}px`);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw particle system
        const particles: Array<{x: number; y: number; vx: number; vy: number; life: number}> = [];
        
        for (let i = 0; i < 50; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            life: Math.random()
          });
        }

        const animate = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.005;

            if (particle.life <= 0) {
              particles[index] = {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                life: 1
              };
            }

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 0, 0, ${particle.life * 0.3})`;
            ctx.fill();
          });

          requestAnimationFrame(animate);
        };

        animate();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <main className="min-h-screen w-full relative flex flex-col items-center justify-start bg-gradient-to-br from-white via-gray-100 to-white overflow-x-hidden">
      {/* Animated Tech Background */}
      <div ref={bgRef} className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Animated gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-gray-500/10 to-black/5 animate-pulse"></div>
        
        {/* Animated geometric patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border border-black/30 rounded-full animate-spin-slow"></div>
          <div className="absolute top-40 right-32 w-24 h-24 border border-gray-600/30 rounded-full animate-spin-slow-reverse"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 border border-black/30 rounded-full animate-spin-slow"></div>
          <div className="absolute bottom-20 right-1/3 w-28 h-28 border border-gray-600/30 rounded-full animate-spin-slow-reverse"></div>
        </div>

        {/* Floating tech elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/6 w-2 h-2 bg-black rounded-full animate-float-slow opacity-60"></div>
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-gray-600 rounded-full animate-float-slower opacity-40"></div>
          <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-black rounded-full animate-float-slow opacity-50"></div>
          <div className="absolute bottom-1/4 right-1/6 w-1 h-1 bg-gray-700 rounded-full animate-float-slower opacity-30"></div>
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-gray-500 rounded-full animate-float-slow opacity-40"></div>
        </div>

        {/* Neural network grid */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="neural-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#000000" strokeWidth="0.5" />
                <circle cx="30" cy="30" r="1" fill="#000000" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#neural-grid)" />
          </svg>
        </div>

        {/* Animated data flow lines */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-black/20 to-transparent animate-data-flow"></div>
          <div className="absolute top-1/4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-600/20 to-transparent animate-data-flow-delayed"></div>
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-black/20 to-transparent animate-data-flow"></div>
          <div className="absolute top-3/4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-data-flow-delayed"></div>
        </div>

        {/* Parallax tech blobs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-radial from-black/10 to-transparent rounded-full blur-3xl animate-pulse-slow" 
             style={{ transform: 'translateY(var(--parallax1, 0px))' }}></div>
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-gradient-radial from-gray-500/10 to-transparent rounded-full blur-3xl animate-pulse-slow" 
             style={{ transform: 'translateY(var(--parallax2, 0px))' }}></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-radial from-black/10 to-transparent rounded-full blur-3xl animate-pulse-slow" 
             style={{ transform: 'translateY(var(--parallax3, 0px))' }}></div>

        {/* Canvas for particle system */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-30"
          style={{ zIndex: 1 }}
        />
      </div>

      {/* Floating Glassy Nav Bar with Logo Inside */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-40 w-[96vw] max-w-5xl flex items-center justify-between px-8 py-2 rounded-2xl glass-nav-light shadow-xl border border-black/10 backdrop-blur-xl transition-all duration-300 min-h-[64px]">
        <div className="flex-1 flex items-center justify-center relative" style={{ minHeight: '48px' }}>
          <span className="floating-logo-in-nav">
            {LOGO.map((char, i) => (
              <span
                key={i}
                className="floating-logo-letter"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                {char}
              </span>
            ))}
          </span>
        </div>
        <div className="flex items-center gap-8 text-black text-base font-medium">
          <Link href="/pricing" className="nav-link-light">Pricing</Link>
          <Link href="/" className="nav-link-light">Home</Link>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-black/10 text-black rounded-lg font-semibold shadow-md cursor-pointer select-none transition-transform duration-200 hover:scale-105 backdrop-blur-sm">User</span>
        </div>
      </nav>

      {/* Full-screen Chat Interface */}
      <div className="w-full h-screen pt-20">
        <DashboardChat 
          activeChatId={activeChatId}
          onChatCreated={setActiveChatId}
          onChatUpdated={() => {
            // This will trigger a refresh of the sidebar
          }}
        />
      </div>

      {/* Floating Video Generator Button */}
      <button
        className="fixed bottom-12 right-12 z-50 px-6 py-4 rounded-full bg-gradient-to-r from-black to-gray-800 text-white font-bold text-lg shadow-2xl hover:from-gray-800 hover:to-black transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-black/20 backdrop-blur-sm flex items-center gap-2"
        onClick={() => setShowVideoGen(true)}
        style={{minWidth: '56px'}}
      >
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg>
        <span className="hidden md:inline">Video Generator</span>
      </button>

      {/* Video Generator Modal */}
      {showVideoGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative bg-white/95 rounded-3xl shadow-2xl border border-gray-300/50 max-w-4xl w-full mx-4 p-0 glass-nav-light animate-fade-in">
            <button
              className="absolute top-4 right-4 text-black bg-white/80 rounded-full p-2 shadow hover:bg-gray-100 transition"
              onClick={() => setShowVideoGen(false)}
              aria-label="Close Video Generator"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <MultiSceneVideoGenerator userId={user?.id ?? ''} onClose={() => setShowVideoGen(false)} />
          </div>
        </div>
      )}

      <style jsx>{`
        .glass-nav-light {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .floating-logo-in-nav {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .floating-logo-letter {
          font-size: 1.5rem;
          font-weight: 700;
          color: #000000;
          animation: float 3s ease-in-out infinite;
          display: inline-block;
        }
        .nav-link-light {
          position: relative;
          transition: color 0.2s;
        }
        .nav-link-light::after {
          content: '';
          position: absolute;
          left: 0; right: 0; bottom: -2px;
          height: 2px;
          background: linear-gradient(90deg, #000000, #666666, #999999);
          opacity: 0;
          transform: scaleX(0.7);
          transition: opacity 0.2s, transform 0.2s;
        }
        .nav-link-light:hover {
          color: #000000;
        }
        .nav-link-light:hover::after {
          opacity: 1;
          transform: scaleX(1);
        }
        @keyframes float {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-18px) scale(1.08); }
          100% { transform: translateY(0px) scale(1); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float 12s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
        .animate-spin-slow-reverse {
          animation: spin 25s linear infinite reverse;
        }
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-data-flow {
          animation: dataFlow 8s linear infinite;
        }
        .animate-data-flow-delayed {
          animation: dataFlow 8s linear infinite 4s;
        }
        @keyframes dataFlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100vw); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </main>
  );
} 