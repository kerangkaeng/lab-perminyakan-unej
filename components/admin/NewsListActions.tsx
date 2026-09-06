"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewsListActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm("Hapus berita ini secara permanen?");
    if (!confirmed) return;

    setLoading(true);
    const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      alert("Gagal menghapus berita.");
      return;
    }
    router.refresh();
  }

  return (
    <button
      disabled={loading}
      onClick={handleDelete}
      className="text-xs text-red-700 underline hover:text-red-900 disabled:opacity-50"
    >
      Hapus
    </button>
  );
}
