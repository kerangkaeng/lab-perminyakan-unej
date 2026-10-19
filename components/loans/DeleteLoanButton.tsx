"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Hapus pengajuan peminjaman yang belum mengunggah dokumen (khusus admin; dicek ulang di API). */
export function DeleteLoanButton({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm("Hapus pengajuan ini secara permanen dari database? Tindakan ini tidak bisa dibatalkan.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/loans/${loanId}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Gagal menghapus pengajuan.");
        return;
      }
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="border border-red-300 px-3 py-1.5 text-xs text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {busy ? "Menghapus…" : "Hapus Pengajuan"}
      </button>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
