/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, User, Clock, ArrowRight } from 'lucide-react';
import { Blog } from '../types';
import { supabase } from '../supabase';

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

        const filtered = (data || []).filter(item => item.id !== '715e9705-4d42-46a2-b86f-afc6f5f5f28e');
        const mapped: Blog[] = filtered.map((item, index) => {
          const wordCount = item.content ? item.content.split(/\s+/).length : 0;
          const readMin = Math.max(1, Math.ceil(wordCount / 200));
          return {
            id: item.id,
            title: item.title,
            excerpt: item.short_description || '',
            content: item.content || '',
            image: item.image_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
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

        const sorted = [...mapped].sort((a, b) => {
          if (a.title.toLowerCase().includes('prajakta')) return -1;
          if (b.title.toLowerCase().includes('prajakta')) return 1;
          return 0;
        });

        if (sorted.length > 0) {
          sorted.forEach((b, i) => {
            b.featured = (i === 0);
          });
        }

        setBlogs(sorted);
      } catch (err) {
        console.error('Error fetching blogs from database:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBlogs();
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
        <div className="border-b border-offwhite/50 pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-midnight font-bold uppercase block mb-2">
              THE LEDGER DIGEST
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-midnight tracking-tight leading-none">
              Editorial Journal
            </h2>
          </div>
          <p className="text-xs md:text-sm text-graycustom font-medium max-w-sm md:text-right leading-relaxed">
            Critical essays, designer profiles, and research journals reviewing contemporary art movements and architectural geometries.
          </p>
        </div>

        {isHome ? (
          // HOME LAYOUT: Render ONLY the single latest / featured blog with image on left and text on right
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
                  <span className="absolute top-4 left-4 z-10 px-3.5 py-1 bg-midnight/80 backdrop-blur-md text-white text-[9px] font-mono uppercase tracking-widest rounded-full font-bold">
                    LATEST ESSAY // {featuredBlog.category}
                  </span>
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
          // DEDICATED ARCHIVE PAGE LAYOUT (Showing all filtered blogs, split-grid)
          filteredBlogs.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-200 rounded-3xl">
              <p className="text-graycustom font-sans text-sm">No editorial articles match your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Hand: Featured Post Block (Taking 7 cols) */}
            {featuredBlog && (
              <div className="lg:col-span-7">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  onClick={() => onSelectBlog?.(featuredBlog)}
                  className="group block relative rounded-[24px] overflow-hidden bg-warmwhite border border-gray-100 shadow-xl cursor-pointer"
                >
                  {/* Photo cover */}
                  <div className="h-[300px] md:h-[450px] overflow-hidden relative">
                    <span className="absolute top-4 left-4 z-10 px-3.5 py-1 bg-midnight text-white text-[10px] font-mono uppercase tracking-widest rounded-full font-bold">
                      FEATURED ARTICLE // {featuredBlog.category}
                    </span>
                    <img
                      src={featuredBlog.image}
                      alt={featuredBlog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Body details */}
                  <div className="p-8 md:p-10">
                    <div className="flex items-center gap-4 text-xs font-mono text-gold font-bold uppercase mb-4">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {featuredBlog.author}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-graycustom">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredBlog.readingTime}
                      </span>
                      <span>•</span>
                      <span className="text-graycustom">{featuredBlog.date}</span>
                    </div>

                    <h3 className="text-2xl md:text-4xl font-serif font-bold text-midnight mb-4 group-hover:text-gold transition-colors duration-200">
                      {featuredBlog.title}
                    </h3>

                    <p className="text-sm text-graycustom leading-relaxed mb-8">
                      {featuredBlog.excerpt}
                    </p>

                    <button
                      id={`read-featured-blog-btn-${featuredBlog.id}`}
                      onClick={() => onSelectBlog?.(featuredBlog)}
                      className="group flex items-center space-x-2 text-xs font-sans font-bold uppercase tracking-widest text-midnight hover:text-gold transition-colors duration-200 cursor-pointer"
                    >
                      <span>Read Full Essay</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Right Hand: 3 Secondary Posts List (Taking 5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-8">
              <span className="text-xs font-mono tracking-widest text-gold font-bold uppercase">
                SECONDARY ARCHIVES
              </span>

              {secondaryBlogs.slice(0, 3).map((blog) => (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  onClick={() => onSelectBlog?.(blog)}
                  className="group flex flex-col sm:flex-row gap-5 p-5 rounded-2xl bg-warmwhite border border-gray-100 hover:border-gold/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  {/* Photo thumbnail */}
                  <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden shrink-0 relative">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Body content */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-gold font-bold uppercase mb-1.5">
                        <span>{blog.category}</span>
                        <span className="text-graycustom">{blog.readingTime}</span>
                      </div>

                      <h4 className="text-lg font-serif font-bold text-midnight line-clamp-2 group-hover:text-gold transition-colors duration-200">
                        {blog.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-3">
                      <span className="text-[11px] text-graycustom">By {blog.author}</span>
                      <button
                        id={`read-blog-btn-${blog.id}`}
                        onClick={() => onSelectBlog?.(blog)}
                        className="text-xs font-sans font-bold uppercase tracking-wider text-midnight hover:text-gold transition-colors duration-200 cursor-pointer flex items-center gap-1"
                      >
                        <span>More</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        )
      )}

      </div>

    </section>
  );
}
