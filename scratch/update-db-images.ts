import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Starting DB image URL updates...');

  // 1. Update featured_profiles
  const { data: profiles, error: pErr } = await supabase
    .from('featured_profiles')
    .select('id, image_url');

  if (pErr) {
    console.error('Error fetching profiles:', pErr);
  } else {
    for (const p of (profiles || [])) {
      if (p.image_url && p.image_url.includes('prajakta_potnis_sculpture_art.png')) {
        const newUrl = p.image_url.replace('prajakta_potnis_sculpture_art.png', 'prajakta_potnis_sculpture_art.webp');
        const { error } = await supabase
          .from('featured_profiles')
          .update({ image_url: newUrl })
          .eq('id', p.id);
        if (error) console.error(`Error updating profile ${p.id}:`, error);
        else console.log(`Updated profile ${p.id} to use WebP`);
      }
    }
  }

  // 2. Update events
  const { data: events, error: eErr } = await supabase
    .from('events')
    .select('id, featured_image_url');

  if (eErr) {
    console.error('Error fetching events:', eErr);
  } else {
    for (const ev of (events || [])) {
      if (ev.featured_image_url && ev.featured_image_url.includes('freedom_season_3_exhibition.png')) {
        const newUrl = ev.featured_image_url.replace('freedom_season_3_exhibition.png', 'freedom_season_3_exhibition.webp');
        const { error } = await supabase
          .from('events')
          .update({ featured_image_url: newUrl })
          .eq('id', ev.id);
        if (error) console.error(`Error updating event ${ev.id}:`, error);
        else console.log(`Updated event ${ev.id} to use WebP`);
      }
    }
  }

  // 3. Update blog content HTML to use WebP
  let blogHtml = fs.readFileSync('scratch/blog_content_updated.html', 'utf8');
  blogHtml = blogHtml.replace(/\.jpeg/g, '.webp');
  fs.writeFileSync('scratch/blog_content_updated.html', blogHtml);
  console.log('Updated scratch/blog_content_updated.html image extensions to .webp');

  const duoBlogIds = ['fa2b09d9-56f9-4e99-bbdb-3aafaf88ebf3', '715e9705-4d42-46a2-b86f-afc6f5f5f28e'];
  for (const id of duoBlogIds) {
    const { error } = await supabase
      .from('blog_submissions')
      .update({ content: blogHtml })
      .eq('id', id);
    if (error) console.error(`Error updating blog ${id}:`, error);
    else console.log(`Updated blog ${id} HTML content to use WebP images`);
  }

  console.log('DB image updates completed!');
}

run();
