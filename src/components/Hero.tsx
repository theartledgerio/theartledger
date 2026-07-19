/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../supabase';

interface HeroProps {
  onChangePage: (pageId: string) => void;
}

export default function Hero({ onChangePage }: HeroProps) {
  const [latestBlog, setLatestBlog] = useState<{ title: string; image: string; category: string } | null>(null);
  const [latestMag, setLatestMag] = useState<{ number: number; name: string; cover: string } | null>(null);

  useEffect(() => {
    async function fetchHeroData() {
      try {
        // Query latest blog post
        const { data: blogData } = await supabase
          .from('blog_submissions')
          .select('title, image_url, category, content')
          .eq('status', 'approved')
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (blogData) {
          const match = blogData.content ? blogData.content.match(/<img[^>]+src="([^">]+)"/) : null;
          const firstImage = match ? match[1] : null;

          setLatestBlog({
            title: blogData.title,
            image: firstImage || blogData.image_url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600',
            category: blogData.category || 'Contemporary'
          });
        }

        // Query latest magazine edition
        const { data: magData } = await supabase
          .from('magazines')
          .select('issue_number, issue_name, cover_image_url')
          .eq('status', 'published')
          .order('issue_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (magData) {
          setLatestMag({
            number: magData.issue_number,
            name: magData.issue_name,
            cover: magData.cover_image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600'
          });
        }
      } catch (err) {
        console.error('Failed to load dynamic hero assets:', err);
      }
    }
    fetchHeroData();
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-[90vh] lg:min-h-screen flex items-center justify-center bg-warmwhite overflow-hidden py-16 lg:py-24"
    >
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-turquoise/5 blur-3xl" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gold/5 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10 mt-6 lg:mt-0">

        {/* Left Column: Core Editorial Statement */}
        <div className="order-1 lg:col-span-7 flex flex-col justify-center text-left mt-8 lg:mt-0">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-[54px] font-sans font-extrabold tracking-tight text-midnight uppercase leading-[1.05] mb-6"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            Global Art News &<br />
            Independent<br />
            Journalism for the<br />
            Art World
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-base md:text-[17px] text-slate-600 leading-relaxed font-sans max-w-xl mb-10"
          >
            The Art Ledger is a monthly art magazine from India with a global perspective, delivering original reporting, artist interviews, market insights, exhibitions, and cultural commentary for the global art community.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="flex flex-wrap items-center gap-6"
          >
            <button
              id="hero-read-latest-btn"
              onClick={() => onChangePage('blogs')}
              className="px-7 py-4 bg-midnight hover:bg-deepblue text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              Read the Latest
            </button>

            <button
              id="hero-about-link-btn"
              onClick={() => onChangePage('about')}
              className="group flex items-center gap-1.5 text-midnight hover:text-turquoise font-sans text-xs font-bold uppercase tracking-widest transition-colors duration-300 cursor-pointer"
            >
              <span>About The Art Ledger</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </motion.div>
        </div>

        {/* Right Column: Layered Premium Cards with Overlaps */}
        <div className="order-2 lg:col-span-5 flex flex-col justify-center lg:justify-end items-center mt-4 lg:mt-0 w-full overflow-hidden">
          
          {/* DESKTOP LAYOUT: 3D Layered Cards (Hidden on Mobile) */}
          <div className="hidden lg:flex relative w-full max-w-[420px] aspect-[4/5] items-center justify-center">
            {/* Left Card: Exhibition Reviews (Back Layer / Last) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: -8 }}
              transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
              whileHover={{ scale: 1.05, rotate: -3, zIndex: 50 }}
              onClick={() => onChangePage('events')}
              className="absolute top-1/2 left-1/2 -translate-x-[95%] -translate-y-[47%] w-[245px] aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-white/10 cursor-pointer bg-slate-900 z-10"
            >
              <img
                src="https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80&w=600"
                alt="Exhibition Review Tribal Art"
                className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-4 text-white">
                <span className="text-[8px] font-mono tracking-widest text-slate-200 font-bold uppercase mb-1 block">
                  EXHIBITION REVIEWS
                </span>
                <h3 className="text-xs font-sans font-semibold leading-tight text-white line-clamp-2">
                  The Many Worlds of India's Tribal Art
                </h3>
              </div>
            </motion.div>

            {/* Right Card: Latest Blog (Middle Layer) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 10 }}
              animate={{ opacity: 1, scale: 1, rotate: 8 }}
              transition={{ duration: 0.9, delay: 0.4, ease: 'easeOut' }}
              whileHover={{ scale: 1.05, rotate: 3, zIndex: 50 }}
              onClick={() => onChangePage('blogs')}
              className="absolute top-1/2 left-1/2 -translate-x-[5%] -translate-y-[47%] w-[245px] aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-white/10 cursor-pointer bg-slate-900 z-20"
            >
              <img
                src={latestBlog ? latestBlog.image : "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600"}
                alt="Latest Blog Essay"
                className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 text-white">
                <span className="text-[8px] font-mono tracking-widest text-slate-300 font-bold uppercase mb-1 block">
                  {latestBlog ? `ESSAY // ${latestBlog.category.toUpperCase()}` : 'FEATURED'}
                </span>
                <h3 className="text-xs font-sans font-semibold leading-tight text-white line-clamp-2">
                  {latestBlog ? latestBlog.title : 'In Conversation with Prajakta Potnis'}
                </h3>
              </div>
            </motion.div>

            {/* Center Card: Latest Magazine (Front Layer / Highlighted) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease: 'easeOut' }}
              whileHover={{ scale: 1.06, rotate: 1, zIndex: 50 }}
              onClick={() => onChangePage('magazine')}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[53%] w-[245px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/15 cursor-pointer bg-slate-900 z-30"
            >
              <img
                src={latestMag ? latestMag.cover : "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600"}
                alt="Latest Magazine Edition"
                className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 text-white">
                <span className="text-[8px] font-mono tracking-widest text-slate-300 font-bold uppercase mb-1 block">
                  {latestMag ? `LATEST ISSUE // ISSUE NO. ${latestMag.number}` : 'LATEST EDITION'}
                </span>
                <h3 className="text-xs font-sans font-semibold leading-tight text-white line-clamp-2">
                  {latestMag ? latestMag.name : 'Issue No. 42: The Digital Renaissance'}
                </h3>
              </div>
            </motion.div>
          </div>

          {/* MOBILE/TABLET LAYOUT: Scroll Snap Carousel (Hidden on Desktop) */}
          <div className="flex lg:hidden w-[100vw] sm:w-[500px] overflow-x-auto snap-x snap-mandatory gap-6 px-8 py-6 no-scrollbar relative -mx-6 sm:mx-0">
            {/* Center Card (Magazine) - Shown First in Carousel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onClick={() => onChangePage('magazine')}
              className="snap-center shrink-0 w-[75vw] sm:w-[280px] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-white/15 cursor-pointer bg-slate-900 relative"
            >
              <img
                src={latestMag ? latestMag.cover : "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600"}
                alt="Latest Magazine Edition"
                className="w-full h-full object-cover opacity-90"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-5 text-white">
                <span className="text-[9px] font-mono tracking-widest text-slate-300 font-bold uppercase mb-1.5 block">
                  {latestMag ? `LATEST ISSUE // ISSUE NO. ${latestMag.number}` : 'LATEST EDITION'}
                </span>
                <h3 className="text-sm sm:text-base font-sans font-semibold leading-tight text-white line-clamp-2">
                  {latestMag ? latestMag.name : 'Issue No. 42: The Digital Renaissance'}
                </h3>
              </div>
            </motion.div>

            {/* Left Card (Events) - Shown Second */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              onClick={() => onChangePage('events')}
              className="snap-center shrink-0 w-[75vw] sm:w-[280px] aspect-[3/4] rounded-3xl overflow-hidden shadow-xl border border-white/10 cursor-pointer bg-slate-900 relative"
            >
              <img
                src="https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80&w=600"
                alt="Exhibition Review Tribal Art"
                className="w-full h-full object-cover opacity-90"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-5 text-white">
                <span className="text-[9px] font-mono tracking-widest text-slate-200 font-bold uppercase mb-1.5 block">
                  EXHIBITION REVIEWS
                </span>
                <h3 className="text-sm sm:text-base font-sans font-semibold leading-tight text-white line-clamp-2">
                  The Many Worlds of India's Tribal Art
                </h3>
              </div>
            </motion.div>

            {/* Right Card (Blogs) - Shown Third */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              onClick={() => onChangePage('blogs')}
              className="snap-center shrink-0 w-[75vw] sm:w-[280px] aspect-[3/4] rounded-3xl overflow-hidden shadow-xl border border-white/10 cursor-pointer bg-slate-900 relative pr-4 lg:pr-0"
            >
              <img
                src={latestBlog ? latestBlog.image : "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600"}
                alt="Latest Blog Essay"
                className="w-full h-full object-cover opacity-90"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-5 text-white">
                <span className="text-[9px] font-mono tracking-widest text-slate-300 font-bold uppercase mb-1.5 block">
                  {latestBlog ? `ESSAY // ${latestBlog.category.toUpperCase()}` : 'FEATURED'}
                </span>
                <h3 className="text-sm sm:text-base font-sans font-semibold leading-tight text-white line-clamp-2">
                  {latestBlog ? latestBlog.title : 'In Conversation with Prajakta Potnis'}
                </h3>
              </div>
            </motion.div>
            
            {/* spacer to allow snapping to the very end comfortably */}
            <div className="snap-center shrink-0 w-4 h-full"></div>
          </div>

        </div>

      </div>
    </section>
  );
}
