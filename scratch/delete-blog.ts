import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const ids = ['fa2b09d9-56f9-4e99-bbdb-3aafaf88ebf3', '715e9705-4d42-46a2-b86f-afc6f5f5f28e'];

  for (const id of ids) {
    const { error } = await supabase
      .from('blog_submissions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting blog ${id}:`, error.message);
    } else {
      console.log(`✓ Deleted blog ${id}`);
    }
  }

  console.log('Done.');
}

run();
