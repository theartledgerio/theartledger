import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: {
    headers: {
      'x-client-info': 'supabase-js-retry'
    }
  }
});

const imageFiles = [
  "blog_image_page_1_1.webp",
  "blog_image_page_2_1.webp",
  "blog_image_page_3_1.webp",
  "blog_image_page_4_1.webp",
  "blog_image_page_10_1.webp",
  "blog_image_page_12_1.webp",
  "blog_image_page_14_1.webp",
  "blog_image_page_14_2.webp",
  "blog_image_page_16_1.webp",
  "freedom_season_3_exhibition.webp",
  "prajakta_potnis_sculpture_art.webp"
];

async function retry<T>(fn: () => Promise<T>, retries = 5, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    console.warn(`Error occurred. Retrying in ${delay}ms... (${retries} retries left). Error:`, err);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 1.5);
  }
}

async function run() {
  const publicUrls: { [key: string]: string } = {};

  for (const filename of imageFiles) {
    const filePath = path.join('public', filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`File does not exist: ${filePath}`);
      continue;
    }

    const fileBody = fs.readFileSync(filePath);
    
    console.log(`Uploading ${filename}...`);
    try {
      await retry(async () => {
        const { data, error } = await supabase.storage
          .from('blog-images')
          .upload(filename, fileBody, {
            contentType: 'image/webp',
            upsert: false // Set to false to avoid updating if it already exists, or catch the RLS/Duplicate error
          });

        if (error) {
          // If RLS violation or duplicate file, we assume it's already uploaded
          if (error.message && (error.message.includes('violates') || error.message.includes('already exists') || error.message.includes('Duplicate'))) {
            console.log(`File ${filename} already exists in bucket.`);
            return;
          }
          throw error;
        }
        console.log(`Successfully uploaded new file: ${filename}`);
      });
    } catch (uploadError) {
      console.error(`Failed to upload ${filename} after retries:`, uploadError);
    }

    const { data: pubData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filename);
    publicUrls[filename] = pubData.publicUrl;
    console.log(`Public URL for ${filename}: ${pubData.publicUrl}`);
  }

  // Update Prajakta Potnis profile
  const prajaktaWebp = publicUrls["prajakta_potnis_sculpture_art.webp"];
  if (prajaktaWebp) {
    try {
      await retry(async () => {
        const { error } = await supabase
          .from('featured_profiles')
          .update({ image_url: prajaktaWebp })
          .eq('name', 'Prajakta Potnis');
        if (error) throw error;
        console.log('Updated Prajakta profile image_url in DB to:', prajaktaWebp);
      });
    } catch (e) {
      console.error('Error updating Prajakta profile:', e);
    }
  }

  // Update Freedom Season 3 event
  const freedomWebp = publicUrls["freedom_season_3_exhibition.webp"];
  if (freedomWebp) {
    try {
      await retry(async () => {
        const { error } = await supabase
          .from('events')
          .update({ featured_image_url: freedomWebp })
          .like('title', '%Freedom - Season 3%');
        if (error) throw error;
        console.log('Updated Freedom Season 3 event featured_image_url in DB to:', freedomWebp);
      });
    } catch (e) {
      console.error('Error updating Freedom Season 3 event:', e);
    }
  }

  // Read blog HTML from scratch file and replace local paths with Supabase URLs
  let blogHtml = fs.readFileSync('scratch/blog_content_updated.html', 'utf8');
  for (const [filename, pubUrl] of Object.entries(publicUrls)) {
    if (filename.startsWith('blog_image_page_')) {
      const localPath = `/${filename}`;
      blogHtml = blogHtml.split(localPath).join(pubUrl);
    }
  }

  // Write the updated HTML back
  fs.writeFileSync('scratch/blog_content_updated_public.html', blogHtml);
  console.log('Saved scratch/blog_content_updated_public.html');

  // Update the database blog entries
  const duoBlogIds = ['fa2b09d9-56f9-4e99-bbdb-3aafaf88ebf3', '715e9705-4d42-46a2-b86f-afc6f5f5f28e'];
  for (const id of duoBlogIds) {
    try {
      await retry(async () => {
        const { error } = await supabase
          .from('blog_submissions')
          .update({ content: blogHtml })
          .eq('id', id);
        if (error) throw error;
        console.log(`Updated blog ${id} HTML content in DB to use public Supabase storage WebP URLs`);
      });
    } catch (e) {
      console.error(`Error updating blog ${id}:`, e);
    }
  }

  console.log('All updates finished successfully!');
}

run();
