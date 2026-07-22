/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Mail } from 'lucide-react';
import { Artist } from '../types';
import { supabase } from '../supabase';

interface FeaturedArtistsProps {
  searchQuery: string;
  onChangePage?: (pageId: string) => void;
  isHome?: boolean;
}

export default function FeaturedArtists({ searchQuery, onChangePage, isHome = true }: FeaturedArtistsProps) {
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  
  const displayArtists = artists.length > 0 ? [...artists, ...artists, ...artists] : [];

  useEffect(() => {
    async function loadArtists() {
      try {
        const { data, error } = await supabase
          .from('featured_profiles')
          .select('*')
          .eq('is_published', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        const mapped: Artist[] = (data || []).map(p => {
          return {
            id: p.id,
            name: p.name,
            style: p.style || 'Artist',
            country: p.country || 'Global',
            born: p.born || '1990',
            medium: p.medium || 'Various Media',
            portrait: p.image_url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600&h=750',
            bio: p.short_bio || `Renowned practitioner showcasing their unique curatorial language in The Art Ledger registry.`,
            statement: p.statement || 'Art is the permanent ledger of human sensory and structural evolution.'
          };
        });

        setArtists(mapped);
      } catch (err) {
        console.error('Error fetching profiles:', err);
      } finally {
        setLoading(false);
      }
    }

    loadArtists();
  }, []);

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySuccess(true);
    setTimeout(() => {
      setInquirySuccess(false);
      setInquiryName('');
      setInquiryEmail('');
    }, 4000);
  };

  // No interval needed — pure CSS handles the seamless scroll

  // Calculate animation duration based on number of artists (faster feel)
  const marqueeSpeed = Math.max(artists.length * 4, 12); // ~4s per card, minimum 12s total

  // ─── PINTEREST-STYLE ARTISTS PAGE (isHome = false) ───
  if (!isHome) {
    return (
      <section id="artists" className="pt-8 pb-20 bg-warmwhite min-h-screen">
        <div className="max-w-7xl mx-auto px-6 md:px-12">

          {/* Page Header */}
          <div className="border-b border-offwhite/50 pb-6 mb-12">
            <span className="text-[10px] font-mono tracking-widest text-[#888] font-bold uppercase block mb-2">
              THE CONTEMPORARY ROSTER
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-midnight tracking-tight leading-none mb-3">
              All Artists
            </h1>
            <p className="text-sm text-graycustom font-sans max-w-xl leading-relaxed">
              Explore the curated registry of contemporary voices selected by The Art Ledger's curatorial board.
            </p>
          </div>

          {loading ? (
            <div className="w-full text-center py-24">
              <p className="text-graycustom font-sans text-xs font-medium">Loading Registry...</p>
            </div>
          ) : (
            /* 5-per-row Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {artists.map((artist, idx) => (
                <motion.div
                  key={artist.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="group cursor-pointer"
                  onClick={() => setSelectedArtist(artist)}
                >
                  {/* Card */}
                  <div className="bg-white rounded-[24px] overflow-hidden border border-slate-200/50 shadow-sm hover:shadow-xl transition-all duration-500">
                    {/* Image */}
                    <div
                      className="relative w-full overflow-hidden"
                      style={{ aspectRatio: '3/4' }}
                    >
                      <img
                        src={artist.portrait}
                        alt={artist.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms] ease-out"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Hover CTA */}
                      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <span className="text-[9px] font-mono text-white tracking-widest uppercase bg-turquoise/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          VIEW FULL PROFILE →
                        </span>
                      </div>
                    </div>

                    {/* Info Panel */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-lg font-serif font-bold text-midnight tracking-tight leading-tight">
                          {artist.name}
                        </h3>
                        <span className="text-[10px] font-mono text-turquoise font-bold uppercase tracking-widest mt-1 block">
                          {artist.style}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-[10px] font-mono text-graycustom">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-turquoise" />
                          {artist.country}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-turquoise" />
                          b. {artist.born}
                        </span>
                      </div>

                      <p className="text-xs text-graycustom leading-relaxed line-clamp-3">
                        {artist.bio}
                      </p>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-0.5">Medium</span>
                        <span className="text-[11px] font-sans font-medium text-midnight">{artist.medium}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Artist Detail Modal — shared with home */}
        <AnimatePresence>
          {selectedArtist && renderArtistModal()}
        </AnimatePresence>
      </section>
    );
  }

  // ─── HOME PAGE MARQUEE CAROUSEL (isHome = true) ───

  // Shared modal renderer
  function renderArtistModal() {
    if (!selectedArtist) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedArtist(null)}
          className="fixed inset-0 bg-midnight/80 backdrop-blur-sm"
        />

        {/* Modal Body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-5xl bg-warmwhite rounded-[24px] overflow-hidden shadow-2xl z-10 border border-[#EAE5D8]"
        >
          {/* Close Button */}
          <button
            id="close-artist-modal"
            onClick={() => setSelectedArtist(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-midnight/5 hover:bg-turquoise/10 text-midnight hover:text-turquoise transition-all duration-200 z-30 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 max-h-[85vh] overflow-y-auto no-scrollbar">
            
            {/* Left Side: Images */}
            <div className="md:col-span-5 bg-white p-6 flex flex-col justify-start border-r border-[#EAE5D8]">
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono text-turquoise font-bold uppercase tracking-widest block mb-2">
                    ARTIST PORTRAIT
                  </span>
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-md">
                    <img
                      src={selectedArtist.portrait}
                      alt={selectedArtist.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Editorial Profile */}
            <div className="md:col-span-7 p-6 md:p-12 flex flex-col justify-between bg-warmwhite">
              <div>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-graycustom font-mono">
                    <MapPin className="w-3.5 h-3.5 text-turquoise" />
                    {selectedArtist.country}
                  </span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                  <span className="flex items-center gap-1 text-xs text-graycustom font-mono">
                    <Calendar className="w-3.5 h-3.5 text-turquoise" />
                    Born {selectedArtist.born}
                  </span>
                </div>

                <h3 className="text-4xl font-serif font-bold text-midnight mb-3">
                  {selectedArtist.name}
                </h3>

                <p className="text-xs font-mono text-turquoise font-bold uppercase tracking-wider mb-8">
                  {selectedArtist.style}
                </p>

                {/* Metadata boxes */}
                <div className="grid grid-cols-2 gap-4 py-4 px-5 bg-white rounded-2xl mb-8 border border-[#EAE5D8]/60">
                  <div>
                    <span className="text-[10px] font-mono text-graycustom uppercase tracking-widest block mb-1">
                      PRIMARY MEDIUMS
                    </span>
                    <span className="text-xs font-sans font-semibold text-midnight">
                      {selectedArtist.medium}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-graycustom uppercase tracking-widest block mb-1">
                      PORTFOLIO SECTOR
                    </span>
                    <span className="text-xs font-sans font-semibold text-midnight">
                      Fine Arts Ledger
                    </span>
                  </div>
                </div>

                <div className="space-y-6 text-sm text-graycustom leading-relaxed">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider font-sans text-midnight block mb-2">
                      Biography
                    </span>
                    <p className="font-medium text-xs leading-relaxed">{selectedArtist.bio}</p>
                  </div>

                  <div className="border-t border-[#EAE5D8] pt-6">
                    <span className="text-xs font-bold uppercase tracking-wider font-sans text-midnight block mb-2">
                      Artist Statement
                    </span>
                    <p className="italic font-serif text-slate-700 pl-4 border-l-2 border-turquoise font-medium text-sm leading-relaxed">
                      "{selectedArtist.statement}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Portfolio Inquiry Form */}
              <div className="border-t border-[#EAE5D8] pt-8 mt-10">
                <h4 className="text-xs font-sans font-bold uppercase tracking-widest text-midnight mb-4 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-turquoise" />
                  Inquire About Private Acquisition
                </h4>
                
                {inquirySuccess ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-turquoise/10 border border-turquoise/20 rounded-xl text-xs text-turquoise font-bold"
                  >
                    Your valuation & collection inquiry for {selectedArtist.name} has been received. Our TAL Art Advisory Desk will reach out within 24 hours.
                  </motion.div>
                ) : (
                  <form onSubmit={handleSendInquiry} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      className="px-4 py-2.5 bg-white border border-[#EAE5D8] rounded-xl text-xs text-darknavy focus:ring-1 focus:ring-turquoise focus:border-turquoise outline-none font-medium"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Your Email"
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      className="px-4 py-2.5 bg-white border border-[#EAE5D8] rounded-xl text-xs text-darknavy focus:ring-1 focus:ring-turquoise focus:border-turquoise outline-none font-medium"
                    />
                    <button
                      id="submit-artist-inquiry"
                      type="submit"
                      className="bg-midnight text-white hover:bg-turquoise text-[10px] font-sans font-bold uppercase tracking-widest py-2.5 rounded-xl transition-all duration-200 cursor-pointer"
                    >
                      Send Inquiry
                    </button>
                  </form>
                )}
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <section
      id="artists"
      className="pt-16 pb-2 bg-warmwhite overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Improved Section Header - Elegant Editorial Design */}
        <div className="border-b border-offwhite/50 pb-6 mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 md:gap-6">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#888] font-bold uppercase block mb-2">
              THE CONTEMPORARY ROSTER
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-midnight tracking-tight leading-none">
              Featured Artists
            </h2>
          </div>
          <div 
            onClick={() => onChangePage?.('artists')}
            className="flex items-center pb-1 cursor-pointer hover:text-turquoise transition-colors"
          >
            <span className="text-[10px] font-mono tracking-widest text-midnight font-bold uppercase hover:text-turquoise">
              ALL ARTISTS
            </span>
          </div>
        </div>

        {/* Seamless Infinite Marquee Carousel */}
        <div className="w-full">
          
          {/* Inject marquee keyframe styles */}
          <style>{`
            @keyframes marquee-scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .marquee-track {
              display: flex;
              gap: 1.5rem;
              width: max-content;
              animation: marquee-scroll ${marqueeSpeed}s linear infinite;
            }
            .marquee-track:hover {
              animation-play-state: paused;
            }
          `}</style>

          <div className="relative overflow-hidden py-2">
            {/* Subtle edge fade masks */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-warmwhite to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-warmwhite to-transparent z-10 pointer-events-none" />

            {loading ? (
              <div className="w-full text-center py-16">
                <p className="text-graycustom font-sans text-xs font-medium">Loading Roster...</p>
              </div>
            ) : (
              <div className="marquee-track">
                {/* Render two full copies for perfect seamless loop */}
                {[...displayArtists, ...artists].map((artist, idx) => (
                  <div
                    key={`marquee-${artist.id}-${idx}`}
                    onClick={() => setSelectedArtist(artist)}
                    className="shrink-0 w-[240px] md:w-[280px] group cursor-pointer"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[24px] shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-200/40">
                      <img
                        src={artist.portrait}
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms] ease-out"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-85 group-hover:opacity-95 transition-opacity duration-300" />
                      
                      {/* Name overlay */}
                      <div className="absolute bottom-6 left-6 right-6">
                        <h4 className="text-lg md:text-xl font-serif font-bold text-white tracking-tight leading-tight">
                          {artist.name}
                        </h4>
                        <span className="text-[8px] font-mono text-turquoise tracking-widest uppercase mt-1.5 block opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                          VIEW PROFILE →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Artist Detail Modal Overlay */}
      <AnimatePresence>
        {selectedArtist && renderArtistModal()}
      </AnimatePresence>

    </section>
  );
}

