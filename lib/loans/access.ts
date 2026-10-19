// Hak akses TINJAU dokumen peminjaman (server-only; memakai service role).
//
//   - Pengaju      : melihat peminjamannya sendiri.
//   - Admin        : melihat SEMUA peminjaman, tetapi hanya meninjau — tidak bisa ACC/tolak
//                    kecuali dia juga memegang jabatan Kepala Lab/Laboran.
//   - Kepala Lab / : melihat peminjaman yang melibatkan bidangnya dan memutuskan ACC/tolak
//     Laboran        (penegakan keputusan ada di app/api/admin/loans/[id]/review/route.ts).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Session } from "@/lib/auth/session";
import { loadUserStaffSlots, type StaffSlot } from "@/lib/loans/approvers";
import type { LoanRecord } from "@/lib/loans/config";

export type LoanReviewer = {
  isAdmin: boolean;
  slots: StaffSlot[];
  /** Admin atau pemegang jabatan Kepala Lab/Laboran. */
  canView: boolean;
};

export async function loadLoanReviewer(db: SupabaseClient, session: Session): Promise<LoanReviewer> {
  const isAdmin = session.appRole === "admin";
  const slots = await loadUserStaffSlots(db, session.usersId);
  return { isAdmin, slots, canView: isAdmin || slots.length > 0 };
}

/** Boleh MELIHAT dokumen peminjaman ini (bukan memutuskan). */
export function canViewLoan(reviewer: LoanReviewer, session: Session, loan: Pick<LoanRecord, "requester_id" | "bidang">): boolean {
  if (loan.requester_id === session.usersId) return true;
  if (reviewer.isAdmin) return true;
  return reviewer.slots.some((s) => loan.bidang.includes(s.bidang));
}
