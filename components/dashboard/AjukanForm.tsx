"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { NON_PRAKTIKUM_OPTIONS } from "@/lib/constants/kegiatan";
import { supabasePublic } from "@/lib/supabase/authed";
import { nonPraktikumLabel } from "@/lib/constants/kegiatan";

type JenisKegiatan = "praktikum" | "non_praktikum";

type ConflictRow = {
  id: string;
  jenis_kegiatan: JenisKegiatan;
  praktikum_nama: string | null;
  modul: string | null;
  kegiatan_non_praktikum: string | null;
  deskripsi_lainnya: string | null;
  jam_mulai: string;
  jam_selesai: string;
  status: "approved" | "pending";
};

function conflictLabel(c: ConflictRow) {
  return c.jenis_kegiatan === "praktikum"
    ? [c.praktikum_nama, c.modul].filter(Boolean).join(" — ")
    : c.kegiatan_non_praktikum === "lainnya" && c.deskripsi_lainnya
    ? c.deskripsi_lainnya
    : nonPraktikumLabel(c.kegiatan_non_praktikum);
}

export function AjukanForm({
  facilityNames,
  practicumNames,
}: {
  facilityNames: string[];
  practicumNames: string[];
}) {
  const router = useRouter();
  const [jenis, setJenis] = useState<JenisKegiatan>("praktikum");
  const [kegiatanNonPraktikum, setKegiatanNonPraktikum] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Field-field ini perlu jadi controlled state (bukan cuma dibaca lewat
  // FormData saat submit) supaya bisa dipakai memicu pengecekan bentrok
  // jadwal secara langsung saat diisi. `name` tetap dipasang di elemen
  // input-nya masing-masing supaya FormData saat submit tetap jalan
  // seperti sebelumnya.
  const [lokasi, setLokasi] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [jamMulai, setJamMulai] = useState("");
  const [jamSelesai, setJamSelesai] = useState("");

  const [conflicts, setConflicts] = useState<ConflictRow[]>([]);
  const [checkingConflict, setCheckingConflict] = useState(false);

  // Cek jadwal bentrok: hanya jalan kalau lab, tanggal, jam mulai & jam
  // selesai semuanya sudah terisi dan valid (mulai < selesai). Dibuat
  // debounce 400ms supaya tidak nge-query tiap ketikan. Ini HANYA
  // peringatan, bukan validasi yang memblokir — pengaju tetap bisa kirim
  // pengajuan meski ada bentrok, karena keputusan akhir tetap di admin.
  useEffect(() => {
    if (!lokasi || !tanggal || !jamMulai || !jamSelesai || jamMulai >= jamSelesai) {
      setConflicts([]);
      return;
    }

    let active = true;
    setCheckingConflict(true);

    const timeout = setTimeout(async () => {
      const supabase = supabasePublic();
      // Dua kegiatan bentrok kalau: kegiatan lain mulai sebelum kegiatan
      // baru selesai, DAN kegiatan lain selesai setelah kegiatan baru
      // mulai (overlap klasik dua rentang waktu).
      const { data, error } = await supabase
        .from("practicum_requests")
        .select(
          "id, jenis_kegiatan, praktikum_nama, modul, kegiatan_non_praktikum, deskripsi_lainnya, jam_mulai, jam_selesai, status"
        )
        .in("status", ["approved", "pending"])
        .eq("lokasi", lokasi)
        .eq("tanggal", tanggal)
        .lt("jam_mulai", jamSelesai)
        .gt("jam_selesai", jamMulai);

      if (!active) return;
      setConflicts(error ? [] : ((data as ConflictRow[]) ?? []));
      setCheckingConflict(false);
    }, 400);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [lokasi, tanggal, jamMulai, jamSelesai]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload: Record<string, unknown> = {
      jenis_kegiatan: jenis,
      tanggal: data.get("tanggal"),
      jam_mulai: data.get("jam_mulai"),
      jam_selesai: data.get("jam_selesai"),
    };

    if (jenis === "praktikum") {
      payload.praktikum_nama = data.get("praktikum_nama");
      payload.modul = data.get("modul");
    } else {
      payload.kegiatan_non_praktikum = data.get("kegiatan_non_praktikum");
      if (kegiatanNonPraktikum === "lainnya") {
        payload.deskripsi_lainnya = data.get("deskripsi_lainnya");
      }
    }
    payload.lokasi = data.get("lokasi");

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
    setJenis("praktikum");
    setKegiatanNonPraktikum("");
    setLokasi("");
    setTanggal("");
    setJamMulai("");
    setJamSelesai("");
    setConflicts([]);
    router.refresh();
  }

  const approvedConflicts = conflicts.filter((c) => c.status === "approved");
  const pendingConflicts = conflicts.filter((c) => c.status === "pending");

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
          Jenis Kegiatan
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setJenis("praktikum")}
            className={`border px-4 py-2.5 text-sm text-left transition-colors ${
              jenis === "praktikum"
                ? "border-petrol bg-mist text-ink"
                : "border-line text-core hover:border-petrol"
            }`}
          >
            Praktikum
          </button>
          <button
            type="button"
            onClick={() => setJenis("non_praktikum")}
            className={`border px-4 py-2.5 text-sm text-left transition-colors ${
              jenis === "non_praktikum"
                ? "border-petrol bg-mist text-ink"
                : "border-line text-core hover:border-petrol"
            }`}
          >
            Non-Praktikum
          </button>
        </div>
      </div>

      {jenis === "praktikum" ? (
        <>
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
              {practicumNames.map((praktikum) => (
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
        </>
      ) : (
        <>
          <div>
            <label className="block text-xs font-mono uppercase text-core mb-1">
              Kegiatan
            </label>
            <select
              name="kegiatan_non_praktikum"
              required
              value={kegiatanNonPraktikum}
              onChange={(e) => setKegiatanNonPraktikum(e.target.value)}
              className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
            >
              <option value="">Pilih kegiatan</option>
              {NON_PRAKTIKUM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {kegiatanNonPraktikum === "lainnya" && (
            <div>
              <label className="block text-xs font-mono uppercase text-core mb-1">
                Deskripsi Kegiatan
              </label>
              <textarea
                name="deskripsi_lainnya"
                required
                rows={3}
                placeholder="Jelaskan kegiatan yang diajukan"
                className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
              />
            </div>
          )}
        </>
      )}

      <div>
        <label className="block text-xs font-mono uppercase text-core mb-1">Laboratorium</label>
        <select
          name="lokasi"
          required
          value={lokasi}
          onChange={(e) => setLokasi(e.target.value)}
          className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
        >
          <option value="">Pilih laboratorium</option>
          {facilityNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Tanggal</label>
          <input
            name="tanggal"
            type="date"
            required
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Jam Mulai</label>
          <input
            name="jam_mulai"
            type="time"
            required
            value={jamMulai}
            onChange={(e) => setJamMulai(e.target.value)}
            className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Jam Selesai</label>
          <input
            name="jam_selesai"
            type="time"
            required
            value={jamSelesai}
            onChange={(e) => setJamSelesai(e.target.value)}
            className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {jamMulai && jamSelesai && jamMulai >= jamSelesai && (
        <p className="text-xs text-red-700">Jam mulai harus sebelum jam selesai.</p>
      )}

      {checkingConflict && (
        <p className="text-xs text-core">Memeriksa jadwal di lab tersebut...</p>
      )}

      {!checkingConflict && (approvedConflicts.length > 0 || pendingConflicts.length > 0) && (
        <div className="border border-rig bg-rig/5 px-4 py-3 space-y-2">
          <p className="text-sm font-medium text-ink">
            ⚠ Ada kegiatan lain di {lokasi} pada jam yang sama/berdekatan:
          </p>
          {approvedConflicts.length > 0 && (
            <ul className="text-xs text-ink space-y-1">
              {approvedConflicts.map((c) => (
                <li key={c.id}>
                  <span className="font-mono text-core">
                    {c.jam_mulai}–{c.jam_selesai}
                  </span>{" "}
                  — {conflictLabel(c)}{" "}
                  <span className="text-petrol font-mono text-[11px] uppercase">(sudah disetujui)</span>
                </li>
              ))}
            </ul>
          )}
          {pendingConflicts.length > 0 && (
            <ul className="text-xs text-core space-y-1">
              {pendingConflicts.map((c) => (
                <li key={c.id}>
                  <span className="font-mono">
                    {c.jam_mulai}–{c.jam_selesai}
                  </span>{" "}
                  — {conflictLabel(c)}{" "}
                  <span className="font-mono text-[11px] uppercase">(masih menunggu ditinjau)</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-core">
            Kamu tetap bisa mengirim pengajuan ini — admin akan meninjau dan mempertimbangkan bentrok
            jadwal ini saat memutuskan.
          </p>
        </div>
      )}

      <Button type="submit">{loading ? "Mengirim..." : "Kirim Pengajuan"}</Button>
    </form>
  );
}
