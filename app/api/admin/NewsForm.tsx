"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { NewsRecord } from "@/types";

type Props = {
  mode: "create" | "edit";
  initial?: NewsRecord;
};

export function NewsForm({ mode, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData();
    form.append("title", title);
    form.append("date", date);
    form.append("excerpt", excerpt);
    form.append("content", content);
    if (file) form.append("cover_image", file);

    const url = mode === "create" ? "/api/admin/news" : `/api/admin/news/${initial!.id}`;
    const res = await fetch(url, { method: mode === "create" ? "POST" : "PATCH", body: form });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Gagal menyimpan berita.");
      return;
    }

    router.push("/admin/news");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {error && <p className="text-sm text-red-700 border border-red-300 bg-red-50 px-4 py-3">{error}</p>}

      <div>
        <label className="mb-1.5 block text-sm text-ink">Judul</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-ink">Tanggal</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-ink">Ringkasan (tampil di daftar berita)</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          required
          rows={2}
          className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-ink">Isi Berita</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={8}
          className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-ink">
          Gambar Sampul {mode === "edit" && "(kosongkan kalau tidak ingin mengganti)"}
        </label>
        {initial?.cover_image && !file && (
          <img src={initial.cover_image} alt="" className="mb-2 h-32 w-full object-cover" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-core file:mr-3 file:border file:border-line file:bg-mist file:px-3 file:py-1.5 file:text-xs file:uppercase file:tracking-wide"
        />
      </div>

      <Button type="submit">
        {submitting ? "Menyimpan..." : mode === "create" ? "Publikasikan Berita" : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
