import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
  (globalThis._supabaseBrowserClient = createBrowserClient(supabaseUrl, supabaseAnonKey));

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
      }
    )
  : null as any;



