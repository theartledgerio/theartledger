import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function run() {
  const blog1Dir = path.join('public', "blog`1");
  const files = fs.readdirSync(blog1Dir).sort();
  console.log('Found image files in public/blog`1:', files);

  const publicUrls: Record<string, string> = {};

  for (const file of files) {
    const filePath = path.join(blog1Dir, file);
    const fileBody = fs.readFileSync(filePath);
    const destinationKey = `father_daughter_${file}`;

    console.log(`Uploading ${file} as ${destinationKey}...`);
    const { error: uploadErr } = await supabase.storage
      .from('blog-images')
      .upload(destinationKey, fileBody, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadErr) {
      console.error(`Upload error for ${file}:`, uploadErr);
    }

    const { data: pubData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(destinationKey);

    publicUrls[file] = pubData.publicUrl;
    console.log(`Uploaded ${file} -> ${pubData.publicUrl}`);
  }

  console.log('All image public URLs:', publicUrls);

  // Write URLs to a JSON file for reference
  fs.writeFileSync('scratch/blog1_image_urls.json', JSON.stringify(publicUrls, null, 2));
}

run().catch(console.error);
