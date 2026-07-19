import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Loader2, Mail, Lock } from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export default function SignInModal({ isOpen, onClose, onSuccess }: SignInModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsPending(true);

    // Simulate authentication delay
    setTimeout(() => {
      setIsPending(false);
      onSuccess(email);
      onClose();
      setEmail('');
      setPassword('');
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-midnight/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="relative w-full max-w-md bg-[#F8FAFC] rounded-[24px] p-6 md:p-8 shadow-2xl z-10 border border-slate-200 max-h-[95vh] overflow-y-auto no-scrollbar"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-midnight/5 text-midnight cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-5 md:space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-turquoise/10 flex items-center justify-center text-turquoise mx-auto">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-midnight">
                  {isRegister ? 'Create Collector Account' : 'Collector Sign In'}
                </h3>
                <p className="text-xs text-graycustom">
                  {isRegister 
                    ? 'Register to track purchases and secure digital art deeds.' 
                    : 'Sign in to access your ledger collections and checkout.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-graycustom uppercase tracking-widest mb-1.5 font-bold">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="collector@artledger.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 md:py-3 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs outline-none text-midnight font-semibold shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-graycustom uppercase tracking-widest mb-1.5 font-bold">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 md:py-3 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs outline-none text-midnight font-semibold shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending || !email || !password}
                  className="w-full py-3 md:py-3.5 bg-midnight hover:bg-turquoise text-white font-sans text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <span>{isRegister ? 'Register Account' : 'Sign In'}</span>
                  )}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-xs text-turquoise hover:underline font-semibold cursor-pointer"
                >
                  {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
