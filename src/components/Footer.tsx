/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowUp, Instagram, Twitter, Linkedin, Youtube, ExternalLink, Globe, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import Logo from './Logo';

interface FooterProps {
  onChangePage: (pageId: string) => void;
  onOpenSubscribeModal: () => void;
}

export default function Footer({ onChangePage, onOpenSubscribeModal }: FooterProps) {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    { name: 'Instagram', icon: <Instagram className="w-4 h-4" />, href: '#' },
    { name: 'Twitter', icon: <Twitter className="w-4 h-4" />, href: '#' },
    { name: 'LinkedIn', icon: <Linkedin className="w-4 h-4" />, href: '#' },
    { name: 'YouTube', icon: <Youtube className="w-4 h-4" />, href: '#' }
  ];

  return (
    <>
      {/* Floating Back to Top Button */}
      <div 
        id="back-to-top-container"
        className={`fixed bottom-8 right-8 z-30 transition-all duration-300 transform ${
          showBackToTop ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'
        }`}
      >
        <button
          id="back-to-top-btn"
          onClick={handleBackToTop}
          className="p-3.5 rounded-full bg-midnight text-white hover:bg-midnight/90 shadow-xl shadow-midnight/15 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex items-center justify-center group border border-[#EAE5D8]"
          aria-label="Scroll back to top"
        >
          <ArrowUp className="w-5 h-5 group-hover:animate-bounce" />
        </button>
      </div>

      <footer
        id="app-footer"
        className="bg-[#FBFBFA] text-darknavy py-16 md:py-20 border-t border-[#EAE5D8]"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-14 border-b border-[#EAE5D8]">
            
            {/* Column 1: Brand & Bio (Takes 5 columns) */}
            <div className="md:col-span-5 space-y-6">
              <button
                id="footer-logo-btn"
                onClick={() => onChangePage('home')}
                className="flex flex-col items-start justify-start text-left cursor-pointer text-midnight hover:opacity-80 transition-opacity duration-300"
              >
                <Logo className="scale-90 origin-left" />
              </button>
              
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-sm">
                The Art Ledger (TAL) is an independent monthly journal from India documenting contemporary fine art, curatorial practices, and creative frontiers with global aesthetic precision.
              </p>

              {/* Social Channels (Circular Badges) */}
              <div className="flex items-center space-x-2.5">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="p-2.5 rounded-full border border-slate-200 hover:border-midnight hover:bg-midnight text-slate-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"
                    aria-label={link.name}
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Navigation (Takes 3 columns) */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-[10px] font-mono text-midnight uppercase tracking-widest font-bold">
                PLATFORM CORE
              </h4>
              <ul className="space-y-3 text-xs text-slate-600 font-medium">
                <li>
                  <button
                    id="footer-nav-home"
                    onClick={() => onChangePage('home')}
                    className="hover:text-midnight transition-all duration-200 cursor-pointer hover:translate-x-1 transform inline-block"
                  >
                    Home Spotlight
                  </button>
                </li>
                <li>
                  <button
                    id="footer-nav-about"
                    onClick={() => onChangePage('about')}
                    className="hover:text-midnight transition-all duration-200 cursor-pointer hover:translate-x-1 transform inline-block"
                  >
                    About TAL Mission
                  </button>
                </li>
                <li>
                  <button
                    id="footer-nav-artists"
                    onClick={() => onChangePage('artists')}
                    className="hover:text-midnight transition-all duration-200 cursor-pointer hover:translate-x-1 transform inline-block"
                  >
                    Curated Artist Roster
                  </button>
                </li>
                <li>
                  <button
                    id="footer-nav-events"
                    onClick={() => onChangePage('events')}
                    className="hover:text-midnight transition-all duration-200 cursor-pointer hover:translate-x-1 transform inline-block"
                  >
                    Exhibition Schedule
                  </button>
                </li>
                <li>
                  <button
                    id="footer-nav-magazine"
                    onClick={() => onChangePage('magazine')}
                    className="hover:text-midnight transition-all duration-200 cursor-pointer hover:translate-x-1 transform inline-block"
                  >
                    Quarterly Magazines
                  </button>
                </li>
                <li>
                  <button
                    id="footer-nav-blogs"
                    onClick={() => onChangePage('blogs')}
                    className="hover:text-midnight transition-all duration-200 cursor-pointer hover:translate-x-1 transform inline-block"
                  >
                    Editorial Journal
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact & Legal (Takes 4 columns) */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-[10px] font-mono text-midnight uppercase tracking-widest font-bold">
                CURATORIAL OFFICE
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                TAL Headquarters: <br />
                84 Rue de l'Université, 75007 Paris, France <br />
                New Delhi Office: Okhla Phase III, New Delhi 110020, India
              </p>
              
              <div className="text-xs space-y-2 text-slate-600 pt-1">
                <p>
                  Advisory:{" "}
                  <a
                    href="mailto:curator@artledger.com"
                    className="text-midnight font-semibold hover:text-midnight hover:underline transition-colors"
                  >
                    curator@artledger.com
                  </a>
                </p>
                <p>
                  Acquisitions:{" "}
                  <a
                    href="mailto:acquisitions@artledger.com"
                    className="text-midnight font-semibold hover:text-midnight hover:underline transition-colors"
                  >
                    acquisitions@artledger.com
                  </a>
                </p>
              </div>

              <div className="pt-2">
                <button
                  id="footer-subscribe-btn"
                  onClick={onOpenSubscribeModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-midnight hover:bg-deepblue text-white text-[9px] font-sans font-bold uppercase tracking-widest rounded-full transition-all duration-300 shadow-md shadow-midnight/10 cursor-pointer"
                >
                  <span>Request Print Catalogues</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>
          


          {/* Bottom Copyright Block */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-[11px] text-slate-500 font-mono">
            <p>© {new Date().getFullYear()} The Art Ledger. All Rights Reserved.</p>
            
            <div className="flex flex-wrap items-center justify-center gap-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-midnight transition-colors">Privacy Charter</a>
              <a href="#" className="hover:text-midnight transition-colors">Collector Terms</a>
              <a href="#" className="hover:text-midnight transition-colors font-bold flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                <span>Global Edition // EN</span>
              </a>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}
