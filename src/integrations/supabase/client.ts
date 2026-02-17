import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Migration guard: clear stale auth tokens when project ref changes
const PROJECT_REF = SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split('.')[0] : '';
const STORED_REF_KEY = 'agendex_project_ref';
const storedRef = localStorage.getItem(STORED_REF_KEY);
if (storedRef && storedRef !== PROJECT_REF) {
  // Project changed – purge old Supabase auth data to stop refresh_token loops
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('sb-')) localStorage.removeItem(key);
  });
  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith('sb-')) sessionStorage.removeItem(key);
  });
}
localStorage.setItem(STORED_REF_KEY, PROJECT_REF);

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Stop infinite refresh loops: on token error, sign out once
supabase.auth.onAuthStateChange((event) => {
  if (event === 'TOKEN_REFRESHED') return;
  if (event === 'SIGNED_OUT') return;
});

// Listen for refresh failures to prevent loops
const originalRefresh = supabase.auth.refreshSession.bind(supabase.auth);
let refreshFailed = false;
supabase.auth.refreshSession = async (...args) => {
  if (refreshFailed) {
    await supabase.auth.signOut({ scope: 'local' });
    return { data: { session: null, user: null }, error: new Error('Session expired') } as any;
  }
  const result = await originalRefresh(...args);
  if (result.error) {
    refreshFailed = true;
    await supabase.auth.signOut({ scope: 'local' });
    window.location.href = '/login';
  }
  return result;
};