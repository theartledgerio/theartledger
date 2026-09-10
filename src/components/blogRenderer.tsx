/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { supabase } from '../supabase';

/**
 * Converts Google Drive sharing links into direct high-resolution image URLs.
 */
export const convertDriveUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('drive.google.com')) {
    const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const fileId = match[1];
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  return trimmed;
};

/**
 * Parses and deletes a previously uploaded file from Supabase storage if it was stored in one of our buckets.
 */
export const deleteStorageFileIfPresent = async (url: string): Promise<boolean> => {
  if (!url || typeof url !== 'string') return false;
  try {
    const trimmed = url.trim();
    // Pattern: .../storage/v1/object/public/<bucket>/<filePath>
    const match = trimmed.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (match) {
      const bucket = match[1];
      const filePath = decodeURIComponent(match[2]);
      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      if (error) {
        console.warn('Storage cleanup warning:', error.message);
        return false;
      }
      return true;
    }
  } catch (err) {
    console.warn('Could not remove previous storage file:', err);
  }
  return false;
};

/**
 * Extracts the first image URL from blog text (HTML, Markdown, or direct URL).
 */
export const extractFirstImage = (content: string): string | null => {
  if (!content) return null;

  // 1. Markdown image: ![alt](url)
  const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s\)]+|data:image\/[^\s\)]+|\/[^\s\)]+)\)/i);
  if (mdMatch) return convertDriveUrl(mdMatch[1]);

  // 2. HTML img tag
  const htmlMatch = content.match(/<img[^>]+src=["']?([^"'>\s]+)["']?/i);
  if (htmlMatch) return convertDriveUrl(htmlMatch[1]);

  // 3. Standalone image URL on its own line
  const urlMatch = content.match(/(https?:\/\/[^\s<]+?\.(?:png|jpe?g|webp|gif|svg|avif)(\?[^\s<]*)?|https?:\/\/[^\s<]+supabase\.co\/storage\/v1\/object\/public\/[^\s<]+|https?:\/\/lh3\.googleusercontent\.com\/[^\s<]+|data:image\/[a-zA-Z]+;base64,[^\s<]+|\/blog1\/[^\s<]+)/i);
  if (urlMatch) return convertDriveUrl(urlMatch[1]);

  return null;
};

/**
 * Parses text containing markdown links or raw URLs into React nodes.
 */
