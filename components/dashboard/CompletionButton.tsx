"use client";

import { useState } from "react";
import { JenisKegiatan } from "@/types";
import { CompletionModal } from "./CompletionModal";

export function CompletionButton({
  requestId,
  jenisKegiatan,
  status,
  completed,
}: {
  requestId: string;
  jenisKegiatan: JenisKegiatan;
  status: "pending" | "approved" | "rejected";
  completed: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (status !== "approved") return <span className="text-xs text-core">-</span>;

  if (completed) {
    return <span className="font-mono text-[11px] uppercase tracking-wide text-petrol">Selesai</span>;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs border border-petrol text-petrol px-3 py-1.5 hover:bg-petrol hover:text-paper transition-colors whitespace-nowrap"
      >
        Lengkapi Administrasi
      </button>
      {open && (
        <CompletionModal requestId={requestId} jenisKegiatan={jenisKegiatan} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
