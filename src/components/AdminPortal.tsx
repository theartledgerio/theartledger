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
  CheckCircle2, AlertTriangle, ArrowLeft, Sparkles, FileText, Download, UploadCloud
} from 'lucide-react';
import { Blog, Artist, Magazine } from '../types';
import Logo from './Logo';

interface AdminPortalProps {
  onChangePage?: (pageId: string) => void;
  portalRole: 'admin' | 'editor';
}

type TabType = 'dashboard' | 'blogs' | 'magazines' | 'artists';

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
  const [dataLoading, setDataLoading] = useState(false);

  // CRUD Form Overlay states
  const [showFormModal, setShowFormModal] = useState(false);
  const [formType, setFormType] = useState<'blog' | 'magazine' | 'artist'>('blog');
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
  const [magPreviewPages, setMagPreviewPages] = useState(''); // Comma separated URLs
  const [magStatus, setMagStatus] = useState('published');
  const [magEditorNote, setMagEditorNote] = useState('');
  const [magEditorName, setMagEditorName] = useState('');
  const [magEditorImageUrl, setMagEditorImageUrl] = useState('');

  // 3. Artist
  const [artName, setArtName] = useState('');
  const [artShortBio, setArtShortBio] = useState('');
  const [artImageUrl, setArtImageUrl] = useState('');
  const [artStyle, setArtStyle] = useState('Painting');
  const [artCountry, setArtCountry] = useState('');
  const [artBorn, setArtBorn] = useState('');
  const [artMedium, setArtMedium] = useState('');
  const [artWorkTitle, setArtWorkTitle] = useState('');
  const [artWorkUrl, setArtWorkUrl] = useState('');
  const [artStatement, setArtStatement] = useState('');
  const [artDisplayOrder, setArtDisplayOrder] = useState('0');

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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/forgot-password`, {
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
  const openForm = (type: 'blog' | 'magazine' | 'artist', mode: 'create' | 'edit', item?: any) => {
    setFormType(type);
    setFormMode(mode);
    setEditingId(item ? item.id : null);

    if (type === 'blog') {
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
      setMagPreviewPages(item && item.preview_pages ? item.preview_pages.join(', ') : '');
      setMagStatus(item ? item.status : 'published');
      setMagEditorNote(item ? item.editor_note || '' : '');
      setMagEditorName(item ? item.editor_name || '' : '');
      setMagEditorImageUrl(item ? item.editor_image_url || '' : '');
    } else if (type === 'artist') {
      setArtName(item ? item.name : '');
      setArtShortBio(item ? item.short_bio || '' : '');
      setArtImageUrl(item ? item.image_url || '' : '');
      setArtStyle(item ? item.style || 'Painting' : 'Painting');
      setArtCountry(item ? item.country || '' : '');
      setArtBorn(item ? item.born || '' : '');
      setArtMedium(item ? item.medium || '' : '');
      setArtWorkTitle(item ? item.featured_work_title || '' : '');
      setArtWorkUrl(item ? item.featured_work_url || '' : '');
      setArtStatement(item ? item.statement || '' : '');
      setArtDisplayOrder(item ? item.display_order.toString() : '0');
    }

    setShowFormModal(true);
  };

  // File Upload Handler for Blog Manuscripts
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    if (file.type === 'text/plain') {
      reader.onload = (event) => {
        setBlogDocument({
          fileName: file.name,
          fileType: file.type,
          fileData: event.target?.result as string,
          textPreview: event.target?.result as string
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        setBlogDocument({
          fileName: file.name,
          fileType: file.type,
          fileData: event.target?.result as string,
          textPreview: file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')
            ? 'Word Document Manuscript Loaded. Ready for editorial review.'
            : file.type === 'application/pdf'
            ? 'PDF Document Loaded. Preview available.'
            : 'Document Loaded.'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      triggerToast('Uploading PDF...');
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('magazine_pdfs')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('magazine_pdfs').getPublicUrl(filePath);
      setMagPdfUrl(data.publicUrl);
      triggerToast('PDF uploaded successfully!');
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
        const payload = {
          title: blogTitle,
          short_description: blogExcerpt,
          content: blogContent,
          image_url: blogImage,
          name: blogAuthor,
          category: blogCategory,
          status: blogStatus,
          published_at: new Date().toISOString(),
          admin_notes: blogDocument ? JSON.stringify(blogDocument) : null
        };

        if (formMode === 'create') {
          const { error } = await supabase.from('blog_submissions').insert([payload]);
          if (error) throw error;
          triggerToast('Blog post created successfully!');
        } else {
          const { error } = await supabase.from('blog_submissions').update(payload).eq('id', editingId);
          if (error) throw error;
          triggerToast('Blog post updated successfully!');
        }
      } else if (formType === 'magazine') {
        const payload = {
          issue_number: parseInt(magIssueNumber),
          issue_name: magIssueName,
          slug: magSlug || magIssueName.toLowerCase().replace(/ /g, '-'),
          release_date: magReleaseDate || new Date().toISOString().split('T')[0],
          single_issue_price: parseFloat(magPrice) || 0.0,
          single_issue_price_usd: parseFloat(magPriceUsd) || 0.0,
          digital_pdf_price: parseFloat(magDigitalPrice) || 299.0,
          digital_pdf_price_usd: parseFloat(magDigitalPriceUsd) || 10.0,
          shipping_inr: parseFloat(magShippingInr) || 150.0,
          shipping_usd: parseFloat(magShippingUsd) || 15.0,
          pdf_url: magPdfUrl,
          cover_image_url: magCoverUrl,
          status: magStatus
        };

        if (formMode === 'create') {
          const { error } = await supabase.from('magazines').insert([payload]);
          if (error) throw error;
          triggerToast('Magazine edition added successfully!');
        } else {
          const { error } = await supabase.from('magazines').update(payload).eq('id', editingId);
          if (error) throw error;
          triggerToast('Magazine edition updated successfully!');
        }
      } else if (formType === 'artist') {
        const payload = {
          name: artName,
          short_bio: artShortBio,
          image_url: artImageUrl,
          style: artStyle,
          country: artCountry,
          born: artBorn,
          medium: artMedium,
          featured_work_title: artWorkTitle,
          featured_work_url: artWorkUrl || artImageUrl,
          statement: artStatement,
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
  const handleDelete = async (type: 'blog' | 'magazine' | 'artist', id: string) => {
    if (!window.confirm('Are you absolutely certain you want to permanently delete this registry entry?')) return;
    try {
      let table = '';
      if (type === 'blog') table = 'blog_submissions';
      else if (type === 'magazine') table = 'magazines';
      else if (type === 'artist') table = 'featured_profiles';

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

            <button
              onClick={() => setActiveTab('magazines')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'magazines' ? 'bg-midnight text-white shadow-md shadow-midnight/15' : 'text-slate-600 hover:bg-[#EAE5D8]/50 hover:text-midnight'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Magazines</span>
            </button>

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
                          <td className="p-4 text-slate-600 font-mono text-[10px] uppercase">{art.style || 'Painting'}</td>
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
                  <h3 className="text-xl font-serif font-bold text-midnight capitalize">{formType} Entry</h3>
                </div>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-midnight"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable form body */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-8 space-y-5 no-scrollbar">
                
                {formType === 'blog' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Title</label>
                      <input
                        type="text"
                        required
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
                          required
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
                          required
                          value={blogCategory}
                          onChange={(e) => setBlogCategory(e.target.value)}
                          placeholder="Exhibition / Contemporary"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Cover Image URL</label>
                      <div className="flex gap-4 items-center">
                        <input
                          type="text"
                          required
                          value={blogImage}
                          onChange={(e) => setBlogImage(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="flex-grow px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                        {blogImage && blogImage.startsWith('http') && (
                          <img src={blogImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0 bg-slate-100" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Short Excerpt</label>
                      <input
                        type="text"
                        required
                        value={blogExcerpt}
                        onChange={(e) => setBlogExcerpt(e.target.value)}
                        placeholder="A short hook sentence to display in grid summaries..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Content HTML</label>
                      <span className="text-[9px] text-slate-500 font-mono block mb-1">HTML tags like &lt;p&gt;, &lt;h2&gt;, &lt;blockquote&gt; will be formatted.</span>
                      <textarea
                        required
                        rows={10}
                        value={blogContent}
                        onChange={(e) => setBlogContent(e.target.value)}
                        placeholder="<p>Write raw HTML content...</p>"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none resize-none font-mono"
                      />
                    </div>

                    {/* Editorial Document Upload */}
                    <div className="p-5 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono text-slate-700 font-bold uppercase tracking-wider block">
                          Editorial Manuscript / Attachment
                        </label>
                        {blogDocument && (
                          <button
                            type="button"
                            onClick={() => setBlogDocument(null)}
                            className="text-[9px] font-mono text-red-500 hover:underline uppercase"
                          >
                            Remove File
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative flex-grow">
                          <input
                            type="file"
                            accept=".txt,.pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="blog-manuscript-file"
                          />
                          <label
                            htmlFor="blog-manuscript-file"
                            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-turquoise rounded-xl text-xs text-slate-600 hover:text-midnight cursor-pointer transition-all shadow-sm"
                          >
                            <UploadCloud className="w-4 h-4 text-slate-400" />
                            <span>
                              {blogDocument ? blogDocument.fileName : 'Upload Document (.docx, .doc, .pdf, .txt)'}
                            </span>
                          </label>
                        </div>
                      </div>
                      {blogDocument && (
                        <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Manuscript file loaded successfully ({blogDocument.fileType || 'Unknown Type'})</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {formType === 'magazine' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Issue #</label>
                        <input
                          type="number"
                          required
                          value={magIssueNumber}
                          onChange={(e) => setMagIssueNumber(e.target.value)}
                          placeholder="43"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={magPrice}
                          onChange={(e) => setMagPrice(e.target.value)}
                          placeholder="499.00"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Release Date</label>
                        <input
                          type="date"
                          required
                          value={magReleaseDate}
                          onChange={(e) => setMagReleaseDate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Issue Title/Name</label>
                      <input
                        type="text"
                        required
                        value={magIssueName}
                        onChange={(e) => setMagIssueName(e.target.value)}
                        placeholder="The Digital Renaissance"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Slug</label>
                        <input
                          type="text"
                          value={magSlug}
                          onChange={(e) => setMagSlug(e.target.value)}
                          placeholder="digital-renaissance"
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
                          <option value="draft">Draft</option>
                          <option value="coming_soon">Coming Soon</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Cover Image URL</label>
                      <div className="flex gap-4 items-center">
                        <input
                          type="text"
                          required
                          value={magCoverUrl}
                          onChange={(e) => setMagCoverUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="flex-grow px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                        {magCoverUrl && magCoverUrl.startsWith('http') && (
                          <img src={magCoverUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0 bg-slate-100" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Digital PDF File</label>
                      <div className="flex gap-4 items-center">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handlePdfUpload}
                          className="flex-grow px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                        {magPdfUrl && (
                          <a href={magPdfUrl} target="_blank" rel="noreferrer" className="text-xs font-mono text-turquoise underline">Preview PDF</a>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono">Upload the PDF to Supabase Storage</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Digital PDF Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={magDigitalPrice}
                        onChange={(e) => setMagDigitalPrice(e.target.value)}
                        placeholder="299.00"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
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
                          required
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
                          <option value="Painting">Painting</option>
                          <option value="Sculpture">Sculpture</option>
                          <option value="Photography">Photography</option>
                          <option value="Digital">Digital</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Country</label>
                        <input
                          type="text"
                          required
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
                          required
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
                          required
                          value={artDisplayOrder}
                          onChange={(e) => setArtDisplayOrder(e.target.value)}
                          placeholder="0"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Portrait Image URL</label>
                      <div className="flex gap-4 items-center">
                        <input
                          type="text"
                          required
                          value={artImageUrl}
                          onChange={(e) => setArtImageUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="flex-grow px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                        {artImageUrl && artImageUrl.startsWith('http') && (
                          <img src={artImageUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0 bg-slate-100" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Medium Details</label>
                      <input
                        type="text"
                        required
                        value={artMedium}
                        onChange={(e) => setArtMedium(e.target.value)}
                        placeholder="Acrylic & Aggregate formulation on linen"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Featured Work Title</label>
                        <input
                          type="text"
                          required
                          value={artWorkTitle}
                          onChange={(e) => setArtWorkTitle(e.target.value)}
                          placeholder="Ethereal Shifting"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Featured Work Image URL</label>
                        <input
                          type="text"
                          value={artWorkUrl}
                          onChange={(e) => setArtWorkUrl(e.target.value)}
                          placeholder="Leave blank to use Portrait Image"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Artist Statement</label>
                      <input
                        type="text"
                        required
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
                        required
                        value={artShortBio}
                        onChange={(e) => setArtShortBio(e.target.value)}
                        placeholder="Full bio narrative of the artist..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-midnight outline-none resize-none"
                      />
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
