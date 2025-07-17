"use client";
import Link from 'next/link';
import { useEffect, useRef } from 'react';

function DashboardAnimatedBackground() {
  // Particle system logic
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let particles = Array.from({ length: 32 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 1 + Math.random() * 2,
      dx: -0.5 + Math.random(),
      dy: -0.5 + Math.random(),
      o: 0.2 + Math.random() * 0.3,
    }));
    let animationId: number;
    function animate() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      // Animated gradient mesh
      const grad = ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
      grad.addColorStop(0, '#7C3AED');
      grad.addColorStop(0.5, '#2563EB');
      grad.addColorStop(1, '#F472B6');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.18;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalAlpha = 1;
      // Particles
      for (let p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255,255,255,${p.o})`;
        ctx.shadowColor = '#7C3AED';
        ctx.shadowBlur = 8;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > window.innerWidth) p.dx *= -1;
        if (p.y < 0 || p.y > window.innerHeight) p.dy *= -1;
      }
      ctx.shadowBlur = 0;
      animationId = window.requestAnimationFrame(animate);
    }
    animate();
    function handleResize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);
  return (
    <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0 pointer-events-none" style={{ position: 'fixed', top: 0, left: 0 }} />
  );
}

export default function DashboardMockup() {
  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden">
      <DashboardAnimatedBackground />
      {/* Glassmorphic Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-20 md:w-56 z-20 flex flex-col items-center py-8 bg-white/10 backdrop-blur-xl border-r border-white/10 shadow-xl">
        <div className="mb-12 flex flex-col items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mb-2">
            <span className="text-white font-bold text-lg">Q</span>
          </div>
          <span className="text-white font-bold text-xl hidden md:block">GenLo</span>
        </div>
        <nav className="flex flex-col gap-6 mt-8 w-full items-center">
          <Link href="/dashboard" className="text-white/80 hover:text-white font-medium px-4 py-2 rounded-lg transition-all bg-white/10 hover:bg-purple-600/30 w-4/5 text-center">Home</Link>

          <Link href="/video-generator" className="text-white/80 hover:text-white font-medium px-4 py-2 rounded-lg transition-all bg-white/10 hover:bg-purple-600/30 w-4/5 text-center">Video Gen</Link>
          <Link href="/pricing" className="text-white/80 hover:text-white font-medium px-4 py-2 rounded-lg transition-all bg-white/10 hover:bg-purple-600/30 w-4/5 text-center">Pricing</Link>
        </nav>
      </aside>
      {/* Glassmorphic Header */}
      <header className="fixed top-0 left-20 md:left-56 right-0 h-20 z-30 flex items-center px-8 bg-white/10 backdrop-blur-xl border-b border-white/10 shadow-xl">
        <h1 className="text-white text-2xl font-bold tracking-wide">Dashboard</h1>
        <div className="ml-auto flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">U</div>
        </div>
      </header>
      {/* Main Content */}
      <main className="relative z-10 pt-28 pl-24 md:pl-64 pr-8 pb-8 min-h-screen flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Chat Widget */}
          <div className="bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-8 flex flex-col col-span-2 min-h-[340px] border border-white/10">
            <h2 className="text-white text-xl font-semibold mb-4">Chat with GenLo</h2>
            <div className="flex-1 flex items-center justify-center text-white/70 italic">[Chat UI Placeholder]</div>
          </div>
          {/* Stats Widget */}
          <div className="bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-8 flex flex-col min-h-[340px] border border-white/10">
            <h2 className="text-white text-xl font-semibold mb-4">Usage Stats</h2>
            <div className="flex-1 flex items-center justify-center text-white/70 italic">[Stats Placeholder]</div>
          </div>
        </div>
        {/* Quick Actions */}
        <div className="flex gap-6 mt-8">
          <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-400/30">New Image</button>
          <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-400/30">New Video</button>
        </div>
      </main>
      {/* Footer */}
      <footer className="fixed bottom-0 left-20 md:left-56 right-0 h-16 flex items-center px-8 bg-white/10 backdrop-blur-xl border-t border-white/10 z-30">
        <span className="text-white/60 text-sm">© 2024 GenLo. All rights reserved.</span>
      </footer>
    </div>
  );
} 