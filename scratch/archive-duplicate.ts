import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const duplicateId = '715e9705-4d42-46a2-b86f-afc6f5f5f28e';

  // Try updating status to 'archived'
  const { data, error } = await supabase
    .from('blog_submissions')
    .update({ status: 'archived' })
    .eq('id', duplicateId)
    .select();

  if (error) {
    console.error('Error updating status:', error);
  } else {
    console.log('Successfully updated duplicate status to archived:', data);
  }

  // Check approved blogs now
  const { data: approvedBlogs } = await supabase
    .from('blog_submissions')
    .select('id, title, status, published_at')
    .eq('status', 'approved');

  console.log('Approved blogs in database now:', approvedBlogs);
}

run().catch(console.error);
