import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const updatedContent = fs.readFileSync('scratch/blog_content_updated.html', 'utf8');

  // We will update both IDs to keep them in sync
  const ids = ['fa2b09d9-56f9-4e99-bbdb-3aafaf88ebf3', '715e9705-4d42-46a2-b86f-afc6f5f5f28e'];

  for (const id of ids) {
    const { data, error } = await supabase
      .from('blog_submissions')
      .update({ content: updatedContent })
      .eq('id', id);

    if (error) {
      console.error(`Error updating blog ${id}:`, error);
    } else {
      console.log(`Successfully updated blog ${id}`);
    }
  }
}

run();
