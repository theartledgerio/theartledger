import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAllData() {
  console.log('--- MAGAZINES ---');
  const { data: mags, error: e1 } = await supabase.from('magazines').select('*');
  console.log('Magazines error:', e1);
  console.log('Magazines count:', mags?.length);
  if (mags) {
    mags.forEach(m => console.log({ id: m.id, issue_number: m.issue_number, issue_name: m.issue_name, cover_image_url: m.cover_image_url, pdf_url: m.pdf_url, preview_pages: m.preview_pages }));
  }

  console.log('\n--- EVENTS ---');
  const { data: events, error: e2 } = await supabase.from('events').select('*');
  console.log('Events error:', e2);
  console.log('Events count:', events?.length);
  if (events) {
    events.forEach(ev => console.log({ id: ev.id, title: ev.title, featured_image_url: ev.featured_image_url }));
  }

  console.log('\n--- BLOGS ---');
  const { data: blogs, error: e3 } = await supabase.from('blog_submissions').select('id, title, status, image_url');
  console.log('Blogs error:', e3);
  console.log('Blogs count:', blogs?.length);
  if (blogs) {
    blogs.forEach(b => console.log({ id: b.id, title: b.title, status: b.status, image_url: b.image_url }));
  }
}

inspectAllData();