export const parseMarkdownLinks = (text: string): React.ReactNode => {
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

    const [, bracketText, parenUrl, rawUrl] = match;

    if (bracketText) {
      let targetUrl = (parenUrl || '').trim();
      let displayText = bracketText.trim();

      if (!targetUrl) {
        if (displayText.toLowerCase() === 'npr') {
          targetUrl = 'https://www.npr.org';
        } else if (displayText.startsWith('http')) {
          targetUrl = displayText;
          try {
            displayText = new URL(displayText).hostname.replace(/^www\./, '');
          } catch (e) {
            displayText = 'Source';
          }
        } else {
          targetUrl = `https://www.google.com/search?q=${encodeURIComponent(displayText)}`;
        }
      }

      const formattedHref = targetUrl.startsWith('http') || targetUrl.startsWith('/') || targetUrl.startsWith('#')
        ? targetUrl
        : `https://${targetUrl}`;

      parts.push(
        <a
          key={`link-${matchIndex}`}
          href={formattedHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-baseline gap-0.5 text-turquoise font-semibold underline decoration-turquoise/40 hover:decoration-turquoise hover:text-midnight transition-colors cursor-pointer mx-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{displayText}</span>
          <ExternalLink className="w-3 h-3 self-center shrink-0 opacity-80" />
        </a>
      );
    } else if (rawUrl) {
      let displayUrl = rawUrl;
      try {
        displayUrl = new URL(rawUrl).hostname.replace(/^www\./, '');
      } catch (e) {}

      parts.push(
        <a
          key={`rawurl-${matchIndex}`}
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-baseline gap-0.5 text-turquoise font-semibold underline decoration-turquoise/40 hover:decoration-turquoise hover:text-midnight transition-colors cursor-pointer mx-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{displayUrl}</span>
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

/**
 * Checks if a string or URL represents an image source.
 */
const isImageSrc = (str: string): boolean => {
  if (!str) return false;
  const s = str.trim();
  if (s.startsWith('data:image/')) return true;
  if (s.startsWith('/blog1/') || s.startsWith('/images/')) return true;
  if (s.includes('supabase.co/storage/v1/object/public/')) return true;
  if (s.includes('lh3.googleusercontent.com') || s.includes('drive.google.com')) return true;
  if (s.includes('unsplash.com') || s.includes('cloudinary.com') || s.includes('imgur.com') || s.includes('postimg.cc')) return true;
  if (/\.(jpeg|jpg|gif|png|webp|svg|avif|bmp|tiff)(\?.*)?$/i.test(s)) return true;
  return false;
};

interface RichBlogRendererProps {
  content: string;
  className?: string;
}

/**
 * Shared rich blog renderer that works seamlessly across Live Preview and Published Article Page.
 */
export const RichBlogContent: React.FC<RichBlogRendererProps> = ({ content, className = '' }) => {
  if (!content || content.trim() === '') {
    return <p className="text-slate-400 italic text-center py-6">No article content written yet...</p>;
  }

  // Full structured HTML document (e.g. from legacy full HTML blocks)
  const isCompleteHtmlDoc = (content.trim().startsWith('<p class="lead') || content.trim().startsWith('<div class="my-8')) && content.includes('</div>');
  if (isCompleteHtmlDoc) {
    const processed = content.replace(/<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, (match, href, text) => {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-turquoise font-semibold underline hover:text-midnight transition-colors duration-200">${text}</a>`;
    });
    return (
      <div
        className={`font-sans text-base text-graycustom leading-relaxed md:text-lg blog-rich-content ${className}`}
        dangerouslySetInnerHTML={{ __html: processed }}
      />
    );
  }

  // Split into paragraph blocks
  const blocks = content.split(/\r?\n\s*\r?\n/).map(b => b.trim()).filter(Boolean);

  return (
    <div className={`space-y-6 font-sans text-base text-graycustom leading-relaxed md:text-lg ${className}`}>
      {blocks.map((block, idx) => {
        const trimmed = block.trim();

        // 1. Markdown Image Block: ![caption](url)
        const mdImgMatch = trimmed.match(/^!\[(.*?)\]\((.+?)\)$/);
        if (mdImgMatch) {
          const caption = mdImgMatch[1]?.trim();
          const rawUrl = mdImgMatch[2]?.trim();
          const imgUrl = convertDriveUrl(rawUrl);
          return (
            <figure key={`md-img-${idx}`} className="my-8 overflow-hidden rounded-2xl shadow-md border border-[#EAE5D8] flex flex-col items-center bg-slate-50/40">
              <img
                src={imgUrl}
                alt={caption || 'Inline Article Image'}
                className="w-full h-auto max-h-[650px] object-contain rounded-2xl bg-white"
                loading="lazy"
              />
              {caption && (
                <figcaption className="text-[11px] font-mono text-graycustom px-5 py-2.5 border-t border-slate-100 w-full text-center bg-slate-50/80">
                  {caption}
                </figcaption>
              )}
            </figure>
          );
        }

        // 2. HTML <img> Tag Block
        if (trimmed.startsWith('<img') || trimmed.startsWith('<figure') || (trimmed.startsWith('<div') && trimmed.includes('<img'))) {
          // Extract src from img tag and ensure Google drive conversion
          const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
          const altMatch = trimmed.match(/alt=["']([^"']+)["']/i);
          if (srcMatch) {
            const finalSrc = convertDriveUrl(srcMatch[1]);
            const altText = altMatch ? altMatch[1] : 'Inline Article Image';
            return (
              <figure key={`html-img-${idx}`} className="my-8 overflow-hidden rounded-2xl shadow-md border border-[#EAE5D8] flex flex-col items-center bg-slate-50/40">
                <img
                  src={finalSrc}
                  alt={altText}
                  className="w-full h-auto max-h-[650px] object-contain rounded-2xl bg-white"
                  loading="lazy"
                />
              </figure>
            );
          }
          return (
            <div
              key={`raw-html-${idx}`}
              dangerouslySetInnerHTML={{ __html: trimmed }}
              className="my-8 rounded-2xl overflow-hidden"
            />
          );
        }

        // 3. Standalone Direct Image URL or Base64 Data URL
        if (isImageSrc(trimmed)) {
          const finalSrc = convertDriveUrl(trimmed);
          return (
            <figure key={`direct-img-${idx}`} className="my-8 overflow-hidden rounded-2xl shadow-md border border-[#EAE5D8] flex justify-center bg-slate-50/40">
              <img
                src={finalSrc}
                alt="Inline Article Image"
                className="w-full h-auto max-h-[650px] object-contain rounded-2xl bg-white"
                loading="lazy"
              />
            </figure>
          );
        }

        // 4. Headings
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={`h1-${idx}`} className="text-3xl md:text-4xl font-serif font-bold text-midnight pt-6 tracking-tight">
              {parseMarkdownLinks(trimmed.replace(/^#\s*/, ''))}
            </h1>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={`h2-${idx}`} className="text-2xl md:text-3xl font-serif font-bold text-midnight pt-5 tracking-tight">
              {parseMarkdownLinks(trimmed.replace(/^##\s*/, ''))}
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={`h3-${idx}`} className="text-xl md:text-2xl font-serif font-bold text-midnight pt-4 tracking-tight">
              {parseMarkdownLinks(trimmed.replace(/^###\s*/, ''))}
            </h3>
          );
        }

        // 5. Blockquote
        if (trimmed.startsWith('> ') || (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 30)) {
          const quoteText = trimmed.replace(/^>\s*/, '').replace(/^"|"$/g, '');
          return (
            <blockquote key={`quote-${idx}`} className="italic font-serif text-slate-800 pl-5 border-l-4 border-turquoise my-6 text-lg md:text-xl leading-relaxed bg-slate-50/60 py-3.5 pr-4 rounded-r-2xl">
              "{parseMarkdownLinks(quoteText)}"
            </blockquote>
          );
        }

        // 6. Paragraph with potential inline images: parse markdown image occurrences inside text
        if (trimmed.includes('![') && trimmed.includes('](')) {
          const parts: React.ReactNode[] = [];
          const inlineImgRegex = /!\[(.*?)\]\((.+?)\)/g;
          let lastPos = 0;
          let inlineMatch: RegExpExecArray | null;

          while ((inlineMatch = inlineImgRegex.exec(trimmed)) !== null) {
            if (inlineMatch.index > lastPos) {
              const textChunk = trimmed.substring(lastPos, inlineMatch.index);
              parts.push(
                <span key={`txt-${lastPos}`}>{parseMarkdownLinks(textChunk)}</span>
              );
            }
            const cap = inlineMatch[1]?.trim();
            const src = convertDriveUrl(inlineMatch[2]?.trim());
            parts.push(
              <figure key={`inline-fig-${inlineMatch.index}`} className="my-6 overflow-hidden rounded-2xl shadow-md border border-[#EAE5D8] flex flex-col items-center bg-slate-50/40">
                <img
                  src={src}
                  alt={cap || 'Article Image'}
                  className="w-full h-auto max-h-[600px] object-contain rounded-2xl bg-white"
                  loading="lazy"
                />
                {cap && (
                  <figcaption className="text-[11px] font-mono text-graycustom px-4 py-2 border-t border-slate-100 w-full text-center">
                    {cap}
                  </figcaption>
                )}
              </figure>
            );
            lastPos = inlineImgRegex.lastIndex;
          }

          if (lastPos < trimmed.length) {
            parts.push(
              <span key={`txt-end-${lastPos}`}>{parseMarkdownLinks(trimmed.substring(lastPos))}</span>
            );
          }

          return (
            <div key={`mixed-p-${idx}`} className="font-sans text-graycustom leading-relaxed font-normal">
              {parts}
            </div>
          );
        }

        // Standard Paragraph
        return (
          <p key={`p-${idx}`} className="font-sans text-graycustom leading-relaxed font-normal">
            {parseMarkdownLinks(trimmed)}
          </p>
        );
      })}
    </div>
  );
};
