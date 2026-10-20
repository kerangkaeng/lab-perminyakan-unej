"use client";

import { useState } from "react";

/** Satu baris: isi nama + gelar seorang dosen (dipakai di tanda tangan surat). */
export function NamaGelarEditor({ userId, initial, placeholder }: { userId: string; initial: string | null; placeholder: string }) {
  const [value, setValue] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = value.trim() !== saved.trim();

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/nama-gelar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_gelar: value }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: body.error ?? "Gagal menyimpan." });
        return;
      }
      const next = body.nama_gelar ?? "";
      setValue(next);
      setSaved(next);
      setMsg({ ok: true, text: next ? "Tersimpan." : "Dihapus (surat memakai nama dari SSO)." });
    } catch {
      setMsg({ ok: false, text: "Gagal terhubung ke server." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          maxLength={150}
          className="w-full min-w-0 border border-line bg-paper px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="shrink-0 border border-petrol px-3 py-1.5 text-xs text-petrol transition-colors hover:bg-petrol hover:text-paper disabled:opacity-40"
        >
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
      {msg && <p className={`text-xs ${msg.ok ? "text-core" : "text-red-700"}`}>{msg.text}</p>}
    </div>
  );
}
