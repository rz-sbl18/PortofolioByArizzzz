import { createBrowserClient } from "@supabase/ssr";

// Klien untuk halaman admin (berjalan di browser, memakai sesi login).
// Keamanan sebenarnya dijaga aturan RLS di database: hanya akun admin yang bisa menulis.
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
