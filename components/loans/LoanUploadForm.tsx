"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_BYTES = 4 * 1024 * 1024; // sama dengan MAX_LOAN_SCAN_BYTES di lib/loans/config.ts
const ACCEPT = "application/pdf,image/jpeg,image/png";

/**
 * Unggah dokumen peminjaman yang SUDAH ditandatangani basah (scan/foto).
 * `reupload` = unggah ulang setelah ditolak.
 */
export function LoanUploadForm({ loanId, reupload = false }: { loanId: string; reupload?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (f && !ACCEPT.split(",").includes(f.type)) {
      setFile(null);
      e.target.value = "";
      return setError("Berkas harus berupa PDF, JPG, atau PNG.");
    }
    if (f && f.size > MAX_BYTES) {
      setFile(null);
      e.target.value = "";
      return setError(`Ukuran file maks. 4 MB. Ukuran file kamu: ${(f.size / (1024 * 1024)).toFixed(2)} MB.`);
    }
    setFile(f);
  }

  async function submit() {
    if (!file) return setError("Pilih berkas dokumen yang sudah ditandatangani.");
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/loans/${loanId}/signed-document`, { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Gagal mengunggah dokumen.");
        return;
      }
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={onPick}
          disabled={busy}
          aria-label="Dokumen peminjaman bertanda tangan"
          className="max-w-full text-xs file:mr-3 file:border file:border-line file:bg-mist file:px-3 file:py-1.5 file:text-xs"
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || !file}
          className="bg-petrol px-4 py-2 text-xs font-medium text-paper transition-colors hover:bg-petrol-light disabled:opacity-50"
        >
          {busy ? "Mengunggah…" : reupload ? "Unggah Ulang Dokumen" : "Unggah Dokumen"}
        </button>
      </div>
      <p className="text-xs text-core">PDF, JPG, atau PNG — maks. 4 MB. Pastikan kedua tanda tangan basah terlihat jelas.</p>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
