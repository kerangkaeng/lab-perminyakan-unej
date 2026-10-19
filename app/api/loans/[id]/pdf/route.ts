import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { generateLoanApprovalPdf, generateLoanTemplatePdf } from "@/lib/loans/server";
import type { LoanRecord } from "@/lib/loans/config";
import { canViewLoan, loadLoanReviewer } from "@/lib/loans/access";

// Dua dokumen, dibuat ulang setiap diminta (tidak disimpan):
//   GET /api/loans/<id>/pdf?jenis=template     -> template formulir untuk ttd basah
//                                                 (default; tersedia sejak pengajuan dibuat)
//   GET /api/loans/<id>/pdf?jenis=persetujuan  -> surat persetujuan ber-ttd elektronik
//                                                 Kepala Lab & Laboran (hanya status "disetujui")

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{32,36}$/i;

export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  if (!UUID.test(id)) return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  const jenis = req.nextUrl.searchParams.get("jenis") === "persetujuan" ? "persetujuan" : "template";

  const { data, error } = await supabaseServer().from("equipment_loans").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("Ambil equipment_loans error", error);
    return NextResponse.json({ error: "Gagal memuat data peminjaman." }, { status: 500 });
  }
  const loan = data as LoanRecord | null;
  // 404 (bukan 403) untuk milik orang lain, supaya keberadaan ID tidak bisa ditebak.
  if (!loan) return NextResponse.json({ error: "Peminjaman tidak ditemukan." }, { status: 404 });
  if (loan.requester_id !== session.usersId) {
    let allowed = false;
    try {
      const reviewer = await loadLoanReviewer(supabaseServer(), session);
      allowed = canViewLoan(reviewer, session, loan);
    } catch (e) {
      console.error("loadLoanReviewer error", e);
    }
    if (!allowed) return NextResponse.json({ error: "Peminjaman tidak ditemukan." }, { status: 404 });
  }

  if (loan.status === "legacy") {
    return NextResponse.json({ error: "Dokumen ini dibuat dengan alur lama dan tidak tersedia lagi." }, { status: 410 });
  }
  if (jenis === "persetujuan" && loan.status !== "disetujui") {
    return NextResponse.json({ error: "Surat persetujuan baru tersedia setelah disetujui Kepala Lab dan Laboran." }, { status: 409 });
  }

  try {
    const pdf = jenis === "persetujuan" ? await generateLoanApprovalPdf(loan) : await generateLoanTemplatePdf(loan);
    const prefix = jenis === "persetujuan" ? "Surat-Persetujuan-Peminjaman" : "Template-Peminjaman-Alat";
    return new NextResponse(Buffer.from(pdf) as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${prefix}-${loan.id.slice(0, 8)}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error("Generate PDF peminjaman error", e);
    return NextResponse.json({ error: "Gagal membuat dokumen PDF." }, { status: 500 });
  }
}
