import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data } = await supabase.from('blog_submissions').select('id, title, image_url, content');
  for (const b of data || []) {
    const match = (b.content || '').match(/<img[^>]+src="([^">]+)"/);
    console.log('ID:', b.id);
    console.log('Title:', b.title);
    console.log('DB image_url:', b.image_url);
    console.log('First img tag in content:', match ? match[1] : 'NONE');
    console.log('---');
  }
}

run();
