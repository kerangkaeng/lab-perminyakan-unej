// Supabase client for use in Client Components ("use client").
// Tahap 2: aktifkan ketika data sudah dipindahkan dari /data ke Supabase.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabaseBrowser = () => createClient(supabaseUrl, supabaseAnonKey);
