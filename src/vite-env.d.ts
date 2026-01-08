/// <reference types="vite/client" />

interface AppConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

interface Window {
  __APP_CONFIG__?: AppConfig;
}
