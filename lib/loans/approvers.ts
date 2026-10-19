// Helper SERVER-ONLY untuk persetujuan peminjaman (Kepala Lab + Laboran).
// Memakai service role — jangan diimpor dari komponen client.
//
// Siapa yang berhak menyetujui ditentukan dari tabel lab_roles (jabatan
// kepala_lab / laboran per bidang), BUKAN dari users.role — jadi Kepala Lab
// Reservoir tidak bisa meng-ACC peminjaman alat Lab Pemboran & Produksi.
import type { SupabaseClient } from "@supabase/supabase-js";
import { BIDANG_ORDER, LAB_TITLE, type ApprovalRole, type LoanApproval } from "@/lib/loans/config";
import type { Bidang } from "@/lib/lab-roles";

export type StaffSlot = { role_type: ApprovalRole; bidang: Bidang };

/** Jabatan Kepala Lab/Laboran yang dipegang user (bisa lebih dari satu bidang). */
export async function loadUserStaffSlots(db: SupabaseClient, usersId: string): Promise<StaffSlot[]> {
  const { data, error } = await db
    .from("lab_roles")
    .select("role_type, bidang")
    .eq("user_id", usersId)
    .in("role_type", ["kepala_lab", "laboran"]);
  if (error) throw error;
  return ((data ?? []) as { role_type: ApprovalRole; bidang: Bidang | null }[]).filter(
    (r): r is StaffSlot => !!r.bidang
  );
}

/** Pesan untuk tiap bidang yang jabatan Kepala Lab/Laboran-nya belum terisi (kosong = semua lengkap). */
export async function findMissingStaff(db: SupabaseClient, bidang: Bidang[]): Promise<string[]> {
  const { data, error } = await db
    .from("lab_roles")
    .select("role_type, bidang")
    .in("role_type", ["kepala_lab", "laboran"])
    .in("bidang", bidang);
  if (error) throw error;
  const rows = (data ?? []) as { role_type: ApprovalRole; bidang: Bidang }[];
  const missing: string[] = [];
  for (const b of BIDANG_ORDER) {
    if (!bidang.includes(b)) continue;
    if (!rows.some((r) => r.role_type === "kepala_lab" && r.bidang === b)) {
      missing.push(`Kepala Laboratorium ${LAB_TITLE[b]}`);
    }
    if (!rows.some((r) => r.role_type === "laboran" && r.bidang === b)) {
      missing.push(`Laboran ${LAB_TITLE[b]}`);
    }
  }
  return missing;
}

/** (Re)buat slot persetujuan untuk sebuah peminjaman: semuanya `pending`. */
export async function resetApprovalSlots(db: SupabaseClient, loanId: string, bidang: Bidang[]): Promise<void> {
  const del = await db.from("equipment_loan_approvals").delete().eq("loan_id", loanId);
  if (del.error) throw del.error;

  const rows = bidang.flatMap((b) =>
    (["kepala_lab", "laboran"] as const).map((role_type) => ({ loan_id: loanId, role_type, bidang: b }))
  );
  const ins = await db.from("equipment_loan_approvals").insert(rows);
  if (ins.error) throw ins.error;
}

export async function loadApprovals(db: SupabaseClient, loanIds: string[]): Promise<Map<string, LoanApproval[]>> {
  const map = new Map<string, LoanApproval[]>();
  if (loanIds.length === 0) return map;
  const { data, error } = await db
    .from("equipment_loan_approvals")
    .select("id, loan_id, role_type, bidang, status, approver_id, decided_at, catatan")
    .in("loan_id", loanIds);
  if (error) throw error;
  for (const row of (data ?? []) as LoanApproval[]) {
    const list = map.get(row.loan_id) ?? [];
    list.push(row);
    map.set(row.loan_id, list);
  }
  // Urutan tampil: Kepala Lab dulu, lalu Laboran; di dalamnya mengikuti BIDANG_ORDER.
  for (const list of map.values()) {
    list.sort(
      (a, b) =>
        (a.role_type === b.role_type ? 0 : a.role_type === "kepala_lab" ? -1 : 1) ||
        BIDANG_ORDER.indexOf(a.bidang) - BIDANG_ORDER.indexOf(b.bidang)
    );
  }
  return map;
}
