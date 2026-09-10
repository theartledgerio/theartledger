/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, User, Clock, ArrowRight } from 'lucide-react';
import { Blog } from '../types';
import { supabase } from '../supabase';

import { convertDriveUrl, extractFirstImage } from './blogRenderer';

interface BlogsProps {
  searchQuery: string;
  isHome?: boolean;
  onChangePage?: (pageId: string) => void;
  onSelectBlog?: (blog: Blog) => void;
}

export default function Blogs({ searchQuery, isHome = false, onChangePage, onSelectBlog }: BlogsProps) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBlogs() {
      try {
        const { data, error } = await supabase
          .from('blog_submissions')
          .select('*')
          .eq('status', 'approved')
          .order('published_at', { ascending: false });

        if (error) throw error;

        const filtered = (data || []).filter(item => {
          const title = (item.title || '').toLowerCase();
          return !title.includes('father') && !title.includes('daughter') && !title.includes('fake history') && item.id !== '715e9705-4d42-46a2-b86f-afc6f5f5f28e' && item.id !== '7904125e-bff5-4012-9e2a-3b6a4ad5f605';
        });

        const mapped: Blog[] = filtered.map((item, index) => {
          const wordCount = item.content ? item.content.split(/\s+/).length : 0;
          const readMin = Math.max(1, Math.ceil(wordCount / 200));
          const extractedImg = extractFirstImage(item.content || '');
          const rawCover = (item.image_url && item.image_url.trim().length > 0)
            ? item.image_url.trim()
            : (extractedImg || '');
          const coverImage = convertDriveUrl(rawCover);

          return {
            id: item.id,
            title: item.title || 'Untitled Essay',
            excerpt: item.short_description || '',
            content: item.content || '',
            image: coverImage,
            readingTime: `${readMin} min read`,
            author: item.name || 'Editorial Board',
            category: item.category || 'Contemporary',
            date: item.published_at
              ? new Date(item.published_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
              : 'Recent',
            featured: index === 0
          };
        });

        setBlogs(mapped);
      } catch (err) {
        console.error('Error fetching blogs from database:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBlogs();

    // Real-time Supabase subscription for instant updates on all devices
    const channel = supabase
      .channel('public:blog_submissions_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_submissions' }, () => {
        loadBlogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter blogs based on global search query
  const filteredBlogs = blogs.filter(blog => {
    return (
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Separate featured blog from standard blogs
  const featuredBlog = filteredBlogs.find(b => b.featured) || filteredBlogs[0];
  const secondaryBlogs = filteredBlogs.filter(b => b.id !== (featuredBlog?.id || ''));

  return (
    <section
      id="blogs"
      className="py-16 md:py-24 bg-offwhite"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Improved Section Header - Elegant Editorial Design */}
        <div className="border-b border-slate-200/60 pb-8 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-mono tracking-[0.25em] text-turquoise font-bold uppercase block mb-2">
              THE LEDGER DIGEST
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-midnight tracking-tight leading-tight">
              Editorial Journal
            </h2>
          </div>
          <p className="text-xs md:text-sm text-graycustom font-sans max-w-md md:text-right leading-relaxed">
            Critical evaluations, artist dialogues, and market research examining contemporary movements and cultural infrastructure.
          </p>
        </div>

        {isHome ? (
          // HOME LAYOUT: Render ONLY the single latest / featured blog with original grand layout
          featuredBlog ? (
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                onClick={() => onSelectBlog?.(featuredBlog)}
                className="group relative rounded-[32px] overflow-hidden bg-warmwhite border-[0.5px] border-[#EAE5D8]/30 hover:border-turquoise/30 shadow-xl hover:shadow-2xl transition-all duration-500 grid grid-cols-1 md:grid-cols-12 items-stretch cursor-pointer"
              >
                {/* Left Column: Photo cover (Image on Left) */}
                <div className="md:col-span-5 overflow-hidden relative min-h-[320px] md:min-h-[460px]">
                  <img
                    src={featuredBlog.image}
                    alt={featuredBlog.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms] ease-out"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle paper luster overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-midnight/10 via-transparent to-white/10 pointer-events-none mix-blend-overlay" />
                </div>

                {/* Right Column: Body details (Text on Right) */}
                <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-[10px] font-mono text-turquoise font-bold uppercase">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {featuredBlog.author}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-graycustom font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredBlog.readingTime}
                      </span>
                      <span>•</span>
                      <span className="text-graycustom font-medium">{featuredBlog.date}</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-midnight tracking-tight leading-tight group-hover:text-turquoise transition-colors duration-300">
                      {featuredBlog.title}
                    </h3>

                    <p className="text-xs md:text-sm text-graycustom leading-relaxed font-medium">
                      {featuredBlog.excerpt}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 mt-8 border-t border-offwhite/85 w-full">
                    <button
                      id={`read-featured-blog-btn-${featuredBlog.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBlog?.(featuredBlog);
                      }}
                      className="group flex items-center space-x-2 text-xs font-sans font-bold uppercase tracking-widest text-midnight hover:text-turquoise transition-colors duration-200 cursor-pointer"
                    >
                      <span>Read Full Essay</span>
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      >
                        <ArrowRight className="w-4 h-4 text-turquoise" />
                      </motion.span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangePage?.('blogs');
                      }}
                      className="px-6 py-3 rounded-xl bg-midnight hover:bg-turquoise text-white text-[9px] font-sans font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer shadow-md hover:shadow-turquoise/15"
                    >
                      EXPLORE FULL JOURNAL ({blogs.length})
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-graycustom font-sans text-sm">No editorial essays available.</p>
            </div>
          )
        ) : (
          // DEDICATED ARCHIVE PAGE LAYOUT (Single-column stacked horizontal cards matching reference style)
          filteredBlogs.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-200 rounded-3xl max-w-5xl mx-auto">
              <p className="text-graycustom font-sans text-sm">No editorial articles match your search criteria.</p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-6">
              {filteredBlogs.map((blog) => (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  onClick={() => onSelectBlog?.(blog)}
                  className="group relative rounded-[28px] overflow-hidden bg-[#FAF9F5] border border-[#E2E7E1] hover:border-turquoise/40 shadow-sm hover:shadow-md transition-all duration-300 grid grid-cols-1 md:grid-cols-12 items-center p-4 md:p-6 gap-6 cursor-pointer"
                >
                  {/* Left Column: Photo cover (Image on Left) */}
                  <div className="md:col-span-5 overflow-hidden relative h-[210px] md:h-[230px] rounded-2xl w-full bg-slate-100">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-top group-hover:scale-103 transition-transform duration-700 ease-out"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Right Column: Body details (Text on Right) */}
                  <div className="md:col-span-7 flex flex-col justify-center space-y-3 py-2">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#2D5A4C] font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-turquoise" />
                        {blog.author}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-turquoise" />
                        {blog.readingTime}
                      </span>
                      <span>•</span>
                      <span className="text-slate-500 font-medium">{blog.date}</span>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-midnight tracking-tight leading-tight group-hover:text-turquoise transition-colors duration-300">
                      {blog.title}
                    </h3>

                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium line-clamp-3">
                      {blog.excerpt}
                    </p>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        id={`read-blog-btn-${blog.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBlog?.(blog);
                        }}
                        className="group flex items-center space-x-2 text-xs font-sans font-bold uppercase tracking-widest text-midnight hover:text-turquoise transition-colors duration-200 cursor-pointer"
                      >
                        <span>Read More</span>
                        <ArrowRight className="w-4 h-4 text-turquoise group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}

      </div>

    </section>
  );
}
