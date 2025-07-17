"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, User, Bot, Send, Sparkles, Palette, Camera } from 'lucide-react';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Marquee from '../components/Marquee';
import { AnimatePresence } from 'framer-motion';

export default function Home() {
  const [input, setInput] = useState("");
  const [inputFocus, setInputFocus] = useState(false);

  const testimonials = [
    {
      name: 'Ava Chen',
      role: 'E-commerce Founder',
      text: 'GenLo helped us launch new product lines with stunning visuals in hours, not weeks. Our conversion rate jumped 22%!',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
    {
      name: 'Marcus Lee',
      role: 'Marketing Director',
      text: 'The AI-generated images are so realistic, our customers can’t tell the difference. It’s a game changer for our campaigns.',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
      name: 'Priya Patel',
      role: 'Brand Strategist',
      text: 'GenLo lets us experiment with creative concepts instantly. The team loves the premium, intuitive dashboard.',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      name: 'Liam O’Connor',
      role: 'Startup CEO',
      text: 'We saved thousands on product photography. The AI even matches our brand style perfectly.',
      avatar: 'https://randomuser.me/api/portraits/men/54.jpg',
    },
    {
      name: 'Sofia Rossi',
      role: 'Content Creator',
      text: 'I can generate unique, high-quality images for every post. GenLo is my secret weapon for engagement.',
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    },
    {
      name: 'David Kim',
      role: 'Product Manager',
      text: 'The workflow automation and AI chat make our creative process 10x faster. Support is top-notch.',
      avatar: 'https://randomuser.me/api/portraits/men/76.jpg',
    },
  ];

  function TestimonialColumn({ column }: { column: number }) {
    const VISIBLE = 5;
    const CARD_HEIGHT = 240; // Uniform height for all cards
    const ANIMATION_DURATION = 16; // seconds for a full loop
    // Use the same duplicated testimonial list for all columns
    const loopTestimonials = [...testimonials, ...testimonials];
    const totalCards = loopTestimonials.length;
    // Offset the starting index for each column for visual variety
    const offset = column * 2; // or 1 for a smaller offset
    return (
      <div className="relative" style={{ height: `${CARD_HEIGHT * VISIBLE}px`, width: '100%', overflow: 'hidden' }}>
        {/* Enhanced gradient fade overlays */}
        <div className="pointer-events-none absolute top-0 left-0 w-full h-32 z-10" style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, transparent 100%)'}} />
        <div className="pointer-events-none absolute bottom-0 left-0 w-full h-32 z-10" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, transparent 100%)'}} />
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: -CARD_HEIGHT * (totalCards - VISIBLE) }}
          transition={{
            duration: ANIMATION_DURATION,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'loop',
          }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        >
          {loopTestimonials.map((t, idx) => (
            <div
              key={t.name + idx + column}
              className="mx-auto bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl p-8 flex flex-col justify-center h-full overflow-visible"
              style={{ position: 'absolute', top: ((idx + offset) % totalCards) * CARD_HEIGHT, height: CARD_HEIGHT, minHeight: CARD_HEIGHT, width: '92%' }}
            >
              <div className="flex flex-col justify-center h-full">
                <div className="flex items-center mb-2 w-full">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full border-2 border-white mr-3" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="font-semibold text-white text-base truncate">{t.name}</span>
                      <span className="ml-2 flex items-center">
                        {Array(4).fill(0).map((_, i) => (
                          <svg key={i} className="w-4 h-4 text-yellow-400 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><polygon points="10,1 12.59,6.99 19,7.64 14,12.26 15.18,18.51 10,15.27 4.82,18.51 6,12.26 1,7.64 7.41,6.99" /></svg>
                        ))}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-400 truncate">{t.role}</div>
                  </div>
                </div>
                <div className="text-neutral-200 text-base mb-2 whitespace-pre-line break-words" style={{lineHeight: '1.5'}}>
                  “{t.text}”
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative overflow-x-hidden text-white bg-neutral-900">
      <Head>
        <title>GenLo – AI-Powered Creative Assistant</title>
        <meta name="description" content="GenLo is your premium AI-powered creative assistant for generating product images, artwork, and more. Dream. Create. Amaze." />
        <meta property="og:title" content="GenLo – AI-Powered Creative Assistant" />
        <meta property="og:description" content="GenLo is your premium AI-powered creative assistant for generating product images, artwork, and more. Dream. Create. Amaze." />
        <meta property="og:image" content="/proof-of-concept/ChatGPT Image Jul 13, 2025, 10_15_10 PM.png" />
        <meta property="og:type" content="website" />
      </Head>
      {/* Navigation Bar */}
      <nav className="w-full flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 py-6 absolute top-0 left-0 z-20">
        {/* Removed left-side Quelle logo/text */}
        <div />
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-8 text-white text-base font-medium w-full sm:w-auto mt-2 sm:mt-0">
          <Link href="#features" className="hover:underline transition-colors">Features</Link>
          <Link href="/pricing" className="hover:underline transition-colors">Pricing</Link>
          <Link href="/auth/login" className="hover:underline transition-colors">Login</Link>
        </div>
      </nav>

      {/* Static QUELLE.IO */}
      <div className="absolute left-1/2 -translate-x-1/2 top-10 z-10 select-none pointer-events-none">
        <span className="text-5xl md:text-7xl font-extrabold tracking-tight text-white opacity-95 drop-shadow-lg">
          GenLo
        </span>
      </div>

      {/* Hero Section with Chat Input */}
      <section className="flex flex-col items-center justify-center min-h-[60vh] pt-24 md:pt-40 pb-8 relative z-10">
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-4 drop-shadow-lg text-white">
          Welcome to <span className="text-white">GenLo</span>
        </h1>
        <p className="text-lg md:text-2xl text-neutral-200 text-center max-w-2xl mb-8">
          Your AI-powered creative assistant. <span className="font-semibold">Dream. Create. Amaze.</span>
        </p>
        {/* Removed chat input/message bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/auth/signup-with-payment"
            className="inline-flex items-center px-8 py-4 bg-white text-black rounded-lg font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 text-lg"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Chat Preview Card */}
      <motion.section
        id="features"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex justify-center items-center w-full pb-24"
      >
        <div className="rounded-2xl shadow-2xl border border-neutral-800 max-w-2xl w-full mx-4 p-0 flex flex-col items-center relative -mt-8 overflow-hidden bg-neutral-900 drop-shadow-[0_0_32px_rgba(255,255,255,0.15)]">
          <div className="w-full bg-neutral-800 px-6 py-4 border-b border-neutral-700 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-4 text-white font-semibold">Chat Preview</span>
          </div>
          <div className="w-full px-6 py-8 flex flex-col gap-6">
            {/* User message */}
            <motion.div initial={{x:-40,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:1.2}} className="flex items-start gap-3">
              <div className="bg-white rounded-full w-9 h-9 flex items-center justify-center">
                <User className="w-5 h-5 text-black" />
              </div>
              <div className="bg-neutral-800 rounded-xl px-5 py-3 text-white text-base max-w-[80%] shadow border border-neutral-700">
                Can you help me generate a product image for my new brand?
              </div>
            </motion.div>
            {/* AI message */}
            <motion.div initial={{x:40,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:1.4}} className="flex items-start gap-3">
              <div className="bg-black rounded-full w-9 h-9 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-neutral-700 rounded-xl px-5 py-3 text-white text-base max-w-[80%] border border-neutral-600 shadow-lg">
                Absolutely! Please describe your product and the style you want, and I'll generate a stunning image or UGC video for you.
              </div>
            </motion.div>
            {/* User message */}
            <motion.div initial={{x:-40,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:1.6}} className="flex items-start gap-3">
              <div className="bg-white rounded-full w-9 h-9 flex items-center justify-center">
                <User className="w-5 h-5 text-black" />
              </div>
              <div className="bg-neutral-800 rounded-xl px-5 py-3 text-white text-base max-w-[80%] shadow border border-neutral-700">
                Modern, minimal, white background, with a touch of blue.
              </div>
            </motion.div>
            {/* AI message */}
            <motion.div initial={{x:40,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:1.8}} className="flex items-start gap-3">
              <div className="bg-black rounded-full w-9 h-9 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-neutral-700 rounded-xl px-5 py-3 text-white text-base max-w-[80%] border border-neutral-600 shadow-lg">
                Generating your image now... <span className="animate-pulse">▍</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Marquee of Social Proof Icons */}
      <div className="w-full flex justify-center items-center bg-transparent py-2">
        <Marquee />
      </div>

      {/* AI-Generated Product Images Section */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="w-full py-20 bg-gradient-to-b from-neutral-900 to-neutral-800"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              <Camera className="w-4 h-4" />
              Product Photography
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              AI-Generated Product Images
            </h2>
            <p className="text-xl text-neutral-300 max-w-3xl mx-auto">
              Transform your product ideas into stunning, professional visuals in seconds. 
              Perfect for e-commerce, marketing, and brand development.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Product Image 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500"
            >
              <div className="aspect-square bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center">
                <Image
                  src="/proof-of-concept/ChatGPT Image Jul 13, 2025, 10_15_10 PM.png"
                  alt="Back Stretcher product on wood table, black with blue accent, proof of concept AI generated image"
                  width={512}
                  height={512}
                  className="object-contain w-full h-full rounded-2xl border border-gray-200 shadow-lg max-h-80"
                  unoptimized
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 bg-opacity-90 px-6 py-4 flex flex-col items-center border-t border-neutral-700">
                <h3 className="text-lg font-semibold text-white mb-1">Back Stretcher</h3>
                <p className="text-neutral-300 text-sm">Modern ergonomic design, blue accent</p>
              </div>
            </motion.div>

            {/* Product Image 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500"
            >
              <div className="aspect-square bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center">
                <Image
                  src="/proof-of-concept/ChatGPT Image Jul 13, 2025, 10_15_07 PM.png"
                  alt="Back Stretcher product, alternate angle, proof of concept AI generated image"
                  width={512}
                  height={512}
                  className="object-contain w-full h-full rounded-2xl border border-gray-200 shadow-lg max-h-80"
                  unoptimized
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 bg-opacity-90 px-6 py-4 flex flex-col items-center border-t border-neutral-700">
                <h3 className="text-lg font-semibold text-white mb-1">Back Stretcher 2</h3>
                <p className="text-neutral-300 text-sm">AI-generated product visualization</p>
              </div>
            </motion.div>

            {/* Product Image 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500"
            >
              <div className="aspect-square bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center">
                <Image
                  src="/proof-of-concept/ChatGPT Image Jul 13, 2025, 10_15_03 PM.png"
                  alt="Woman using back stretcher, relaxing on yoga mat, proof of concept AI generated image"
                  width={512}
                  height={512}
                  className="object-contain w-full h-full rounded-2xl border border-gray-200 shadow-lg max-h-80"
                  unoptimized
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 bg-opacity-90 px-6 py-4 flex flex-col items-center border-t border-neutral-700">
                <h3 className="text-lg font-semibold text-white mb-1">Hand Held Game Console</h3>
                <p className="text-neutral-300 text-sm">Portable gaming experience, ergonomic design</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <section className="w-full py-20 bg-black/95">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">What our customers say</h2>
            <p className="text-lg text-neutral-300 max-w-2xl mx-auto">Discover how GenLo is transforming creative workflows for teams, marketers, and entrepreneurs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[0, 1, 2].map((col) => (
              <TestimonialColumn key={col} column={col} />
            ))}
          </div>
        </div>
      </section>

      {/* AI-Generated Creative Artwork Section */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="w-full py-20 bg-neutral-900"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              <Palette className="w-4 h-4" />
              Creative Artwork
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Creative AI Artwork
            </h2>
            <p className="text-xl text-neutral-300 max-w-3xl mx-auto">
              Explore the boundaries of creativity with AI-generated artwork. 
              From abstract concepts to detailed illustrations, bring your vision to life.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Creative Artwork 1 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-600 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                    <Palette className="w-16 h-16 text-black" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Abstract Digital Art</h3>
                  <p className="text-neutral-300 mb-4">Futuristic design with vibrant colors</p>
                  <div className="flex justify-center gap-2">
                    <span className="px-3 py-1 bg-white text-black text-xs rounded-full">Digital</span>
                    <span className="px-3 py-1 bg-neutral-700 text-white text-xs rounded-full">Abstract</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
            </motion.div>

            {/* Creative Artwork 2 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-600 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                    <Palette className="w-16 h-16 text-black" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Concept Illustration</h3>
                  <p className="text-neutral-300 mb-4">Detailed character and scene design</p>
                  <div className="flex justify-center gap-2">
                    <span className="px-3 py-1 bg-white text-black text-xs rounded-full">Concept</span>
                    <span className="px-3 py-1 bg-neutral-700 text-white text-xs rounded-full">Illustration</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
            </motion.div>
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mt-16"
          >
            <Link
              href="/auth/signup"
              className="inline-flex items-center px-8 py-4 bg-white text-black rounded-lg font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 text-lg"
            >
              Start Creating Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Custom CSS for effects */}
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-blink { animation: blink 1s steps(1) infinite; }
      `}</style>
    </main>
  );
} 