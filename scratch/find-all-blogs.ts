import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('blog_submissions')
    .select('id, title, status, published_at, created_at, short_description');

  if (error) {
    console.error('Error fetching blogs:', error);
  } else {
    console.log(`Found ${data.length} blogs:`);
    for (const blog of data) {
      console.log(`ID: ${blog.id}`);
      console.log(`Title: ${blog.title}`);
      console.log(`Status: ${blog.status}`);
      console.log(`Published At: ${blog.published_at}`);
      console.log(`Created At: ${blog.created_at}`);
      console.log(`Excerpt: ${blog.short_description}`);
      console.log('---');
    }
  }
}

run();
