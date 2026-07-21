/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, User, ChevronRight, CheckCircle, Ticket, ArrowDown, History, Hourglass } from 'lucide-react';
import { Event } from '../types';
import { supabase } from '../supabase';

interface EventsProps {
  isHome?: boolean;
  onChangePage?: (pageId: string) => void;
}

export default function Events({ isHome = false, onChangePage }: EventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegEvent, setSelectedRegEvent] = useState<Event | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const timelineSectionRef = useRef<HTMLDivElement>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'guidelines' | 'awards' | 'participation'>('overview');

  useEffect(() => {
    async function loadEvents() {
      try {
        const freedomEvent: Event = {
          id: 'freedom-season-3',
          title: 'Freedom - Season 3',
          subtitle: 'International Art Exhibition & Award Event',
          date: '2026-08-11',
          time: '12:00 PM - 7:00 PM',
          venue: 'Nehru Centre AC Art Gallery, Worli, Mumbai',
          artist: 'SKAF India (Curator: Siddharth Karmakar)',
          image: 'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&q=80&w=1200',
          status: 'Upcoming',
          description: 'Freedom - Season 3 is a prestigious international art exhibition and award event curated by Siddharth Karmakar. Designed to uplift emerging and established artists alike, it offers a prominent platform at the Nehru Centre AC Art Gallery in Worli, Mumbai. The exhibition welcomes diverse mediums including Painting, Sculpture, Graphic Art, Digital Art, and Photography (no crafts). Exhibiting artists are eligible for awards, certificates, physical catalogues, and mementos with zero sales commission.',
          type: 'Exhibition',
          timelineStep: 1
        };

        const DUMMY_TITLES = [
          'the future of fine art asset valuation',
          'beneath the canvas: elena rossi',
          'beneath the canvas',
          'the silent monument',
          'monolithic echoes',
          'curatorial symposium',
          'digital resonances'
        ];

        const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });

        const realEventsFromDb: Event[] = (data || [])
          .filter(item => {
            const titleLower = (item.title || '').toLowerCase();
            return !DUMMY_TITLES.some(d => titleLower.includes(d));
          })
          .map((item, index) => ({
            id: item.id,
            title: item.title,
            subtitle: item.short_description || 'Curated Exhibition',
            date: item.event_date || '2026-08-11',
            time: '12:00 PM - 7:00 PM',
            venue: item.location || 'Nehru Centre AC Art Gallery, Worli, Mumbai',
            artist: item.artist || 'SKAF India (Curator: Siddharth Karmakar)',
            image: item.featured_image_url || 'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&q=80&w=1200',
            status: item.status === 'completed' ? 'Completed' : item.status === 'published' ? 'Current' : 'Upcoming',
            description: item.long_description || item.short_description || '',
            type: 'Exhibition',
            timelineStep: index + 1
          }));

        // Ensure Freedom 3 is the single sole exhibition event
        const freedomOnly = [freedomEvent];
        setEvents(freedomOnly);
        setActiveEvent(freedomEvent);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegSuccess(true);
    setTimeout(() => {
      setRegSuccess(false);
      setSelectedRegEvent(null);
      setAttendeeName('');
      setAttendeeEmail('');
    }, 4000);
  };



  const scrollToTimeline = () => {
    if (timelineSectionRef.current) {
      timelineSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter events for simple home layout
  const upcomingEvents = events.filter(e => e.status !== 'Completed');
  const completedEvents = events.filter(e => e.status === 'Completed');

  // HOME SCREEN LAYOUT (Simple, nice, no video, 2 sections for upcoming vs previous)
  if (isHome) {
    return (
      <section
        id="events-home"
        className="py-20 md:py-32 bg-warmwhite border-t border-offwhite/55 relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
          
          {/* Section Header */}
          <div className="border-b border-offwhite pb-8 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[11px] font-mono tracking-[0.3em] text-midnight font-bold uppercase block mb-3">
                CHRONICLE // EXHIBITIONS
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-midnight tracking-tight leading-none">
                Exhibition Calendar
              </h2>
            </div>
            <p className="text-sm sm:text-base text-graycustom font-medium max-w-sm md:text-right leading-relaxed">
              Curating dialogue, space, and physical-digital narratives across global art capitals.
            </p>
          </div>

          {/* Two Columns: Upcoming vs Previous */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16">
            
            {/* Column 1: Upcoming Events */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-offwhite pb-4">
                <div className="p-2 bg-midnight/5 text-midnight rounded-xl">
                  <Hourglass className="w-5 h-5 text-midnight" />
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-midnight">
                  Upcoming Releases
                </h3>
              </div>

              <div className="space-y-6">
                {upcomingEvents.map((event) => (
                  <div 
                    key={event.id}
                    onClick={() => onChangePage?.('events')}
                    className="group bg-white/40 hover:bg-white/90 border border-offwhite/50 hover:border-offwhite rounded-2xl p-5 transition-all duration-300 flex flex-col sm:flex-row gap-5 shadow-sm hover:shadow-md cursor-pointer"
                  >
                    {/* Visual Media Container */}
                    <div className="w-full sm:w-28 h-28 rounded-xl overflow-hidden shrink-0">
                      <img 
                        src={event.image} 
                        alt={event.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-midnight bg-midnight/5 px-2 py-0.5 rounded-full">
                            {event.type}
                          </span>
                          <span className="text-[10px] font-mono text-graycustom">
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="text-lg font-serif font-bold text-midnight group-hover:text-[#1C2D42] transition-colors line-clamp-1">
                          {event.title}
                        </h4>
                        <p className="text-xs text-graycustom font-medium mt-1">
                          By {event.artist}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[11px] text-graycustom mt-3">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Previous Events */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-offwhite pb-4">
                <div className="p-2 bg-midnight/5 text-midnight rounded-xl">
                  <History className="w-5 h-5 text-midnight" />
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-midnight">
                  Previous Archive
                </h3>
              </div>

              <div className="space-y-6">
                {completedEvents.map((event) => (
                  <div 
                    key={event.id}
                    onClick={() => onChangePage?.('events')}
                    className="group bg-white/10 hover:bg-white/40 border border-offwhite/30 hover:border-offwhite/70 rounded-2xl p-5 transition-all duration-300 flex flex-col sm:flex-row gap-5 opacity-75 hover:opacity-100 cursor-pointer"
                  >
                    {/* Gray scale / Desaturated Media Container */}
                    <div className="w-full sm:w-28 h-28 rounded-xl overflow-hidden shrink-0 filter grayscale">
                      <img 
                        src={event.image} 
                        alt={event.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-graycustom bg-gray-200/40 px-2 py-0.5 rounded-full font-bold">
                            ARCHIVE
                          </span>
                          <span className="text-[10px] font-mono text-graycustom">
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="text-lg font-serif font-bold text-midnight line-clamp-1">
                          {event.title}
                        </h4>
                        <p className="text-xs text-graycustom font-medium mt-1">
                          By {event.artist}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[11px] text-graycustom mt-3">
                        <CheckCircle className="w-3.5 h-3.5 text-graycustom" />
                        <span>Completed Retrospective</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Call to action navigation */}
          <div className="mt-16 text-center">
            <button
              onClick={() => onChangePage?.('events')}
              className="px-8 py-4 bg-midnight hover:bg-[#1C2D42] text-white font-sans text-xs sm:text-sm font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-3.5 mx-auto"
            >
              <span>Explore Interactive Timeline</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>
    );
  }

  // FULL PAGE LAYOUT (Fullscreen video hero + chronological calendar timeline)
  return (
    <div id="events-full-page" className="bg-warmwhite min-h-screen">
      
      {/* Immersive Fullscreen Hero Section */}
      <section className="relative w-full h-[calc(100vh-48px)] min-h-[580px] overflow-hidden flex flex-col justify-end">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 bg-midnight">
          <img
            src="https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&q=80&w=1920"
            alt="Art Gallery Background"
            className="w-full h-full object-cover opacity-25 filter brightness-50"
          />
          {/* Heavy cinematic dark overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/65 to-midnight/80 z-10" />
        </div>

        {/* Live Status indicator */}
        <div className="absolute top-8 right-8 z-30 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-midnight/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-white font-bold uppercase">TRANSMITTING</span>
          </div>
        </div>

        {/* Overlay Content anchored beautifully at the bottom */}
        <div className="relative z-20 max-w-5xl mx-auto px-6 md:px-12 pb-16 md:pb-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="space-y-6 md:space-y-8"
          >
            <div>
              <span className="text-xs sm:text-sm font-mono tracking-[0.3em] uppercase text-white/80 block mb-3">
                THE ART LEDGER // LIVE BROADCAST FEED
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white tracking-tight leading-[1.05] max-w-4xl">
                The Contemplation of Modern Spaces
              </h1>
            </div>

            <p className="text-base sm:text-lg md:text-xl text-white/85 max-w-3xl leading-relaxed font-sans font-light">
              We document physical structures, transient installations, and global curated projects with absolute purity. No press releases, no bias. Simply modern space recorded in real-time.
            </p>

            {/* Scroll down indicator action button */}
            <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <button
                onClick={scrollToTimeline}
                className="px-8 py-4.5 bg-white text-midnight hover:bg-offwhite font-sans font-bold uppercase text-xs tracking-widest rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-3 group"
              >
                <span>EXPLORE CHRONOLOGICAL TIMELINE</span>
                <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-300" />
              </button>
              
              <span className="text-xs font-mono text-white/60 uppercase tracking-widest hidden sm:inline">
                SCROLL DOWN TO ACCESS RESERVATIONS
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Exhibition Calendar and Interactive Timeline Area */}
      <div 
        ref={timelineSectionRef}
        className="py-20 md:py-32"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          {/* Section Header */}
          <div className="border-b border-offwhite pb-8 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[11px] font-mono tracking-[0.3em] text-midnight font-bold uppercase block mb-3">
                04 // TIMELINE INDEX
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-midnight tracking-tight leading-none">
                Exhibition Calendar
              </h2>
            </div>
            <p className="text-sm sm:text-base text-graycustom font-medium max-w-sm md:text-right leading-relaxed">
              Secure priority passes to panel forums, studio collections, and VIP previews coordinated by the TAL press network.
            </p>
          </div>

          {/* Interactive Split Timeline & Detail layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: Vertical Chronological Timeline Tracks */}
            <div className="lg:col-span-5 space-y-4">
              <div className="mb-6">
                <span className="text-[10px] font-mono tracking-widest text-midnight/60 font-bold uppercase block">
                  CHRONOLOGICAL INDEX
                </span>
                <h3 className="text-2xl font-serif font-bold text-midnight mt-1">
                  Select Exhibition Date
                </h3>
              </div>

              {/* Vertical Track container */}
              <div className="relative pl-8 space-y-6">
                {/* Vertical line connector */}
                <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-offwhite" />
                
                {events.map((event) => {
                  const isActive = activeEvent?.id === event.id;
                  return (
                    <button
                      key={event.id}
                      onClick={() => setActiveEvent(event)}
                      className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 relative group flex gap-4 cursor-pointer focus:outline-none ${
                        isActive
                          ? 'bg-midnight border-midnight text-white shadow-xl translate-x-1.5'
                          : 'bg-offwhite border-transparent text-midnight hover:border-midnight/15'
                      }`}
                    >
                      {/* Animated Node Point */}
                      <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                        <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                          isActive 
                            ? 'bg-midnight ring-4 ring-midnight/35 scale-125' 
                            : 'bg-gray-300 group-hover:bg-midnight group-hover:scale-110'
                        }`} />
                      </div>

                      {/* Left Block Date column */}
                      <div className="flex flex-col justify-between shrink-0 text-center w-14 border-r border-offwhite/20 pr-3">
                        <span className={`text-[11px] font-mono font-bold tracking-widest uppercase ${
                          isActive ? 'text-white' : 'text-graycustom'
                        }`}>
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className={`text-2xl font-serif font-bold leading-none mt-1.5 ${
                          isActive ? 'text-white' : 'text-midnight'
                        }`}>
                          {new Date(event.date).toLocaleDateString('en-US', { day: '2-digit' })}
                        </span>
                      </div>

                      {/* Right Block details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`text-[10px] font-mono tracking-wider uppercase ${
                            isActive ? 'text-white/60' : 'text-graycustom'
                          }`}>
                            {event.type}
                          </span>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase ${
                            event.status === 'Completed'
                              ? 'bg-red-500/10 text-red-400'
                              : event.status === 'Current'
                              ? 'bg-[#1C2D42]/20 text-midnight font-bold'
                              : 'bg-midnight/10 text-midnight font-bold'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                        <h4 className={`text-base font-serif font-bold truncate ${
                          isActive ? 'text-white' : 'text-midnight'
                        }`}>
                          {event.title}
                        </h4>
                        <p className={`text-xs truncate ${
                          isActive ? 'text-white/75' : 'text-graycustom'
                        }`}>
                          {event.artist}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: High-fidelity Detailed Showcase Poster */}
            <div className="lg:col-span-7">
              {activeEvent ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeEvent.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4 }}
                    className="rounded-[32px] bg-white border border-offwhite/80 p-6 md:p-10 shadow-xl relative overflow-hidden"
                  >
                    <div className="space-y-8">
                      {/* Event Photo Cover */}
                      <div className="h-[280px] sm:h-[380px] w-full rounded-2xl overflow-hidden relative shadow-md group">
                        <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-midnight/95 backdrop-blur-sm text-white text-[10px] font-mono uppercase tracking-widest rounded-full font-bold">
                          {activeEvent.status} SHOWING
                        </div>
                        <img
                          src={activeEvent.image}
                          alt={activeEvent.title}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Metadata line */}
                      <div className="flex items-center gap-2 text-xs font-mono text-midnight font-bold uppercase tracking-widest">
                        <span>{activeEvent.type}</span>
                        <span>•</span>
                        <span className="text-graycustom font-medium">{activeEvent.status}</span>
                      </div>

                      {/* Exhibition Titles */}
                      <div>
                        <h3 className="text-3xl sm:text-4xl font-serif font-bold text-midnight tracking-tight leading-tight">
                        {activeEvent.title}
                        </h3>
                        <p className="text-sm sm:text-base font-semibold text-graycustom italic mt-2">
                          "{activeEvent.subtitle}"
                        </p>
                      </div>

                      {/* Interactive Detail Tabs */}
                      <div className="flex border-b border-offwhite pb-1 overflow-x-auto gap-6 no-scrollbar">
                        {[
                          { id: 'overview', label: 'Overview & Venue' },
                          { id: 'guidelines', label: 'Guidelines & Fees' },
                          { id: 'awards', label: 'Awards & Perks' },
                          { id: 'participation', label: 'How to Participate' }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveDetailTab(tab.id as any)}
                            className={`pb-3 text-xs font-mono uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                              activeDetailTab === tab.id
                                ? 'border-midnight text-midnight'
                                : 'border-transparent text-graycustom hover:text-midnight'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Tab Content Panels */}
                      <div className="space-y-6">
                        {activeDetailTab === 'overview' && (
                          <div className="space-y-6">
                            <p className="text-base text-graycustom leading-relaxed font-normal">
                              {activeEvent.description}
                            </p>
                            
                            {/* Curation Profile Block */}
                            <div className="bg-slate-50 border border-offwhite rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start">
                              <img
                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
                                alt="Siddharth Karmakar"
                                className="w-16 h-16 rounded-full object-cover shrink-0 border border-offwhite"
                              />
                              <div className="space-y-2">
                                <span className="text-[9px] font-mono text-turquoise uppercase tracking-widest block font-bold">CURATOR BIOGRAPHY</span>
                                <h4 className="text-sm font-serif font-bold text-midnight">Siddharth Karmakar Art Foundation (SKAF India)</h4>
                                <p className="text-xs text-graycustom leading-relaxed">
                                  Founded by artist and advertising professional Siddharth Karmakar, SKAF is committed to uplifting emerging artists, especially those lacking recognition or platforms to showcase their work. With an MFA from Rabindra Bharati University, Kolkata and 25+ years in the advertising sector in Mumbai, Siddharth combines creative and strategic expertise to guide artists in navigating today’s art landscape.
                                </p>
                              </div>
                            </div>

                            {/* Gallery Pics Grid */}
                            <div className="space-y-3">
                              <span className="text-[10px] font-mono text-midnight uppercase tracking-wider font-bold block">
                                NEHRU CENTRE GALLERY & IMAGES
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="rounded-xl overflow-hidden border border-offwhite h-32 relative">
                                  <img 
                                    src={activeEvent.image} 
                                    alt="Gallery Interior 1" 
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                                  />
                                </div>
                                <div className="rounded-xl overflow-hidden border border-offwhite h-32 relative">
                                  <img 
                                    src="https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&q=80&w=400" 
                                    alt="Gallery Interior 2" 
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                                  />
                                </div>
                                <div className="rounded-xl overflow-hidden border border-offwhite h-32 relative">
                                  <img 
                                    src="https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&q=80&w=400" 
                                    alt="Nehru Centre Building" 
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Google Map Iframe */}
                            <div className="space-y-3">
                              <span className="text-[10px] font-mono text-midnight uppercase tracking-wider font-bold block">
                                VENUE LOCATION MAP
                              </span>
                              <div className="rounded-2xl overflow-hidden border border-offwhite shadow-sm h-64 bg-slate-100">
                                <iframe
                                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3772.1384025178553!2d72.81729091538356!3d18.991584987137024!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7ce898083bf2f%3A0xe54d310651ea65bc!2sNehru%20Centre%20Art%20Gallery!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin"
                                  title="Nehru Centre AC Art Gallery Map"
                                  className="w-full h-full border-0"
                                  allowFullScreen={false}
                                  loading="lazy"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {activeDetailTab === 'guidelines' && (
                          <div className="space-y-6">
                            <div className="bg-slate-50 border border-offwhite rounded-2xl p-6 space-y-4">
                              <h4 className="font-serif font-bold text-midnight text-lg">Artwork Specifications</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-graycustom leading-relaxed">
                                <div className="space-y-2">
                                  <span className="font-mono text-[10px] text-midnight font-bold uppercase block">Eligible Mediums</span>
                                  <p>Painting, Sculpture, Graphic Art, Digital Art, and Photography are accepted. <span className="text-red-500 font-bold font-mono text-[9px] uppercase">Crafts are strictly not allowed</span>.</p>
                                </div>
                                <div className="space-y-2">
                                  <span className="font-mono text-[10px] text-midnight font-bold uppercase block">Max Dimensions</span>
                                  <ul className="list-disc pl-4 space-y-1">
                                    <li><strong>Artwork:</strong> 2 ft (Width) x 2 ft (Height) after complete framing.</li>
                                    <li><strong>Sculpture:</strong> 2 ft x 2 ft x 3 ft (Height).</li>
                                  </ul>
                                </div>
                                <div className="space-y-2 md:col-span-2 pt-2 border-t border-offwhite">
                                  <span className="font-mono text-[10px] text-midnight font-bold uppercase block">Physical Submission Rules</span>
                                  <ul className="list-disc pl-4 space-y-1">
                                    <li>Artwork in any medium on framed canvas or canvas board is preferred.</li>
                                    <li>An outer frame is not mandatory for inner framed canvas, but mandatory for canvas boards.</li>
                                    <li>Glass-framed artwork accepted only if the artist drops off and picks up personally. No courier/delivery accepted for glass.</li>
                                  </ul>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-50 border border-offwhite rounded-2xl p-6 space-y-4">
                              <h4 className="font-serif font-bold text-midnight text-lg">Participation Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-graycustom leading-relaxed">
                                <div className="space-y-2 p-4 bg-white border border-offwhite rounded-xl">
                                  <span className="font-mono text-[10px] text-midnight font-bold uppercase tracking-wider block">PHASE 1 (11–13 Aug 2026)</span>
                                  <p className="text-sm font-serif font-bold text-midnight mt-1">Single & Multiple Submissions Available</p>
                                  <p className="text-[10px] font-mono text-graycustom mt-1">Contact Advisory Desk for Slot Allocation</p>
                                </div>
                                <div className="space-y-2 p-4 bg-white border border-offwhite rounded-xl">
                                  <span className="font-mono text-[10px] text-midnight font-bold uppercase tracking-wider block">PHASE 2 (14–16 Aug 2026)</span>
                                  <p className="text-sm font-serif font-bold text-midnight mt-1">Single & Multiple Submissions Available</p>
                                  <p className="text-[10px] font-mono text-graycustom mt-1">Contact Advisory Desk for Slot Allocation</p>
                                </div>
                                <div className="md:col-span-2 space-y-2 pt-2 border-t border-offwhite">
                                  <span className="font-mono text-[10px] text-midnight font-bold uppercase block">Special Conditions</span>
                                  <ul className="list-disc pl-4 space-y-1">
                                    <li><strong>Sculpture entry:</strong> 1 Sculpture entry included upon selection.</li>
                                    <li><strong>Multi-phase discount:</strong> Special incentives available for participating in both phases (all 6 days).</li>
                                    <li><strong>No commission:</strong> There is <span className="text-midnight font-bold font-serif underline font-bold">NO commission (0%)</span> charged on artwork sales. All proceeds go directly to the artist.</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeDetailTab === 'awards' && (
                          <div className="space-y-6">
                            <div className="bg-slate-50 border border-offwhite rounded-2xl p-6 space-y-4">
                              <h4 className="font-serif font-bold text-midnight text-lg">Exhibition Awards & Artist Perks</h4>
                              <div className="space-y-4 text-xs text-graycustom leading-relaxed">
                                <div className="p-4 bg-white border border-offwhite rounded-xl space-y-2">
                                  <span className="font-mono text-[10px] text-turquoise font-bold uppercase tracking-wider block">TOP 10 AWARDS INCLUDES</span>
                                  <ul className="list-disc pl-4 space-y-1.5 font-sans font-medium text-midnight">
                                    <li>Certificate of Award (Hard Copy)</li>
                                    <li>Memento of Award (Hard Copy)</li>
                                    <li>Certificate of Participation (Hard Copy)</li>
                                    <li>Memento of Participation (Hard Copy)</li>
                                    <li>Printed Foldable Exhibition Catalogue (Hard Copy)</li>
                                    <li>Participation E-Poster & E-Certificate via email</li>
                                  </ul>
                                </div>

                                <div className="p-4 bg-white border border-offwhite rounded-xl space-y-2">
                                  <span className="font-mono text-[10px] text-midnight font-bold uppercase tracking-wider block">ALL PARTICIPATING ARTISTS WILL GET</span>
                                  <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                                    <li>Certificate of Participation (Hard Copy)</li>
                                    <li>Memento of Participation (Hard Copy)</li>
                                    <li>Printed Foldable Exhibition Catalogue (Hard Copy)</li>
                                    <li>Participation E-Poster & E-Certificate via email</li>
                                  </ul>
                                </div>
                                
                                <p className="text-[10px] font-mono text-graycustom text-center bg-offwhite/50 py-2.5 rounded-lg border border-offwhite">
                                  * Note: There are absolutely no extra hidden costs for hard copies of certificates or mementos.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeDetailTab === 'participation' && (
                          <div className="space-y-6">
                            <div className="bg-slate-50 border border-offwhite rounded-2xl p-6 space-y-4">
                              <h4 className="font-serif font-bold text-midnight text-lg">Step-by-Step Registration Process</h4>
                              <div className="space-y-4 text-xs text-graycustom leading-relaxed">
                                <div className="relative pl-8 space-y-6">
                                  <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-offwhite" />
                                  
                                  {[
                                    { step: '1', title: 'Visit Registration Portal', desc: 'Go to the official registration website: www.creARTorscollective.com and click the "ARTIST\'S REGISTRATION" button.' },
                                    { step: '2', title: 'Submit Form & Details', desc: 'Fill out the form and attach your profile photo along with high-res photos of your artworks. Provide titles, sizes, mediums, year of creation, and prices.' },
                                    { step: '3', title: 'Evaluation & Notification', desc: 'Your entries will be evaluated individually. SKAF India will notify you of the selection result and payment procedure via Email/WhatsApp.' },
                                    { step: '4', title: 'Pay Participation Fees', desc: 'Upon selection, pay the fees within 4 days to secure your exhibition slot. Once payment screenshot is submitted, participation is officially confirmed.' },
                                    { step: '5', title: 'Artwork Delivery', desc: 'Personally drop off physical artworks at the Nehru Centre AC Art Gallery on August 11 (Phase 1) or August 14 (Phase 2) at 8:00 AM. Alternatively, courier canvas paintings/prints to the Mumbai address by 31st July 2026.' }
                                  ].map(item => (
                                    <div key={item.step} className="relative group">
                                      <div className="absolute -left-8 top-0.5 w-7 h-7 rounded-full bg-midnight text-white flex items-center justify-center font-mono text-xs font-bold ring-4 ring-white shadow-sm">
                                        {item.step}
                                      </div>
                                      <h5 className="font-serif font-bold text-midnight text-sm">{item.title}</h5>
                                      <p className="mt-1 text-graycustom leading-normal">{item.desc}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-50 border border-offwhite rounded-2xl p-6 space-y-3">
                              <span className="font-mono text-[10px] text-midnight font-bold uppercase tracking-wider block">CONTACT & HELP DESK</span>
                              <p className="text-xs text-graycustom leading-relaxed">
                                If you have any questions or require support regarding submission, transport, or details, reach out directly:
                              </p>
                              <div className="bg-white border border-[#EAE5D8] rounded-xl p-4 text-center">
                                <p className="text-lg font-serif font-bold text-midnight">+91 85529 18937</p>
                                <p className="text-[10px] font-mono text-graycustom mt-1">CALL OR WHATSAPP // SKAF SUPPORT</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Key Logistics panel */}
                      <div className="bg-offwhite rounded-[24px] p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-sans font-medium text-[#1C2D42]">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5 text-graycustom">
                            <Calendar className="w-4 h-4 text-midnight" />
                            <span className="font-mono text-[10px] uppercase tracking-wider">Date & Time</span>
                          </div>
                          <p className="pl-6 text-midnight text-sm font-semibold">
                            {new Date(activeEvent.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {activeEvent.time}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5 text-graycustom">
                            <MapPin className="w-4 h-4 text-midnight" />
                            <span className="font-mono text-[10px] uppercase tracking-wider">Location Venue</span>
                          </div>
                          <p className="pl-6 text-midnight text-sm font-semibold truncate">
                            {activeEvent.venue}
                          </p>
                        </div>

                        <div className="space-y-2 sm:col-span-2 pt-4 border-t border-[#EAE5D8]">
                          <div className="flex items-center gap-2.5 text-graycustom">
                            <User className="w-4 h-4 text-midnight" />
                            <span className="font-mono text-[10px] uppercase tracking-wider">Featured Artist</span>
                          </div>
                          <p className="pl-6 text-midnight text-sm font-bold">
                            {activeEvent.artist}
                          </p>
                        </div>
                      </div>

                      {/* Reserve admissions button */}
                      <div className="flex justify-end pt-2">
                        {activeEvent.status !== 'Completed' ? (
                          <button
                            id={`reserve-spot-${activeEvent.id}`}
                            onClick={() => setSelectedRegEvent(activeEvent)}
                            className="px-8 py-4 bg-midnight hover:bg-[#1C2D42] text-white font-sans font-bold uppercase text-xs tracking-widest rounded-xl transition-all duration-300 shadow-md flex items-center gap-2.5 cursor-pointer"
                          >
                            <Ticket className="w-4 h-4" />
                            <span>Reserve Admission Pass</span>
                          </button>
                        ) : (
                          <div className="text-xs font-mono uppercase tracking-widest text-red-500 font-bold px-4 py-3 bg-red-500/5 rounded-xl border border-red-500/10 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            <span>RETROSPECTIVE COMPLETED // CLOSED</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="rounded-[32px] bg-white border border-offwhite/80 p-12 text-center shadow-md">
                  <p className="text-graycustom text-xs font-mono">No active events found.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Ticket Booking Dialog Modal */}
      <AnimatePresence>
        {selectedRegEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRegEvent(null)}
              className="fixed inset-0 bg-midnight/85 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-warmwhite rounded-[24px] p-8 shadow-2xl z-10 border border-gray-100"
            >
              <h3 className="text-2xl font-serif font-bold text-midnight mb-2">
                Exhibition Admission
              </h3>
              <p className="text-xs text-graycustom mb-6">
                Reserve your editorial pass for: <span className="font-semibold text-midnight font-bold">"{selectedRegEvent.title}"</span>
              </p>

              {regSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="w-16 h-16 text-midnight mx-auto mb-4 animate-bounce" />
                  <h4 className="text-lg font-serif font-bold text-midnight mb-1">Pass Approved!</h4>
                  <p className="text-xs text-graycustom max-w-xs mx-auto mb-4">
                    Your admissions ticket has been dispatched to your email address. Bring your QR code on opening night.
                  </p>
                  <span className="text-[10px] font-mono text-midnight tracking-wider uppercase font-bold">
                    TAL LEDGER PASS ID: #{Math.floor(100000 + Math.random() * 900000)}
                  </span>
                </motion.div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-graycustom uppercase tracking-widest mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Eleanor Vance"
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      className="w-full px-4 py-3 bg-offwhite border border-gray-200 focus:border-midnight focus:ring-1 focus:ring-midnight rounded-xl text-sm outline-none text-darknavy transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-graycustom uppercase tracking-widest mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. eleanor@artledger.com"
                      value={attendeeEmail}
                      onChange={(e) => setAttendeeEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-offwhite border border-gray-200 focus:border-midnight focus:ring-1 focus:ring-midnight rounded-xl text-sm outline-none text-darknavy transition-all duration-200"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      id="cancel-reg-btn"
                      type="button"
                      onClick={() => setSelectedRegEvent(null)}
                      className="flex-1 py-3 border border-darknavy/10 text-midnight hover:bg-black/5 font-sans font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all duration-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="submit-reg-btn"
                      type="submit"
                      className="flex-1 py-3 bg-midnight text-white hover:bg-black font-sans font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all duration-200 shadow-lg cursor-pointer"
                    >
                      Acquire Ticket
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
