import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  console.log('Testing update on blog_submissions...');
  const { data, error } = await supabase
    .from('blog_submissions')
    .update({ title: 'A Father-Daughter Duo Who Sold Fake History Instead of Fake Art' })
    .eq('id', 'fa2b09d9-56f9-4e99-bbdb-3aafaf88ebf3')
    .select();

  console.log('Data returned:', data);
  console.log('Error returned:', error);
}

testUpdate();
