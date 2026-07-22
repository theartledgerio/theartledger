import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
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
    return;
  }

  fs.writeFileSync('scratch/blog_content_active.html', data.content);
  console.log('Active Blog content written to scratch/blog_content_active.html');
}

run();
