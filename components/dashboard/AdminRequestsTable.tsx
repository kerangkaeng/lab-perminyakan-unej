"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PracticumRequest } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "@/lib/utils";

export function AdminRequestsTable({ requests }: { requests: PracticumRequest[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <div className="overflow-x-auto border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-mist border-b border-line font-mono text-xs uppercase tracking-wide text-core">
              <th className="text-left p-4">Pengaju</th>
              <th className="text-left p-4">Praktikum</th>
              <th className="text-left p-4">Modul</th>
              <th className="text-left p-4">Jadwal</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 align-top">
                <td className="p-4 text-ink">
                  <p className="font-medium">{r.requester?.nama ?? "-"}</p>
                  <p className="text-xs text-core font-mono">{r.requester?.nim ?? "-"}</p>
                </td>
                <td className="p-4 text-core">{r.praktikum_nama}</td>
                <td className="p-4 text-core">{r.modul}</td>
                <td className="p-4 text-core font-mono whitespace-nowrap">
                  {formatDate(r.tanggal)}
                  <br />
                  {r.jam_mulai}–{r.jam_selesai}
                </td>
                <td className="p-4">
                  <StatusBadge status={r.status} />
                </td>
                <td className="p-4">
                  {r.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        disabled={loadingId === r.id}
                        onClick={() => updateStatus(r.id, "approved")}
                        className="text-xs border border-petrol text-petrol px-3 py-1.5 hover:bg-petrol hover:text-paper transition-colors disabled:opacity-50"
                      >
                        Setujui
                      </button>
                      <button
                        disabled={loadingId === r.id}
                        onClick={() => updateStatus(r.id, "rejected")}
                        className="text-xs border border-red-400 text-red-700 px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Tolak
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-core">
                      {r.catatan_admin ? r.catatan_admin : "Selesai ditinjau"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
