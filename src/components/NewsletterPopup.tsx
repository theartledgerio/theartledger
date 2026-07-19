import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Sparkles, Loader2 } from 'lucide-react';

interface NewsletterPopupProps {
  heroHeight?: number;
}

export default function NewsletterPopup({ heroHeight = 600 }: NewsletterPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Note: Temporarily disabling the sessionStorage check so you can test it easily!
    // const isDismissed = sessionStorage.getItem('tal_newsletter_dismissed') === 'true';
    const isSubscribed = sessionStorage.getItem('tal_newsletter_subscribed') === 'true';

    if (isSubscribed) return;

    const triggerHeight = heroHeight / 2;

    const handleScroll = () => {
      if (window.scrollY > triggerHeight) {
        setIsOpen(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    // Check immediately in case they refresh while already scrolled down
    if (window.scrollY > triggerHeight) {
      setIsOpen(true);
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [heroHeight]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('tal_newsletter_dismissed', 'true');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsPending(true);

    setTimeout(() => {
      setIsPending(false);
      setIsSubmitted(true);
      sessionStorage.setItem('tal_newsletter_subscribed', 'true');
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Subtle blurred backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-midnight/50 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 185 }}
            className="relative w-full max-w-md bg-warmwhite border border-offwhite rounded-[28px] p-8 shadow-2xl z-10"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-midnight/5 text-midnight cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {isSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-turquoise/10 flex items-center justify-center text-turquoise mx-auto animate-bounce">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-serif font-bold text-midnight">Welcome to the Inner Circle</h4>
                <p className="text-xs text-graycustom max-w-xs mx-auto leading-relaxed">
                  Your subscription is confirmed. Prepare for unparalleled insights into the global art market delivered directly to your inbox.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <span className="text-[9px] font-mono text-turquoise uppercase tracking-widest block font-bold">THE ART LEDGER INSIDER</span>
                  <h3 className="text-2xl font-serif font-bold text-midnight leading-tight">
                    Elevate Your Collection
                  </h3>
                  <p className="text-xs text-graycustom max-w-xs mx-auto leading-relaxed">
                    Unlock exclusive access to expert market analysis, curated artist discoveries, and private invitations to our premium exhibitions.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-offwhite focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs outline-none text-midnight font-semibold shadow-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPending || !email}
                    className="w-full py-3 bg-midnight hover:bg-turquoise text-white font-sans text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Subscribing...</span>
                      </>
                    ) : (
                      <span>Subscribe</span>
                    )}
                  </button>
                </form>

                <div className="text-center">
                  <button
                    onClick={handleClose}
                    className="text-[10px] font-mono text-graycustom hover:text-midnight uppercase tracking-wider font-bold transition-colors cursor-pointer"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
