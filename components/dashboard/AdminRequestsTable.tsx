"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PracticumRequest } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { DocumentationViewer } from "./DocumentationViewer";
import { formatDate } from "@/lib/utils";
import { nonPraktikumLabel } from "@/lib/constants/kegiatan";

type TabKey = "semua" | "baru" | "disetujui" | "terlambat" | "selesai";

const TODAY = new Date().toISOString().slice(0, 10);

function isOverdue(r: PracticumRequest): boolean {
  return r.status === "approved" && !r.completed && r.tanggal < TODAY;
}

function matchesTab(r: PracticumRequest, tab: TabKey): boolean {
  switch (tab) {
    case "semua":
      return true;
    case "baru":
      return r.status === "pending";
    case "disetujui":
      return r.status === "approved" && !r.completed && !isOverdue(r);
    case "terlambat":
      return isOverdue(r);
    case "selesai":
      return r.completed === true;
    default:
      return true;
  }
}

export function AdminRequestsTable({
  requests,
  canManage = true,
}: {
  requests: PracticumRequest[];
  /** false = cuma boleh lihat (role asisten): tombol approve/reject/hapus/revisi disembunyikan. */
  canManage?: boolean;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<PracticumRequest | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("semua");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "semua", label: "Semua" },
    { key: "baru", label: "Baru Masuk" },
    { key: "disetujui", label: "Disetujui" },
    { key: "terlambat", label: "Terlambat" },
    { key: "selesai", label: "Selesai" },
  ];

  const counts = useMemo(() => {
    const result: Record<TabKey, number> = {
      semua: 0,
      baru: 0,
      disetujui: 0,
      terlambat: 0,
      selesai: 0,
    };
    for (const r of requests) {
      for (const tab of tabs.map((t) => t.key)) {
        if (matchesTab(r, tab)) result[tab] += 1;
      }
    }
    return result;
  }, [requests]);

  const filtered = useMemo(
    () => requests.filter((r) => matchesTab(r, activeTab)),
    [requests, activeTab]
  );

  async function updateStatus(id: string, status: "approved" | "rejected") {
    setError(null);

    let catatan_admin: string | undefined;
    if (status === "rejected") {
      catatan_admin = window.prompt("Catatan penolakan (opsional):") ?? undefined;
    }

    setLoadingId(id);
    const res = await fetch(`/api/admin/practicum-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, catatan_admin }),
    });
    setLoadingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Gagal memperbarui status.");
      return;
    }

    router.refresh();
  }

  async function deleteRequest(id: string) {
    setError(null);

    const confirmed = window.confirm(
      "Hapus pengajuan ini secara permanen? Tindakan ini tidak bisa dibatalkan."
    );
    if (!confirmed) return;

    setLoadingId(id);
    const res = await fetch(`/api/admin/practicum-requests/${id}`, {
      method: "DELETE",
    });
    setLoadingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Gagal menghapus pengajuan.");
      return;
    }

    router.refresh();
  }

  async function reopenForRevision(id: string) {
    setError(null);

    const catatan = window.prompt(
      "Kenapa administrasi ini perlu direvisi? (opsional, akan tersimpan sebagai catatan admin)"
    );
    // window.prompt mengembalikan null kalau ditekan Cancel — batalkan aksi.
    if (catatan === null) return;

    setLoadingId(id);
    const res = await fetch(`/api/admin/practicum-requests/${id}/reopen`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catatan: catatan || undefined }),
    });
    setLoadingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Gagal membuka kembali administrasi untuk revisi.");
      return;
    }

    router.refresh();
  }

  if (requests.length === 0) {
    return <p className="text-core text-sm">Belum ada pengajuan masuk.</p>;
  }

  return (
    <div>
      {error && (
        <p className="text-sm text-red-700 border border-red-300 bg-red-50 px-4 py-3 mb-4">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-6 border-b border-line pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-sm px-4 py-2 border transition-colors ${
              activeTab === tab.key
                ? "border-petrol bg-petrol text-paper"
                : "border-line text-core hover:border-petrol hover:text-ink"
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 font-mono text-xs ${
                activeTab === tab.key ? "text-paper/80" : "text-core/70"
              }`}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "terlambat" && filtered.length > 0 && (
        <p className="text-sm text-red-700 border border-red-300 bg-red-50 px-4 py-3 mb-4">
          Kegiatan-kegiatan ini tanggalnya sudah lewat tapi administrasinya (dokumentasi/laporan
          insiden) belum diselesaikan mahasiswa. Mungkin perlu ditindaklanjuti.
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-core text-sm">Tidak ada pengajuan di kategori ini.</p>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-mist border-b border-line font-mono text-xs uppercase tracking-wide text-core">
                <th className="text-left p-4">Pengaju</th>
                <th className="text-left p-4">Jenis</th>
                <th className="text-left p-4">Kegiatan</th>
                <th className="text-left p-4">Jadwal</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Administrasi</th>
                <th className="text-left p-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 align-top">
                  <td className="p-4 text-ink">
                    <p className="font-medium">{r.requester?.nama ?? "-"}</p>
                    <p className="text-xs text-core font-mono">{r.requester?.nim ?? "-"}</p>
                  </td>
                  <td className="p-4 text-core">
                    {r.jenis_kegiatan === "praktikum" ? "Praktikum" : "Non-Praktikum"}
                  </td>
                  <td className="p-4 text-core">
                    {r.jenis_kegiatan === "praktikum" ? (
                      <>
                        <p className="text-ink font-medium">{r.praktikum_nama}</p>
                        <p className="text-xs">{r.modul}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-ink font-medium">
                          {nonPraktikumLabel(r.kegiatan_non_praktikum)}
                        </p>
                        {r.kegiatan_non_praktikum === "lainnya" && r.deskripsi_lainnya && (
                          <p className="text-xs">{r.deskripsi_lainnya}</p>
                        )}
                      </>
                    )}
                    {r.lokasi && <p className="text-xs">{r.lokasi}</p>}
                  </td>
                  <td className="p-4 text-core font-mono whitespace-nowrap">
                    {formatDate(r.tanggal)}
                    {isOverdue(r) && (
                      <span className="ml-2 inline-block text-[10px] uppercase text-red-700 border border-red-300 px-1.5 py-0.5 align-middle">
                        Lewat
                      </span>
                    )}
                    <br />
                    {r.jam_mulai}–{r.jam_selesai}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-4">
                    {r.status !== "approved" ? (
                      <span className="text-xs text-core">-</span>
                    ) : (
                      <div className="space-y-1.5">
                        <p
                          className={`font-mono text-[11px] uppercase tracking-wide ${
                            r.completed ? "text-petrol" : "text-core"
                          }`}
                        >
                          {r.completed
                            ? "Selesai"
                            : r.completed_at
                            ? "Sedang direvisi"
                            : "Belum selesai"}
                        </p>
                        {r.completed && r.ada_insiden && (
                          <p className="font-mono text-[11px] uppercase tracking-wide text-red-700">
                            Ada Insiden
                          </p>
                        )}
                        {(r.completed || r.completed_at) && (
                          <button
                            onClick={() => setViewing(r)}
                            className="text-xs text-petrol underline hover:text-rig"
                          >
                            Lihat Dokumentasi
                          </button>
                        )}
                        {r.completed && canManage && (
                          <button
                            disabled={loadingId === r.id}
                            onClick={() => reopenForRevision(r.id)}
                            className="block text-xs text-rig underline hover:text-petrol disabled:opacity-50"
                          >
                            Izinkan Revisi
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {canManage ? (
                      <>
                        <div className="flex gap-2 mb-1">
                          <button
                            disabled={loadingId === r.id || r.status === "approved"}
                            onClick={() => updateStatus(r.id, "approved")}
                            className="text-xs border border-petrol text-petrol px-3 py-1.5 hover:bg-petrol hover:text-paper transition-colors disabled:opacity-50"
                          >
                            Setujui
                          </button>
                          <button
                            disabled={loadingId === r.id || r.status === "rejected"}
                            onClick={() => updateStatus(r.id, "rejected")}
                            className="text-xs border border-red-400 text-red-700 px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            Tolak
                          </button>
                          <button
                            disabled={loadingId === r.id}
                            onClick={() => deleteRequest(r.id)}
                            className="text-xs border border-line text-core px-3 py-1.5 hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-colors disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        </div>
                        {r.catatan_admin && <p className="text-xs text-core">{r.catatan_admin}</p>}
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-core">Lihat saja</span>
                        {r.catatan_admin && <p className="text-xs text-core mt-1">{r.catatan_admin}</p>}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && <DocumentationViewer request={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
