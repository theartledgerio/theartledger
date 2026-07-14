/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Artist {
  id: string;
  name: string;
  style: string;
  country: string;
  bio: string;
  portrait: string;
  featuredWorkTitle: string;
  featuredWorkUrl: string;
  born: string;
  medium: string;
  statement: string;
}

export interface Event {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time?: string;
  venue: string;
  artist: string;
  image: string;
  status: 'Upcoming' | 'Current' | 'Completed';
  description: string;
  type: 'Exhibition' | 'Panel Discussion' | 'Auction' | 'Private View';
  timelineStep: number; // For interactive timeline ordering
}

export interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string; // HTML or structured content
  image: string;
  readingTime: string;
  author: string;
  category: string;
  date: string;
  featured?: boolean;
}

export interface Magazine {
  id: string;
  title: string;
  coverUrl: string;
  description: string;
  editionDate: string;
  editionNumber: string;
  downloadUrl: string;
  price: number;
  featured?: boolean;
  pages: string[]; // URLs of preview pages
}

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  year: string;
  medium: string;
  size: string;
  image: string;
  galleryCategory: 'Abstract' | 'Sculpture' | 'Digital' | 'Photography' | 'Minimalist';
  likes: number;
}
