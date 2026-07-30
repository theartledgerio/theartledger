import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadAssets() {
  const artifactsDir = `C:\\Users\\ayush\\.gemini\\antigravity-ide\\brain\\5c45d6fc-1eba-4e37-8519-bdb9c6a82cda`;
  const files = fs.readdirSync(artifactsDir);

  const heroMagFile = files.find(f => f.startsWith('hero_magazine_cover_real_'));
  const heroExhFile = files.find(f => f.startsWith('hero_freedom_exhibition_real_'));

  if (heroMagFile) {
    const magPath = path.join(artifactsDir, heroMagFile);
    const magBody = fs.readFileSync(magPath);
    const { data: magData, error: magErr } = await supabase.storage
      .from('blog-images')
      .upload(`assets/${heroMagFile}`, magBody, { contentType: 'image/png', upsert: true });

    if (magErr) {
      console.error('Mag upload error:', magErr);
    } else {
      const { data: pData } = supabase.storage.from('blog-images').getPublicUrl(`assets/${heroMagFile}`);
      console.log('Hero Mag Public URL:', pData.publicUrl);
    }
  }

  if (heroExhFile) {
    const exhPath = path.join(artifactsDir, heroExhFile);
    const exhBody = fs.readFileSync(exhPath);
    const { data: exhData, error: exhErr } = await supabase.storage
      .from('blog-images')
      .upload(`assets/${heroExhFile}`, exhBody, { contentType: 'image/png', upsert: true });

    if (exhErr) {
      console.error('Exh upload error:', exhErr);
    } else {
      const { data: pData } = supabase.storage.from('blog-images').getPublicUrl(`assets/${heroExhFile}`);
      console.log('Hero Exh Public URL:', pData.publicUrl);
    }
  }
}

uploadAssets();
