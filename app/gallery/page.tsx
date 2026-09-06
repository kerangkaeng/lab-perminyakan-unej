import Link from "next/link";
import { supabasePublic } from "@/lib/supabase/authed";

export const revalidate = 0;

const categories = [
  "Praktikum", "Training", "Workshop", "Seminar",
  "Kunjungan Industri", "Kunjungan Sekolah", "Penelitian", "Pengabdian Masyarakat",
];

interface GalleryItem {
  id: string;
  title: string | null;
  category: string;
  image_url: string;
  date: string;
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const activeCategory = searchParams?.category;
  const supabase = supabasePublic();

  let query = supabase
    .from("gallery_items")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: false });

  if (activeCategory) {
    query = query.eq("category", activeCategory);
  }

  const { data } = await query;
  const items = (data ?? []) as GalleryItem[];

  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Dokumentasi</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Gallery</h1>

      {/* Filter kategori */}
      <div className="flex flex-wrap gap-2 mb-12">
        <Link
          href="/gallery"
          className={`font-mono text-xs uppercase px-3 py-2 border transition-colors ${
            !activeCategory ? "border-rig bg-rig/10 text-rig" : "border-line text-core hover:border-petrol"
          }`}
        >
          Semua
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/gallery?category=${encodeURIComponent(c)}`}
            className={`font-mono text-xs uppercase px-3 py-2 border transition-colors ${
              activeCategory === c ? "border-rig bg-rig/10 text-rig" : "border-line text-core hover:border-petrol"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {/* Grid gambar */}
      {items.length === 0 ? (
        <p className="text-core text-sm">Belum ada dokumentasi untuk kategori ini.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="relative aspect-[4/3] bg-mist border border-line overflow-hidden group">
              <img
                src={item.image_url}
                alt={item.title ?? item.category}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                <span className="font-mono text-xs uppercase text-white">
                  {item.title ?? item.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
