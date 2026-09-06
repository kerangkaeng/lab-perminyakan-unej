"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "./RichTextEditor";
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
  const [submitting, setSubmitting] = useState<"draft" | "published" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(status: "draft" | "published") {
    setError(null);
    setSubmitting(status);

    const form = new FormData();
    form.append("title", title);
    form.append("date", date);
    form.append("excerpt", excerpt);
    form.append("content", content);
    form.append("status", status);
    if (file) form.append("cover_image", file);

    const url = mode === "create" ? "/api/admin/news" : `/api/admin/news/${initial!.id}`;
    const res = await fetch(url, { method: mode === "create" ? "POST" : "PATCH", body: form });

    setSubmitting(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Gagal menyimpan berita.");
      return;
    }

    const body = await res.json();
    const slug = body?.data?.slug ?? initial?.slug;

    if (status === "draft" && slug) {
      router.push(`/news/${slug}/preview`);
    } else {
      router.push("/admin/news");
    }
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-5">
      {error && <p className="text-sm text-red-700 border border-red-300 bg-red-50 px-4 py-3">{error}</p>}

      {initial?.status === "draft" && (
        <p className="border border-rig/40 bg-rig/10 px-4 py-3 text-sm text-ink">
          Status: <span className="font-mono uppercase text-rig">Draft</span> — belum tayang di halaman publik.{" "}
          <Link href={`/news/${initial.slug}/preview`} className="underline hover:text-rig">
            Lihat preview
          </Link>
        </p>
      )}

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
        <RichTextEditor value={content} onChange={setContent} />
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

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => submit("draft")}>
          {submitting === "draft" ? "Menyimpan..." : "Simpan sebagai Draft"}
        </Button>
        <Button type="button" onClick={() => submit("published")}>
          {submitting === "published" ? "Menyimpan..." : "Publikasikan"}
        </Button>
      </div>
    </div>
  );
}
