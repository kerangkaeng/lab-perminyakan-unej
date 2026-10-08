"use client";

import { useState } from "react";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + second).toUpperCase();
}

export function ProfilePhoto({ src, alt, name }: { src: string; alt: string; name?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    // Sengaja TIDAK disembunyikan diam-diam: tampilkan placeholder inisial +
    // keterangan, supaya kelihatan kalau foto SISTER gagal dimuat (base URL
    // salah, diblokir hotlink, atau file tidak ada) — bukan sekadar kosong.
    return (
      <div className="mb-6">
        <div className="flex h-32 w-32 items-center justify-center border border-line bg-mist font-display text-3xl text-core">
          {initialsOf(name ?? alt)}
        </div>
        <p className="mt-2 text-xs text-core">Foto SISTER tidak dapat dimuat.</p>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className="mb-6 h-32 w-32 border border-line object-cover"
      onError={() => setFailed(true)}
    />
  );
}
