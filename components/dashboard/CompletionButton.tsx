"use client";

import { useState } from "react";
import { JenisKegiatan } from "@/types";
import { CompletionModal } from "./CompletionModal";

export function CompletionButton({
  requestId,
  jenisKegiatan,
  status,
  completed,
  completedAt,
}: {
  requestId: string;
  jenisKegiatan: JenisKegiatan;
  status: "pending" | "approved" | "rejected";
  completed: boolean;
  // `completed_at` tidak di-null-kan saat admin membuka kembali (reopen)
  // administrasi untuk direvisi — jadi ini dipakai sebagai penanda
  // "pernah completed sebelumnya" untuk membedakan pengisian pertama kali
  // (form kosong) vs revisi (form di-prefill dari data lama).
  completedAt: string | null;
}) {
  const [open, setOpen] = useState(false);

  if (status !== "approved") return <span className="text-xs text-core">-</span>;

  if (completed) {
    return <span className="font-mono text-[11px] uppercase tracking-wide text-petrol">Selesai</span>;
  }

  const isRevision = !!completedAt;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`text-xs border px-3 py-1.5 transition-colors whitespace-nowrap ${
          isRevision
            ? "border-rig text-rig hover:bg-rig hover:text-paper"
            : "border-petrol text-petrol hover:bg-petrol hover:text-paper"
        }`}
      >
        {isRevision ? "Revisi Administrasi" : "Lengkapi Administrasi"}
      </button>
      {open && (
        <CompletionModal
          requestId={requestId}
          jenisKegiatan={jenisKegiatan}
          isRevision={isRevision}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
