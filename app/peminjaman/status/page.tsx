import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LoanStatusBadge, ApprovalBadge } from "@/components/loans/LoanStatusBadge";
import { LoanUploadForm } from "@/components/loans/LoanUploadForm";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { loadApprovals } from "@/lib/loans/approvers";
import { loadLoanReviewer } from "@/lib/loans/access";
import { LAB_TITLE, approvalTitle, formatTanggalId, sortBidang, type LoanRecord } from "@/lib/loans/config";

export const revalidate = 0;

const linkCls = "border border-petrol px-3 py-1.5 text-xs text-petrol transition-colors hover:bg-petrol hover:text-paper";

export default async function StatusPeminjamanPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/peminjaman/status");

  const db = supabaseServer();
  const { data, error } = await db
    .from("equipment_loans")
    .select("*")
    .eq("requester_id", session.usersId)
    .order("created_at", { ascending: false })
    .limit(30);

  const loans = (data ?? []) as LoanRecord[];
  let approvals = new Map<string, Awaited<ReturnType<typeof loadApprovals>> extends Map<string, infer V> ? V : never>();
  let canReview = false;
  try {
    approvals = await loadApprovals(db, loans.map((l) => l.id));
    canReview = (await loadLoanReviewer(db, session)).canView;
  } catch (e) {
    console.error("Status peminjaman: gagal memuat persetujuan", e);
  }

  return (
    <DashboardShell title="Status Peminjaman">
      <div className="mb-8 flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-core">
          Unduh template, tanda tangani basah (Dosen Pembimbing dan Pemohon), lalu unggah hasil scan/foto di sini
          untuk ditinjau Kepala Lab dan Laboran.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/peminjaman" className={linkCls}>
            Buat Peminjaman Baru
          </Link>
          {canReview && (
            <Link href="/peminjaman/kelola" className={linkCls}>
              Kelola Peminjaman
            </Link>
          )}
        </div>
      </div>

      {error ? (
        <p className="max-w-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">Gagal memuat data peminjaman.</p>
      ) : loans.length === 0 ? (
        <p className="text-sm text-core">Belum ada peminjaman.</p>
      ) : (
        <ul className="max-w-3xl divide-y divide-line border border-line">
          {loans.map((loan) => {
            const list = approvals.get(loan.id) ?? [];
            return (
              <li key={loan.id} className="space-y-3 px-4 py-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {loan.items.length} item · {sortBidang(loan.bidang).map((b) => LAB_TITLE[b]).join(" + ")}
                    </p>
                    <p className="text-xs text-core">
                      Pinjam {formatTanggalId(loan.tanggal_pinjam)} – kembali {formatTanggalId(loan.tanggal_kembali)}
                    </p>
                    <p className="mt-0.5 max-w-md truncate text-xs text-core" title={loan.keperluan}>
                      {loan.keperluan}
                    </p>
                  </div>
                  <LoanStatusBadge status={loan.status} />
                </div>

                {list.length > 0 && loan.status !== "menunggu_upload" && (
                  <div className="flex flex-wrap gap-2">
                    {list.map((a) => (
                      <span key={a.id} className="inline-flex items-center gap-2 text-xs text-core">
                        {approvalTitle(a.role_type, a.bidang)}
                        <ApprovalBadge status={a.status} />
                      </span>
                    ))}
                  </div>
                )}

                {loan.status === "ditolak" && loan.catatan_penolakan && (
                  <p className="border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                    Alasan penolakan: {loan.catatan_penolakan}
                  </p>
                )}

                {loan.status !== "legacy" && (
                  <div className="flex flex-wrap gap-2">
                    {(loan.status === "menunggu_upload" || loan.status === "ditolak") && (
                      <a href={`/api/loans/${loan.id}/pdf`} target="_blank" rel="noopener noreferrer" className={linkCls}>
                        Unduh Template
                      </a>
                    )}
                    {loan.signed_doc_key && (
                      <a href={`/api/loans/${loan.id}/signed-document`} target="_blank" rel="noopener noreferrer" className={linkCls}>
                        Lihat Dokumen Terunggah
                      </a>
                    )}
                    {loan.status === "disetujui" && (
                      <a href={`/api/loans/${loan.id}/pdf?jenis=persetujuan`} target="_blank" rel="noopener noreferrer" className={linkCls}>
                        Unduh Surat Persetujuan
                      </a>
                    )}
                  </div>
                )}

                {(loan.status === "menunggu_upload" || loan.status === "ditolak") && (
                  <LoanUploadForm loanId={loan.id} reupload={loan.status === "ditolak"} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardShell>
  );
}
