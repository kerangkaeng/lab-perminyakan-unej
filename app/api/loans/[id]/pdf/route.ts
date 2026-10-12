import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { generateLoanPdf } from "@/lib/loans/server";
import type { LoanRecord } from "@/lib/loans/config";

// Dokumen dibuat ulang setiap diminta (bukan disimpan), supaya selalu
// memakai tanda tangan & pemegang jabatan Kepala Lab/Laboran terbaru.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{32,36}$/i;

export async function GET(_req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  if (!UUID.test(id)) return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  const { data, error } = await supabaseServer().from("equipment_loans").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("Ambil equipment_loans error", error);
    return NextResponse.json({ error: "Gagal memuat data peminjaman." }, { status: 500 });
  }
  const loan = data as LoanRecord | null;
  // 404 (bukan 403) untuk milik orang lain, supaya keberadaan ID tidak bisa ditebak.
  if (!loan || (loan.requester_id !== session.usersId && session.appRole !== "admin")) {
    return NextResponse.json({ error: "Peminjaman tidak ditemukan." }, { status: 404 });
  }

  try {
    const pdf = await generateLoanPdf(loan);
    return new NextResponse(Buffer.from(pdf) as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Peminjaman-Alat-${loan.id.slice(0, 8)}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error("Generate PDF peminjaman error", e);
    return NextResponse.json({ error: "Gagal membuat dokumen PDF." }, { status: 500 });
  }
}
