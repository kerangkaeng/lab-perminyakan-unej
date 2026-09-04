"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { facilities } from "@/data/facilities";

export function AjukanForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      praktikum_nama: data.get("praktikum_nama"),
      modul: data.get("modul"),
      tanggal: data.get("tanggal"),
      jam_mulai: data.get("jam_mulai"),
      jam_selesai: data.get("jam_selesai"),
      lokasi: data.get("lokasi"),
    };

    const res = await fetch("/api/practicum/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Gagal mengirim pengajuan.");
      return;
    }

    setSuccess(true);
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      {error && (
        <p className="text-sm text-red-700 border border-red-300 bg-red-50 px-4 py-3">{error}</p>
      )}
      {success && (
        <p className="text-sm text-petrol border border-petrol bg-mist px-4 py-3">
          Pengajuan berhasil dikirim. Pantau statusnya di menu &ldquo;Status Pengajuan&rdquo;.
        </p>
      )}

      <div>
        <label className="block text-xs font-mono uppercase text-core mb-1">
          Praktikum
        </label>
        <select
          name="praktikum_nama"
          required
          className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
        >
          <option value="">Pilih praktikum</option>
          {facilities.flatMap((f) => f.modules ?? []).map((praktikum) => (
            <option key={praktikum} value={praktikum}>
              {praktikum}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-mono uppercase text-core mb-1">Modul</label>
        <input
          name="modul"
          required
          placeholder="mis. Pengukuran Rheologi Lumpur"
          className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Tanggal</label>
          <input
            name="tanggal"
            type="date"
            required
            className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Jam Mulai</label>
          <input
            name="jam_mulai"
            type="time"
            required
            className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Jam Selesai</label>
          <input
            name="jam_selesai"
            type="time"
            required
            className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono uppercase text-core mb-1">Laboratorium</label>
        <select
          name="lokasi"
          required
          className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
        >
          <option value="">Pilih laboratorium</option>
          {facilities.map((f) => (
            <option key={f.slug} value={f.name}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit">{loading ? "Mengirim..." : "Kirim Pengajuan"}</Button>
    </form>
  );
}
