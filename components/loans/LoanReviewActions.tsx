"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Tombol ACC / Tolak untuk Kepala Lab & Laboran (hanya dirender kalau user punya slot pending). */
export function LoanReviewActions({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "reject">("idle");
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(action: "approve" | "reject") {
    if (action === "approve" && !window.confirm("Setujui peminjaman ini? Tanda tangan elektronik kamu akan dipakai pada surat persetujuan.")) {
      return;
    }
    if (action === "reject" && catatan.trim().length < 5) {
      return setError("Tulis alasan penolakan (minimal 5 karakter).");
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/loans/${loanId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, catatan }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Gagal menyimpan keputusan.");
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
    <div className="space-y-3">
      {mode === "idle" ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => send("approve")}
            disabled={busy}
            className="bg-petrol px-4 py-2 text-xs font-medium text-paper transition-colors hover:bg-petrol-light disabled:opacity-50"
          >
            {busy ? "Menyimpan…" : "Setujui (ACC)"}
          </button>
          <button
            type="button"
            onClick={() => setMode("reject")}
            disabled={busy}
            className="border border-red-300 px-4 py-2 text-xs text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            Tolak…
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Alasan penolakan (akan terlihat oleh pengaju)"
            className="w-full border border-line bg-mist px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => send("reject")}
              disabled={busy}
              className="bg-red-700 px-4 py-2 text-xs font-medium text-paper transition-colors hover:bg-red-800 disabled:opacity-50"
            >
              {busy ? "Menyimpan…" : "Kirim Penolakan"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("idle");
                setError(null);
              }}
              disabled={busy}
              className="border border-line px-4 py-2 text-xs text-core hover:border-petrol disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
