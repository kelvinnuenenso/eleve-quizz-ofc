import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables for Supabase configuration
// Support both VITE_ (for Vite) and NEXT_PUBLIC_ (for Next.js) prefixes
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 
                    import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
                    "https://rijvidluwvzvatoarqoe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
                               import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                               "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpanZpZGx1d3Z6dmF0b2FycW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1Njc0MTAsImV4cCI6MjA3MTE0MzQxMH0.Wm2aXhLV6ZO8ZeSpWwzdskisV_VIQbQvaHmHk0CLVTg";

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('Missing Supabase environment variables');
  throw new Error('Supabase configuration is missing. Please check your environment variables.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: process.env.NODE_ENV === 'development'
  },
  global: {
    headers: {
      'X-Client-Info': 'quiz-lift-off@1.0.0'
    }
  }
});