import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('blog_submissions')
    .select('*')
    .eq('id', 'fa2b09d9-56f9-4e99-bbdb-3aafaf88ebf3')
    .single();

  if (error) {
    console.error('Error fetching blog:', error);
  } else {
    console.log('Fetched blog successfully!');
    console.log('Content snippet:', data.content ? data.content.substring(0, 1000) : 'null');
    // search for img tags in content
    const imgMatches = data.content ? data.content.match(/<img[^>]+src="([^">]+)"/g) : [];
    console.log('Image tags found:', imgMatches);
  }
}

run();
