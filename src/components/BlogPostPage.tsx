/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Clock, ArrowLeft, Heart, Share2, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { Blog } from '../types';
import { supabase } from '../supabase';

interface BlogPostPageProps {
  blog: Blog;
  onChangePage?: (pageId: string) => void;
}

interface Comment {
  id: string;
  name: string;
  comment_text: string;
  created_at: string;
}

export default function BlogPostPage({ blog, onChangePage }: BlogPostPageProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    async function loadComments() {
      try {
        const { data, error } = await supabase
          .from('blog_comments')
          .select('*')
          .eq('blog_id', blog.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        setComments(data || []);
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setLoadingComments(false);
      }
    }
    loadComments();
  }, [blog.id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName || !commentEmail || !commentText) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('blog_comments')
        .insert([
          {
            blog_id: blog.id,
            name: commentName,
            email: commentEmail,
            comment_text: commentText,
            is_approved: true
          }
        ]);

      if (error) throw error;

      setSubmitSuccess(true);
      setCommentText('');
      
      // Reload comments list
      const { data } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('blog_id', blog.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: true });
      setComments(data || []);

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/#blog/${blog.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 3000);
    });
  };

  return (
    <div className="min-h-screen bg-warmwhite py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        
        {/* Back Link & Meta actions */}
        <div className="flex items-center justify-between border-b border-offwhite pb-6 mb-10">
          <button
            onClick={() => onChangePage?.('blogs')}
            className="group flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-widest text-midnight hover:text-turquoise transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Journal</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="p-2.5 rounded-xl bg-white border border-[#EAE5D8]/60 hover:border-turquoise text-graycustom hover:text-turquoise cursor-pointer transition-all duration-300 shadow-sm"
              title="Like Essay"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-turquoise text-turquoise' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-white border border-[#EAE5D8]/60 hover:border-turquoise text-graycustom hover:text-turquoise cursor-pointer transition-all duration-300 shadow-sm"
              title="Share Essay"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Article Header info */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <span className="inline-block px-3 py-1 bg-turquoise/10 border border-turquoise/20 rounded-full text-[10px] font-mono text-turquoise tracking-widest uppercase font-bold mb-4">
            {blog.category}
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-midnight tracking-tight leading-tight mb-6">
            {blog.title}
          </h1>

          <div className="flex items-center justify-center gap-6 text-xs font-mono text-graycustom">
            <span className="flex items-center gap-1.5 font-bold text-midnight uppercase">
              <User className="w-4 h-4 text-turquoise" />
              By {blog.author}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              {blog.readingTime}
            </span>
            <span>•</span>
            <span>Published {blog.date}</span>
          </div>
        </div>

        {/* Cover Image */}
        {blog.image && !blog.content.includes(blog.image) && (
          <div className="max-w-4xl mx-auto mb-10 overflow-hidden rounded-2xl shadow-lg">
            <img src={blog.image} alt={blog.title} className="w-full h-auto object-cover max-h-[60vh]" />
          </div>
        )}

        {/* Article Content Render */}
        <div 
          className="max-w-2xl mx-auto font-sans text-base text-graycustom leading-relaxed md:text-lg border-t border-offwhite pt-10 blog-rich-content"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Discussion / Comments Section */}
        <div className="max-w-2xl mx-auto border-t border-offwhite mt-16 pt-12">
          <h3 className="text-2xl font-serif font-bold text-midnight tracking-tight mb-8 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-turquoise" />
            Discussion ({comments.length})
          </h3>

          {/* Comment List */}
          <div className="space-y-6 mb-12">
            {loadingComments ? (
              <p className="text-graycustom text-xs font-mono">Loading discussion threads...</p>
            ) : comments.length === 0 ? (
              <p className="text-graycustom text-xs font-mono italic">No remarks have been left on this essay yet. Be the first to add yours.</p>
            ) : (
              comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-white border border-[#EAE5D8]/50 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans font-bold text-midnight uppercase">
                      {comment.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(comment.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-graycustom leading-relaxed font-medium">
                    {comment.comment_text}
                  </p>
                </motion.div>
              ))
            )}
          </div>

          {/* Comment Form */}
          <div className="p-6 md:p-8 rounded-3xl bg-warmwhite border border-[#EAE5D8]/60 shadow-inner">
            <h4 className="text-sm font-mono tracking-widest text-[#888] font-bold uppercase mb-6">
              LEAVE A REMARK
            </h4>

            <form onSubmit={handleCommentSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Name</label>
                  <input
                    type="text"
                    required
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    placeholder="Shivam Thorne"
                    className="w-full px-4 py-2.5 bg-white border border-[#EAE5D8] focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-darknavy placeholder-slate-400 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Email</label>
                  <input
                    type="email"
                    required
                    value={commentEmail}
                    onChange={(e) => setCommentEmail(e.target.value)}
                    placeholder="shivam@example.com"
                    className="w-full px-4 py-2.5 bg-white border border-[#EAE5D8] focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-darknavy placeholder-slate-400 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Comment</label>
                <textarea
                  required
                  rows={4}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your perspective on this curator's movement..."
                  className="w-full px-4 py-3 bg-white border border-[#EAE5D8] focus:border-turquoise focus:ring-1 focus:ring-turquoise rounded-xl text-xs text-darknavy placeholder-slate-400 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <div>
                  {submitSuccess && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1 text-[10px] font-mono font-bold text-turquoise uppercase"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Remark published successfully!</span>
                    </motion.div>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-midnight hover:bg-turquoise text-white text-[10px] font-sans font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer flex items-center gap-2 shadow-md hover:shadow-turquoise/15 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{isSubmitting ? 'Posting...' : 'POST REMARK'}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

      {/* Copy link Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-midnight text-white px-5 py-3.5 rounded-xl shadow-xl border border-white/10 text-xs font-mono font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-turquoise" />
            <span>LINK COPIED TO CLIPBOARD</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
