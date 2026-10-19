import { LOAN_STATUS_LABEL, type ApprovalStatus, type LoanStatus } from "@/lib/loans/config";
import { cn } from "@/lib/utils";

const LOAN_CLASS: Record<LoanStatus, string> = {
  menunggu_upload: "text-amber-800 border-amber-300",
  menunggu_acc: "text-core border-line",
  ditolak: "text-red-700 border-red-300",
  disetujui: "text-petrol border-petrol",
  legacy: "text-core border-line",
};

const BADGE = "font-mono text-[11px] uppercase tracking-wide px-2 py-1 border whitespace-nowrap";

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return <span className={cn(BADGE, LOAN_CLASS[status])}>{LOAN_STATUS_LABEL[status]}</span>;
}

const APPROVAL: Record<ApprovalStatus, { label: string; className: string }> = {
  pending: { label: "Menunggu", className: "text-core border-line" },
  approved: { label: "ACC", className: "text-petrol border-petrol" },
  rejected: { label: "Ditolak", className: "text-red-700 border-red-300" },
};

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const c = APPROVAL[status];
  return <span className={cn(BADGE, c.className)}>{c.label}</span>;
}
