"use client";

import { useState } from "react";
import { Download } from "lucide-react";

// Preset rentang cepat — digenerate di client (bukan dihitung server-side
// saat render) supaya selalu berbasis "hari ini" saat tombolnya diklik,
// bukan basi kalau halamannya di-cache.
function presetRange(kind: "bulan_ini" | "semester_ini" | "tahun_ini"): { dari: string; sampai: string } {
  const today = new Date();
  const toISO = (d: Date) => d.toISOString().slice(0, 10);

  if (kind === "bulan_ini") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { dari: toISO(start), sampai: toISO(end) };
  }
  if (kind === "semester_ini") {
    // Semester Genap: Feb–Jul, Semester Ganjil: Agu–Jan. Pendekatan kasar
    // berbasis bulan kalender, bukan kalender akademik resmi UNEJ — cukup
    // untuk kebutuhan rekap cepat.
    const month = today.getMonth(); // 0-indexed
    const isGenap = month >= 1 && month <= 6; // Feb(1)..Jul(6)
    const year = today.getFullYear();
    if (isGenap) {
      return { dari: toISO(new Date(year, 1, 1)), sampai: toISO(new Date(year, 6, 31)) };
    }
    const startYear = month === 0 ? year - 1 : year; // Jan termasuk ganjil tahun sebelumnya
    return { dari: toISO(new Date(startYear, 7, 1)), sampai: toISO(new Date(startYear + 1, 0, 31)) };
  }
  // tahun_ini
  return { dari: toISO(new Date(today.getFullYear(), 0, 1)), sampai: toISO(new Date(today.getFullYear(), 11, 31)) };
}

export function RecapDateRangeForm({ labs }: { labs: string[] }) {
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [jenis, setJenis] = useState("all");
  const [lab, setLab] = useState("all");
  const [status, setStatus] = useState("all");

  function applyPreset(kind: "bulan_ini" | "semester_ini" | "tahun_ini") {
    const r = presetRange(kind);
    setDari(r.dari);
    setSampai(r.sampai);
  }

  const params = new URLSearchParams();
  if (dari) params.set("dari", dari);
  if (sampai) params.set("sampai", sampai);
  if (jenis !== "all") params.set("jenis", jenis);
  if (lab !== "all") params.set("lab", lab);
  if (status !== "all") params.set("status", status);
  const downloadHref = `/api/admin/practicum-requests/recap?${params.toString()}`;

  const inputClass = "w-full border border-line bg-mist px-3 py-2.5 text-sm focus:outline-none focus:border-petrol";

  return (
    <div className="border border-line p-6 max-w-2xl">
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => applyPreset("bulan_ini")}
          className="text-xs border border-line px-3 py-1.5 hover:border-petrol hover:text-petrol transition-colors"
        >
          Bulan Ini
        </button>
        <button
          type="button"
          onClick={() => applyPreset("semester_ini")}
          className="text-xs border border-line px-3 py-1.5 hover:border-petrol hover:text-petrol transition-colors"
        >
          Semester Ini
        </button>
        <button
          type="button"
          onClick={() => applyPreset("tahun_ini")}
          className="text-xs border border-line px-3 py-1.5 hover:border-petrol hover:text-petrol transition-colors"
        >
          Tahun Ini
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Dari Tanggal</label>
          <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Sampai Tanggal</label>
          <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className={inputClass} />
        </div>
      </div>

      <p className="text-xs text-core mb-4">
        Kosongkan salah satu atau keduanya untuk tidak membatasi rentang tanggal (ambil semua data).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Jenis Kegiatan</label>
          <select value={jenis} onChange={(e) => setJenis(e.target.value)} className={inputClass}>
            <option value="all">Semua Jenis</option>
            <option value="praktikum">Praktikum</option>
            <option value="non_praktikum">Non-Praktikum</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Laboratorium</label>
          <select value={lab} onChange={(e) => setLab(e.target.value)} className={inputClass}>
            <option value="all">Semua Laboratorium</option>
            {labs.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="all">Semua Status</option>
            <option value="pending">Baru Masuk (Belum Diaksi)</option>
            <option value="acted">Sudah Diaksi (Disetujui/Ditolak)</option>
            <option value="admin_done">Selesai Administrasi</option>
            <option value="activity_pending">Kegiatan Selesai, Administrasi Belum</option>
          </select>
        </div>
      </div>

      <a
        href={downloadHref}
        className="inline-flex items-center gap-2 bg-petrol text-paper px-5 py-3 text-sm hover:bg-petrol-light transition-colors"
      >
        <Download size={16} />
        Download Rekap Excel
      </a>
    </div>
  );
}
