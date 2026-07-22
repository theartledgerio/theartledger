import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('blog_submissions')
    .select('id, title, content');

  if (error) {
    console.error('Error fetching blogs:', error);
  } else {
    console.log(`Found ${data.length} blogs:`);
    for (const blog of data) {
      console.log(`ID: ${blog.id}`);
      console.log(`Title: ${blog.title}`);
      const imgMatches = blog.content ? blog.content.match(/<img[^>]+src="([^">]+)"/g) : [];
      console.log(`Images:`, imgMatches);
      console.log('---');
    }
  }
}

run();
