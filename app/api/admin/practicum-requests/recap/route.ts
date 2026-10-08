import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { PracticumRequest } from "@/types";
import { filterAndSortRequests, STATUS_FILTER_LABELS, type SortDirection } from "@/lib/admin/requestFilters";
import { buildRecapWorkbook } from "@/lib/admin/recapExcel";

// GET /api/admin/practicum-requests/recap?jenis=...&lab=...&status=...&urutan=...
// &dari=YYYY-MM-DD&sampai=YYYY-MM-DD
//
// Query params SENGAJA sama persis dengan yang dipakai RequestsFilterBar
// (jenis/lab/status/urutan) supaya tombol "Download Excel" di halaman
// Kelola Pengajuan cukup menambahkan path ini ke URL saat ini apa adanya
// (lihat RequestsFilterBar.tsx) — dan dua param tambahan (dari/sampai)
// untuk dipakai halaman Rekap terpisah (rentang tanggal kegiatan).
//
// Admin-only — ini laporan data pribadi pengaju (nama, NIM/NIP, prodi)
// dalam bentuk file yang bisa diunduh & disebarkan, jadi aksesnya lebih
// ketat daripada sekadar "bisa melihat" (canViewPracticumRequests, yang
// juga meloloskan role asisten).
export async function GET(req: NextRequest) {
  const session = await getSession();
  const token = getSessionToken();
  if (!session || !token || session.appRole !== "admin") {
    return NextResponse.json({ error: "Kamu tidak berhak mengunduh rekap ini." }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const jenis = searchParams.get("jenis") ?? "all";
  const lab = searchParams.get("lab") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const urutan: SortDirection = searchParams.get("urutan") === "asc" ? "asc" : "desc";
  const dariTanggal = searchParams.get("dari") || undefined;
  const sampaiTanggal = searchParams.get("sampai") || undefined;

  const supabase = supabaseAuthed(token);
  const { data, error } = await supabase
    .from("practicum_requests")
    .select("*, requester:users!requester_id(nama, nim, prodi)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Gagal memuat data pengajuan." }, { status: 500 });
  }

  const requests = (data as unknown as PracticumRequest[]) ?? [];
  const filtered = filterAndSortRequests(requests, {
    jenis,
    lab,
    status,
    urutan,
    dariTanggal,
    sampaiTanggal,
  });

  const titleParts = ["Rekap Kegiatan Lab Perminyakan UNEJ"];
  if (dariTanggal || sampaiTanggal) {
    titleParts.push(`Periode ${dariTanggal ?? "awal"} s/d ${sampaiTanggal ?? "sekarang"}`);
  }
  if (lab !== "all") titleParts.push(`Lab: ${lab}`);
  if (jenis !== "all") titleParts.push(jenis === "praktikum" ? "Praktikum" : "Non-Praktikum");
  if (status !== "all") {
    titleParts.push(STATUS_FILTER_LABELS[status as keyof typeof STATUS_FILTER_LABELS] ?? status);
  }

  const workbook = await buildRecapWorkbook(filtered, { title: titleParts.join(" — ") });
  const buffer = await workbook.xlsx.writeBuffer();

  const todayStr = new Date().toISOString().slice(0, 10);
  const filename = `rekap-kegiatan-lab-${todayStr}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
