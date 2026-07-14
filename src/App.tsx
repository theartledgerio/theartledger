/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, CreditCard, Sparkles, CheckCircle2, ShoppingCart, Loader2 } from 'lucide-react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import About from './components/About';
import FeaturedArtists from './components/FeaturedArtists';
import Events from './components/Events';
import MagazineSection from './components/Magazine';
import Blogs from './components/Blogs';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import SubscribeModal from './components/SubscribeModal';
import Logo from './components/Logo';
import { Blog } from './types';
import BlogPostPage from './components/BlogPostPage';
import AdminPortal from './components/AdminPortal';
import SignInModal from './components/SignInModal';
import NewsletterPopup from './components/NewsletterPopup';

export default function App() {
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [activeBlog, setActiveBlog] = useState<Blog | null>(null);

  // User & Authentication States
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [signInModalOpen, setSignInModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSignInSuccess = (email: string) => {
    setUser({ email });
  };

  // Switch to the specific page view and scroll smoothly to top
  const handlePageChange = (pageId: string) => {
    setCurrentPage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div 
      id="app-root-container"
      className="min-h-screen flex flex-col font-sans bg-warmwhite text-darknavy selection:bg-turquoise/20 selection:text-turquoise"
    >
      {/* Premium Sticky Navigation */}
      {currentPage !== 'admin' && (
        <Navigation
          onOpenSubscribeModal={() => {
            if (!user) {
              setSignInModalOpen(true);
            } else {
              setSubscribeModalOpen(true);
            }
          }}
          onSearchQuery={setSearchQuery}
          activePage={currentPage}
          onChangePage={handlePageChange}
          showSplash={showSplash}
          user={user}
          onSignOut={() => {
            setUser(null);
          }}
          onSignInClick={() => setSignInModalOpen(true)}
        />
      )}

      {currentPage === 'admin' ? (
        <AdminPortal onChangePage={handlePageChange} />
      ) : (
        <main className="flex-grow pt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full"
            >
              {currentPage === 'home' && (
                <>
                  <Hero onChangePage={handlePageChange} />
                  
                  <FeaturedArtists searchQuery={searchQuery} onChangePage={handlePageChange} />
                  
                  <Events isHome={true} onChangePage={handlePageChange} />
                  
                  <MagazineSection isHome={true} onChangePage={handlePageChange} user={user} onSignInClick={() => setSignInModalOpen(true)} />
                  
                  <Blogs 
                    searchQuery={searchQuery} 
                    isHome={true} 
                    onChangePage={handlePageChange} 
                    onSelectBlog={(blog) => {
                      setActiveBlog(blog);
                      handlePageChange('blog-post');
                    }}
                  />
                  
                  <Newsletter />
                </>
              )}

              {currentPage === 'about' && (
                <div className="pt-8">
                  <About onChangePage={handlePageChange} />
                  
                  {/* EXTRA DETAILED ABOUT SECTOR TO MEET "MORE INFO" CONSTRAINT */}
                  <section className="py-24 bg-warmwhite border-t border-turquoise/10">
                    <div className="max-w-5xl mx-auto px-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
                        <div>
                          <h3 className="text-2xl font-serif font-bold text-midnight mb-4">Our Curatorial Board</h3>
                          <p className="text-xs text-graycustom leading-relaxed mb-4">
                            The Art Ledger Curatorial Board consists of seasoned museum curators, fine-art analysts, and creative technologists based across Paris, Milan, and Tokyo. 
                          </p>
                          <p className="text-xs text-graycustom leading-relaxed">
                            Under the directorship of Clara Dubois, our vetting panel analyzes over five hundred global portfolio submissions monthly, selecting only a handful of exceptional contemporary voices to log onto our digital ledger.
                          </p>
                        </div>
                        <div>
                          <h3 className="text-2xl font-serif font-bold text-midnight mb-4">Provenance Verification Charter</h3>
                          <p className="text-xs text-graycustom leading-relaxed mb-4">
                            Every transaction and profile listed in the TAL registry undergoes standard double-blind provenance authentication checks. We coordinate directly with artist guilds and verified foundations to ensure authentic digital deed transfers.
                          </p>
                          <p className="text-xs text-graycustom leading-relaxed">
                            By strictly adhering to modern cataloging rules, we build a permanent structural index that guarantees artists' IP integrity and collectors' long-term valuation security.
                          </p>
                        </div>
                      </div>
                      <div className="text-center p-10 bg-offwhite rounded-[24px] border border-turquoise/10">
                        <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest block mb-3">TAL MANIFESTO</span>
                        <p className="text-sm font-serif italic text-midnight max-w-2xl mx-auto leading-relaxed">
                          "Art is not merely a decorative asset; it is the physical architecture of human consciousness across space and time. Our role is to document its evolution with absolute purity."
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {currentPage === 'artists' && (
                <div className="pt-8">
                  <FeaturedArtists searchQuery={searchQuery} onChangePage={handlePageChange} isHome={false} />
                </div>
              )}

              {currentPage === 'events' && (
                <div className="pt-8">
                  <Events isHome={false} onChangePage={handlePageChange} />
                </div>
              )}

              {currentPage === 'magazine' && (
                <div className="pt-8">
                  <MagazineSection isHome={false} onChangePage={handlePageChange} user={user} onSignInClick={() => setSignInModalOpen(true)} />
                </div>
              )}

              {currentPage === 'blogs' && (
                <div className="pt-8">
                  <Blogs 
                    searchQuery={searchQuery} 
                    isHome={false} 
                    onChangePage={handlePageChange} 
                    onSelectBlog={(blog) => {
                      setActiveBlog(blog);
                      handlePageChange('blog-post');
                    }}
                  />
                </div>
              )}

              {currentPage === 'blog-post' && activeBlog && (
                <BlogPostPage blog={activeBlog} onChangePage={handlePageChange} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      )}

      {currentPage !== 'admin' && (
        <Footer
          onChangePage={handlePageChange}
          onOpenSubscribeModal={() => setSubscribeModalOpen(true)}
        />
      )}

      {/* Checkout and Subscription Patrons Desk Modal */}
      <SubscribeModal
        isOpen={subscribeModalOpen}
        onClose={() => setSubscribeModalOpen(false)}
      />

      <SignInModal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        onSuccess={handleSignInSuccess}
      />

      <NewsletterPopup heroHeight={600} />



      {/* Immersive Dark Blue Splash Screen with White Logo transition */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash-screen-overlay"
            id="splash-screen"
            className="fixed inset-0 bg-midnight z-50 flex flex-col items-center justify-center text-white"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              layoutId="logo-container"
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <Logo light={true} className="scale-125 md:scale-150" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
