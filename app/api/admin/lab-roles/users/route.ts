import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";

// Pencarian user terdaftar untuk dipilih sebagai pemegang jabatan (admin saja).
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.appRole !== "admin") {
    return NextResponse.json({ error: "Kamu tidak berhak melakukan aksi ini." }, { status: 403 });
  }

  // Buang karakter yang punya arti khusus di filter PostgREST.
  const q = (req.nextUrl.searchParams.get("q") ?? "").replace(/[,()%*\\]/g, " ").trim();
  if (q.length < 2) return NextResponse.json({ users: [] });

  const { data, error } = await supabaseServer()
    .from("users")
    .select("id, nama, nim, nip, user_type")
    .or(`nama.ilike.%${q}%,nim.ilike.%${q}%,nip.ilike.%${q}%,identifier.ilike.%${q}%`)
    .order("nama", { ascending: true })
    .limit(8);

  if (error) {
    console.error("Cari user error", error);
    return NextResponse.json({ error: "Gagal mencari user." }, { status: 500 });
  }
  return NextResponse.json({ users: data ?? [] });
}
