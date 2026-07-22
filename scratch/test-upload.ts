import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const fileBody = fs.readFileSync('public/blog_image_page_4_1.webp');
  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload('test_upload_from_agent.webp', fileBody, {
      contentType: 'image/webp',
      upsert: true
    });

  if (error) {
    console.error('Upload failed:', error);
  } else {
    console.log('Upload succeeded!', data);
    const { data: pubData } = supabase.storage
      .from('blog-images')
      .getPublicUrl('test_upload_from_agent.webp');
    console.log('Public URL:', pubData.publicUrl);
  }
}

run();
