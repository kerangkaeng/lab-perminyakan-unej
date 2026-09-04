# Website Laboratorium Teknik Perminyakan

Stack: **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase + Vercel**

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Struktur Data (Tahap 1 — Statis)

Semua konten saat ini ada di folder `data/` (facilities, research, publications, news)
dalam bentuk array TypeScript biasa. Ini memudahkan development awal tanpa database.

## Migrasi ke Supabase (Tahap 2)

1. Buat project di https://supabase.com
2. Salin `.env.local.example` menjadi `.env.local`, isi dengan URL & anon key project kamu
3. Buat tabel yang strukturnya mengikuti `types/index.ts` (Facility, Publication, NewsItem, dst)
4. Ganti pemanggilan `data/*.ts` di setiap halaman dengan query melalui `lib/supabase/server.ts`
   (untuk Server Component) atau `lib/supabase/client.ts` (untuk Client Component)

## Deploy ke Vercel

1. Push project ini ke repository GitHub
2. Import repository di https://vercel.com/new
3. Tambahkan environment variables (`NEXT_PUBLIC_SUPABASE_URL`, dst) di dashboard Vercel
4. Deploy — domain kustom (mis. `www.namalab.ac.id`) bisa dihubungkan di tab **Domains** setelah deploy pertama berhasil

## Struktur Halaman

```
/                       Home
/about                  Profil, Visi & Misi, Struktur Organisasi, Team
/facilities             Daftar & detail 7 laboratorium
/research               Research areas, projects, researchers
/publications           Tabel publikasi
/practicum              Modul, jadwal, pengumuman
/news                   Berita & kegiatan
/gallery                Dokumentasi kegiatan
/contact                Form kontak
```

## Desain

- **Warna**: petrol (navy-teal, primer), rig (amber, aksen), core (abu-olive, teks sekunder), paper/mist (latar)
- **Tipografi**: Fraunces (display), Inter (body), IBM Plex Mono (data/label teknis)
- **Elemen signature**: strip "well-log" vertikal di Hero — merepresentasikan kurva log sumur, instrumen inti Laboratorium Well Logging
