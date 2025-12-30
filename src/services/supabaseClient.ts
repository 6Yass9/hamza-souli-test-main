import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export function getAppToken(): string | null {
  try {
    return localStorage.getItem('app_token');
  } catch {
    return null;
  }
}

export function setAppToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem('app_token');
    else localStorage.setItem('app_token', token);
  } catch {
    // ignore
  }
}

export function supabase() {
  const token = getAppToken();
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  });
}
