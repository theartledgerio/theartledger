/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/newsletter-subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        throw new Error('Failed to subscribe');
      }

      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setEmail('');
      }, 4000);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Error occurred');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <section
      id="newsletter"
      className="relative py-24 md:py-32 bg-[#FAF6ED] border-t border-b border-gold/30 overflow-hidden"
    >
      {/* Background elegant golden highlight */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full bg-gold/5 blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <span className="text-xs font-mono tracking-widest text-gold uppercase mb-4 block font-bold">
          THE ART LEDGER WEEKLY DIRECTORY
        </span>

        <h2 className="text-3xl md:text-5xl font-serif font-bold text-midnight leading-tight mb-6">
          Stay Connected With <br /> The Art World
        </h2>

        <p className="text-sm md:text-base text-graycustom max-w-xl mx-auto leading-relaxed mb-12">
          Subscribe to our premium catalog mailing list and receive critical reviews, curated portfolios, VIP opening cards, and digital magazine codes weekly.
        </p>

        {/* Input form */}
        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto p-6 bg-warmwhite border border-gold/20 rounded-2xl shadow-xl"
            >
              <CheckCircle2 className="w-12 h-12 text-gold mx-auto mb-4 animate-bounce" />
              <h4 className="text-lg font-serif font-bold text-midnight mb-1">Weekly Ledger Subscribed</h4>
              <p className="text-xs text-graycustom">
                Welcome to our curated list. We respect your attention; only premium critical evaluations will ever land in your inbox.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="max-w-md mx-auto flex items-center bg-warmwhite border border-gold/35 hover:border-gold rounded-full p-1.5 transition-all duration-300 shadow-md"
            >
              <div className="flex items-center pl-4 pr-2">
                <Mail className="w-5 h-5 text-gold" />
              </div>

              <input
                type="email"
                required
                placeholder="Enter your curator email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
                className="flex-1 bg-transparent border-none text-midnight text-sm outline-none px-2 py-3 placeholder:text-graycustom/60 disabled:opacity-50"
              />

              <button
                id="submit-newsletter-email"
                type="submit"
                disabled={status === 'loading' || !email}
                className="group p-3 sm:px-6 rounded-full bg-midnight text-white hover:bg-gold hover:text-white font-sans font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <span className="hidden sm:inline">Subscribe</span>
                {status === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {status === 'error' && (
          <p className="text-xs text-red-500 mt-4">{errorMessage}</p>
        )}

        <p className="text-[10px] font-mono text-graycustom mt-6 uppercase tracking-wider">
          NO SPAM. SHIELDED PRIVACY. CANCEL SUBSCRIPTION INSTANTLY.
        </p>
      </div>
    </section>
  );
}
