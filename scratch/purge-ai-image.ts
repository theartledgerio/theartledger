import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeAiFreedomImages() {
  console.log('--- Checking Events Table in Supabase ---');
  const { data: events, error } = await supabase.from('events').select('*');
  console.log('Events error:', error);
  console.log('Events in DB:', events);

  // Remove any event that contains unsplash or AI image references from DB
  if (events && events.length > 0) {
    for (const ev of events) {
      if (ev.featured_image_url && ev.featured_image_url.includes('unsplash')) {
        console.log(`Updating event ID ${ev.id} to use real exhibition photo...`);
        await supabase
          .from('events')
          .update({
            featured_image_url: 'https://psbfhomirpzlkinuttea.supabase.co/storage/v1/object/public/blog-images/assets/hero_freedom_exhibition_real_1785413701462.png'
          })
          .eq('id', ev.id);
      }
    }
  }

  // Delete any AI image assets from Supabase storage if uploaded
  const { data: files } = await supabase.storage.from('blog-images').list('assets');
  if (files) {
    const aiFiles = files.filter(f => f.name.includes('ai') || f.name.includes('unsplash'));
    if (aiFiles.length > 0) {
      console.log('Deleting AI files from storage:', aiFiles.map(f => f.name));
      await supabase.storage.from('blog-images').remove(aiFiles.map(f => `assets/${f.name}`));
    }
  }

  console.log('Purge completed cleanly!');
}

purgeAiFreedomImages();
