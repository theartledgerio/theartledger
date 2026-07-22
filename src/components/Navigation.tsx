/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, X, Mail, ArrowUp, ShoppingCart, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

interface NavigationProps {
  onOpenSubscribeModal: () => void;
  onSearchQuery?: (query: string) => void;
  activePage: string;
  onChangePage: (pageId: string) => void;
  showSplash?: boolean;
  user?: { email: string } | null;
  onSignOut?: () => void;
  onSignInClick?: () => void;
}

export default function Navigation({
  onOpenSubscribeModal,
  onSearchQuery,
  activePage,
  onChangePage,
  showSplash = false,
  user = null,
  onSignOut,
  onSignInClick
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'About', id: 'about' },
    { name: 'Artists', id: 'artists' },
    { name: 'Events', id: 'events' },
    { name: 'Magazine', id: 'magazine' },
    { name: 'Blogs', id: 'blogs' }
  ];

  return (
    <>
      {/* Scroll Progress Indicator */}
      <div 
        id="scroll-progress-indicator"
        className="fixed top-0 left-0 h-[3px] bg-turquoise z-50 transition-all duration-100" 
        style={{ width: `${scrollProgress}%` }}
      />

      <nav
        id="main-nav"
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 py-3 bg-white/95 border-b border-slate-200/60 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.02)]`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          
          {/* Logo */}
          <button 
            id="nav-logo"
            onClick={() => onChangePage('home')} 
            className="flex items-center text-midnight cursor-pointer min-h-[44px]"
          >
            {!showSplash ? (
              <motion.div
                layoutId="logo-container"
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <Logo className="scale-90 md:scale-100 origin-left" />
              </motion.div>
            ) : (
              // Invisible placeholder to preserve layout/width during splash
              <div className="opacity-0 pointer-events-none scale-90 md:scale-100 origin-left">
                <Logo />
              </div>
            )}
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangePage(item.id)}
                  className={`text-xl font-condensed tracking-widest transition-all duration-300 relative group py-1 cursor-pointer ${
                    isActive ? 'text-darknavy' : 'text-darknavy hover:text-darknavy/80'
                  }`}
                >
                  {item.name}
                  <span className={`absolute bottom-0 left-0 h-[1.5px] bg-darknavy transition-all duration-300 ${
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
                </button>
              );
            })}
          </div>

          {/* Desktop Action Icons */}
          <div className="hidden lg:flex items-center space-x-5">
            {/* Subscribe Button */}
            <button
              id="subscribe-nav-btn"
              onClick={onOpenSubscribeModal}
              className="px-5 py-2.5 rounded-full text-sm font-sans font-semibold uppercase tracking-widest text-white bg-midnight hover:bg-turquoise hover:text-white shadow-md hover:shadow-turquoise/20 transition-all duration-300 transform active:scale-95 cursor-pointer"
            >
              Subscribe
            </button>

            {/* User Sign In / Profile Action */}
            {user ? (
              <div className="flex items-center gap-3 bg-midnight/5 px-4 py-2 rounded-full border border-offwhite">
                <User className="w-4 h-4 text-midnight" />
                <span className="text-[10px] font-mono font-bold uppercase text-midnight max-w-[100px] truncate">
                  {user.email.split('@')[0]}
                </span>
                <button
                  onClick={onSignOut}
                  className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className="px-4 py-2 border border-midnight text-midnight hover:bg-midnight hover:text-white font-sans text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile/Tablet Right Controls (Logo, Subscribe, Three Lines Hamburger) */}
          <div className="flex lg:hidden items-center space-x-3">
            {/* Subscribe Button for Mobile/Tablet */}
            <button
              id="mobile-subscribe-nav-btn"
              onClick={onOpenSubscribeModal}
              className="px-4 py-2 rounded-full text-[10px] sm:text-xs font-sans font-semibold uppercase tracking-widest text-white bg-midnight hover:bg-turquoise shadow-md transition-all duration-300 transform active:scale-95 cursor-pointer"
            >
              Subscribe
            </button>

            {/* Hamburger Button (Three lines) */}
            <button
              id="mobile-menu-btn"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-darknavy cursor-pointer"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="mobile-nav-drawer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden w-full bg-white/95 border-b border-slate-200/50 backdrop-blur-xl mt-2 shadow-[0_4px_30px_rgba(0,0,0,0.03)]"
            >
              <div className="flex flex-col px-6 py-6 space-y-4">
                {navItems.map((item) => {
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setIsOpen(false);
                        onChangePage(item.id);
                      }}
                      className={`text-left text-lg font-condensed tracking-wider py-2 border-b border-gray-100 cursor-pointer ${
                        isActive ? 'text-darknavy font-bold' : 'text-darknavy/80'
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
                
                <button
                  id="mobile-subscribe-btn"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSubscribeModal();
                  }}
                  className="flex items-center justify-center space-x-2 w-full py-3 mt-2 rounded-full bg-midnight text-white font-sans font-semibold text-sm cursor-pointer hover:bg-turquoise transition-colors duration-250"
                >
                  <Mail className="w-4 h-4" />
                  <span>SUBSCRIBE TO MAGAZINE</span>
                </button>

                {user ? (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onSignOut && onSignOut();
                    }}
                    className="flex items-center justify-center space-x-2 w-full py-3 mt-2 rounded-full border border-red-500 text-red-500 font-sans font-semibold text-sm cursor-pointer hover:bg-red-50 transition-colors duration-250"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>SIGN OUT ({user.email.split('@')[0]})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onSignInClick && onSignInClick();
                    }}
                    className="flex items-center justify-center space-x-2 w-full py-3 mt-2 rounded-full border border-midnight text-midnight font-sans font-semibold text-sm cursor-pointer hover:bg-midnight/5 transition-colors duration-250"
                  >
                    <User className="w-4 h-4" />
                    <span>SIGN IN</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
