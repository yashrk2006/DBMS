import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Query Logger ────────────────────────────────────────────────────────────
const loggedFetch: typeof fetch = async (url, options) => {
  const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_DB === 'true';
  const method = options?.method || 'GET';
  const path = new URL(url.toString()).pathname;
  
  if (isDev) {
    const color = method === 'GET' ? '\x1b[32m' : (method === 'POST' ? '\x1b[33m' : '\x1b[36m');
    console.log(`\x1b[90m[DB]\x1b[0m ${color}${method}\x1b[0m ${path}`);
    if (options?.body && typeof options.body === 'string') {
      try {
        const body = JSON.parse(options.body);
        console.log(`\x1b[90m     BODY:\x1b[0m`, JSON.stringify(body, null, 2).split('\n').slice(0, 5).join('\n') + (options.body.length > 200 ? '\n     ...' : ''));
      } catch {
        console.log(`\x1b[90m     BODY:\x1b[0m`, options.body.substring(0, 100));
      }
    }
  }
  return fetch(url, options);
};

// ─── Browser Client Singleton ────────────────────────────────────────────────
// Guard against "Multiple GoTrueClient instances" warning in Next.js dev mode.
// Using globalThis ensures only one instance is created per browser context
// even if this module is evaluated multiple times (hot reload, etc.)
declare global {
  // eslint-disable-next-line no-var
  var _supabaseBrowserClient: ReturnType<typeof createBrowserClient> | undefined;
}

export const supabase =
  globalThis._supabaseBrowserClient ??
  (globalThis._supabaseBrowserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: loggedFetch }
  }));

// ─── Admin Client (Server-Side Only) ────────────────────────────────────────
// For administrative tasks (bypassing RLS).
// Only use this in API routes and server components.
export const supabaseAdmin = typeof window === 'undefined'
  ? createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: { fetch: loggedFetch }
      }
    )
  : null as any;



