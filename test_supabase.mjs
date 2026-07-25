import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ympkyaakwveogjcgqqnr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltcGt5YWFrd3Zlb2dqY2dxcW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNjkyMDcsImV4cCI6MjA3NTc0NTIwN30.OtkJR9sK5wgUKyXAYpHM99ddA-3sbleUN9WLVRVSgZA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) console.error(error);
  else console.log(JSON.stringify(data[0], null, 2));
}

test();
