import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedFreedomEvent() {
  const freedomPayload = {
    title: 'Freedom - Season 3',
    short_description: 'International Art Exhibition & Award Event',
    long_description: 'Freedom - Season 3 is a prestigious international art exhibition and award event curated by Siddharth Karmakar. Designed to uplift emerging and established artists alike, it offers a prominent platform at the Nehru Centre AC Art Gallery in Worli, Mumbai. The exhibition welcomes diverse mediums including Painting, Sculpture, Graphic Art, Digital Art, and Photography (no crafts). Exhibiting artists are eligible for awards, certificates, physical catalogues, and mementos with zero sales commission.',
    event_date: '2026-08-11',
    location: 'Nehru Centre AC Art Gallery, Worli, Mumbai',
    featured_image_url: 'https://psbfhomirpzlkinuttea.supabase.co/storage/v1/object/public/blog-images/assets/hero_freedom_exhibition_real_1785413701462.png',
    status: 'published',
    slug: 'freedom-season-3'
  };

  const { data: existing } = await supabase.from('events').select('id, title').ilike('title', '%freedom%');

  if (existing && existing.length > 0) {
    console.log('Freedom event already exists in DB:', existing);
    const { error: updateErr } = await supabase.from('events').update(freedomPayload).eq('id', existing[0].id);
    if (updateErr) console.error('Update error:', updateErr);
    else console.log('Successfully updated Freedom Season 3 event in Supabase!');
  } else {
    const { data: inserted, error: insertErr } = await supabase.from('events').insert([freedomPayload]).select();
    if (insertErr) console.error('Insert error:', insertErr);
    else console.log('Successfully inserted Freedom Season 3 event in Supabase:', inserted);
  }
}

seedFreedomEvent();
