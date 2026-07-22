/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Layers, BookOpen, Calendar, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';

export interface HeroDeckCard {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  badge: string;
  title: string;
  subtitle?: string;
  link_page: string;
  link_text?: string;
}

interface HeroProps {
  onChangePage: (pageId: string) => void;
}

const DEFAULT_3_HERO_CARDS: HeroDeckCard[] = [
  {
    id: 'hero-blog',
    media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1200',
    badge: 'ESSAY // CONTEMPORARY ART',
    title: 'In Conversation with Prajakta Potnis',
    subtitle: 'Exploring contemporary sculpture, domestic spaces, and post-colonial motifs.',
    link_page: 'blogs',
    link_text: 'Read Full Essay'
  },
  {
    id: 'hero-magazine',
    media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1200',
    badge: 'LATEST PRINT ISSUE // NO. 42',
    title: 'The Digital Renaissance',
    subtitle: 'Special quarterly print release examining new media art & generative algorithms.',
    link_page: 'magazine',
    link_text: 'Explore Magazine'
  },
  {
    id: 'hero-event',
    media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&q=80&w=1200',
    badge: 'UPCOMING EXHIBITION // MUMBAI',
    title: 'Freedom - Season 3',
    subtitle: 'International Art Exhibition & Award Event at Nehru Centre AC Art Gallery, Worli, Mumbai.',
    link_page: 'events',
    link_text: 'View Exhibition'
  }
];

