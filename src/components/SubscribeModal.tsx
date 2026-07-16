import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, CreditCard, Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

import { useCurrency } from '../CurrencyContext';

interface SubscribeModalProps {
 isOpen: boolean;
 onClose: () => void;
}

export default function SubscribeModal({ isOpen, onClose }: SubscribeModalProps) {
 const { formatPrice, currency } = useCurrency();
 const [selectedPlan, setSelectedPlan] = useState<'1_year'>('1_year');
 const [isSubmitted, setIsSubmitted] = useState(false);
 const [isPending, setIsPending] = useState(false);
 const [memberId, setMemberId] = useState('');
 
 // Checkout states
 const [email, setEmail] = useState('');
 const [name, setName] = useState('');

 const plans = [
 {
 id: '1_year' as const,
 name: '1 Year Subscription',
 priceInINR: 30000,
 period: 'subscription',
 desc: 'Our premium offering. Receive curated print publications delivered directly to your doorstep for an entire year.',
 perks: ['All Printed Journal Issues', 'Full Digital Ledger Access', 'Guaranteed VIP opening night tickets', 'Early acquisition catalogs'],
 featured: true
 }
 ];

 const handleSubscribe = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!name || !email) return;
 setIsPending(true);

 try {
 const response = await fetch(`${import.meta.env.VITE_API_URL}/payment-create`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json'
 },
 body: JSON.stringify({
 plan: selectedPlan,
 name,
 email,
 country: currency === 'INR' ? 'India' : 'International',
 currency
 })
 });

 if (!response.ok) {
 throw new Error('Subscription initiation failed');
 }

 const orderData = await response.json();

 const options = {
 key: orderData.key_id || 'rzp_test_placeholder',
 amount: orderData.amount,
 currency: orderData.currency,
 name: 'The Art Ledger',
 description: orderData.description,
 order_id: orderData.order_id,
 handler: async function (response: any) {
 setMemberId(`TAL-2026-${Math.floor(1000 + Math.random() * 9000)}`);
 setIsSubmitted(true);
 setIsPending(false);

 await fetch(`${import.meta.env.VITE_API_URL}/payment-webhook`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'x-razorpay-signature': response.razorpay_signature || ''
 },
 body: JSON.stringify({
 event: 'payment.captured',
 payload: {
 payment: {
 entity: {
 id: response.razorpay_payment_id,
 order_id: response.razorpay_order_id,
 amount: orderData.amount
 }
 }
 }
 })
 }).catch(err => console.error('Subscription webhook post failed:', err));
 },
 prefill: {
 name,
 email
 },
 theme: {
 color: '#1A1A1A'
 }
 };

 const rzp = new (window as any).Razorpay(options);
 rzp.open();
 } catch (err: any) {
 alert(`Subscription failed: ${err.message}`);
 setIsPending(false);
 }
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
 initial={{ opacity: 0, scale: 0.95, y: 30 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 30 }}
 transition={{ type: 'spring', damping: 25, stiffness: 180 }}
 className="relative w-full max-w-4xl bg-white rounded-[28px] overflow-hidden shadow-2xl z-10 border border-gray-100 "
 >
 {/* Close Button */}
 <button
 id="close-subscribe-modal"
 onClick={onClose}
 className="absolute top-5 right-5 p-2 rounded-full bg-midnight/5 hover:bg-turquoise/10 text-midnight hover:text-turquoise cursor-pointer z-25"
 >
 <X className="w-5 h-5" />
 </button>

 {isSubmitted ? (
 <div className="p-12 md:p-20 text-center flex flex-col items-center justify-center min-h-[500px]">
 <CheckCircle2 className="w-20 h-20 text-turquoise mb-6 animate-bounce" />
 <h3 className="text-3xl font-serif font-bold text-midnight mb-2">
 Welcome to The Art Ledger
 </h3>
 <p className="text-sm text-graycustom max-w-md leading-relaxed mb-6">
 Your patron membership has been authorized under the <span className="font-semibold text-turquoise uppercase">"{plans.find(p => p.id === selectedPlan)?.name}"</span> tier. A welcome package and activation keys have been dispatched to your email address.
 </p>
 <span className="text-xs font-mono text-gold tracking-widest uppercase bg-gold/5 px-4 py-1.5 rounded-full border border-gold/15">
 MEMBER ID: #{memberId}
 </span>
 </div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[90vh] overflow-y-auto no-scrollbar">
 
 {/* Left side: Tiers selection (Taking 7 cols) */}
 <div className="lg:col-span-7 p-6 md:p-10 bg-[#F8FAFC] border-r border-gray-100 ">
 <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest block mb-1">
 EXQUISITE DIRECTORY ACCESS
 </span>
 <h3 className="text-2xl md:text-3xl font-serif font-bold text-midnight mb-6">
 Select Your Ledger Tier
 </h3>

 <div className="space-y-4">
 {plans.map((plan) => {
 const isSelected = selectedPlan === plan.id;
 return (
 <div
 key={plan.id}
 onClick={() => setSelectedPlan(plan.id)}
 className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-4 ${
 isSelected
 ? 'bg-white border-turquoise shadow-lg'
 : 'bg-white/50 border-transparent hover:border-turquoise/30'
 }`}
 >
 {/* Radio circle */}
 <div className="mt-1">
 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
 isSelected ? 'border-turquoise bg-turquoise' : 'border-gray-300 '
 }`}>
 {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
 </div>
 </div>

 {/* Plan Copy */}
 <div className="flex-1">
 <div className="flex items-center justify-between mb-1.5">
 <h4 className="font-sans font-bold text-sm text-midnight flex items-center gap-1.5">
 {plan.name}
 {plan.featured && (
 <span className="text-[8px] font-mono bg-turquoise text-white uppercase px-1.5 py-0.5 rounded tracking-widest">
 RECOMMENDED
 </span>
 )}
 </h4>
 
 <div className="flex items-baseline gap-0.5">
 <span className="text-base font-serif font-bold text-midnight ">{formatPrice(plan.priceInINR)}</span>
 <span className="text-[10px] text-graycustom ">/{plan.period}</span>
 </div>
 </div>

 <p className="text-xs text-graycustom leading-relaxed mb-3">
 {plan.desc}
 </p>

 {/* perks */}
 {isSelected && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 ">
 {plan.perks.map((perk, i) => (
 <div key={i} className="flex items-center gap-2 text-[11px] text-graycustom font-sans">
 <Check className="w-3 h-3 text-turquoise shrink-0" />
 <span>{perk}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Right side: Payment checkout detail (Taking 5 cols) */}
 <div className="lg:col-span-5 p-6 md:p-10 flex flex-col justify-between bg-white ">
 <div>
 <span className="text-[10px] font-mono text-gold uppercase tracking-widest block mb-1">
 SECURED ADMISSIONS GATEWAY
 </span>
 <h3 className="text-xl font-serif font-bold text-midnight mb-6 flex items-center gap-1.5">
 <CreditCard className="w-5 h-5 text-turquoise" />
 Checkout Details
 </h3>

 <form onSubmit={handleSubscribe} className="space-y-4">
 <div>
 <label className="block text-[10px] font-mono text-graycustom uppercase tracking-widest mb-1">
 Full Name
 </label>
 <input
 type="text"
 required
 placeholder="e.g. ELEANOR VANCE"
 value={name}
 onChange={(e) => setName(e.target.value.toUpperCase())}
 className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-gray-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs outline-none text-darknavy "
 />
 </div>

 <div>
 <label className="block text-[10px] font-mono text-graycustom uppercase tracking-widest mb-1">
 Email Address
 </label>
 <input
 type="email"
 required
 placeholder="collector@artledger.com"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-gray-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs outline-none text-darknavy "
 />
 </div>

 <div className="p-4 bg-slate-100 rounded-xl border border-slate-200/50 space-y-2 mt-4">
 <span className="text-[9px] font-mono text-turquoise uppercase tracking-widest font-bold block">Secure Payment Gateway</span>
 <p className="text-[10px] text-graycustom leading-relaxed">
 Your payment is securely processed by Razorpay. All transaction details are encrypted and logged directly onto our digital ledger.
 </p>
 </div>

 <p className="text-[10px] text-graycustom leading-relaxed flex gap-1.5 pt-2">
 <AlertCircle className="w-3.5 h-3.5 text-turquoise shrink-0 mt-0.5" />
 <span>This is a one-time payment for the selected subscription term. You can manage your subscription inside your TAL profile panel.</span>
 </p>

 <button
 id="submit-subscribe-billing"
 type="submit"
 disabled={isPending || !name || !email}
 className="w-full py-3.5 bg-midnight text-white hover:bg-turquoise font-sans font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all duration-300 shadow-xl flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
 >
 {isPending ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 <span>Authenticating...</span>
 </>
 ) : (
 <span>Authorize & Subscribe</span>
 )}
 </button>
 </form>
 </div>

 <div className="pt-6 border-t border-gray-100 mt-6 flex items-center justify-between text-[10px] font-mono text-graycustom uppercase">
 <span>SSL Secured 256-Bit</span>
 <span className="text-turquoise">Verified Merchant</span>
 </div>
 </div>

 </div>
 )}
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
}
