/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';
import { 
  Lock, Mail, Eye, EyeOff, LayoutDashboard, BookOpen, 
  Users, Layers, LogOut, Plus, Trash2, Edit3, X, Save, 
  CheckCircle2, AlertTriangle, ArrowLeft, Sparkles, FileText, Download, UploadCloud, CreditCard, Calendar, MapPin, Images, Film,
  Search, Filter, RotateCcw, ExternalLink
} from 'lucide-react';
import { Blog, Artist, Magazine } from '../types';
import Logo from './Logo';
import { API_BASE_URL } from '../config';
import mammoth from 'mammoth';

interface AdminPortalProps {
  onChangePage?: (pageId: string) => void;
  portalRole: 'admin' | 'editor';
}

type TabType = 'dashboard' | 'hero' | 'blogs' | 'magazines' | 'artists' | 'payments' | 'events';

export const convertDriveUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('drive.google.com') && (trimmed.includes('/file/d/') || trimmed.includes('id='))) {
    let fileId = '';
    const match = trimmed.match(/\/file\/d\/([^\/\?]+)/);
    if (match) {
      fileId = match[1];
    } else {
      const matchId = trimmed.match(/[?&]id=([^&]+)/);
      if (matchId) fileId = matchId[1];
    }
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  return trimmed;
};

const renderBlogPreviewContent = (text: string) => {
  if (!text || text.trim() === '') {
    return <p className="text-slate-400 italic text-center py-6">No article content written yet...</p>;
  }

  const paragraphs = text.split(/\n\s*\n/);
  return paragraphs.map((block, idx) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={idx} className="text-xl md:text-2xl font-serif font-bold text-midnight mt-6 mb-3">
          {trimmed.replace(/^##\s*/, '')}
        </h2>
      );
    }
    if (trimmed.startsWith('> ')) {
      return (
        <blockquote key={idx} className="my-6 pl-4 border-l-2 border-turquoise font-serif italic text-midnight text-sm bg-slate-50 py-3 px-4 rounded-r-xl">
          "{trimmed.replace(/^>\s*/, '')}"
        </blockquote>
      );
    }
    if (
      trimmed.startsWith('http://') || 
      trimmed.startsWith('https://') || 
      trimmed.startsWith('/') || 
      trimmed.startsWith('data:image/')
    ) {
      const isImg = 
        trimmed.startsWith('data:image/') ||
        trimmed.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || 
        trimmed.includes('lh3.googleusercontent.com') || 
        trimmed.includes('unsplash.com') || 
        trimmed.includes('supabase.co');
        
      if (isImg) {
        return (
          <div key={idx} className="my-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex justify-center bg-slate-50/50">
            <img src={convertDriveUrl(trimmed)} alt="Inline Blog Image" className="w-full h-auto max-h-[550px] object-contain rounded-2xl" />
          </div>
        );
      }
    }
    if (trimmed.startsWith('<img')) {
      return (
        <div key={idx} dangerouslySetInnerHTML={{ __html: trimmed }} className="my-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm" />
      );
    }
    return (
      <p key={idx} className="mb-4 text-xs md:text-sm text-slate-700 leading-relaxed font-sans">
        {parseMarkdownLinksInPreview(trimmed)}
      </p>
    );
  });
};

const parseMarkdownLinksInPreview = (text: string): React.ReactNode => {
  if (!text) return null;
  const linkRegex = /\[([^\]]+)\](?:\(([^)]+)\))?|(https?:\/\/[^\s<]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    const [fullMatch, bracketText, parenUrl, rawUrl] = match;

    if (bracketText) {
      const targetUrl = (parenUrl || '').trim();
      const displayText = bracketText.trim();
      const formattedHref = targetUrl.startsWith('http') || targetUrl.startsWith('/') ? targetUrl : `https://${targetUrl}`;

      parts.push(
        <a
          key={matchIndex}
          href={formattedHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-baseline gap-0.5 text-turquoise font-semibold underline hover:text-midnight transition-colors cursor-pointer mx-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{displayText}</span>
          <ExternalLink className="w-3 h-3 self-center shrink-0 opacity-80" />
        </a>
      );
    } else if (rawUrl) {
      parts.push(
        <a
          key={matchIndex}
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-baseline gap-0.5 text-turquoise font-semibold underline hover:text-midnight transition-colors cursor-pointer mx-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{rawUrl}</span>
          <ExternalLink className="w-3 h-3 self-center shrink-0 opacity-80" />
        </a>
      );
    }

    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

const extractParagraphTextWithLinks = (el: HTMLElement): string => {
  let output = '';
  el.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      output += child.textContent || '';
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child as HTMLElement;
      const tag = childEl.tagName.toLowerCase();
      if (tag === 'a') {
        const href = childEl.getAttribute('href')?.trim();
        const text = extractParagraphTextWithLinks(childEl).trim();
        if (href && text) {
          output += ` [${text}](${href}) `;
        } else if (text) {
          output += text;
        }
      } else if (tag === 'img') {
        // img handled separately
      } else {
        output += extractParagraphTextWithLinks(childEl);
      }
    }
  });
  return output.replace(/\s+/g, ' ').trim();
};

export const cleanWordHtmlToMarkdown = (html: string): string => {
  if (!html) return '';
  if (!html.includes('<')) {
    return html.split(/\r?\n/).map(l => l.trim()).filter(Boolean).join('\n\n');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks: string[] = [];

  const walk = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === 'h1' || tag === 'h2') {
        const txt = extractParagraphTextWithLinks(el);
        if (txt) blocks.push(`## ${txt}`);
      } else if (tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
        const txt = extractParagraphTextWithLinks(el);
        if (txt) blocks.push(`### ${txt}`);
      } else if (tag === 'blockquote') {
        const txt = extractParagraphTextWithLinks(el);
        if (txt) blocks.push(`> ${txt}`);
      } else if (tag === 'img') {
        const src = el.getAttribute('src');
        if (src) blocks.push(src);
      } else if (tag === 'p' || tag === 'div' || tag === 'li') {
        const imgs = el.querySelectorAll('img');
        if (imgs.length > 0) {
          imgs.forEach(img => {
            const src = img.getAttribute('src');
            if (src) blocks.push(src);
          });
        }
        const txt = extractParagraphTextWithLinks(el);
        if (txt) blocks.push(txt);
      } else {
        Array.from(el.childNodes).forEach(walk);
      }
    }
  };

  Array.from(doc.body.childNodes).forEach(walk);

  if (blocks.length === 0) {
    return doc.body.textContent?.trim() || html;
  }

  const cleanBlocks = blocks.filter((b, i, arr) => b && (i === 0 || b !== arr[i - 1]));
  return cleanBlocks.join('\n\n');
};