export default function Hero({ onChangePage }: HeroProps) {
  const [cards, setCards] = useState<HeroDeckCard[]>(DEFAULT_3_HERO_CARDS);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  useEffect(() => {
    async function loadInterconnectedHeroContent() {
      try {
        // 1. Fetch uploaded blog essay (matching Prajakta or latest approved)
        const { data: allBlogs } = await supabase
          .from('blog_submissions')
          .select('title, image_url, content, category, short_description')
          .eq('status', 'approved')
          .order('published_at', { ascending: false });

        const prajaktaBlog = (allBlogs || []).find(b => b.title?.toLowerCase().includes('prajakta')) || (allBlogs && allBlogs[0]);
        
        const extractFirstImage = (htmlContent: string) => {
          const match = (htmlContent || '').match(/<img[^>]+src="([^">]+)"/);
          return match ? match[1] : null;
        };

        const blogMediaUrl = prajaktaBlog
          ? (prajaktaBlog.image_url || extractFirstImage(prajaktaBlog.content) || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1200')
          : 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1200';

        const blogTitle = prajaktaBlog?.title || 'In Conversation with Prajakta Potnis';
        const blogSubtitle = prajaktaBlog?.short_description || 'Exploring contemporary sculpture, domestic spaces, and post-colonial motifs.';

        // 2. Fetch latest published magazine edition
        const { data: magData } = await supabase
          .from('magazines')
          .select('issue_number, issue_name, cover_image_url, tagline, short_summary')
          .eq('status', 'published')
          .order('issue_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 3. Fetch Freedom - Season 3 exhibition event image
        const { data: freedomEventData } = await supabase
          .from('events')
          .select('title, featured_image_url, short_description, location')
          .ilike('title', '%freedom%')
          .maybeSingle();

        const freedomMediaUrl = freedomEventData?.featured_image_url || 'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&q=80&w=1200';

        // Check if custom slides were explicitly configured in Admin
        const localSaved = localStorage.getItem('tal_hero_cards');
        let customDeck: HeroDeckCard[] | null = null;
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              customDeck = parsed.slice(0, 3); // Strictly 3 cards
            }
          } catch (e) {}
        }

        if (customDeck && customDeck.length === 3) {
          setCards(customDeck);
          return;
        }

        // Dynamically build interconnected 3-card deck with uploaded images
        setCards([
          {
            id: 'hero-blog',
            media_type: 'image',
            media_url: blogMediaUrl,
            badge: 'ESSAY // CONTEMPORARY ART',
            title: blogTitle,
            subtitle: blogSubtitle,
            link_page: 'blogs',
            link_text: 'Read Full Essay'
          },
          {
            id: 'hero-magazine',
            media_type: 'image',
            media_url: magData?.cover_image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1200',
            badge: `LATEST PRINT // ISSUE NO. ${magData?.issue_number || 42}`,
            title: magData?.issue_name || 'The Digital Renaissance',
            subtitle: magData?.tagline || magData?.short_summary || 'Special quarterly print release examining new media art.',
            link_page: 'magazine',
            link_text: 'Explore Issue'
          },
          {
            id: 'hero-event',
            media_type: 'image',
            media_url: freedomMediaUrl,
            badge: 'UPCOMING EXHIBITION // MUMBAI',
            title: 'Freedom - Season 3',
            subtitle: 'International Art Exhibition & Award Event at Nehru Centre AC Art Gallery, Worli, Mumbai.',
            link_page: 'events',
            link_text: 'View Exhibition'
          }
        ]);
      } catch (err) {
        console.error('Error interconnecting hero assets:', err);
      }
    }
    loadInterconnectedHeroContent();
  }, []);

  // Continuous infinite auto-rotation between the 3 cards (4 seconds per card, pauses on user hover)
  useEffect(() => {
    if (cards.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [cards.length, isHovered]);

  return (
    <section
      id="hero"
      className="relative min-h-[90vh] lg:min-h-screen flex items-center justify-center bg-warmwhite overflow-hidden py-12 lg:py-20"
    >
      {/* Background Subtle High-Performance Gradient Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[15%] -left-[10%] w-[55%] h-[55%] rounded-full bg-turquoise/5 blur-3xl transform-gpu will-change-transform animate-pulse" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[55%] h-[55%] rounded-full bg-gold/5 blur-3xl transform-gpu will-change-transform" />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center relative z-10">

        {/* Left Column: Editorial Manifesto & Statement */}
        <div className="order-1 lg:col-span-6 flex flex-col justify-center text-left">
          <div className="mt-6 lg:-mt-28 mb-16 lg:mb-28">
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-serif font-bold tracking-tight text-midnight leading-[1.08] mb-2.5 uppercase"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              GLOBAL ART NEWS &<br className="hidden sm:inline" /> JOURNALISM.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg sm:text-xl text-slate-700 leading-relaxed font-sans max-w-xl font-normal"
            >
              A magazine covering the global art world.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-5"
          >
            <button
              id="hero-read-latest-btn"
              onClick={() => onChangePage('blogs')}
              className="px-7 py-4 bg-midnight hover:bg-deepblue text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform-gpu hover:-translate-y-0.5 cursor-pointer active:scale-95"
            >
              Read the Latest
            </button>

            <button
              id="hero-about-link-btn"
              onClick={() => onChangePage('about')}
              className="group flex items-center gap-2 text-midnight hover:text-turquoise font-sans text-xs font-bold uppercase tracking-widest transition-colors duration-300 cursor-pointer py-2 px-1"
            >
              <span>About The Art Ledger</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </motion.div>
        </div>

        {/* Right Column: Interactive 3-Card Overlapping Deck */}
        <div
          className="order-2 lg:col-span-6 flex flex-col justify-center items-center w-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* DESKTOP 3-CARD SHUFFLE DECK */}
          <div className="hidden sm:flex relative w-full h-[480px] lg:h-[520px] gap-3.5 p-0 bg-transparent overflow-hidden">
            {cards.slice(0, 3).map((card, index) => {
              const isActive = index === activeIndex;

              return (
                <div
                  key={card.id || index}
                  onClick={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) transform-gpu will-change-transform select-none ${
                    isActive
                      ? 'flex-[5] shadow-[0_15px_35px_rgba(0,0,0,0.6)] z-20 border-2 border-turquoise/50 ring-4 ring-turquoise/15 scale-[1.01]'
                      : 'flex-[1.2] opacity-75 hover:opacity-100 z-10 border border-white/10 hover:flex-[1.6]'
                  }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden'
                  }}
                >
                  {/* Media Background (Image or Video) */}
                  {card.media_type === 'video' ? (
                    <video
                      ref={(el) => { videoRefs.current[card.id] = el; }}
                      src={card.media_url}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                        isActive ? 'scale-110 filter brightness-105' : 'scale-100 filter brightness-65 group-hover:brightness-90'
                      }`}
                    />
                  ) : (
                    <img
                      src={card.media_url}
                      alt={card.title}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                        isActive ? 'scale-110 filter brightness-105' : 'scale-100 filter brightness-65 group-hover:brightness-90'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* Dynamic Dark Gradient Overlay */}
                  <div
                    className={`absolute inset-0 transition-all duration-500 ${
                      isActive
                        ? 'bg-gradient-to-t from-black/95 via-black/35 to-black/10 opacity-100'
                        : 'bg-gradient-to-t from-black/90 via-black/60 to-black/40 opacity-90'
                    }`}
                  />

                  {/* ACTIVE CARD OVERLAY CONTENT */}
                  <AnimatePresence mode="wait">
                    {isActive && (
                      <motion.div
                        key={card.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="absolute inset-x-0 bottom-0 p-7 text-white flex flex-col justify-end z-30"
                      >
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-turquoise/20 border border-turquoise/40 backdrop-blur-md text-[9px] font-mono tracking-widest text-turquoise font-bold uppercase mb-3 rounded-full w-fit shadow-sm animate-pulse">
                          <Sparkles className="w-3 h-3" />
                          {card.badge || 'INTERCONNECTED CONTENT'}
                        </span>
                        
                        <h3 className="text-xl md:text-2xl font-serif font-extrabold leading-tight text-white mb-2 line-clamp-2 drop-shadow-md">
                          {card.title}
                        </h3>

                        {card.subtitle && (
                          <p className="text-xs md:text-sm text-slate-200 line-clamp-2 font-sans mb-5 max-w-md leading-relaxed font-normal">
                            {card.subtitle}
                          </p>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onChangePage(card.link_page || 'blogs');
                          }}
                          className="inline-flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-midnight bg-turquoise hover:bg-white px-6 py-3 rounded-xl transition-all duration-300 w-fit cursor-pointer transform-gpu hover:scale-105 active:scale-95 shadow-lg shadow-turquoise/25"
                        >
                          <span>{card.link_text || 'Discover'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* INACTIVE CARD VERTICAL STRIP & ACCENT */}
                  {!isActive && (
                    <div className="absolute inset-0 p-4 text-white flex flex-col justify-between items-center pointer-events-none z-20">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-turquoise/90 uppercase bg-black/60 px-2 py-1 rounded border border-white/10">
                        0{index + 1}
                      </span>
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-sans font-extrabold uppercase tracking-widest text-white drop-shadow-md [writing-mode:vertical-lr] rotate-180 line-clamp-1 py-4">
                          {card.title}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* MOBILE CAROUSEL */}
          <div className="flex sm:hidden w-full overflow-x-auto snap-x snap-mandatory gap-4 py-2 no-scrollbar">
            {cards.slice(0, 3).map((card, index) => (
              <div
                key={card.id || index}
                onClick={() => onChangePage(card.link_page || 'blogs')}
                className="snap-center shrink-0 w-[82vw] aspect-[3/4] rounded-2xl overflow-hidden relative bg-slate-900 border border-white/10 shadow-xl cursor-pointer"
              >
                {card.media_type === 'video' ? (
                  <video
                    src={card.media_url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={card.media_url}
                    alt={card.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-5 text-white">
                  <span className="text-[9px] font-mono tracking-widest text-turquoise font-bold uppercase mb-1.5 block">
                    {card.badge}
                  </span>
                  <h3 className="text-base font-sans font-bold leading-tight text-white mb-1.5 line-clamp-2">
                    {card.title}
                  </h3>
                  {card.subtitle && (
                    <p className="text-xs text-slate-300 line-clamp-2 font-sans mb-3">
                      {card.subtitle}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-turquoise">
                    {card.link_text || 'Explore'} &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* DECK INDICATOR DOTS (3 Cards) */}
          <div className="flex items-center gap-2 mt-4">
            {cards.slice(0, 3).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                  i === activeIndex ? 'w-8 bg-midnight' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
