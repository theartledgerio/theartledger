import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: blogs, error } = await supabase
    .from('blog_submissions')
    .select('id, title, published_at, created_at, content');

  if (error) {
    console.error('Error fetching blogs:', error);
    return;
  }

  console.log(`Currently found ${blogs.length} blogs in database:`);
  for (const b of blogs) {
    const imgMatches = (b.content || '').match(/<img/g)?.length || 0;
    console.log(`- ID: ${b.id}`);
    console.log(`  Title: ${b.title}`);
    console.log(`  Published At: ${b.published_at}`);
    console.log(`  Images count: ${imgMatches}`);
  }

  // Keep ID: 'fa2b09d9-56f9-4e99-bbdb-3aafaf88ebf3' (Our complete updated blog with 9 images)
  // Keep ID: '75ca829e-7fc8-4e2e-bba0-c513917f475e' (Prajakta Potnis blog)
  // Delete any other duplicate IDs
  const keepIds = ['fa2b09d9-56f9-4e99-bbdb-3aafaf88ebf3', '75ca829e-7fc8-4e2e-bba0-c513917f475e'];

  for (const b of blogs) {
    if (!keepIds.includes(b.id)) {
      console.log(`Deleting duplicate/unwanted blog row with ID: ${b.id}`);
      const { error: delErr } = await supabase
        .from('blog_submissions')
        .delete()
        .eq('id', b.id);

      if (delErr) {
        console.error(`Failed to delete blog ${b.id}:`, delErr);
      } else {
        console.log(`Successfully deleted blog ${b.id}`);
      }
    }
  }

  // Double check remaining blogs
  const { data: finalBlogs } = await supabase
    .from('blog_submissions')
    .select('id, title, published_at');

  console.log('\nRemaining blogs in database:');
  console.log(finalBlogs);
}

run().catch(console.error);
