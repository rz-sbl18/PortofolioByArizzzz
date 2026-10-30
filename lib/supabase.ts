import { createClient } from "@supabase/supabase-js";

// Klien untuk membaca data publik (hanya baris berstatus published yang bisa dibaca).
// Memakai publishable key, aman berada di sisi website.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
