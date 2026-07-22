/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Download, CreditCard, ChevronLeft, ChevronRight, X, Sparkles, CheckCircle2, Sun, Moon, Share2, MapPin, Locate, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';
import { useCurrency } from '../CurrencyContext';

interface MagazineEdition {
  id: string;
  issueNumber: string;
  title: string;
  season: string;
  coverUrl: string;
  description: string;
  price: number;
  priceUsd?: number;
  pdfUrl?: string;
  digitalPrice?: number;
  digitalPriceUsd?: number;
  pages: string[];
  editorNote?: string;
  editorName?: string;
  editorImageUrl?: string;
}

interface MagazineSectionProps {
  isHome?: boolean;
  onChangePage?: (pageId: string) => void;
  user?: { email: string } | null;
  onSignInClick?: () => void;
}

export default function MagazineSection({ isHome = false, onChangePage, user = null, onSignInClick }: MagazineSectionProps) {
  const { formatPrice, currency, isIndia, isLoading: isLocationLoading, addressData, detectLocation } = useCurrency();
  const [magazines, setMagazines] = useState<MagazineEdition[]>([]);
  const [activeIssue, setActiveIssue] = useState<MagazineEdition | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [autoFlip, setAutoFlip] = useState(false);
  const [readingMode, setReadingMode] = useState<'dark' | 'light'>('dark');
  const [editorNoteExpanded, setEditorNoteExpanded] = useState(false);
  const [isMobileReader, setIsMobileReader] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkSize = () => setIsMobileReader(window.innerWidth < 1024);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  useEffect(() => {
    setEditorNoteExpanded(false);
  }, [activeIssue]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Checkout and Shipping Address States
  const [shippingName, setShippingName] = useState('');
  const [shippingEmail, setShippingEmail] = useState(user?.email || '');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingHouseNo, setShippingHouseNo] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [shippingCountry, setShippingCountry] = useState('India');
  const [isPending, setIsPending] = useState(false);
  const [receiptId, setReceiptId] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [purchasePlan, setPurchasePlan] = useState<'single' | 'digital_single'>('single');

  useEffect(() => {
    if (addressData) {
      if (addressData.city) setShippingCity(addressData.city);
      if (addressData.state) setShippingAddress(addressData.state);
      if (addressData.postcode) setShippingPincode(addressData.postcode);
      if (addressData.country) setShippingCountry(addressData.country);
    }
  }, [addressData]);

  const handleOpenPurchase = (plan: 'single' | 'digital_single') => {
    if (!user) {
      onSignInClick && onSignInClick();
      return;
    }
    setPurchasePlan(plan);
    setPurchaseOpen(true);
    detectLocation();
  };

  useEffect(() => {
    if (user?.email) {
      setShippingEmail(user.email);
    }
    if (addressData) {
      if (addressData.city) setShippingCity(addressData.city);
      if (addressData.country) setShippingCountry(addressData.country);
      if (addressData.postcode) setShippingPincode(addressData.postcode);
      if (addressData.state) setShippingAddress(addressData.state); // Using state as a fallback for street address if blank
    }
  }, [user, addressData]);

  // Load Razorpay Checkout SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {
        // Safe check
      }
    };
  }, []);

  const [showShareToast, setShowShareToast] = useState(false);
  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => {
      setShowShareToast(false);
    }, 3000);
  };

  useEffect(() => {
    if (previewOpen || purchaseOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [previewOpen, purchaseOpen]);

  useEffect(() => {
    async function loadMagazines() {
      try {
        const { data, error } = await supabase
          .from('magazines')
          .select('*')
          .eq('status', 'published')
          .order('issue_number', { ascending: false });

        if (error) throw error;

        const mapped: MagazineEdition[] = (data || []).map(m => {
          // Setup preview pages from database or use defaults
          let previewPages = [];
          if (m.preview_pages && m.preview_pages.length > 0) {
            previewPages = m.preview_pages;
          } else {
            previewPages = [
              m.cover_image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600&h=850',
              'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600&h=850',
              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600&h=850',
              'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=600&h=850'
            ];
          }

          return {
            id: m.id,
            issueNumber: `Issue No. ${m.issue_number}`,
            title: m.issue_name,
            season: m.tagline || 'Recent Release',
            coverUrl: m.cover_image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600&h=850',
            description: m.short_summary || m.long_description || 'A fine art periodical published by The Art Ledger.',
            price: m.single_issue_price || 2500,
            pdfUrl: m.pdf_url,
            digitalPrice: m.digital_pdf_price || 299,
            pages: previewPages,
            editorNote: m.editor_note,
            editorName: m.editor_name,
            editorImageUrl: m.editor_image_url
          };
        });

        setMagazines(mapped);
        if (mapped.length > 0) {
          setActiveIssue(mapped[0]);
        }
      } catch (err) {
        console.error('Error fetching magazines:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMagazines();
  }, []);

  useEffect(() => {
    let timer: any = null;
    if (autoFlip && previewOpen && activeIssue) {
      timer = setInterval(() => {
        setCurrentPageIndex(prev => {
          const inc = isMobileReader ? 1 : 2;
          if (prev + inc >= activeIssue.pages.length) return 0;
          return prev + inc;
        });
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [autoFlip, previewOpen, isMobileReader, activeIssue]);

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const road = addr.road || addr.suburb || addr.neighbourhood || '';
        const house = addr.house_number || '';
        const cityVal = addr.city || addr.town || addr.village || addr.county || '';
        const stateVal = addr.state || '';
        const pincodeVal = addr.postcode || '';
        const countryVal = addr.country || 'India';

        setShippingAddress(`${house} ${road}`.trim() || data.display_name || '');
        setShippingCity(cityVal || stateVal || '');
        setShippingPincode(pincodeVal || '');
        setShippingCountry(countryVal);
      }
    } catch (e) {
      console.error('Reverse geocoding error:', e);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          alert('Failed to retrieve location: ' + error.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const initializeMap = () => {
    const L = (window as any).L;
    if (!L) return;

    const container = document.getElementById('map-picker-container');
    if (!container) return;

    container.innerHTML = '';
    const mapDiv = document.createElement('div');
    mapDiv.id = 'map-picker-leaflet';
    mapDiv.style.width = '100%';
    mapDiv.style.height = '320px';
    mapDiv.style.borderRadius = '16px';
    container.appendChild(mapDiv);

    // Default to Mumbai
    const defaultLat = 19.0760;
    const defaultLng = 72.8777;

    const map = L.map('map-picker-leaflet').setView([defaultLat, defaultLng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

    const onMapClick = (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      reverseGeocode(lat, lng);
    };

    map.on('click', onMapClick);
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      reverseGeocode(position.lat, position.lng);
    });

    reverseGeocode(defaultLat, defaultLng);
  };

  useEffect(() => {
    if (mapOpen) {
      // Load Leaflet CSS if not exists
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      // Load Leaflet JS if not exists
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => {
          initializeMap();
        };
        document.body.appendChild(script);
      } else {
        setTimeout(initializeMap, 100);
      }
    }
  }, [mapOpen]);

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIssue || isPending) return;
    setIsPending(true);

    try {
      // Create payment order on the backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payment-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: purchasePlan,
          selected_issue: activeIssue.id,
          name: shippingName,
          email: shippingEmail,
          phone: shippingPhone,
          address: shippingHouseNo ? `${shippingHouseNo}, ${shippingAddress}`.trim() : shippingAddress,
          city: shippingCity,
          pincode: shippingPincode,
          country: currency === 'INR' ? 'India' : 'International',
          currency: currency,
          quantity: 1
        })
      });

      if (!response.ok) {
        throw new Error('Payment order creation failed');
      }

      const orderData = await response.json();

      // Open Razorpay Popup
      const options = {
        key: orderData.key_id || 'rzp_test_placeholder',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'The Art Ledger',
        description: orderData.description,
        order_id: orderData.order_id,
        handler: async function (res: any) {
          const generatedReceiptId = res.razorpay_payment_id || `TAL-${Math.floor(100000 + Math.random() * 900000)}`;
          setReceiptId(generatedReceiptId);
          setIsPurchased(true);
          setIsPending(false);

          await fetch(`${import.meta.env.VITE_API_URL}/payment-webhook`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-razorpay-signature': res.razorpay_signature || ''
            },
            body: JSON.stringify({
              event: 'payment.captured',
              payload: {
                payment: {
                  entity: {
                    id: res.razorpay_payment_id,
                    order_id: res.razorpay_order_id,
                    amount: orderData.amount
                  }
                }
              }
            })
          }).catch(err => console.error('Signature webhook post failed:', err));
        },
        prefill: {
          name: shippingName,
          email: shippingEmail,
          contact: shippingPhone
        },
        theme: {
          color: '#0B132B'
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
      setIsPending(false);
    }
  };

  const triggerDownloadPDF = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4500);
  };

  if (!activeIssue) {
    return (
      <section id="magazine" className="py-24 bg-warmwhite text-center">
        <p className="text-graycustom text-xs font-mono">Loading Periodical Registry...</p>
      </section>
    );
  }

  return (
    <section id="magazine" className="py-16 md:py-24 bg-warmwhite">

      {/* Standardized Section Header */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-12">
        <div className="border-b border-offwhite pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-midnight font-bold uppercase block mb-2">
              PERIODICAL PRINT
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-midnight tracking-tight leading-none">
              The Magazine
            </h2>
          </div>
          <p className="text-xs md:text-sm text-graycustom font-medium max-w-sm md:text-right leading-relaxed">
            Our flagship biannual print release, delivering meticulous critical essays, collector strategies, and studio portraits.
          </p>
        </div>
      </div>

      {/* 1. Main Issue Highlight Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          {/* Left Column: Info and Buy Button */}
          <div className="order-2 lg:order-1 lg:col-span-7 space-y-8 mt-6 lg:mt-0">
            <div className="space-y-4">
              <span className="text-[10px] font-mono tracking-[0.18em] text-midnight font-bold uppercase block">
                {activeIssue.season.toUpperCase()}
              </span>
              <h2 className="text-5xl md:text-8xl font-serif font-bold text-midnight tracking-tight leading-none">
                {activeIssue.issueNumber.replace('Issue No. ', 'No. ')}
              </h2>
            </div>

            <p className="text-sm md:text-base text-graycustom leading-relaxed max-w-xl font-medium">
              {activeIssue.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <button
                  onClick={() => handleOpenPurchase('single')}
                  className="group flex items-center justify-center gap-2.5 px-8 py-4 w-full sm:w-auto rounded-full bg-midnight text-white hover:bg-turquoise font-sans font-bold uppercase text-[10px] tracking-widest transition-all duration-300 shadow-xl cursor-pointer"
                >
                  <span>Buy Physical Copy</span>
                </button>

                <button
                  onClick={() => handleOpenPurchase('digital_single')}
                  className="group flex items-center justify-center gap-2.5 px-8 py-4 w-full sm:w-auto rounded-full bg-white text-midnight border border-slate-300 hover:border-turquoise hover:text-turquoise font-sans font-bold uppercase text-[10px] tracking-widest transition-all duration-300 shadow-sm cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-turquoise" />
                  <span>Buy Digital Copy</span>
                </button>
              </div>

              <button
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-2.5 px-8 py-4 rounded-full border border-slate-200 text-midnight hover:border-turquoise hover:text-turquoise font-sans font-bold uppercase text-[10px] tracking-widest transition-colors duration-300 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Read Digital Copy</span>
              </button>

              {isHome && onChangePage && (
                <button
                  onClick={() => onChangePage('magazine')}
                  className="flex items-center gap-1.5 ml-2 text-xs font-mono font-bold tracking-wider text-turquoise hover:text-midnight transition-colors cursor-pointer uppercase hover:translate-x-1 duration-200"
                >
                  <span>Browse Archive</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Interactive 3D Mockup */}
          <div className="order-1 lg:order-2 lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm flex justify-center lg:justify-end [perspective:1800px]">

              {/* Interactive 3D Magazine Book Container with Floating Animation */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-full max-w-[360px] flex justify-center lg:justify-end"
              >
                <div
                  id="interactive-3d-magazine"
                  onClick={() => setPreviewOpen(true)}
                  className="relative w-full aspect-[3/4] [transform-style:preserve-3d] transition-all duration-[800ms] ease-out cursor-pointer group"
                  style={{
                    transform: 'rotateY(-20deg) rotateX(8deg) rotateZ(-3deg)',
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget;
                    target.style.transform = 'rotateY(-6deg) rotateX(4deg) rotateZ(-1deg) scale(1.08)';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget;
                    target.style.transform = 'rotateY(-20deg) rotateX(8deg) rotateZ(-3deg) scale(1)';
                  }}
                >
                  {/* Real 3D Ambient Shadow under the book */}
                  <div
                    className="absolute inset-4 bg-turquoise/20 blur-2xl rounded-lg [transform:translateZ(-40px)_scale(0.95)] transition-all duration-[800ms] opacity-60 group-hover:opacity-100 group-hover:blur-3xl group-hover:bg-turquoise/40 group-hover:[transform:translateZ(-60px)_scale(1)]"
                  />

                  {/* Simulated Book Page Edges (Right side depth) */}
                  <div
                    className="absolute inset-y-1.5 right-0 w-[12px] bg-slate-100 rounded-r border-r border-y border-slate-300 [transform:translateZ(10px)_rotateY(90deg)] origin-right flex flex-col justify-between py-1 overflow-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {[...Array(15)].map((_, i) => (
                      <div key={i} className="h-[1px] w-full bg-slate-300/50" />
                    ))}
                  </div>

                  {/* Simulated Bottom Page Edges */}
                  <div
                    className="absolute inset-x-1.5 bottom-0 h-[12px] bg-slate-100 rounded-b border-b border-x border-slate-300 [transform:translateZ(10px)_rotateX(-90deg)] origin-bottom flex gap-[2px] px-1 overflow-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {[...Array(15)].map((_, i) => (
                      <div key={i} className="w-[1px] h-full bg-slate-300/50" />
                    ))}
                  </div>

                  {/* Simulated Book Spine (Left side thickness) */}
                  <div
                    className="absolute inset-y-0 left-0 w-[16px] bg-gradient-to-r from-[#111] via-[#222] to-[#333] border-r border-black/30 [transform:rotateY(-90deg)_translateZ(8px)] origin-left flex items-center justify-center"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <span className="text-[5px] font-mono text-white/40 tracking-widest uppercase [writing-mode:vertical-lr] rotate-180">
                      TAL {activeIssue.issueNumber.toUpperCase()}
                    </span>
                  </div>

                  {/* Front Cover Container with Z-Offset */}
                  <div className="absolute inset-0 w-full h-full rounded-l-sm rounded-r-xl overflow-hidden bg-white shadow-2xl [transform:translateZ(10px)] [backface-visibility:hidden] border border-slate-200/50">

                    {/* Actual Cover Image */}
                    <img
                      src={activeIssue.coverUrl}
                      alt={`${activeIssue.title} Cover`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />

                    {/* Spine Fold / Hinge Indentation Line */}
                    <div className="absolute inset-y-0 left-[14px] w-[1px] bg-black/30 shadow-[1px_0_0_rgba(255,255,255,0.15)] pointer-events-none z-20" />

                    {/* Spine Soft Shadow Overlay */}
                    <div className="absolute inset-y-0 left-0 w-[14px] bg-gradient-to-r from-black/40 to-transparent pointer-events-none z-10" />

                    {/* Real paper luster shine overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/12 pointer-events-none mix-blend-overlay z-10" />

                    {/* Micro Logo & Issue Info on Cover */}
                    <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/50 via-black/15 to-transparent p-6 text-white text-center z-10">
                      <span className="font-serif font-bold text-[10px] tracking-[0.3em] uppercase block">THE ART LEDGER</span>
                      <span className="text-[6px] font-mono tracking-widest text-slate-300 block mt-1 uppercase">{activeIssue.title.toUpperCase()}</span>
                    </div>
                  </div>

                </div>
              </motion.div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Editorial Perspective Banner (Circular Headshot + Big Quote) */}
      {!isHome && (
        <div className="bg-[#0B132B] text-white py-20 mb-28">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

              {/* Editor Circular Avatar */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center text-center">
                <div className="relative w-44 h-44 rounded-full overflow-hidden p-1 border-2 border-turquoise/30 mb-4 bg-slate-800">
                  <img
                    src={activeIssue.editorImageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=350&h=350"}
                    alt={activeIssue.editorName || "Editor-in-Chief"}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {activeIssue.editorName && (
                  <span className="px-3 py-1 bg-turquoise/10 border border-turquoise/20 rounded text-[9px] font-mono tracking-widest text-turquoise font-bold uppercase">
                    {activeIssue.editorName}
                  </span>
                )}
              </div>

              {/* Quote details */}
              <div className="lg:col-span-8 space-y-6">
                <span className="text-[10px] font-mono tracking-[0.18em] text-turquoise font-bold uppercase block">
                  Editorial Perspective
                </span>

                <h3 className={`relative z-10 text-lg md:text-xl font-serif italic text-slate-200 leading-relaxed font-light tracking-wide transition-all duration-300 no-underline decoration-transparent ${editorNoteExpanded ? '' : 'line-clamp-3 md:line-clamp-4'
                  }`}
                  style={{ textDecoration: 'none' }}>
                  {activeIssue.editorNote ? `"${activeIssue.editorNote.replace(/[\u0334-\u0336]/g, '')}"` : `"We are witnessing a Digital Renaissance where the binary meets the brushstroke. ${activeIssue.issueNumber} isn't just about art; it's about the soul within the machine and the collectors who dare to preserve it."`}
                </h3>

                <button
                  onClick={() => setEditorNoteExpanded(!editorNoteExpanded)}
                  className="text-[9px] font-mono tracking-widest text-turquoise hover:text-white uppercase font-bold transition-colors flex items-center gap-1 cursor-pointer mt-2"
                >
                  <span>{editorNoteExpanded ? 'Read Less' : 'Read More'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 3. Archive / All Editions section */}
      {!isHome && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

            {/* Left Column: Sticky Editorial Text */}
            <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-6">
              <span className="text-[10px] font-mono tracking-[0.2em] text-turquoise font-bold uppercase block">
                THE ARCHIVE
              </span>
              <h3 className="text-4xl md:text-5xl font-serif font-bold text-midnight tracking-tight leading-tight">
                All Published<br />Editions
              </h3>
              <div className="w-12 h-[2px] bg-turquoise" />
              <p className="text-xs md:text-sm text-graycustom leading-relaxed max-w-sm">
                Browse our complete periodical registry. Each volume compiles high-fidelity studio profiles, critical essays on provenance, and deep analysis of the modern fine-art landscape. Select any issue to showcase it above.
              </p>
            </div>

            {/* Right Column: 2-Column Grid */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 gap-x-6 gap-y-12">
                {magazines.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => {
                      setActiveIssue(issue);
                      setCurrentPageIndex(0);
                      const el = document.getElementById('magazine');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={`w-full max-w-[240px] mx-auto group cursor-pointer p-3 rounded-[24px] border transition-all duration-300 ${activeIssue.id === issue.id
                      ? 'border-turquoise bg-turquoise/5 shadow-md shadow-turquoise/5'
                      : 'border-slate-100 hover:border-slate-200 bg-transparent'
                      }`}
                  >
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden relative shadow-lg bg-slate-100 border border-slate-200/50 mb-4 transform group-hover:-translate-y-1 transition-transform duration-300">
                      <img
                        src={issue.coverUrl}
                        alt={issue.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">
                          VIEW EDITION
                        </span>
                      </div>
                    </div>

                    <div className="px-1">
                      <span className="text-[9px] font-mono text-graycustom block mb-1 uppercase font-bold tracking-wider">
                        {issue.season}
                      </span>
                      <h4 className="text-xs sm:text-sm font-serif font-bold text-midnight group-hover:text-turquoise transition-colors duration-200 leading-snug">
                        {issue.issueNumber}: {issue.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FLIPBOOK PREVIEW MODAL - CLEAN FLOATING ARTWORK MODE */}
      <AnimatePresence>
        {previewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 lg:p-8">
            {/* Soft Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewOpen(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-0"
            />

            {/* Main Stage Wrapper (Transparent background, no grey boxes) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 140 }}
              className="relative w-full h-full max-w-6xl z-10 flex flex-col justify-between items-center pointer-events-none"
            >
              {/* Minimal Floating Top Header */}
              <div className="w-full flex items-center justify-between px-4 py-2 pointer-events-auto z-30">
                {/* Left: Issue Meta */}
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-turquoise animate-pulse" />
                  <span className="text-xs font-serif font-bold text-white tracking-wide">
                    {activeIssue.issueNumber}: {activeIssue.title}
                  </span>
                </div>

                {/* Right Controls: Buy Digital Copy, Page Count & Close */}
                <div className="flex items-center gap-3 pointer-events-auto">
                  <button
                    onClick={() => {
                      setPreviewOpen(false);
                      handleOpenPurchase('digital_single');
                    }}
                    className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full bg-turquoise text-midnight hover:bg-white font-sans font-bold uppercase text-[10px] tracking-widest transition-all cursor-pointer shadow-lg hover:scale-105"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Buy Digital Copy</span>
                  </button>

                  <span className="text-[11px] font-mono text-white/80 font-bold bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    {isMobileReader ? `${currentPageIndex + 1} / ${activeIssue.pages.length}` : `Spread ${Math.floor(currentPageIndex / 2) + 1} / ${Math.ceil(activeIssue.pages.length / 2)}`}
                  </span>

                  <button
                    onClick={() => setPreviewOpen(false)}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-turquoise text-white hover:text-midnight transition-all duration-200 cursor-pointer border border-white/20 shadow-xl backdrop-blur-md hover:scale-110 flex items-center justify-center"
                    title="Close Preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Floating Magazine Spread Center Stage */}
              <div className="relative w-full flex-1 my-2 lg:my-4 flex items-center justify-center pointer-events-auto overflow-hidden">
                
                {/* Previous Page Floating Button */}
                {currentPageIndex > 0 && (
                  <button
                    onClick={() => { setCurrentPageIndex(prev => Math.max(0, prev - (isMobileReader ? 1 : 2))); setAutoFlip(false); }}
                    className="absolute left-2 md:left-6 z-40 p-4 rounded-full bg-black/50 hover:bg-turquoise text-white hover:text-midnight transition-all cursor-pointer flex items-center justify-center hover:scale-110 border border-white/20 shadow-2xl backdrop-blur-md"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}

                {/* The Floating Magazine Spread Container */}
                <div className="relative w-full h-full lg:max-w-5xl lg:max-h-[78vh] lg:aspect-[3/2] flex items-center justify-center shadow-[0_30px_100px_rgba(0,0,0,0.9)] lg:rounded-lg overflow-hidden border border-white/15">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`spread-${currentPageIndex}`}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="w-full h-full flex items-center justify-center bg-transparent"
                    >
                      {/* Left Page */}
                      <div className={`${isMobileReader ? 'w-full' : 'w-1/2'} h-full relative flex items-center justify-center bg-white overflow-hidden`}>
                        <img
                          src={activeIssue.pages[currentPageIndex]}
                          alt="Magazine left page"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        {/* Spine shadow crease */}
                        {!isMobileReader && (
                          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/25 to-transparent pointer-events-none" />
                        )}
                      </div>

                      {/* Right Page */}
                      {!isMobileReader && currentPageIndex + 1 < activeIssue.pages.length && (
                        <div className="w-1/2 h-full relative flex items-center justify-center bg-white overflow-hidden border-l border-black/10">
                          <img
                            src={activeIssue.pages[currentPageIndex + 1]}
                            alt="Magazine right page"
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                          {/* Spine shadow crease */}
                          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/25 to-transparent pointer-events-none" />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Next Page Floating Button */}
                {currentPageIndex + (isMobileReader ? 1 : 2) < activeIssue.pages.length && (
                  <button
                    onClick={() => { setCurrentPageIndex(prev => Math.min(activeIssue.pages.length - 1, prev + (isMobileReader ? 1 : 2))); setAutoFlip(false); }}
                    className="absolute right-2 md:right-6 z-40 p-4 rounded-full bg-black/50 hover:bg-turquoise text-white hover:text-midnight transition-all cursor-pointer flex items-center justify-center hover:scale-110 border border-white/20 shadow-2xl backdrop-blur-md"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Minimal Floating Page Indicator Dots at Bottom */}
              <div className="flex items-center gap-2 pointer-events-auto bg-black/40 backdrop-blur-md px-5 py-2 rounded-full border border-white/10">
                {Array.from({ length: isMobileReader ? activeIssue.pages.length : Math.ceil(activeIssue.pages.length / 2) }).map((_, idx) => {
                  const targetIndex = isMobileReader ? idx : idx * 2;
                  return (
                    <button
                      key={idx}
                      onClick={() => { setCurrentPageIndex(targetIndex); setAutoFlip(false); }}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${currentPageIndex === targetIndex ? 'w-6 bg-turquoise' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                      title={isMobileReader ? `Page ${idx + 1}` : `Spread ${idx + 1}`}
                    />
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHECKOUT SIMULATOR MODAL */}
      <AnimatePresence>
        {purchaseOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPurchaseOpen(false)}
              className="fixed inset-0 bg-midnight/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#F8FAFC] rounded-[24px] p-8 shadow-2xl z-10 border border-slate-200 overflow-y-auto max-h-[90vh] no-scrollbar"
            >
              <h3 className="text-2xl font-serif font-bold text-midnight mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-turquoise" />
                TAL Checkout Desk
              </h3>
              <p className="text-xs text-graycustom mb-6">
                Acquire premium access to <span className="font-semibold text-turquoise">"{activeIssue.issueNumber}: {activeIssue.title}"</span>
              </p>

              {isPurchased ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle2 className="w-16 h-16 text-turquoise mx-auto mb-4 animate-bounce" />
                  <h4 className="text-lg font-serif font-bold text-midnight mb-1">Receipt Approved</h4>
                  <p className="text-xs text-graycustom max-w-xs mx-auto mb-4 leading-relaxed">
                    Transaction successful. Your permanent high-fidelity digital compilation has been unlocked. Check your inbox for download credentials.
                  </p>
                  <span className="inline-block text-[10px] font-mono text-turquoise tracking-wider uppercase bg-turquoise/5 border border-turquoise/15 px-3 py-1.5 rounded-full font-bold mb-6">
                    PAYMENT ID: {receiptId}
                  </span>
                  
                  {purchasePlan === 'digital_single' && activeIssue.pdfUrl && (
                    <a
                      href={activeIssue.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-center gap-2.5 px-8 py-4 w-full rounded-xl bg-midnight text-white hover:bg-turquoise font-sans font-bold uppercase text-[10px] tracking-widest transition-all duration-300 shadow-xl cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Your PDF</span>
                    </a>
                  )}
                </motion.div>
              ) : (
                <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                  {/* Location Clearance Banner */}
                  {isLocationLoading ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-[11px] text-amber-800 font-mono">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                      <span>Detecting regional location & currency...</span>
                    </div>
                  ) : currency === 'INR' ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800 font-mono">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Location: India Verified (Pricing in ₹ INR)</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2 text-[11px] text-slate-700 font-mono">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Location: International (Pricing in $ USD)</span>
                    </div>
                  )}

                  {/* Shipping Info Fields */}
                  <div>
                    <label className="block text-[10px] font-mono text-graycustom uppercase tracking-widest mb-1.5 font-bold">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ELEANOR VANCE"
                      value={shippingName}
                      onChange={(e) => setShippingName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs outline-none text-midnight font-semibold shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-graycustom uppercase tracking-widest mb-1.5 font-bold">
                      Email Address (For Receipt)
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="collector@artledger.com"
                      value={shippingEmail}
                      onChange={(e) => setShippingEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs outline-none text-midnight font-semibold shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-graycustom uppercase tracking-widest mb-1.5 font-bold">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={shippingPhone}
                      onChange={(e) => setShippingPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs outline-none text-midnight font-semibold shadow-sm"
                    />
                  </div>
                  {purchasePlan !== 'digital_single' && (
                    <>
                      {/* Location Autofill Buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 hover:border-turquoise hover:bg-turquoise/5 text-midnight hover:text-turquoise rounded-xl text-[10px] font-mono tracking-wider font-bold transition-all cursor-pointer"
                        >
                          <Locate className="w-3.5 h-3.5" />
                          USE LOCATION
                        </button>
                        <button
                          type="button"
                          onClick={() => setMapOpen(true)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 hover:border-turquoise hover:bg-turquoise/5 text-midnight hover:text-turquoise rounded-xl text-[10px] font-mono tracking-wider font-bold transition-all cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          SELECT ON MAP
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-graycustom uppercase tracking-widest mb-1.5 font-bold">
                            House / Flat / Suite No.
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Flat 402, 4th Floor"
                            value={shippingHouseNo}
                            onChange={(e) => setShippingHouseNo(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs outline-none text-midnight font-semibold shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-graycustom uppercase tracking-widest mb-1.5 font-bold">
                            Apartment / Building / Street
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Sea Breeze Apartments"
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs outline-none text-midnight font-semibold shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-graycustom uppercase tracking-widest mb-1.5 font-bold">
                            City
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Mumbai"
                            value={shippingCity}
                            onChange={(e) => setShippingCity(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs outline-none text-midnight font-semibold shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-graycustom uppercase tracking-widest mb-1.5 font-bold">
                            Pincode
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="400001"
                            value={shippingPincode}
                            onChange={(e) => setShippingPincode(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs outline-none text-midnight font-semibold shadow-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-graycustom uppercase tracking-widest mb-1.5 font-bold">
                          Country
                        </label>
                        <select
                          value={shippingCountry}
                          onChange={(e) => setShippingCountry(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs outline-none text-midnight font-semibold shadow-sm"
                        >
                          <option value="India">India</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Singapore">Singapore</option>
                          <option value="United Arab Emirates">United Arab Emirates</option>
                          <option value="Other">Other Country</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Summary Pricing Block */}
                  <div className="p-4 bg-slate-100/80 rounded-2xl border border-slate-200/60 text-xs space-y-2 text-midnight">
                    <div className="flex justify-between font-semibold">
                      <span className="text-graycustom">{purchasePlan === 'digital_single' ? 'Online Print / Digital PDF' : 'Physical Print Edition'}</span>
                      <span>
                        {currency === 'USD'
                          ? `$${purchasePlan === 'digital_single' ? (activeIssue.digitalPriceUsd || 10) : (activeIssue.priceUsd || Math.ceil((activeIssue.price || 499) / 80))}`
                          : `₹${purchasePlan === 'digital_single' ? (activeIssue.digitalPrice || 299).toFixed(0) : (activeIssue.price || 499).toFixed(0)}`
                        }
                      </span>
                    </div>
                    {purchasePlan !== 'digital_single' && (
                      <div className="flex justify-between font-semibold text-graycustom">
                        <span>Shipping ({shippingCountry})</span>
                        <span>
                          {currency === 'USD'
                            ? `$${shippingCountry.toLowerCase().trim() === 'india' ? 5 : 15}`
                            : `₹${shippingCountry.toLowerCase().trim() === 'india' ? 150 : 2500}`
                          }
                        </span>
                      </div>
                    )}
                    <div className="border-t border-slate-200/60 my-2"></div>
                    <div className="flex justify-between font-bold text-sm">
                      <span>Total</span>
                      <span>
                        {currency === 'USD'
                          ? `$${purchasePlan === 'digital_single' 
                              ? (activeIssue.digitalPriceUsd || 10) 
                              : ((activeIssue.priceUsd || Math.ceil((activeIssue.price || 499) / 80)) + (shippingCountry.toLowerCase().trim() === 'india' ? 5 : 15))}`
                          : `₹${purchasePlan === 'digital_single' 
                              ? (activeIssue.digitalPrice || 299).toFixed(0) 
                              : ((activeIssue.price || 499) + (shippingCountry.toLowerCase().trim() === 'india' ? 150 : 2500)).toFixed(0)}`
                        }
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPurchaseOpen(false)}
                      className="flex-1 py-3 border border-slate-200 text-midnight hover:bg-slate-100 font-sans font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all duration-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || !shippingName || !shippingEmail || !shippingPhone || (purchasePlan !== 'digital_single' && (!shippingHouseNo || !shippingAddress || !shippingCity || !shippingPincode))}
                      className="flex-1 py-3 bg-midnight text-white hover:bg-turquoise font-sans font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating premium toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-10 z-50 p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 shadow-2xl flex items-center gap-4 max-w-sm"
          >
            <div className="w-10 h-10 rounded-full bg-turquoise/10 flex items-center justify-center text-turquoise shrink-0 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-serif font-bold text-xs text-midnight uppercase tracking-wider">
                Ledger Dispatched
              </h5>
              <p className="text-[11px] text-graycustom mt-0.5 leading-relaxed">
                Initiating digital ledger transfer of <strong>Issue No. 42.pdf</strong>.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toast notification for share */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-10 z-50 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 shadow-2xl flex items-center gap-3 max-w-sm"
          >
            <div className="w-8 h-8 rounded-full bg-turquoise/10 flex items-center justify-center text-turquoise shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-midnight font-bold">Link Copied</p>
              <p className="text-[10px] text-graycustom leading-relaxed">Shareable catalog path copied to clipboard.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Picker Modal */}
      <AnimatePresence>
        {mapOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMapOpen(false)}
              className="fixed inset-0 bg-midnight/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-warmwhite border border-offwhite rounded-[28px] p-6 shadow-2xl z-10"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-[9px] font-mono text-turquoise uppercase tracking-widest block font-bold">SHIPPING ADDRESS PICKER</span>
                  <h4 className="text-base font-serif font-bold text-midnight">Select on Map</h4>
                </div>
                <button
                  onClick={() => setMapOpen(false)}
                  className="p-2 rounded-full hover:bg-midnight/5 text-midnight cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div id="map-picker-container" className="mb-4">
                <div className="text-center py-20 text-xs text-graycustom">Loading interactive map...</div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-4 text-[11px] text-midnight leading-relaxed font-semibold">
                <div className="flex items-center gap-1.5 text-turquoise mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="font-mono text-[9px] tracking-wider uppercase font-bold">Detected Address</span>
                </div>
                <p className="line-clamp-2">{shippingAddress || 'No location selected yet. Click or drag marker.'}</p>
              </div>

              <button
                onClick={() => setMapOpen(false)}
                className="w-full py-3 bg-midnight hover:bg-turquoise text-white font-sans text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer text-center"
              >
                Confirm Shipping Address
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
