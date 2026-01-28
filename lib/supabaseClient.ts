import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ympkyaakwveogjcgqqnr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltcGt5YWFrd3Zlb2dqY2dxcW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNjkyMDcsImV4cCI6MjA3NTc0NTIwN30.OtkJR9sK5wgUKyXAYpHM99ddA-3sbleUN9WLVRVSgZA';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false // Prevent auto-login from URL fragments which can cause logout loops
  }
});