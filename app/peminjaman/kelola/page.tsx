import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LoanStatusBadge, ApprovalBadge } from "@/components/loans/LoanStatusBadge";
import { LoanReviewActions } from "@/components/loans/LoanReviewActions";
import { DeleteLoanButton } from "@/components/loans/DeleteLoanButton";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { loadApprovals } from "@/lib/loans/approvers";
import { loadLoanReviewer } from "@/lib/loans/access";
import { LAB_TITLE, approvalTitle, formatTanggalId, sortBidang, type LoanRecord, type LoanStatus } from "@/lib/loans/config";

// Halaman tinjau dokumen peminjaman bertanda tangan.
//   - Admin            : boleh melihat semua, tapi TIDAK ada tombol ACC/Tolak
//                        (kecuali dia juga Kepala Lab/Laboran).
//   - Kepala Lab/Laboran: melihat peminjaman bidangnya + tombol ACC/Tolak
//                        untuk slot miliknya yang masih pending.
// Penegakan sebenarnya ada di API review (cek jabatan di lab_roles); tombol
// di sini hanya soal tampilan.
export const revalidate = 0;

const linkCls = "border border-petrol px-3 py-1.5 text-xs text-petrol transition-colors hover:bg-petrol hover:text-paper";
const ORDER: Record<LoanStatus, number> = { menunggu_acc: 0, ditolak: 1, disetujui: 2, menunggu_upload: 3, legacy: 4 };

type Requester = { id: string; nama: string; nim: string | null; nip: string | null; prodi: string | null };

export default async function KelolaPeminjamanPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/peminjaman/kelola");

  const db = supabaseServer();
  const reviewer = await loadLoanReviewer(db, session).catch(() => null);

  if (!reviewer || !reviewer.canView) {
    return (
      <DashboardShell title="Kelola Peminjaman">
        <p className="max-w-xl border border-line bg-mist px-4 py-3 text-sm text-core">
          Halaman ini hanya untuk Admin, Kepala Laboratorium, dan Laboran.{" "}
          <Link href="/peminjaman/status" className="text-petrol underline">
            Lihat status peminjaman saya
          </Link>
        </p>
      </DashboardShell>
    );
  }

  const { data, error } = await db
    .from("equipment_loans")
    .select("*")
    .in("status", ["menunggu_upload", "menunggu_acc", "ditolak", "disetujui"])
    .order("created_at", { ascending: false })
    .limit(200);

  // Admin melihat semua; Kepala Lab/Laboran hanya yang melibatkan bidangnya.
  const mySlotBidang = new Set(reviewer.slots.map((s) => s.bidang));
  const loans = ((data ?? []) as LoanRecord[])
    // "menunggu_upload" (belum ada dokumen) hanya ditampilkan ke admin, supaya bisa dihapus kalau salah isi.
    .filter((l) => (reviewer.isAdmin && l.status === "menunggu_upload") || (l.status !== "menunggu_upload" && (reviewer.isAdmin || l.bidang.some((b) => mySlotBidang.has(b)))))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  const approvals = await loadApprovals(db, loans.map((l) => l.id)).catch(() => new Map());
  const ids = Array.from(new Set(loans.map((l) => l.requester_id)));
  const { data: users } = ids.length
    ? await db.from("users").select("id, nama, nim, nip, prodi").in("id", ids)
    : { data: [] as Requester[] };
  const byId = new Map(((users ?? []) as Requester[]).map((u) => [u.id, u]));

  const viewOnly = reviewer.slots.length === 0;

  return (
    <DashboardShell title="Kelola Peminjaman">
      <p className="mb-8 max-w-2xl text-core">
        Tinjau dokumen peminjaman yang sudah ditandatangani pengaju.
        {viewOnly
          ? " Sebagai admin Anda hanya dapat melihat; persetujuan atau penolakan dilakukan oleh Kepala Lab dan Laboran. Pengajuan yang belum mengunggah dokumen dapat dihapus."
          : " Setujui atau tolak peminjaman yang menunggu keputusan Anda."}
      </p>

      {error ? (
        <p className="max-w-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">Gagal memuat data peminjaman.</p>
      ) : loans.length === 0 ? (
        <p className="text-sm text-core">Belum ada pengajuan peminjaman.</p>
      ) : (
        <ul className="max-w-3xl divide-y divide-line border border-line">
          {loans.map((loan) => {
            const list = approvals.get(loan.id) ?? [];
            const u = byId.get(loan.requester_id);
            const canDecide =
              loan.status === "menunggu_acc" &&
              list.some(
                (a: { status: string; role_type: string; bidang: string }) =>
                  a.status === "pending" && reviewer.slots.some((s) => s.role_type === a.role_type && s.bidang === a.bidang)
              );
            return (
              <li key={loan.id} className="space-y-3 px-4 py-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {u?.nama ?? "—"}
                      <span className="ml-2 font-mono text-xs font-normal text-core">{u?.nim ?? u?.nip ?? ""}</span>
                    </p>
                    {u?.prodi && <p className="text-xs text-core">{u.prodi}</p>}
                    <p className="mt-1 text-xs text-core">
                      {loan.items.length} item · {sortBidang(loan.bidang).map((b) => LAB_TITLE[b]).join(" + ")} · Pinjam{" "}
                      {formatTanggalId(loan.tanggal_pinjam)} – kembali {formatTanggalId(loan.tanggal_kembali)}
                    </p>
                    <p className="mt-0.5 max-w-md text-xs text-core">{loan.keperluan}</p>
                  </div>
                  <LoanStatusBadge status={loan.status} />
                </div>

                <ul className="list-inside list-disc text-xs text-core">
                  {loan.items.map((it) => (
                    <li key={`${it.equipment_id}-${it.bidang}`}>
                      {it.equipment_name} — {String(it.jumlah).replace(".", ",")} {it.satuan}
                    </li>
                  ))}
                </ul>

                {list.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {list.map((a: { id: string; role_type: "kepala_lab" | "laboran"; bidang: "pemboran_produksi" | "reservoir"; status: "pending" | "approved" | "rejected" }) => (
                      <span key={a.id} className="inline-flex items-center gap-2 text-xs text-core">
                        {approvalTitle(a.role_type, a.bidang)}
                        <ApprovalBadge status={a.status} />
                      </span>
                    ))}
                  </div>
                )}

                {loan.status === "ditolak" && loan.catatan_penolakan && (
                  <p className="border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">Alasan penolakan: {loan.catatan_penolakan}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {loan.signed_doc_key && (
                    <a href={`/api/loans/${loan.id}/signed-document`} target="_blank" rel="noopener noreferrer" className={linkCls}>
                      Lihat Dokumen Bertanda Tangan
                    </a>
                  )}
                  {loan.status === "disetujui" && (
                    <a href={`/api/loans/${loan.id}/pdf?jenis=persetujuan`} target="_blank" rel="noopener noreferrer" className={linkCls}>
                      Surat Persetujuan
                    </a>
                  )}
                </div>

                {loan.status === "menunggu_upload" && (
                  <p className="text-xs text-core">Pengaju belum mengunggah dokumen bertanda tangan.</p>
                )}
                {reviewer.isAdmin && loan.status === "menunggu_upload" && !loan.signed_doc_key && (
                  <DeleteLoanButton loanId={loan.id} />
                )}
                {canDecide && <LoanReviewActions loanId={loan.id} />}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardShell>
  );
}
