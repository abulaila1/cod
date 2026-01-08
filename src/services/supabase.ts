import { createClient } from '@supabase/supabase-js';

function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || window.__APP_CONFIG__?.SUPABASE_URL || '';
}

function getSupabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || window.__APP_CONFIG__?.SUPABASE_ANON_KEY || '';
}

export const isSupabaseConfigured = !!(getSupabaseUrl() && getSupabaseAnonKey());

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

if (import.meta.env.DEV && isSupabaseConfigured) {
  const urlSource = import.meta.env.VITE_SUPABASE_URL ? 'vite-env' : 'runtime-config';
  const keySource = import.meta.env.VITE_SUPABASE_ANON_KEY ? 'vite-env' : 'runtime-config';
  console.log(`[Config] Using SUPABASE_URL from: ${urlSource}`);
  console.log(`[Config] Using SUPABASE_ANON_KEY from: ${keySource}`);
}

if (!isSupabaseConfigured) {
  console.error('Missing Supabase configuration:');
  if (!supabaseUrl) {
    console.error('- SUPABASE_URL is not set (checked VITE_SUPABASE_URL and window.__APP_CONFIG__.SUPABASE_URL)');
  }
  if (!supabaseAnonKey) {
    console.error('- SUPABASE_ANON_KEY is not set (checked VITE_SUPABASE_ANON_KEY and window.__APP_CONFIG__.SUPABASE_ANON_KEY)');
  }
  console.error('Please configure these values in either:');
  console.error('  1. Environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
  console.error('  2. Runtime config file (/public/config.js)');
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null as any;
