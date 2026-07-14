/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface AboutProps {
  onChangePage?: (pageId: string) => void;
}

export default function About({ onChangePage }: AboutProps) {
  const [readMore, setReadMore] = useState(false);

  const sections = [
    {
      id: '01',
      tag: '01 — Who we are',
      title: 'About The Art Ledger',
      paragraphs: [
        'The Art Ledger is an independent art-market intelligence platform uncovering the realities behind artworks, artists, auction houses, and valuations. We expose manipulation, track real sales patterns, and bring transparency to a market built on perception and power.',
        "In an industry where information is controlled, curated, and often misleading, The Art Ledger exists to cut through the noise. We don't rely on press releases from galleries or auction houses. We investigate. We verify. We report."
      ]
    },
    {
      id: '02',
      tag: '02 — Our mission',
      title: 'Our Mission',
      paragraphs: [
        'To bring transparency, accountability, and market awareness to the art ecosystem by documenting verifiable sales data and exposing manipulation.',
        'We believe collectors, artists, and enthusiasts deserve access to accurate information — not marketing narratives crafted by those with vested interests. Our mission is to democratize art market intelligence.'
      ]
    },
    {
      id: '03',
      tag: '03 — Our vision',
      title: 'Our Vision',
      paragraphs: [
        'To become one of the most trusted independent voices in the art market — where truth matters more than reputation.',
        'We envision a future where the art market operates with the same transparency expected of other major asset classes. Where collectors can make informed decisions, where artists are fairly valued, and where manipulation is exposed and corrected.'
      ]
    },
    {
      id: '04',
      tag: '04 — Our team',
      title: 'About The Team',
      paragraphs: [
        'The Art Ledger is powered by a dedicated team of researchers, analysts, writers, and industry insiders who share a common goal: bringing truth to the art world.',
        'Our team includes former auction house professionals, art historians, investigative journalists, and data analysts. We combine deep industry knowledge with rigorous research methodologies to produce content that is both authoritative and accessible.',
        'We operate independently, without ties to galleries, auction houses, or collectors who might seek to influence our coverage. This independence is our greatest asset — and our commitment to our readers.'
      ]
    }
  ];

  return (
    <section
      id="about"
      className="py-20 md:py-32 bg-warmwhite border-t border-offwhite/55 relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Bold Editorial Manifesto Header */}
        <div className="mb-20 md:mb-28">
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs sm:text-sm tracking-[0.35em] text-midnight font-bold uppercase mb-4"
          >
            THE ART LEDGER // MANIFESTO
          </motion.p>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-midnight leading-[1.1] tracking-tight mb-8"
          >
            A ledger for the art world,<br />
            written without compromise.
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-[#1C2D42]/90 leading-relaxed font-sans font-medium"
          >
            Independent. Investigative. Allergic to press releases. The Art Ledger documents the contemporary market — its triumphs, its theatre, and the quiet manipulations in between.
          </motion.p>
        </div>

        {/* Investigative Sections - Beautifully simple and large */}
        <div className="space-y-20 md:space-y-28">
          {sections.map((sect, sIdx) => (
            <motion.div 
              key={sect.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: sIdx * 0.05 }}
              className="space-y-6 pt-10 border-t border-offwhite"
            >
              <div>
                <span className="text-xs sm:text-sm font-mono font-bold text-midnight/70 tracking-widest block mb-2 uppercase">
                  {sect.tag}
                </span>
                <h3 className="text-3xl sm:text-4xl font-serif font-bold text-midnight tracking-tight">
                  {sect.title}
                </h3>
              </div>

              <div className="space-y-6 text-base sm:text-lg md:text-xl text-[#1C2D42]/85 leading-relaxed font-sans font-normal">
                {sect.paragraphs.map((p, pIdx) => (
                  <p key={pIdx}>
                    {p}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Expandable Segment (Continue Reading) */}
        <AnimatePresence>
          {readMore && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="overflow-hidden mt-16"
            >
              <div className="p-8 bg-white/75 backdrop-blur-sm border border-offwhite rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-8 text-sm sm:text-base text-graycustom leading-relaxed font-normal">
                <div>
                  <h4 className="font-serif font-bold text-lg sm:text-xl text-midnight mb-3 flex items-center gap-2">
                    Double-Blind Research Standards
                  </h4>
                  <p className="mb-3">
                    Our reporting metrics match institutional investigation protocols. Every statement is verified through cross-referencing multiple verified insiders, transaction ledgers, and direct digital registries.
                  </p>
                  <p>
                    We reject anonymous promotional tips and public relation narratives, focusing purely on cold sales contracts and traceable provenance.
                  </p>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-lg sm:text-xl text-midnight mb-3 flex items-center gap-2">
                    Advisory Integrity Pledge
                  </h4>
                  <p className="mb-3">
                    The Art Ledger holds zero commercial interest in art assets or gallery commissions. We do not participate in secondary market brokerages or represent individual artists financially.
                  </p>
                  <p>
                    This complete financial segregation allows us to write, review, and evaluate the contemporary market without conflict of interest.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Actions and Fine Signature */}
        <div className="mt-20 md:mt-28 border-t border-offwhite pt-12 flex flex-col items-center justify-center text-center">
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <button
              onClick={() => setReadMore(!readMore)}
              className="px-8 py-4 bg-midnight hover:bg-[#1C2D42] text-white font-sans text-xs sm:text-sm font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
            >
              {readMore ? 'Collapse Profile' : 'Continue Reading'}
            </button>
            <button
              onClick={() => onChangePage?.('blogs')}
              className="px-8 py-4 bg-white border border-[#EAE5D8] hover:border-midnight text-midnight hover:text-midnight font-sans text-xs sm:text-sm font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Explore The Journal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Master Signature Logo */}
          <div className="select-none">
            <span className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-midnight uppercase leading-none opacity-90">
              The Art Ledger
            </span>
            <div className="w-12 h-0.5 bg-midnight mx-auto mt-3 rounded-full" />
          </div>
        </div>

      </div>
    </section>
  );
}
