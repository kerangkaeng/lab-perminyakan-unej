"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_BYTES = 1 * 1024 * 1024; // sama dengan MAX_SIGNATURE_BYTES di lib/storage/b2.ts (server-only)
const ACCEPT = "image/png,image/jpeg";

/**
 * Unggah/ganti/hapus tanda tangan milik sendiri. Dipakai pada dokumen
 * peminjaman (pengaju, Kepala Lab, Laboran). `src` = URL tanda tangan saat
 * ini atau null.
 */
export function SignatureUploader({ src }: { src: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shown = removed ? null : preview ?? src;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (!ACCEPT.split(",").includes(file.type)) {
      setError("Format harus PNG atau JPG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Ukuran file maks. 1 MB. Ukuran file kamu: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`);
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/profile/signature", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Gagal mengunggah tanda tangan.");
        return;
      }
      setPreview(URL.createObjectURL(file));
      setRemoved(false);
      router.refresh();
    } catch {
      setError("Gagal mengunggah tanda tangan. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/profile/signature", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Gagal menghapus tanda tangan.");
        return;
      }
      setPreview(null);
      setRemoved(true);
      router.refresh();
    } catch {
      setError("Gagal menghapus tanda tangan. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-line py-3">
      <p className="text-xs font-mono uppercase text-core">Tanda Tangan</p>
      <p className="mt-1 text-xs text-core">
        Dipakai otomatis pada dokumen peminjaman alat. Gunakan PNG berlatar transparan atau foto tanda
        tangan di kertas putih (maks. 1 MB).
      </p>

      <div className="mt-3 flex h-24 w-56 items-center justify-center border border-line bg-white">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            alt="Tanda tangan"
            className="max-h-full max-w-full object-contain"
            onError={() => setRemoved(true)}
          />
        ) : (
          <span className="text-xs text-core">Belum ada tanda tangan</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="bg-petrol px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-petrol-light disabled:opacity-50"
        >
          {busy ? "Memproses…" : shown ? "Ganti" : "Unggah"}
        </button>
        {shown && (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="border border-line px-3 py-1.5 text-xs text-ink transition-colors hover:border-red-400 hover:text-red-700 disabled:opacity-50"
          >
            Hapus
          </button>
        )}
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onPick} />
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
