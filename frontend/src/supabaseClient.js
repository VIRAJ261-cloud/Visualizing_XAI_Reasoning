import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    url !== 'https://placeholder-project.supabase.co' &&
    !url.includes('your-supabase-project-id') &&
    key !== 'placeholder-anon-key' &&
    key !== 'your-supabase-anon-key-here'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