// Drag and Drop File Upload Component for Admin Forms
const DragDropFileZone: React.FC<{
  label: string;
  accept?: string;
  value: string;
  onChange: (url: string) => void;
  onFileSelect?: (file: File) => void;
  placeholder?: string;
  type?: 'image' | 'pdf' | 'video';
}> = ({ label, accept, value, onChange, onFileSelect, placeholder, type = 'image' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const processFile = async (file: File) => {
    if (onFileSelect) {
      onFileSelect(file);
      return;
    }
    
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop() || 'file';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const bucketName = 'blog-images';
      
      const { error } = await supabase.storage.from(bucketName).upload(fileName, file, {
        contentType: file.type || undefined,
        upsert: true
      });
      if (!error) {
        const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        onChange(data.publicUrl);
      } else {
        // Fallback: Read file directly into Data URL (Base64) for instant direct file upload without external URL dependencies
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            onChange(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (e: any) {
      // Local fallback for offline/direct upload
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const defaultAccept = type === 'video'
    ? "video/*,.mp4,.webm,.mov,.avi,.mkv"
    : type === 'pdf'
    ? "application/pdf"
    : "image/*,.png,.jpg,.jpeg,.webp,.svg,.gif,.bmp,.tiff";

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">{label}</label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
          isDragging ? 'border-turquoise bg-turquoise/10 scale-[1.01]' : 'border-slate-200 bg-slate-50/50 hover:border-turquoise/50 hover:bg-slate-50'
        }`}
      >
        <input
          type="file"
          accept={accept || defaultAccept}
          onChange={handleFileInput}
          disabled={isUploading}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        <div className="flex flex-col items-center justify-center gap-1.5">
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-turquoise border-t-transparent rounded-full animate-spin" />
          ) : (
            <UploadCloud className={`w-6 h-6 ${isDragging ? 'text-turquoise animate-bounce' : 'text-slate-400'}`} />
          )}
          <div className="text-xs">
            {isUploading ? (
              <span className="font-bold text-turquoise">Uploading...</span>
            ) : (
              <><span className="font-bold text-midnight">Drag & drop file here</span> or <span className="text-turquoise font-semibold underline">browse file</span></>
            )}
          </div>
          <p className="text-[9px] font-mono text-slate-400">Upload direct file or paste link below</p>
        </div>
      </div>
      <div className="flex gap-3 items-center pt-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(convertDriveUrl(e.target.value))}
          placeholder={placeholder || 'Or paste direct URL / Google Drive link...'}
          className="flex-grow px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none font-mono"
        />
        {type === 'image' && value && (value.startsWith('http') || value.startsWith('data:image')) && (
          <img src={value} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100" />
        )}
        {type === 'video' && value && (value.startsWith('http') || value.startsWith('data:video')) && (
          <video src={value} className="w-14 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-black" autoPlay loop muted playsInline />
        )}
      </div>
    </div>
  );
};

export default function AdminPortal({ onChangePage, portalRole }: AdminPortalProps) {
  // Authentication states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Password Recovery States
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>(portalRole === 'editor' ? 'blogs' : 'dashboard');

  // Roster lists
  const [blogsList, setBlogsList] = useState<any[]>([]);
  const [magazinesList, setMagazinesList] = useState<any[]>([]);
  const [artistsList, setArtistsList] = useState<any[]>([]);
  const [subscribersList, setSubscribersList] = useState<any[]>([]);
  const [enquiriesList, setEnquiriesList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Completed Payment Notification Tracking
  const [seenPaymentIds, setSeenPaymentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tal_seen_payment_ids');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const completedPayments = paymentsList.filter(p => 
    p.status === 'paid' || p.status === 'completed' || p.status === 'captured'
  );
  const unreadCompletedPayments = completedPayments.filter(p => !seenPaymentIds.includes(p.id));
  const unreadOrdersCount = unreadCompletedPayments.length;

  const markPaymentsAsRead = () => {
    const allCompletedIds = completedPayments.map(p => p.id);
    setSeenPaymentIds(allCompletedIds);
    try {
      localStorage.setItem('tal_seen_payment_ids', JSON.stringify(allCompletedIds));
    } catch (e) {}
  };

  // Payment Filter & Search States
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [paymentDateFilter, setPaymentDateFilter] = useState('all');
  const [paymentPlanFilter, setPaymentPlanFilter] = useState('all');

  // CRUD Form Overlay states
  const [showFormModal, setShowFormModal] = useState(false);
  const [formType, setFormType] = useState<'blog' | 'magazine' | 'artist' | 'event' | 'hero'>('blog');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  // 1. Blog
  const [blogTitle, setBlogTitle] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogImage, setBlogImage] = useState('');
  const [blogAuthor, setBlogAuthor] = useState('');
  const [blogCategory, setBlogCategory] = useState('');
  const [blogStatus, setBlogStatus] = useState('approved');
  const [blogFormTab, setBlogFormTab] = useState<'edit' | 'preview'>('edit');

  // 2. Magazine
  const [magIssueNumber, setMagIssueNumber] = useState('');
  const [magIssueName, setMagIssueName] = useState('');
  const [magSlug, setMagSlug] = useState('');
  const [magReleaseDate, setMagReleaseDate] = useState('');
  const [magPrice, setMagPrice] = useState('');
  const [magPriceUsd, setMagPriceUsd] = useState('');
  const [magTagline, setMagTagline] = useState('');
  const [magShortSummary, setMagShortSummary] = useState('');
  const [magLongDescription, setMagLongDescription] = useState('');
  const [magCoverUrl, setMagCoverUrl] = useState('');
  const [magPdfUrl, setMagPdfUrl] = useState('');
  const [magDigitalPrice, setMagDigitalPrice] = useState('299');
  const [magDigitalPriceUsd, setMagDigitalPriceUsd] = useState('10');
  const [magShippingInr, setMagShippingInr] = useState('150');
  const [magShippingUsd, setMagShippingUsd] = useState('15');
  const [magPreviewPage1, setMagPreviewPage1] = useState('');
  const [magPreviewPage2, setMagPreviewPage2] = useState('');
  const [magPreviewPage3, setMagPreviewPage3] = useState('');
  const [magPreviewPage4, setMagPreviewPage4] = useState('');
  const [magPreviewPage5, setMagPreviewPage5] = useState('');
  const [magPreviewPage6, setMagPreviewPage6] = useState('');
  const [magStatus, setMagStatus] = useState('published');
  const [magEditorNote, setMagEditorNote] = useState('');
  const [magEditorName, setMagEditorName] = useState('');
  const [magEditorImageUrl, setMagEditorImageUrl] = useState('');

  // 3. Artist
  const [artName, setArtName] = useState('');
  const [artShortBio, setArtShortBio] = useState('');
  const [artImageUrl, setArtImageUrl] = useState('');
  const [artStyle, setArtStyle] = useState('Artist');
  const [artCountry, setArtCountry] = useState('');
  const [artBorn, setArtBorn] = useState('');
  const [artMedium, setArtMedium] = useState('');
  const [artStatement, setArtStatement] = useState('');
  const [artDisplayOrder, setArtDisplayOrder] = useState('0');

  // 4. Event
  const [eventTitle, setEventTitle] = useState('');
  const [eventSubtitle, setEventSubtitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventArtist, setEventArtist] = useState('');
  const [eventImage, setEventImage] = useState('');
  const [eventType, setEventType] = useState('Exhibition');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStatus, setEventStatus] = useState('Upcoming');

  // 5. Hero Card State
  const [heroList, setHeroList] = useState<any[]>([]);
  const [heroBadge, setHeroBadge] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroMediaUrl, setHeroMediaUrl] = useState('');
  const [heroMediaType, setHeroMediaType] = useState<'image' | 'video'>('image');
  const [heroLinkPage, setHeroLinkPage] = useState('blogs');
  const [heroLinkText, setHeroLinkText] = useState('Explore');

  // Toast / Feedback
  const [successToast, setSuccessToast] = useState('');

  // Blog document upload states
  const [blogDocument, setBlogDocument] = useState<any | null>(null);
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);

  // Check auth session on load
  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
      setCheckingAuth(false);
      return;
    }

    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsAuthenticated(true);
          await verifyAdmin(session.user.id);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkSession();
  }, []);

  // Fetch lists whenever tab changes
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [activeTab, isAdmin, portalRole]);

  async function verifyAdmin(userId: string) {
    try {
      const allowedRoles = portalRole === 'editor' ? ['admin', 'editor'] : ['admin'];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', allowedRoles)
        .limit(1)
        .maybeSingle();
      
      if (data && !error) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        setErrorMsg(`Access Denied: You do not have ${portalRole} permissions.`);
        await supabase.auth.signOut();
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Role verification error:', err);
      setIsAdmin(false);
    }
  }

  const fetchLiveWebsiteDeck = async () => {
    try {
      const { data: blogData } = await supabase
        .from('blog_submissions')
        .select('title, short_description, image_url, content')
        .eq('status', 'approved')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: magData } = await supabase
        .from('magazines')
        .select('issue_number, issue_name, cover_image_url, tagline, short_summary, status')
        .neq('status', 'draft')
        .order('issue_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: freedomEventData } = await supabase
        .from('events')
        .select('title, featured_image_url, short_description, location')
        .ilike('title', '%freedom%')
        .limit(1)
        .maybeSingle();

      return [
        {
          id: 'hero-blog',
          badge: 'ESSAY // CONTEMPORARY ART',
          title: blogData?.title || 'In Conversation with Prajakta Potnis',
          subtitle: blogData?.short_description || 'Exploring contemporary sculpture, domestic spaces, and post-colonial motifs.',
          media_url: blogData?.image_url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1200',
          media_type: 'image',
          link_page: 'blogs',
          link_text: 'Read Full Essay'
        },
        {
          id: 'hero-magazine',
          badge: magData?.status === 'coming_soon' ? `COMING SOON // ISSUE NO. ${magData?.issue_number || 42}` : `LATEST PRINT // ISSUE NO. ${magData?.issue_number || 42}`,
          title: magData?.issue_name || 'The Digital Renaissance',
          subtitle: magData?.tagline || magData?.short_summary || 'Special quarterly print release examining new media art.',
          media_url: magData?.cover_image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1200',
          media_type: 'image',
          link_page: 'magazine',
          link_text: 'Explore Issue'
        },
        {
          id: 'hero-event',
          badge: 'EXHIBITION // FEATURED',
          title: freedomEventData?.title || 'Freedom - Season 3',
          subtitle: freedomEventData?.short_description || 'International Art Exhibition & Award Event at Nehru Centre AC Art Gallery, Worli, Mumbai.',
          media_url: freedomEventData?.featured_image_url || '/blog1/1.png',
          media_type: 'image',
          link_page: 'events',
          link_text: 'View Exhibition'
        }
      ];
    } catch (e) {
      return [];
    }
  };

  const loadLiveInterconnectedDeck = async () => {
    triggerToast('Fetching live website deck...');
    const deck = await fetchLiveWebsiteDeck();
    setHeroList(deck);
    triggerToast('Live website cards loaded into panel!');
  };

  async function loadData() {
    setDataLoading(true);
    try {
      if (activeTab === 'blogs' || activeTab === 'dashboard') {
        const { data } = await supabase
          .from('blog_submissions')
          .select('*')
          .order('published_at', { ascending: false });
        const filtered = (data || []).filter(item => item.id !== '715e9705-4d42-46a2-b86f-afc6f5f5f28e');
        setBlogsList(filtered);
      }
      if (activeTab === 'magazines' || activeTab === 'dashboard') {
        const { data } = await supabase
          .from('magazines')
          .select('*')
          .order('issue_number', { ascending: false });
        setMagazinesList(data || []);
      }
      if (activeTab === 'artists' || activeTab === 'dashboard') {
        const { data } = await supabase
          .from('featured_profiles')
          .select('*')
          .order('display_order', { ascending: true });
        setArtistsList(data || []);
      }
      if (activeTab === 'payments' || activeTab === 'dashboard') {
        const { data: payData } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });
        setPaymentsList(payData || []);
      }
      if (activeTab === 'events' || activeTab === 'dashboard') {
        const { data: evData } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: false });
        
        const freedomDefault = {
          id: 'freedom-season-3',
          title: 'Freedom - Season 3',
          short_description: 'International Art Exhibition & Award Event at Nehru Centre AC Art Gallery, Worli, Mumbai.',
          event_date: '2026-09-15',
          location: 'Nehru Centre AC Art Gallery, Worli, Mumbai',
          artist: 'SKAF India (Curator: Siddharth Karmakar)',
          featured_image_url: '/blog1/1.png',
          status: 'published',
          type: 'Exhibition'
        };

        const list = evData || [];
        const hasFreedom = list.some(item => (item.title || '').toLowerCase().includes('freedom'));
        setEventsList(hasFreedom ? list : [freedomDefault, ...list]);
      }
      if (activeTab === 'hero' || activeTab === 'dashboard') {
        let loadedHero: any[] | null = null;

        // 1. Fetch directly from Supabase site_settings table
        try {
          const { data: settings } = await supabase
            .from('site_settings')
            .select('hero_slides')
            .limit(1)
            .maybeSingle();

          if (settings?.hero_slides && Array.isArray(settings.hero_slides) && settings.hero_slides.length > 0) {
            loadedHero = settings.hero_slides;
          }
        } catch (e) {
          console.error('Error querying Supabase site_settings for hero_slides:', e);
        }

        // 2. Fetch from Supabase Storage JSON file
        if (!loadedHero) {
          try {
            const publicJsonUrl = `https://bybmtrhpgxnquzjbhhtm.supabase.co/storage/v1/object/public/blog-images/hero_slides.json?t=${Date.now()}`;
            const res = await fetch(publicJsonUrl);
            if (res.ok) {
              const parsed = await res.json();
              if (Array.isArray(parsed) && parsed.length > 0) {
                loadedHero = parsed;
              }
            }
          } catch (e) {}
        }

        if (loadedHero && loadedHero.length > 0) {
          setHeroList(loadedHero);
        } else {
          // If no custom slides stored in DB, load the live 3-card website deck directly
          const liveDeck = await fetchLiveWebsiteDeck();
          setHeroList(liveDeck);
        }
      }
      if (activeTab === 'dashboard') {
        const { data: subs } = await supabase
          .from('newsletter_subscribers')
          .select('*')
          .order('created_at', { ascending: false });
        setSubscribersList(subs || []);

        const { data: enqs } = await supabase
          .from('ad_enquiries')
          .select('*')
          .order('created_at', { ascending: false });
        setEnquiriesList(enqs || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setDataLoading(false);
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      // Dummy credentials removed for production security.
      // Now enforcing real Supabase Authentication.

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.session?.user) {
        setIsAuthenticated(true);
        await verifyAdmin(data.session.user.id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setIsAdmin(false);
    setActiveTab('dashboard');
    setEmail('');
    setPassword('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setRecoveryStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('Failed to send recovery email');
      setRecoveryStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending recovery email.');
      setRecoveryStatus('idle');
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      triggerToast('Password updated successfully. Please log in.');
      setIsRecoveryMode(false);
      setPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating password.');
    } finally {
      setLoading(false);
    }
  };

  // Open Form modal
  const openForm = (type: 'blog' | 'magazine' | 'artist' | 'event' | 'hero', mode: 'create' | 'edit', item?: any) => {
    setFormType(type);
    setFormMode(mode);
    setEditingId(item ? item.id : null);

    if (type === 'blog') {
      setBlogFormTab('edit');
      setBlogTitle(item ? item.title : '');
      setBlogExcerpt(item ? item.short_description || '' : '');
      setBlogContent(item ? item.content || '' : '');
      setBlogImage(item ? item.image_url || '' : '');
      setBlogAuthor(item ? item.name || '' : '');
      setBlogCategory(item ? item.category || '' : '');
      setBlogStatus(item ? item.status : 'approved');
      if (item && item.admin_notes) {
        try {
          const parsed = JSON.parse(item.admin_notes);
          if (parsed && parsed.fileName) {
            setBlogDocument(parsed);
          } else {
            setBlogDocument(null);
          }
        } catch (e) {
          setBlogDocument(null);
        }
      } else {
        setBlogDocument(null);
      }
    } else if (type === 'magazine') {
      setMagIssueNumber(item ? item.issue_number.toString() : '');
      setMagIssueName(item ? item.issue_name : '');
      setMagSlug(item ? item.slug : '');
      setMagReleaseDate(item ? item.release_date : '');
      setMagPrice(item && item.single_issue_price ? item.single_issue_price.toString() : '');
      setMagPriceUsd(item && item.single_issue_price_usd ? item.single_issue_price_usd.toString() : '');
      setMagTagline(item ? item.tagline || '' : '');
      setMagShortSummary(item ? item.short_summary || '' : '');
      setMagLongDescription(item ? item.long_description || '' : '');
      setMagCoverUrl(item ? item.cover_image_url || '' : '');
      setMagPdfUrl(item ? item.pdf_url || '' : '');
      setMagDigitalPrice(item && item.digital_pdf_price ? item.digital_pdf_price.toString() : '299');
      setMagDigitalPriceUsd(item && item.digital_pdf_price_usd ? item.digital_pdf_price_usd.toString() : '10');
      setMagShippingInr(item && item.shipping_inr ? item.shipping_inr.toString() : '150');
      setMagShippingUsd(item && item.shipping_usd ? item.shipping_usd.toString() : '15');
      const pages = item && Array.isArray(item.preview_pages) ? item.preview_pages : [];
      setMagPreviewPage1(pages[0] || '');
      setMagPreviewPage2(pages[1] || '');
      setMagPreviewPage3(pages[2] || '');
      setMagPreviewPage4(pages[3] || '');
      setMagPreviewPage5(pages[4] || '');
      setMagPreviewPage6(pages[5] || '');
      setMagStatus(item ? item.status : 'published');
      setMagEditorNote(item ? item.editor_note || '' : '');
      setMagEditorName(item ? item.editor_name || '' : '');
      setMagEditorImageUrl(item ? item.editor_image_url || '' : '');
    } else if (type === 'artist') {
      setArtName(item ? item.name : '');
      setArtShortBio(item ? item.short_bio || '' : '');
      setArtImageUrl(item ? item.image_url || '' : '');
      setArtStyle(item ? item.style || 'Artist' : 'Artist');
      setArtCountry(item ? item.country || '' : '');
      setArtBorn(item ? item.born || '' : '');
      setArtMedium(item ? item.medium || '' : '');
      setArtStatement(item ? item.statement || '' : '');
      setArtDisplayOrder(item ? item.display_order.toString() : '0');
    } else if (type === 'event') {
      setEventTitle(item ? item.title : '');
      setEventSubtitle(item ? item.short_description || item.subtitle || '' : '');
      setEventDate(item ? item.event_date || item.date || '' : '');
      setEventTime(item ? item.time || '12:00 PM - 7:00 PM' : '');
      setEventVenue(item ? item.location || item.venue || '' : '');
      setEventArtist(item ? item.artist || '' : '');
      setEventImage(item ? item.featured_image_url || item.image || '' : '');
      setEventType(item ? item.type || 'Exhibition' : 'Exhibition');
      setEventDescription(item ? item.long_description || item.description || '' : '');
      setEventStatus(item ? item.status || 'Upcoming' : 'Upcoming');
    } else if (type === 'hero') {
      setHeroBadge(item ? item.badge || '' : 'FEATURED EDITORIAL');
      setHeroTitle(item ? item.title || '' : '');
      setHeroSubtitle(item ? item.subtitle || '' : '');
      setHeroMediaUrl(item ? item.media_url || '' : '');
      setHeroMediaType(item ? item.media_type || 'image' : 'image');
      setHeroLinkPage(item ? item.link_page || 'blogs' : 'blogs');
      setHeroLinkText(item ? item.link_text || 'Explore' : 'Explore');
    }

    setShowFormModal(true);
  };

  // File Upload Handler for Blog Manuscripts
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setBlogDocument({
          fileName: file.name,
          fileType: file.type || 'text/plain',
          textPreview: text
        });

        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          const firstLine = lines[0].replace(/^#+\s*/, '');
          setBlogTitle(prev => prev ? prev : firstLine);
          if (lines.length > 1) {
            setBlogExcerpt(prev => prev ? prev : lines[1]);
          }
          setBlogContent(prev => prev ? prev : text);
        }
        triggerToast('Text manuscript content imported & populated!');
      };
      reader.readAsText(file);
      return;
    }

    if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      try {
        triggerToast('Extracting Word document & inline images...');
        const arrayBuffer = await file.arrayBuffer();

        // Convert to HTML preserving embedded inline images from Word
        const htmlResult = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            convertImage: mammoth.images.imgElement(async (image) => {
              try {
                const imageBuffer = await image.read('base64');
                const contentType = image.contentType || 'image/jpeg';
                const fileExt = contentType.split('/')[1] || 'jpg';
                const fileName = `docx_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

                const byteCharacters = atob(imageBuffer);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: contentType });

                const { error: uploadErr } = await supabase.storage
                  .from('blog-images')
                  .upload(fileName, blob, { contentType, cacheControl: '3600', upsert: true });

                if (!uploadErr) {
                  const { data } = supabase.storage.from('blog-images').getPublicUrl(fileName);
                  if (data?.publicUrl) {
                    return { src: data.publicUrl };
                  }
                }
                return { src: `data:${contentType};base64,${imageBuffer}` };
              } catch (err) {
                const imageBuffer = await image.read('base64');
                return { src: `data:${image.contentType || 'image/jpeg'};base64,${imageBuffer}` };
              }
            })
          }
        );

        const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
        const extractedText = (rawTextResult.value || '').trim();
        const extractedHtml = (htmlResult.value || '').trim();

        setBlogDocument({
          fileName: file.name,
          fileType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          textPreview: extractedText.substring(0, 300) + '...'
        });

        const lines = extractedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          const firstLine = lines[0].replace(/^#+\s*/, '');
          setBlogTitle(prev => prev ? prev : firstLine);
          if (lines.length > 1) {
            setBlogExcerpt(prev => prev ? prev : lines[1]);
          }
        }
        const cleanFormattedContent = cleanWordHtmlToMarkdown(extractedHtml || extractedText);
        setBlogContent(prev => prev ? prev : cleanFormattedContent);
        triggerToast('Word manuscript extracted cleanly as formatted text & images!');
      } catch (err: any) {
        console.error('Docx extraction error:', err);
        triggerToast('Word document uploaded as attachment');
      }
      return;
    }

    try {
      triggerToast('Uploading manuscript document...');
      const fileExt = file.name.split('.').pop() || 'file';
      const fileName = `manuscript_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      let publicUrl = '';

      const { error: uploadErr } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file, { contentType: file.type || undefined, upsert: true });

      if (!uploadErr) {
        const { data } = supabase.storage.from('blog-images').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      setBlogDocument({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileUrl: publicUrl || '',
        textPreview: 'Document Attached'
      });
      triggerToast('Manuscript document attached!');
    } catch (err: any) {
      console.error('Error processing manuscript file:', err);
      setBlogDocument({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        textPreview: 'Document attached.'
      });
    }
  };

  // Upload inline images directly to Supabase storage and insert into blog body
  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      triggerToast('Uploading inline image...');
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `inline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from('blog-images').getPublicUrl(fileName);
      if (data?.publicUrl) {
        setBlogContent(prev => prev + (prev ? '\n\n' : '') + data.publicUrl + '\n\n');
        triggerToast('Inline image inserted into article!');
      }
    } catch (err: any) {
      console.error('Error uploading inline image:', err);
      triggerToast(`Inline image upload failed: ${err.message}`);
    }
  };

  const handlePdfUpload = async (fileOrEvent: File | React.ChangeEvent<HTMLInputElement>) => {
    const file = 'target' in fileOrEvent ? fileOrEvent.target.files?.[0] : fileOrEvent;
    if (!file) return;

    try {
      triggerToast('Uploading Magazine PDF...');
      const fileExt = file.name.split('.').pop();
      const fileName = `magazine_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload exclusively to dedicated magazine-pdfs bucket (fall back to blog-images if bucket doesn't exist yet)
      let bucketName = 'magazine-pdfs';
      let { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError && (uploadError.message?.includes('not found') || (uploadError as any).statusCode === '404')) {
        bucketName = 'blog-images';
        const { error: fbErr } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, { cacheControl: '3600', upsert: true });
        if (fbErr) throw fbErr;
      } else if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      setMagPdfUrl(data.publicUrl);
      triggerToast('Magazine PDF uploaded successfully!');
    } catch (error: any) {
      triggerToast(`PDF Upload failed: ${error.message}`);
    }
  };

  // Submit CRUD Action
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formType === 'blog') {
        const { data: { user } } = await supabase.auth.getUser();
        const authorEmail = user?.email || 'editorial@theartledger.io';

        const cleanContent = cleanWordHtmlToMarkdown(blogContent || '').trim() || blogContent?.trim() || 'Blog article content.';

        const payload = {
          title: blogTitle || 'Untitled Blog',
          short_description: blogExcerpt || '',
          content: cleanContent,
          image_url: convertDriveUrl(blogImage),
          name: blogAuthor || 'Editorial Board',
          email: authorEmail,
          category: blogCategory || 'Editorial',
          status: blogStatus || 'approved',
          published_at: new Date().toISOString(),
          admin_notes: blogDocument ? JSON.stringify(blogDocument) : null
        };

        if (formMode === 'create') {
          const { error } = await supabase.from('blog_submissions').insert([payload]);
          if (error) {
            // Fallback to core payload if optional metadata columns differ in schema
            const corePayload = {
              title: payload.title,
              short_description: payload.short_description,
              content: payload.content,
              image_url: payload.image_url,
              name: payload.name,
              email: payload.email,
              category: payload.category,
              status: payload.status,
              published_at: payload.published_at
            };
            const { error: coreErr } = await supabase.from('blog_submissions').insert([corePayload]);
            if (coreErr) throw coreErr;
          }
          triggerToast('Blog post created successfully!');
        } else {
          const { error } = await supabase.from('blog_submissions').update(payload).eq('id', editingId);
          if (error) {
            const corePayload = {
              title: payload.title,
              short_description: payload.short_description,
              content: payload.content,
              image_url: payload.image_url,
              name: payload.name,
              email: payload.email,
              category: payload.category,
              status: payload.status,
              published_at: payload.published_at
            };
            const { error: coreErr } = await supabase.from('blog_submissions').update(corePayload).eq('id', editingId);
            if (coreErr) throw coreErr;
          }
          triggerToast('Blog post updated successfully!');
        }
      } else if (formType === 'magazine') {
        // Core payload containing guaranteed database columns
        const payload: any = {
          issue_number: parseInt(magIssueNumber) || 1,
          issue_name: magIssueName || 'Untitled Issue',
          slug: magSlug || (magIssueName ? magIssueName.toLowerCase().replace(/ /g, '-') : `issue-${Date.now()}`),
          release_date: magReleaseDate || new Date().toISOString().split('T')[0],
          single_issue_price: parseFloat(magPrice) || 0.0,
          digital_pdf_price: parseFloat(magDigitalPrice) || 299.0,
          cover_image_url: magCoverUrl || '',
          pdf_url: magPdfUrl || '',
          preview_pages: [magPreviewPage1, magPreviewPage2, magPreviewPage3, magPreviewPage4, magPreviewPage5, magPreviewPage6].filter(Boolean),
          status: magStatus || 'published'
        };

        // Attach editorial metadata fields if set
        if (magTagline) payload.tagline = magTagline;
        if (magShortSummary) payload.short_summary = magShortSummary;
        if (magLongDescription) payload.long_description = magLongDescription;
        if (magEditorNote) payload.editor_note = magEditorNote;
        if (magEditorName) payload.editor_name = magEditorName;
        if (magEditorImageUrl) payload.editor_image_url = magEditorImageUrl;

        if (formMode === 'create') {
          const { error } = await supabase.from('magazines').insert([payload]);
          if (error) {
            // If optional columns cause issue, send clean core payload
            const corePayload = {
              issue_number: payload.issue_number,
              issue_name: payload.issue_name,
              slug: payload.slug,
              release_date: payload.release_date,
              single_issue_price: payload.single_issue_price,
              digital_pdf_price: payload.digital_pdf_price,
              cover_image_url: payload.cover_image_url,
              pdf_url: payload.pdf_url,
              preview_pages: payload.preview_pages,
              status: payload.status
            };
            const { error: coreErr } = await supabase.from('magazines').insert([corePayload]);
            if (coreErr) throw coreErr;
          }
        } else {
          const { error } = await supabase.from('magazines').update(payload).eq('id', editingId);
          if (error) {
            const corePayload = {
              issue_number: payload.issue_number,
              issue_name: payload.issue_name,
              slug: payload.slug,
              release_date: payload.release_date,
              single_issue_price: payload.single_issue_price,
              digital_pdf_price: payload.digital_pdf_price,
              cover_image_url: payload.cover_image_url,
              pdf_url: payload.pdf_url,
              preview_pages: payload.preview_pages,
              status: payload.status
            };
            const { error: coreErr } = await supabase.from('magazines').update(corePayload).eq('id', editingId);
            if (coreErr) throw coreErr;
          }
        }

        triggerToast(formMode === 'create' ? 'Magazine edition added successfully!' : 'Magazine edition updated successfully!');
      } else if (formType === 'artist') {
        const payload = {
          name: artName || 'Untitled Artist',
          short_bio: artShortBio || '',
          image_url: convertDriveUrl(artImageUrl),
          style: artStyle || 'Artist',
          country: artCountry || '',
          born: artBorn || '',
          medium: artMedium || '',
          statement: artStatement || '',
          display_order: parseInt(artDisplayOrder) || 0,
          is_published: true,
          profile_type: 'artist'
        };

        if (formMode === 'create') {
          const { error } = await supabase.from('featured_profiles').insert([payload]);
          if (error) throw error;
          triggerToast('Artist profile created successfully!');
        } else {
          const { error } = await supabase.from('featured_profiles').update(payload).eq('id', editingId);
          if (error) throw error;
          triggerToast('Artist profile updated successfully!');
        }
      } else if (formType === 'event') {
        const rawStatus = (eventStatus || 'Upcoming').toLowerCase();
        let finalStatus = 'upcoming';
        if (rawStatus.includes('completed')) finalStatus = 'completed';
        else if (rawStatus.includes('past')) finalStatus = 'past';
        else if (rawStatus.includes('current')) finalStatus = 'current';
        else if (rawStatus.includes('draft')) finalStatus = 'draft';
        else if (rawStatus.includes('published')) finalStatus = 'published';

        const payload = {
          title: eventTitle || 'Untitled Event',
          short_description: eventSubtitle || '',
          long_description: eventDescription || '',
          event_date: eventDate || new Date().toISOString().split('T')[0],
          location: eventVenue || '',
          featured_image_url: convertDriveUrl(eventImage),
          status: finalStatus,
          slug: (eventTitle || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `event-${Date.now()}`
        };

        if (formMode === 'create') {
          const { error } = await supabase.from('events').insert([payload]);
          if (error) throw error;
          triggerToast('Event created successfully!');
        } else {
          const { error } = await supabase.from('events').update(payload).eq('id', editingId);
          if (error) throw error;
          triggerToast('Event updated successfully!');
        }
      } else if (formType === 'hero') {
        const isVid = heroMediaType === 'video' || (heroMediaUrl && (
          heroMediaUrl.toLowerCase().includes('.mp4') ||
          heroMediaUrl.toLowerCase().includes('.webm') ||
          heroMediaUrl.toLowerCase().includes('.mov') ||
          heroMediaUrl.toLowerCase().includes('video')
        ));

        const cardObj = {
          id: editingId || `card-${Date.now()}`,
          badge: heroBadge || 'FEATURED STATEMENT',
          title: heroTitle || 'Untitled Card',
          subtitle: heroSubtitle || '',
          media_url: heroMediaUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1200',
          media_type: (isVid ? 'video' : 'image') as 'image' | 'video',
          link_page: heroLinkPage || 'blogs',
          link_text: heroLinkText || 'Explore'
        };

        let updated = [...heroList];
        if (formMode === 'create') {
          updated.push(cardObj);
        } else {
          updated = updated.map(c => c.id === editingId ? cardObj : c);
        }

        setHeroList(updated);

        // 1. Save directly to Supabase site_settings DB table first (instant DB write)
        try {
          const { error: dbErr } = await supabase
            .from('site_settings')
            .upsert({ id: '00000000-0000-0000-0000-000000000001', hero_slides: updated });
          if (dbErr) {
            console.error('Database site_settings upsert error:', dbErr);
          }
        } catch (e) {
          console.error('Database save error:', e);
        }

        // 2. Also save to public Supabase Storage JSON
        try {
          const jsonBlob = new Blob([JSON.stringify(updated)], { type: 'application/json' });
          await supabase.storage
            .from('blog-images')
            .upload('hero_slides.json', jsonBlob, { contentType: 'application/json', upsert: true, cacheControl: '0' });
        } catch (e) {}

        triggerToast('Hero Deck card saved & synced to Supabase!');
      }

      setShowFormModal(false);
      loadData();
    } catch (err: any) {
      alert(`Error saving: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete Item Action
  const handleDelete = async (type: 'blog' | 'magazine' | 'artist' | 'event' | 'hero', id: string) => {
    if (!window.confirm('Are you absolutely certain you want to permanently delete this registry entry?')) return;
    try {
      if (type === 'hero') {
        const updated = heroList.filter(c => c.id !== id);
        setHeroList(updated);
        localStorage.setItem('tal_hero_cards', JSON.stringify(updated));
        try {
          const jsonBlob = new Blob([JSON.stringify(updated)], { type: 'application/json' });
          await supabase.storage
            .from('blog-images')
            .upload('hero_slides.json', jsonBlob, { contentType: 'application/json', upsert: true, cacheControl: '0' });
        } catch (e) {}
        try {
          await supabase.from('site_settings').upsert({ id: '00000000-0000-0000-0000-000000000001', hero_slides: updated });
        } catch (e) {}
        triggerToast('Hero Deck card removed.');
        return;
      }

      let table = '';
      if (type === 'blog') table = 'blog_submissions';
      else if (type === 'magazine') table = 'magazines';
      else if (type === 'artist') table = 'featured_profiles';
      else if (type === 'event') table = 'events';

      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;

      triggerToast('Entry deleted successfully.');
      loadData();
    } catch (err: any) {
      alert(`Error deleting entry: ${err.message}`);
    }
  };

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warmwhite text-midnight">
        <p className="text-xs font-mono tracking-widest uppercase animate-pulse">Authenticating Portal Credentials...</p>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-warmwhite px-6 text-midnight relative overflow-hidden">
        {/* Decorative Grid Mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(26,115,232,0.03)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(26,115,232,0.03)_1.5px,transparent_1.5px)] bg-[size:30px_30px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-[250px] h-[250px] bg-turquoise/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Back Link */}
        <button
          onClick={() => onChangePage?.('home')}
          className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-600 hover:text-turquoise uppercase transition-colors duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO MAIN SITE</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md p-8 md:p-10 rounded-[32px] bg-white border border-slate-200 shadow-2xl relative z-10 space-y-6"
        >
          <div className="text-center space-y-3 flex flex-col items-center justify-center">
            <Logo className="scale-110 mb-1" />
            <span className="text-[9px] font-mono tracking-[0.2em] text-slate-500 font-bold uppercase block">
              {portalRole === 'editor' ? 'EDITORIAL DESK ACCESS' : 'PORTAL DESK ACCESS'}
            </span>
            <p className="text-xs text-slate-600 font-sans">
              Authenticate using curatorial administration credentials.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-sans font-medium flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isRecoveryMode ? (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-700 font-bold uppercase tracking-wider block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-[#F8FAFC] border border-slate-200 focus:border-turquoise rounded-xl text-xs text-black placeholder-slate-400 outline-none transition-all"
                    placeholder=""
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-midnight hover:bg-[#0B2545] text-white text-[10px] font-sans font-bold uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-midnight/15 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'UPDATING...' : 'SET NEW PASSWORD'}
              </button>
            </form>
          ) : isForgotPasswordMode ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-700 font-bold uppercase tracking-wider block">Account Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-slate-200 focus:border-turquoise rounded-xl text-xs text-black placeholder-slate-400 outline-none transition-all"
                    placeholder=""
                    disabled={recoveryStatus === 'loading'}
                  />
                </div>
              </div>
              {recoveryStatus === 'success' && (
                <p className="text-xs text-green-600 font-medium">Recovery email sent. Check your inbox.</p>
              )}
              <button
                type="submit"
                disabled={recoveryStatus === 'loading' || recoveryStatus === 'success'}
                className="w-full py-3.5 bg-midnight hover:bg-[#0B2545] text-white text-[10px] font-sans font-bold uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-midnight/15 cursor-pointer disabled:opacity-50"
              >
                {recoveryStatus === 'loading' ? 'SENDING...' : 'SEND RECOVERY LINK'}
              </button>
              <button
                type="button"
                onClick={() => { setIsForgotPasswordMode(false); setRecoveryStatus('idle'); setErrorMsg(''); }}
                className="w-full text-[10px] font-mono text-slate-500 hover:text-midnight uppercase tracking-wider block text-center mt-2 transition-colors cursor-pointer"
              >
                BACK TO LOGIN
              </button>
            </form>
          ) : (

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-700 font-bold uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-slate-200 focus:border-turquoise rounded-xl text-xs text-black placeholder-slate-400 outline-none transition-all"
                  placeholder=""
                  disabled={checkingAuth}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-700 font-bold uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#F8FAFC] border border-slate-200 focus:border-turquoise rounded-xl text-xs text-black placeholder-slate-400 outline-none transition-all"
                  placeholder=""
                  disabled={checkingAuth}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => { setIsForgotPasswordMode(true); setErrorMsg(''); }}
                className="text-[10px] font-mono text-slate-500 hover:text-turquoise transition-colors cursor-pointer uppercase tracking-wider"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-midnight hover:bg-[#0B2545] text-white text-[10px] font-sans font-bold uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-midnight/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'AUTHENTICATING...' : 'ACCESS PORTAL DESK →'}
            </button>
          </form>
          )}
        </motion.div>
      </div>
    );
  }

  // ADMIN PORTAL DESKTOP
  return (
    <div className="min-h-screen bg-warmwhite text-midnight flex flex-col md:flex-row relative">
      {/* Side Navigation bar */}
      <aside className="w-full md:w-64 bg-white/95 border-r border-slate-200/60 flex flex-col justify-between p-6 shrink-0 md:min-h-screen shadow-sm">
        <div className="space-y-8">
          <div className="flex items-center gap-2 pb-6 border-b border-slate-200/60">
            <Logo className="scale-90 origin-left" />
          </div>

          <nav className="space-y-1">
            {portalRole === 'admin' && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-midnight text-white shadow-md shadow-midnight/15' : 'text-slate-600 hover:bg-[#EAE5D8]/50 hover:text-midnight'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('blogs')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'blogs' ? 'bg-midnight text-white shadow-md shadow-midnight/15' : 'text-slate-600 hover:bg-[#EAE5D8]/50 hover:text-midnight'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Manage Blogs</span>
            </button>

            {portalRole === 'admin' && (
              <button
                onClick={() => setActiveTab('hero')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'hero' ? 'bg-midnight text-white shadow-md shadow-midnight/15' : 'text-slate-600 hover:bg-[#EAE5D8]/50 hover:text-midnight'
                }`}
              >
                <Images className="w-4 h-4" />
                <span>Hero Deck</span>
              </button>
            )}

            {portalRole === 'admin' && (
              <button
                onClick={() => setActiveTab('magazines')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'magazines' ? 'bg-midnight text-white shadow-md shadow-midnight/15' : 'text-slate-600 hover:bg-[#EAE5D8]/50 hover:text-midnight'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Magazines</span>
              </button>
            )}

            {portalRole === 'admin' && (
              <button
                onClick={() => setActiveTab('artists')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'artists' ? 'bg-midnight text-white shadow-md shadow-midnight/15' : 'text-slate-600 hover:bg-[#EAE5D8]/50 hover:text-midnight'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Artists Registry</span>
              </button>
            )}

            {portalRole === 'admin' && (
              <button
                onClick={() => setActiveTab('events')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'events' ? 'bg-midnight text-white shadow-md shadow-midnight/15' : 'text-slate-600 hover:bg-[#EAE5D8]/50 hover:text-midnight'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Events</span>
              </button>
            )}

            {portalRole === 'admin' && (
              <button
                onClick={() => { setActiveTab('payments'); markPaymentsAsRead(); }}
                className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'payments' ? 'bg-midnight text-white shadow-md shadow-midnight/15' : 'text-slate-600 hover:bg-[#EAE5D8]/50 hover:text-midnight'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4" />
                  <span>Payment Dashboard</span>
                </div>
                {unreadOrdersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-mono font-bold animate-pulse shadow-sm">
                    {unreadOrdersCount} NEW
                  </span>
                )}
              </button>
            )}
          </nav>
        </div>

        <div className="pt-6 border-t border-[#EAE5D8] space-y-4">
          <button
            onClick={() => onChangePage?.('home')}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-midnight text-[9px] font-mono tracking-widest uppercase rounded-lg transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>VISIT SITE</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[9px] font-mono tracking-widest uppercase rounded-lg transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>SIGN OUT</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto max-h-screen bg-warmwhite text-midnight">
        
        {/* Active Tab View Rendering */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/60">
              <div>
                <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest block mb-1">REGISTRY DESK</span>
                <h1 className="text-3xl font-serif font-bold tracking-tight text-midnight">Dashboard Summary</h1>
              </div>
            </div>

            {/* New Completed Payment Orders Alert Banner */}
            {unreadOrdersCount > 0 && (
              <div className="p-5 rounded-2xl bg-[#1E3A8A] text-white border border-blue-400/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-blue-400/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/30 animate-pulse">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-blue-300 flex items-center gap-2">
                      <span>{unreadOrdersCount} NEW COMPLETED ORDER{unreadOrdersCount > 1 ? 'S' : ''} PAID</span>
                    </h4>
                    <p className="text-xs text-slate-200 mt-0.5 font-medium leading-relaxed">
                      Latest: <strong>{unreadCompletedPayments[0]?.name || 'Collector'}</strong> paid {unreadCompletedPayments[0]?.amount ? `₹${unreadCompletedPayments[0]?.amount}` : ''} ({unreadCompletedPayments[0]?.plan || 'order'}) on {unreadCompletedPayments[0]?.created_at ? new Date(unreadCompletedPayments[0]?.created_at).toLocaleDateString() : 'today'}.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => { setActiveTab('payments'); markPaymentsAsRead(); }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-[10px] font-sans font-bold uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
                  >
                    View & Confirm Orders
                  </button>
                  <button
                    onClick={markPaymentsAsRead}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-sans font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer whitespace-nowrap"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Quick stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-white border border-[#EAE5D8] rounded-2xl space-y-2 shadow-sm text-midnight">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">TOTAL ARTICLES</span>
                <p className="text-4xl font-serif font-bold text-[#0B2545]">{blogsList.length}</p>
                <button onClick={() => setActiveTab('blogs')} className="text-[9px] font-mono text-turquoise hover:underline uppercase block">Manage Articles →</button>
              </div>

              <div className="p-6 bg-white border border-[#EAE5D8] rounded-2xl space-y-2 shadow-sm text-midnight">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">MAGAZINES</span>
                <p className="text-4xl font-serif font-bold text-[#0B2545]">{magazinesList.length}</p>
                <button onClick={() => setActiveTab('magazines')} className="text-[9px] font-mono text-turquoise hover:underline uppercase block">Manage Editions →</button>
              </div>

              <div className="p-6 bg-white border border-[#EAE5D8] rounded-2xl space-y-2 shadow-sm text-midnight">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">FEATURED ARTISTS</span>
                <p className="text-4xl font-serif font-bold text-[#0B2545]">{artistsList.length}</p>
                <button onClick={() => setActiveTab('artists')} className="text-[9px] font-mono text-turquoise hover:underline uppercase block">Manage Roster →</button>
              </div>

              <div className="p-6 bg-white border border-[#EAE5D8] rounded-2xl space-y-2 shadow-sm text-midnight">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">SUBSCRIBERS</span>
                <p className="text-4xl font-serif font-bold text-[#0B2545]">{subscribersList.length}</p>
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Newsletter Registry</span>
              </div>
            </div>

            {/* Practical curator tip box */}
            <div className="p-6 bg-turquoise/5 border border-turquoise/15 rounded-2xl space-y-2">
              <h4 className="text-xs font-mono text-turquoise font-bold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin-slow animate-pulse" />
                <span>HOW TO UPDATE THE LIVE WEBSITE IMMEDIATELY</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                All modifications and additions take effect immediately on the live website. To verify your updates, simply click the <strong>VISIT SITE</strong> button in the sidebar. The website's frontend fetches data dynamically from the database every time pages are loaded!
              </p>
            </div>

            {/* Recent activity Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent blogs */}
              <div className="p-6 bg-white border border-[#EAE5D8] rounded-[24px] space-y-4 shadow-sm text-midnight">
                <h3 className="text-sm font-mono text-slate-600 font-bold uppercase tracking-wider pb-3 border-b border-slate-200/60">RECENT ARTICLES</h3>
                <div className="space-y-3">
                  {blogsList.slice(0, 4).map(b => (
                    <div key={b.id} className="flex justify-between items-center text-xs">
                      <span className="font-medium text-midnight truncate max-w-xs">{b.title}</span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{b.category}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent subscribers */}
              <div className="p-6 bg-white border border-[#EAE5D8] rounded-[24px] space-y-4 shadow-sm text-midnight">
                <h3 className="text-sm font-mono text-slate-600 font-bold uppercase tracking-wider pb-3 border-b border-slate-200/60">RECENT SUBSCRIBERS</h3>
                <div className="space-y-3">
                  {subscribersList.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono">No subscribers registered yet.</p>
                  ) : (
                    subscribersList.slice(0, 4).map(s => (
                      <div key={s.id || s.email} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-midnight font-semibold">{s.email}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'blogs' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-200/60">
              <div>
                <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest block mb-1">EDITORIAL DESK</span>
                <h1 className="text-3xl font-serif font-bold tracking-tight text-midnight">Manage Blogs</h1>
              </div>
              <button
                onClick={() => openForm('blog', 'create')}
                className="px-4 py-2.5 bg-midnight hover:bg-[#0B2545] rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest text-white cursor-pointer flex items-center gap-1.5 shadow-md shadow-midnight/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>WRITE ARTICLE</span>
              </button>
            </div>

            {/* Blogs list table */}
            <div className="bg-white border border-[#EAE5D8] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200/60 bg-slate-50/50">
                <h3 className="text-xs font-mono text-slate-400 font-bold uppercase tracking-widest">Active Articles ({blogsList.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/60 text-slate-500 uppercase font-mono text-[9px] tracking-wider">
                      <th className="p-4">Title</th>
                      <th className="p-4">Author</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dataLoading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">Loading data threads...</td>
                      </tr>
                    ) : blogsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">No blog records found.</td>
                      </tr>
                    ) : (
                      blogsList.map(blog => (
                        <tr key={blog.id} className="hover:bg-slate-50/60">
                          <td className="p-4 font-serif font-semibold text-midnight font-bold max-w-sm truncate">{blog.title}</td>
                          <td className="p-4 text-slate-600">{blog.name || 'Editorial'}</td>
                          <td className="p-4 text-slate-600 font-mono text-[10px] uppercase">{blog.category}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-mono text-[9px] uppercase font-bold border border-emerald-200">
                              {blog.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {blog.admin_notes && (() => {
                              try {
                                const parsed = JSON.parse(blog.admin_notes);
                                if (parsed && parsed.fileName) {
                                  return (
                                    <button
                                      onClick={() => setViewingDoc(parsed)}
                                      className="p-1.5 bg-turquoise/15 hover:bg-turquoise/25 rounded-lg text-turquoise transition-colors cursor-pointer inline-flex border border-turquoise/20"
                                      title={`View Manuscript: ${parsed.fileName}`}
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                    </button>
                                  );
                                }
                              } catch (e) {}
                              return null;
                            })()}
                            <button
                              onClick={() => openForm('blog', 'edit', blog)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-midnight transition-colors cursor-pointer inline-flex"
                              title="Edit Article"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete('blog', blog.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 transition-colors cursor-pointer inline-flex"
                              title="Delete Article"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'magazines' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-200/60">
              <div>
                <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest block mb-1">PERIODICAL DESK</span>
                <h1 className="text-3xl font-serif font-bold tracking-tight text-midnight">Manage Magazines</h1>
              </div>
              <button
                onClick={() => openForm('magazine', 'create')}
                className="px-4 py-2.5 bg-midnight hover:bg-[#0B2545] rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest text-white cursor-pointer flex items-center gap-1.5 shadow-md shadow-midnight/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD EDITION</span>
              </button>
            </div>

            {/* Magazines table */}
            <div className="bg-white border border-[#EAE5D8] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200/60 bg-slate-50/50">
                <h3 className="text-xs font-mono text-slate-400 font-bold uppercase tracking-widest">Magazine Catalogue ({magazinesList.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/60 text-slate-500 uppercase font-mono text-[9px] tracking-wider">
                      <th className="p-4">Issue</th>
                      <th className="p-4">Title</th>
                      <th className="p-4">Release Date</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dataLoading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">Loading data threads...</td>
                      </tr>
                    ) : magazinesList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">No magazines found in register.</td>
                      </tr>
                    ) : (
                      magazinesList.map(issue => (
                        <tr key={issue.id} className="hover:bg-slate-50/60">
                          <td className="p-4 font-mono font-bold text-[#0B2545]">#{issue.issue_number}</td>
                          <td className="p-4 font-serif font-bold text-midnight font-bold max-w-sm truncate">{issue.issue_name}</td>
                          <td className="p-4 text-slate-600">{issue.release_date}</td>
                          <td className="p-4 text-slate-600 font-mono">₹{issue.single_issue_price}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-[#0B2545]/10 text-[#0B2545] border border-[#0B2545]/20 rounded-full font-mono text-[9px] uppercase font-bold">
                              {issue.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => openForm('magazine', 'edit', issue)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-700 rounded-lg text-slate-600 hover:text-white transition-colors cursor-pointer inline-flex"
                              title="Edit Edition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete('magazine', issue.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 transition-colors cursor-pointer inline-flex"
                              title="Delete Edition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'artists' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-200/60">
              <div>
                <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest block mb-1">ROSTER DESK</span>
                <h1 className="text-3xl font-serif font-bold tracking-tight text-midnight">Manage Artists</h1>
              </div>
              <button
                onClick={() => openForm('artist', 'create')}
                className="px-4 py-2.5 bg-midnight hover:bg-[#0B2545] rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest text-white cursor-pointer flex items-center gap-1.5 shadow-md shadow-midnight/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD ARTIST</span>
              </button>
            </div>

            {/* Artists table */}
            <div className="bg-white border border-[#EAE5D8] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200/60 bg-slate-50/50">
                <h3 className="text-xs font-mono text-slate-400 font-bold uppercase tracking-widest">Featured Artists ({artistsList.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/60 text-slate-500 uppercase font-mono text-[9px] tracking-wider">
                      <th className="p-4">Name</th>
                      <th className="p-4">Style/Genre</th>
                      <th className="p-4">Country</th>
                      <th className="p-4">Born</th>
                      <th className="p-4 font-mono text-right">Order</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dataLoading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">Loading data threads...</td>
                      </tr>
                    ) : artistsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">No artist profiles found.</td>
                      </tr>
                    ) : (
                      artistsList.map(art => (
                        <tr key={art.id} className="hover:bg-slate-50/60">
                          <td className="p-4 font-serif font-bold text-midnight font-bold max-w-sm truncate">{art.name}</td>
                          <td className="p-4 text-slate-600 font-mono text-[10px] uppercase">{art.style || 'Artist'}</td>
                          <td className="p-4 text-slate-600">{art.country || 'Global'}</td>
                          <td className="p-4 text-slate-600 font-mono">{art.born || '1990'}</td>
                          <td className="p-4 text-right font-mono text-[#0B2545] font-bold">{art.display_order}</td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => openForm('artist', 'edit', art)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-midnight transition-colors cursor-pointer inline-flex"
                              title="Edit Artist"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete('artist', art.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 transition-colors cursor-pointer inline-flex"
                              title="Delete Artist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-200/60">
              <div>
                <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest block mb-1">CURATORIAL EVENTS</span>
                <h1 className="text-3xl font-serif font-bold tracking-tight text-midnight">Manage Events</h1>
              </div>
              <button
                onClick={() => openForm('event', 'create')}
                className="px-4 py-2.5 bg-midnight hover:bg-[#0B2545] rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest text-white cursor-pointer flex items-center gap-1.5 shadow-md shadow-midnight/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>CREATE EVENT</span>
              </button>
            </div>

            {/* AUTOMATIC EXPIRATION POPUP & ACTION BANNER FOR PAST EVENTS */}
            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const expiredEvents = eventsList.filter(e => (e.event_date || e.date) && (e.event_date || e.date) < todayStr && e.status !== 'completed');

              if (expiredEvents.length === 0) return null;

              return (
                <div className="p-6 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500 text-white rounded-xl shadow-md">
                        <AlertTriangle className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-serif font-bold text-amber-950">
                          Exhibition Date Ended ({expiredEvents.length} Pending Archive)
                        </h4>
                        <p className="text-xs text-amber-900 font-sans mt-0.5">
                          The date for <span className="font-bold">"{expiredEvents[0].title}"</span> has passed. Upload post-exhibition photos/recap images and archive to Previous Events.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openForm('event', 'edit', expiredEvents[0])}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-md flex items-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Pics & Archive</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Events table */}
            <div className="bg-white border border-[#EAE5D8] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200/60 bg-slate-50/50">
                <h3 className="text-xs font-mono text-slate-400 font-bold uppercase tracking-widest">Exhibitions & Events ({eventsList.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/60 text-slate-500 uppercase font-mono text-[9px] tracking-wider">
                      <th className="p-4">Title</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Venue/Location</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dataLoading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">Loading events...</td>
                      </tr>
                    ) : eventsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">No events recorded in database.</td>
                      </tr>
                    ) : (
                      eventsList.map(ev => (
                        <tr key={ev.id} className="hover:bg-slate-50/60">
                          <td className="p-4 font-serif font-bold text-midnight max-w-sm truncate">{ev.title}</td>
                          <td className="p-4 text-slate-600 font-mono">{ev.event_date || ev.date || 'TBD'}</td>
                          <td className="p-4 text-slate-600 truncate max-w-xs">{ev.location || ev.venue || 'N/A'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase font-bold border ${
                              ev.status === 'completed' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {ev.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => openForm('event', 'edit', ev)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-midnight transition-colors cursor-pointer inline-flex"
                              title="Edit Event"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete('event', ev.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 transition-colors cursor-pointer inline-flex"
                              title="Delete Event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (() => {
          const filteredPayments = paymentsList.filter(pay => {
            // 1. Search Query Filter
            if (paymentSearch.trim() !== '') {
              const q = paymentSearch.toLowerCase();
              const nameMatch = (pay.name || '').toLowerCase().includes(q);
              const emailMatch = (pay.email || '').toLowerCase().includes(q);
              const phoneMatch = (pay.phone || '').toLowerCase().includes(q);
              const orderMatch = (pay.razorpay_order_id || pay.razorpay_payment_id || pay.id || '').toLowerCase().includes(q);
              const addressMatch = (pay.address || pay.shipping_address || '').toLowerCase().includes(q);
              if (!nameMatch && !emailMatch && !phoneMatch && !orderMatch && !addressMatch) return false;
            }

            // 2. Status Filter
            if (paymentStatusFilter !== 'all') {
              const st = (pay.status || '').toLowerCase();
              if (paymentStatusFilter === 'paid' && st !== 'paid' && st !== 'captured' && st !== 'completed') return false;
              if (paymentStatusFilter === 'pending' && (st === 'paid' || st === 'captured' || st === 'completed' || st === 'failed')) return false;
              if (paymentStatusFilter === 'failed' && st !== 'failed') return false;
            }

            // 3. Plan Filter
            if (paymentPlanFilter !== 'all') {
              const planStr = (pay.plan || '').toLowerCase();
              if (paymentPlanFilter === 'single' && !planStr.includes('single') && !planStr.includes('issue')) return false;
              if (paymentPlanFilter === 'digital' && !planStr.includes('digital')) return false;
              if (paymentPlanFilter === 'subscription' && !planStr.includes('year') && !planStr.includes('annual') && !planStr.includes('sub')) return false;
            }

            // 4. Date Range (Days) Filter
            if (paymentDateFilter !== 'all') {
              if (!pay.created_at) return false;
              const payDate = new Date(pay.created_at);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - payDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (paymentDateFilter === 'today' && diffDays > 1) return false;
              if (paymentDateFilter === '7days' && diffDays > 7) return false;
              if (paymentDateFilter === '30days' && diffDays > 30) return false;
              if (paymentDateFilter === '90days' && diffDays > 90) return false;
            }

            return true;
          });

          const totalInr = filteredPayments
            .filter(p => p.currency !== 'USD' && (p.status === 'paid' || p.status === 'captured' || p.status === 'completed'))
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

          const totalUsd = filteredPayments
            .filter(p => p.currency === 'USD' && (p.status === 'paid' || p.status === 'captured' || p.status === 'completed'))
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-slate-200/60 flex-wrap gap-4">
                <div>
                  <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest block mb-1">FINANCIAL LEDGER</span>
                  <h1 className="text-3xl font-serif font-bold tracking-tight text-midnight">Payment Dashboard</h1>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono font-bold text-emerald-800">
                    Filtered Paid INR: ₹{totalInr.toLocaleString()}
                  </div>
                  {totalUsd > 0 && (
                    <div className="px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-mono font-bold text-blue-800">
                      Filtered Paid USD: ${totalUsd.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* FILTER & SEARCH CONTROL BAR */}
              <div className="p-4 bg-white border border-[#EAE5D8] rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-turquoise" />
                    Filter & Search Transactions
                  </span>
                  {(paymentSearch || paymentStatusFilter !== 'all' || paymentDateFilter !== 'all' || paymentPlanFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setPaymentSearch('');
                        setPaymentStatusFilter('all');
                        setPaymentDateFilter('all');
                        setPaymentPlanFilter('all');
                      }}
                      className="text-[10px] font-mono text-turquoise hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset All Filters</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      placeholder="Search name, email, phone, order ID..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none font-mono"
                    />
                  </div>

                  {/* Status Dropdown */}
                  <div>
                    <select
                      value={paymentStatusFilter}
                      onChange={(e) => setPaymentStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none font-mono"
                    >
                      <option value="all">Status: All Statuses</option>
                      <option value="paid">Status: Paid / Captured</option>
                      <option value="pending">Status: Pending / Created</option>
                      <option value="failed">Status: Failed</option>
                    </select>
                  </div>

                  {/* Date Range Dropdown */}
                  <div>
                    <select
                      value={paymentDateFilter}
                      onChange={(e) => setPaymentDateFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none font-mono"
                    >
                      <option value="all">Date: All Time</option>
                      <option value="today">Date: Today</option>
                      <option value="7days">Date: Last 7 Days</option>
                      <option value="30days">Date: Last 30 Days</option>
                      <option value="90days">Date: Last 90 Days</option>
                    </select>
                  </div>

                  {/* Plan Dropdown */}
                  <div>
                    <select
                      value={paymentPlanFilter}
                      onChange={(e) => setPaymentPlanFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none font-mono"
                    >
                      <option value="all">Plan: All Plans</option>
                      <option value="single">Plan: Print Issue</option>
                      <option value="digital">Plan: Digital PDF</option>
                      <option value="subscription">Plan: Membership / Annual</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payments table with full address details */}
              <div className="bg-white border border-[#EAE5D8] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200/60 bg-slate-50/50 flex justify-between items-center flex-wrap gap-2">
                  <h3 className="text-xs font-mono text-slate-400 font-bold uppercase tracking-widest">
                    Transaction Records & Customer Details ({filteredPayments.length} of {paymentsList.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/60 text-slate-500 uppercase font-mono text-[9px] tracking-wider">
                        <th className="p-4">Customer Name</th>
                        <th className="p-4">Contact Info</th>
                        <th className="p-4">Plan / Issue</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Full Address & Shipping Details</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dataLoading ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">Loading payment records...</td>
                        </tr>
                      ) : filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">No matching payment transactions found.</td>
                        </tr>
                      ) : (
                        filteredPayments.map(pay => (
                          <tr key={pay.id} className="hover:bg-slate-50/60">
                            <td className="p-4 font-serif font-bold text-midnight font-bold">{pay.name || 'Anonymous'}</td>
                            <td className="p-4 space-y-0.5">
                              <p className="font-mono text-[11px] text-slate-700">{pay.email}</p>
                              <p className="font-mono text-[10px] text-slate-500">{pay.phone}</p>
                            </td>
                            <td className="p-4 font-mono text-[10px] uppercase text-[#0B2545] font-bold">
                              {pay.plan} {pay.selected_issue ? `(${pay.selected_issue})` : ''}
                            </td>
                            <td className="p-4 font-mono font-bold text-emerald-700">
                              {pay.currency === 'USD' ? `$${pay.amount}` : `₹${pay.amount}`}
                            </td>
                            <td className="p-4 text-slate-700 max-w-sm space-y-1">
                              <p className="font-sans font-semibold text-midnight leading-snug whitespace-pre-wrap">{pay.address || pay.shipping_address || 'No street address provided'}</p>
                              <p className="text-[11px] font-mono text-slate-600 font-medium">
                                {[pay.house_no, pay.city, pay.pincode, pay.country].filter(Boolean).join(', ')}
                              </p>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase font-bold border ${
                                pay.status === 'captured' || pay.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {pay.status}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-[10px] text-slate-500">
                              {pay.created_at ? new Date(pay.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'hero' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-200/60">
              <div>
                <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest block mb-1">INTERACTIVE SHUFFLE DECK</span>
                <h1 className="text-3xl font-serif font-bold tracking-tight text-midnight">Hero Deck Cards</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadLiveInterconnectedDeck}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-midnight text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-200 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-turquoise" />
                  <span>Fetch Live Deck</span>
                </button>
                <button
                  onClick={() => openForm('hero', 'create')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-midnight hover:bg-deepblue text-white text-xs font-sans font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Hero Card</span>
                </button>
              </div>
            </div>

            {heroList.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                <Sparkles className="w-8 h-8 text-turquoise mx-auto" />
                <h3 className="text-base font-serif font-bold text-midnight">No Custom Hero Cards Configured</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  The website is currently serving the dynamic live interconnected deck. Click below to load the live website cards into the panel or create a new custom Hero card!
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={loadLiveInterconnectedDeck}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-midnight text-xs font-mono font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Load Live Website Cards
                  </button>
                  <button
                    onClick={() => openForm('hero', 'create')}
                    className="px-4 py-2 bg-midnight hover:bg-turquoise text-white hover:text-midnight text-xs font-mono font-bold rounded-xl transition-all cursor-pointer"
                  >
                    + Add New Card
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {heroList.map((card, idx) => (
                <div key={card.id || idx} className="bg-white border border-[#EAE5D8] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="flex gap-4">
                    <div className="w-24 h-32 rounded-xl overflow-hidden bg-slate-900 shrink-0 relative border border-slate-200">
                      {card.media_type === 'video' ? (
                        <video src={card.media_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={card.media_url} alt={card.title} className="w-full h-full object-cover" />
                      )}
                      <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/70 text-[8px] font-mono text-turquoise rounded font-bold uppercase">
                        {card.media_type}
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <span className="text-[9px] font-mono tracking-widest text-turquoise font-bold uppercase block truncate">
                        {card.badge || 'FEATURED'}
                      </span>
                      <h3 className="text-base font-serif font-bold text-midnight line-clamp-2 leading-snug">
                        {card.title}
                      </h3>
                      {card.subtitle && (
                        <p className="text-xs text-slate-500 line-clamp-2 font-sans">
                          {card.subtitle}
                        </p>
                      )}
                      <p className="text-[10px] font-mono text-slate-400">
                        Links to: <span className="text-midnight font-bold uppercase">{card.link_page}</span> ({card.link_text || 'Explore'})
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openForm('hero', 'edit', card)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-midnight text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete('hero', card.id)}
                      className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

      </main>

      {/* Form Dialog Modal Overlay */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFormModal(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Form Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white border border-[#EAE5D8] rounded-3xl overflow-hidden shadow-2xl z-10 text-midnight max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="px-8 py-5 border-b border-slate-200/60 flex justify-between items-center bg-slate-900">
                <div>
                  <span className="text-[9px] font-mono text-turquoise uppercase tracking-widest block">{formMode} Registry</span>
                  <h3 className="text-xl font-serif font-bold text-white capitalize">{formType} Entry</h3>
                </div>
                {formType === 'blog' && (
                  <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setBlogFormTab('edit')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        blogFormTab === 'edit' ? 'bg-turquoise text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ✍️ Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlogFormTab('preview')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        blogFormTab === 'preview' ? 'bg-turquoise text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      👁️ Live Preview
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowFormModal(false)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable form body */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-8 space-y-5 no-scrollbar">
                
                {formType === 'blog' && blogFormTab === 'preview' && (
                  <div className="space-y-6 bg-slate-50/70 p-6 rounded-2xl border border-slate-200">
                    <div className="space-y-3 text-center border-b border-slate-200 pb-6">
                      <span className="inline-block px-3 py-1 bg-turquoise/10 text-turquoise text-[10px] font-mono font-bold uppercase tracking-widest rounded-full">
                        {blogCategory || 'EDITORIAL / ESSAY'}
                      </span>
                      <h1 className="text-2xl md:text-3xl font-serif font-bold text-midnight leading-tight">
                        {blogTitle || 'Untitled Blog Post'}
                      </h1>
                      {blogExcerpt && (
                        <p className="text-xs md:text-sm font-serif italic text-slate-600 max-w-xl mx-auto">
                          {blogExcerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-center gap-3 text-[10px] font-mono text-slate-500 pt-2">
                        <span>By {blogAuthor || 'Editorial Board'}</span>
                        <span>•</span>
                        <span>{Math.max(1, Math.ceil((blogContent ? blogContent.split(/\s+/).length : 0) / 200))} min read</span>
                        <span>•</span>
                        <span className="text-turquoise font-bold uppercase">Live Preview</span>
                      </div>
                    </div>

                    {blogImage && (
                      <div className="rounded-2xl overflow-hidden shadow-md max-h-[320px]">
                        <img
                          src={convertDriveUrl(blogImage)}
                          alt="Cover Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="prose max-w-none text-midnight space-y-4 pt-2">
                      {renderBlogPreviewContent(blogContent)}
                    </div>
                  </div>
                )}

                {formType === 'blog' && blogFormTab === 'edit' && (
                  <div className="space-y-4">

                    {/* TOP PROMINENT DOCUMENT IMPORT ZONE */}
                    <div className="p-4 border-2 border-dashed border-turquoise/40 rounded-2xl bg-turquoise/5 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono text-turquoise uppercase tracking-widest font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-turquoise" />
                          <span>Auto-Fill from Word Manuscript (.docx, .doc, .txt, .pdf)</span>
                        </label>
                        {blogDocument && (
                          <button
                            type="button"
                            onClick={() => setBlogDocument(null)}
                            className="text-[9px] font-mono text-red-500 hover:underline uppercase cursor-pointer"
                          >
                            Remove File
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".txt,.pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="blog-manuscript-file-top"
                        />
                        <label
                          htmlFor="blog-manuscript-file-top"
                          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-turquoise rounded-xl text-xs text-midnight cursor-pointer transition-all shadow-sm font-semibold"
                        >
                          <UploadCloud className="w-4 h-4 text-turquoise" />
                          <span>
                            {blogDocument ? `Loaded: ${blogDocument.fileName}` : '📄 Upload / Drag & Drop Word Document (.docx, .doc, .txt) to Auto-Extract'}
                          </span>
                        </label>
                      </div>
                      {blogDocument && (
                        <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Manuscript file loaded & content extracted!</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Title</label>
                      <input
                        type="text"
                        value={blogTitle}
                        onChange={(e) => setBlogTitle(e.target.value)}
                        placeholder="In Conversation with..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Author</label>
                        <input
                          type="text"
                          value={blogAuthor}
                          onChange={(e) => setBlogAuthor(e.target.value)}
                          placeholder="Elena Thorne"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Category</label>
                        <input
                          type="text"
                          value={blogCategory}
                          onChange={(e) => setBlogCategory(e.target.value)}
                          placeholder="Exhibition / Contemporary"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                    </div>

                    <DragDropFileZone
                      label="Blog Cover Image (Drag & Drop or Select File)"
                      accept="image/*"
                      value={blogImage}
                      onChange={(url) => setBlogImage(url)}
                      placeholder="Upload cover image or paste direct URL..."
                      type="image"
                    />

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Short Excerpt</label>
                      <input
                        type="text"
                        value={blogExcerpt}
                        onChange={(e) => setBlogExcerpt(e.target.value)}
                        placeholder="A short hook sentence to display in grid summaries..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">
                          Article Document Content (Write naturally like a Document / Word file)
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setBlogContent(prev => prev + (prev ? '\n\n## ' : '## ') + 'New Section Heading')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            + Heading
                          </button>
                          <button
                            type="button"
                            onClick={() => setBlogContent(prev => prev + (prev ? '\n\n> ' : '> ') + 'A memorable pull-quote from the essay...')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            + Quote
                          </button>
                          <label
                            htmlFor="inline-blog-img-input"
                            className="px-2.5 py-1 bg-turquoise/10 hover:bg-turquoise/20 text-turquoise text-[10px] font-mono font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Images className="w-3 h-3" />
                            <span>+ Upload & Insert Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleInlineImageUpload}
                              className="hidden"
                              id="inline-blog-img-input"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const imgUrl = prompt('Enter or paste Image URL (or Google Drive link):');
                              if (imgUrl) {
                                const directUrl = convertDriveUrl(imgUrl);
                                setBlogContent(prev => prev + (prev ? '\n\n' : '') + directUrl + '\n\n');
                              }
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-mono font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            + URL Link
                          </button>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono block">
                        Write paragraphs naturally with linebreaks. No HTML needed! Use <code className="bg-slate-100 px-1 rounded">## Heading</code> for titles and <code className="bg-slate-100 px-1 rounded">&gt; Quote</code> for pull-quotes.
                      </span>
                      <textarea
                        rows={10}
                        value={blogContent}
                        onChange={(e) => setBlogContent(e.target.value)}
                        placeholder="Type or paste your article content here naturally like in Google Docs...&#10;&#10;Separate paragraphs with double line breaks. Insert image links on their own line."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none resize-none font-sans leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {formType === 'magazine' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Issue #</label>
                        <input
                          type="number"
                          value={magIssueNumber}
                          onChange={(e) => setMagIssueNumber(e.target.value)}
                          placeholder="43"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Release Date</label>
                        <input
                          type="date"
                          value={magReleaseDate}
                          onChange={(e) => setMagReleaseDate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Status</label>
                        <select
                          value={magStatus}
                          onChange={(e) => setMagStatus(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        >
                          <option value="published">Published</option>
                          <option value="coming_soon">Coming Soon</option>
                          <option value="sold">Sold Out</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Issue Title/Name</label>
                      <input
                        type="text"
                        value={magIssueName}
                        onChange={(e) => setMagIssueName(e.target.value)}
                        placeholder="The Digital Renaissance"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                      />
                    </div>

                    {/* PHYSICAL COPY PRICES (INR & USD) */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest font-bold block">
                        1. Physical Print Copy Prices
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">India Domestic Price (₹ INR)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={magPrice}
                            onChange={(e) => setMagPrice(e.target.value)}
                            placeholder="499.00"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">International Price ($ USD)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={magPriceUsd}
                            onChange={(e) => setMagPriceUsd(e.target.value)}
                            placeholder="15.00"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ONLINE PRINT / DIGITAL PDF PRICES (INR & USD) */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest font-bold block">
                        2. Online Print / Digital Edition Prices
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Online Print Price (₹ INR)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={magDigitalPrice}
                            onChange={(e) => setMagDigitalPrice(e.target.value)}
                            placeholder="299.00"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Online Print Price ($ USD)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={magDigitalPriceUsd}
                            onChange={(e) => setMagDigitalPriceUsd(e.target.value)}
                            placeholder="10.00"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SHIPPING FEES (INR & USD) */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest font-bold block">
                        3. Shipping Fees (Domestic & International)
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">India Domestic Shipping (₹ INR)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={magShippingInr}
                            onChange={(e) => setMagShippingInr(e.target.value)}
                            placeholder="150.00"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">International Shipping ($ USD)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={magShippingUsd}
                            onChange={(e) => setMagShippingUsd(e.target.value)}
                            placeholder="15.00"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* DRAG & DROP COVER IMAGE ZONE */}
                    <DragDropFileZone
                      label="Cover Image (Drag & Drop or Select File)"
                      accept="image/*"
                      value={magCoverUrl}
                      onChange={(url) => setMagCoverUrl(url)}
                      placeholder="https://images.unsplash.com/photo-..."
                      type="image"
                    />

                    {/* DRAG & DROP ONLINE PRINT PDF FILE ZONE */}
                    <DragDropFileZone
                      label="Full Digital Magazine PDF File"
                      accept="application/pdf"
                      value={magPdfUrl}
                      onChange={(url) => setMagPdfUrl(url)}
                      onFileSelect={handlePdfUpload}
                      placeholder="Upload magazine PDF or paste direct URL..."
                      type="pdf"
                    />

                    {/* 5 INDIVIDUAL DIGITAL READER PREVIEW PAGE UPLOADS */}
                    <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
                      <div>
                        <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest font-bold block mb-1">
                          Digital Reader Pages (5 Pages Preview)
                        </span>
                        <p className="text-[11px] text-slate-500 font-sans">
                          Upload 5 individual page images to build the interactive flipbook reader.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <DragDropFileZone
                          label="Preview Page 1 (Cover / Spread 1 Left)"
                          accept="image/*"
                          value={magPreviewPage1}
                          onChange={(url) => setMagPreviewPage1(url)}
                          placeholder="Page 1 image URL..."
                          type="image"
                        />

                        <DragDropFileZone
                          label="Preview Page 2 (Spread 1 Right)"
                          accept="image/*"
                          value={magPreviewPage2}
                          onChange={(url) => setMagPreviewPage2(url)}
                          placeholder="Page 2 image URL..."
                          type="image"
                        />

                        <DragDropFileZone
                          label="Preview Page 3 (Spread 2 Left)"
                          accept="image/*"
                          value={magPreviewPage3}
                          onChange={(url) => setMagPreviewPage3(url)}
                          placeholder="Page 3 image URL..."
                          type="image"
                        />

                        <DragDropFileZone
                          label="Preview Page 4 (Spread 2 Right)"
                          accept="image/*"
                          value={magPreviewPage4}
                          onChange={(url) => setMagPreviewPage4(url)}
                          placeholder="Page 4 image URL..."
                          type="image"
                        />

                        <DragDropFileZone
                          label="Preview Page 5 (Spread 3 Left)"
                          accept="image/*"
                          value={magPreviewPage5}
                          onChange={(url) => setMagPreviewPage5(url)}
                          placeholder="Page 5 image URL..."
                          type="image"
                        />

                        <DragDropFileZone
                          label="Preview Page 6 (Back Cover / Spread 3 Right)"
                          accept="image/*"
                          value={magPreviewPage6}
                          onChange={(url) => setMagPreviewPage6(url)}
                          placeholder="Page 6 image URL..."
                          type="image"
                        />
                      </div>
                    </div>

                    {/* EDITOR / CURATOR & ORGANISER PROFILE PICTURE SECTION */}
                    <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
                      <div>
                        <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest font-bold block mb-1">
                          Editor-in-Chief & Curator / Organiser Profile
                        </span>
                        <p className="text-[11px] text-slate-500 font-sans">
                          Update the editor note, curator name, and portrait picture.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Editor / Organiser Name</label>
                          <input
                            type="text"
                            value={magEditorName}
                            onChange={(e) => setMagEditorName(e.target.value)}
                            placeholder="Siddharth Karmakar"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Editor's Note / Statement</label>
                          <input
                            type="text"
                            value={magEditorNote}
                            onChange={(e) => setMagEditorNote(e.target.value)}
                            placeholder="A word from the curator..."
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                          />
                        </div>
                      </div>

                      {/* DRAG & DROP EDITOR / ORGANISER PORTRAIT IMAGE */}
                      <DragDropFileZone
                        label="Editor / Organiser Portrait Photo (Drag & Drop or Select File)"
                        accept="image/*"
                        value={magEditorImageUrl}
                        onChange={(url) => setMagEditorImageUrl(url)}
                        placeholder="Upload editor portrait photo or paste URL..."
                        type="image"
                      />
                    </div>
                  </div>
                )}

                {formType === 'artist' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Artist Name</label>
                        <input
                          type="text"
                          value={artName}
                          onChange={(e) => setArtName(e.target.value)}
                          placeholder="Möldir Qarubaiqyzy"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Discipline/Style</label>
                        <select
                          value={artStyle}
                          onChange={(e) => setArtStyle(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        >
                          <option value="Artist">Artist</option>
                          <option value="Collector">Collector</option>
                          <option value="Advisor">Advisor</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Country</label>
                        <input
                          type="text"
                          value={artCountry}
                          onChange={(e) => setArtCountry(e.target.value)}
                          placeholder="Kazakhstan / New Delhi, India"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Year Born</label>
                        <input
                          type="text"
                          value={artBorn}
                          onChange={(e) => setArtBorn(e.target.value)}
                          placeholder="1993"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Display Order</label>
                        <input
                          type="number"
                          value={artDisplayOrder}
                          onChange={(e) => setArtDisplayOrder(e.target.value)}
                          placeholder="0"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                    </div>

                    <DragDropFileZone
                      label="Artist Portrait Image (Drag & Drop or Select File)"
                      accept="image/*"
                      value={artImageUrl}
                      onChange={(url) => setArtImageUrl(url)}
                      placeholder="Upload artist portrait image or paste direct URL / Google Drive link..."
                      type="image"
                    />

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Medium Details</label>
                      <input
                        type="text"
                        value={artMedium}
                        onChange={(e) => setArtMedium(e.target.value)}
                        placeholder="Acrylic & Aggregate formulation on linen"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Artist Statement</label>
                      <input
                        type="text"
                        value={artStatement}
                        onChange={(e) => setArtStatement(e.target.value)}
                        placeholder="Paint is a living coordinate..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Bio Narrative</label>
                      <textarea
                        rows={4}
                        value={artShortBio}
                        onChange={(e) => setArtShortBio(e.target.value)}
                        placeholder="Full bio narrative of the artist..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none resize-none"
                      />
                    </div>
                  </div>
                )}

                {formType === 'event' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Event Title</label>
                      <input
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="Freedom - Season 3"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Subtitle / Tagline</label>
                        <input
                          type="text"
                          value={eventSubtitle}
                          onChange={(e) => setEventSubtitle(e.target.value)}
                          placeholder="International Art Exhibition & Award Event"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Status</label>
                        <select
                          value={eventStatus}
                          onChange={(e) => setEventStatus(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        >
                          <option value="Upcoming">Upcoming</option>
                          <option value="Current">Current</option>
                          <option value="Completed">Completed</option>
                          <option value="Past">Past</option>
                          <option value="Draft">Draft</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Event Date</label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Event Time</label>
                        <input
                          type="text"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          placeholder="12:00 PM - 7:00 PM"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Venue / Location</label>
                      <input
                        type="text"
                        value={eventVenue}
                        onChange={(e) => setEventVenue(e.target.value)}
                        placeholder="Nehru Centre AC Art Gallery, Worli, Mumbai"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                      />
                    </div>

                    {/* DRAG & DROP EVENT FEATURED IMAGE ZONE */}
                    <DragDropFileZone
                      label="Event Banner / Poster Image (Drag & Drop or Select File)"
                      accept="image/*"
                      value={eventImage}
                      onChange={(url) => setEventImage(url)}
                      placeholder="Upload poster image or paste direct URL..."
                      type="image"
                    />

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Detailed Overview & Description</label>
                      <textarea
                        rows={6}
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        placeholder="Full exhibition narrative and rules..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none resize-none font-sans"
                      />
                    </div>
                  </div>
                )}

                {formType === 'hero' && (
                  <div className="space-y-4">
                    {/* QUICK SELECT FROM EXISTING CONTENT */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <label className="text-[10px] font-mono text-turquoise uppercase tracking-widest font-bold block">
                        ⚡ Quick Autofill from Published Content (Blogs / Magazines / Events)
                      </label>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const [type, id] = val.split(':');
                          if (type === 'blog') {
                            const item = blogsList.find(b => b.id === id);
                            if (item) {
                              const matchImg = (item.content || '').match(/<img[^>]+src=["']([^"']+)["']/i);
                              const extractedImg = matchImg ? matchImg[1] : '';
                              setHeroBadge(`ESSAY // ${item.category || 'CONTEMPORARY'}`);
                              setHeroTitle(item.title || '');
                              setHeroSubtitle(item.short_description || '');
                              setHeroMediaUrl(item.image_url || extractedImg || '');
                              setHeroMediaType('image');
                              setHeroLinkPage('blogs');
                              setHeroLinkText('Read Full Essay');
                            }
                          } else if (type === 'magazine') {
                            const item = magazinesList.find(m => m.id === id);
                            if (item) {
                              setHeroBadge(`LATEST PRINT // ISSUE NO. ${item.issue_number || 42}`);
                              setHeroTitle(item.issue_name || '');
                              setHeroSubtitle(item.tagline || item.short_summary || '');
                              setHeroMediaUrl(item.cover_image_url || '');
                              setHeroMediaType('image');
                              setHeroLinkPage('magazine');
                              setHeroLinkText('Explore Magazine');
                            }
                          } else if (type === 'event') {
                            const item = eventsList.find(ev => ev.id === id);
                            if (item) {
                              setHeroBadge(`EXHIBITION // ${item.status?.toUpperCase() || 'FEATURED'}`);
                              setHeroTitle(item.title || '');
                              setHeroSubtitle(item.short_description || item.subtitle || '');
                              setHeroMediaUrl(item.featured_image_url || item.image || '');
                              setHeroMediaType('image');
                              setHeroLinkPage('events');
                              setHeroLinkText('View Exhibition');
                            }
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight font-medium outline-none"
                      >
                        <option value="">-- Choose content to feature on Hero Card --</option>
                        <optgroup label="📰 Journal & Essays (Blogs)">
                          {blogsList.map(b => (
                            <option key={b.id} value={`blog:${b.id}`}>Blog: {b.title}</option>
                          ))}
                        </optgroup>
                        <optgroup label="📖 Magazine Editions">
                          {magazinesList.map(m => (
                            <option key={m.id} value={`magazine:${m.id}`}>Magazine: Issue #{m.issue_number} - {m.issue_name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="🏛️ Events & Exhibitions">
                          {eventsList.map(ev => (
                            <option key={ev.id} value={`event:${ev.id}`}>Event: {ev.title}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Badge Tag</label>
                        <input
                          type="text"
                          value={heroBadge}
                          onChange={(e) => setHeroBadge(e.target.value)}
                          placeholder="FEATURED ESSAY // CONTEMPORARY"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Media Type</label>
                        <select
                          value={heroMediaType}
                          onChange={(e) => setHeroMediaType(e.target.value as 'image' | 'video')}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        >
                          <option value="image">Image (JPG / PNG / WebP)</option>
                          <option value="video">Video (MP4 / WebM / Video Clip)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Title</label>
                      <input
                        type="text"
                        required
                        value={heroTitle}
                        onChange={(e) => setHeroTitle(e.target.value)}
                        placeholder="In Conversation with..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Subtitle / Description</label>
                      <textarea
                        rows={3}
                        value={heroSubtitle}
                        onChange={(e) => setHeroSubtitle(e.target.value)}
                        placeholder="Short summary overlay on hero card..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none resize-none font-sans"
                      />
                    </div>

                    <DragDropFileZone
                      label={heroMediaType === 'video' ? "Upload Video File or Paste Video URL" : "Upload Image File or Paste Image URL"}
                      accept={heroMediaType === 'video' ? "video/*,.mp4,.webm,.mov,.avi,.mkv" : "image/*"}
                      value={heroMediaUrl}
                      onChange={(url) => setHeroMediaUrl(url)}
                      placeholder={heroMediaType === 'video' ? "https://cdn.example.com/art-clip.mp4" : "https://images.unsplash.com/photo-..."}
                      type={heroMediaType}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Target Page Link</label>
                        <select
                          value={heroLinkPage}
                          onChange={(e) => setHeroLinkPage(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        >
                          <option value="blogs">Journal / Blogs</option>
                          <option value="events">Events & Exhibitions</option>
                          <option value="magazine">Magazine Print Issues</option>
                          <option value="artists">Featured Artists</option>
                          <option value="about">About The Art Ledger</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Button Text</label>
                        <input
                          type="text"
                          value={heroLinkText}
                          onChange={(e) => setHeroLinkText(e.target.value)}
                          placeholder="Read Essay"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 bg-white sticky bottom-0">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-700 rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest text-slate-600 hover:text-white cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-midnight hover:bg-[#0B2545] rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest text-white cursor-pointer flex items-center gap-1.5 shadow-md shadow-midnight/15 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{loading ? 'SAVING...' : 'SAVE RECORD'}</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Copy link Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-midnight text-white px-5 py-3.5 rounded-xl shadow-xl border border-white/10 text-xs font-mono font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{successToast.toUpperCase()}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Document Viewer Modal Overlay */}
      <AnimatePresence>
        {viewingDoc && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingDoc(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Document Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-white border border-[#EAE5D8] rounded-3xl overflow-hidden shadow-2xl z-10 text-midnight max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="px-8 py-5 border-b border-slate-200/60 flex justify-between items-center bg-midnight text-white">
                <div>
                  <span className="text-[9px] font-mono text-turquoise uppercase tracking-widest block">EDITORIAL MANUSCRIPT</span>
                  <h3 className="text-lg font-serif font-bold truncate max-w-lg">{viewingDoc.fileName}</h3>
                </div>
                <div className="flex items-center gap-3">
                  {/* Download Button */}
                  <a
                    href={viewingDoc.fileData}
                    download={viewingDoc.fileName}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all flex items-center gap-1.5 text-xs font-sans font-semibold tracking-wider uppercase cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="p-1.5 bg-white/15 hover:bg-white/25 rounded-full text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Document Preview Body */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                {viewingDoc.fileType === 'application/pdf' ? (
                  <div className="w-full h-[60vh] border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    <iframe
                      src={viewingDoc.fileData}
                      title="PDF Manuscript Preview"
                      className="w-full h-full"
                    />
                  </div>
                ) : viewingDoc.fileType === 'text/plain' ? (
                  <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-inner max-h-[60vh] overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-mono text-xs text-slate-800 leading-relaxed">
                      {viewingDoc.textPreview}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl space-y-4">
                    <FileText className="w-16 h-16 text-slate-400 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="font-serif font-semibold text-slate-800 font-bold">Preview Unavailable</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        This document type ({viewingDoc.fileType || 'Word Document'}) cannot be rendered inline. Please download the file to view its full contents.
                      </p>
                    </div>
                    <a
                      href={viewingDoc.fileData}
                      download={viewingDoc.fileName}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-midnight hover:bg-[#0B2545] text-white text-xs font-sans font-bold uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Document</span>
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
