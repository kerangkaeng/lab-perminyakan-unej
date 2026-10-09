"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_BYTES = 1 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + second).toUpperCase();
}

/**
 * Foto profil yang diunggah sendiri oleh user. `src` adalah signed URL
 * sementara (atau null kalau belum punya foto).
 */
export function ProfilePhoto({ src, name }: { src: string | null; name: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shown = preview ?? (broken ? null : src);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    if (!ACCEPT.split(",").includes(file.type)) {
      setError("Format foto harus JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Ukuran foto maks. 1 MB. Ukuran file kamu: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`);
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/profile/photo", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Gagal mengunggah foto.");
        return;
      }
      setPreview(body.url);
      setBroken(false);
      router.refresh();
    } catch {
      setError("Gagal mengunggah foto. Periksa koneksi kamu.");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    if (!confirm("Hapus foto profil?")) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/profile/photo", { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Gagal menghapus foto.");
        return;
      }
      setPreview(null);
      setBroken(true);
      router.refresh();
    } catch {
      setError("Gagal menghapus foto. Periksa koneksi kamu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6">
      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shown}
          alt={`Foto profil ${name}`}
          referrerPolicy="no-referrer"
          className="h-32 w-32 border border-line object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="flex h-32 w-32 items-center justify-center border border-line bg-mist font-display text-3xl text-core">
          {initialsOf(name)}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onPick} />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="border border-line px-3 py-1.5 text-xs font-mono uppercase text-ink hover:bg-mist disabled:opacity-50"
        >
          {busy ? "Memproses…" : shown ? "Ganti foto" : "Unggah foto"}
        </button>
        {shown && (
          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            className="text-xs font-mono uppercase text-red-700 hover:underline disabled:opacity-50"
          >
            Hapus
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-core">JPG, PNG, atau WebP. Maks. 1 MB.</p>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
