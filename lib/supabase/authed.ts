// Client Supabase server-side yang membawa JWT sesi user (CAS) sebagai
// Authorization header, supaya query tunduk ke RLS sebagai user tersebut
// (auth.uid() akan cocok dengan users.auth_uid miliknya).
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export function supabaseAuthed(jwt: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  });
}

// Client anon biasa (tanpa sesi user) — dipakai untuk data yang memang
// publik, misalnya menu Jadwal yang menampilkan practicum_requests dengan
// status='approved' lewat policy RLS khusus role anon.
export function supabasePublic() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
