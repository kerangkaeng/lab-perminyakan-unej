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

## Fitur Login SSO UNEJ & Pengajuan Praktikum (Tahap 2)

Fitur ini butuh Supabase (untuk data) dan beberapa environment variable
tambahan. Tanpa ini, sisa website (halaman statis) tetap jalan normal,
tapi halaman `/login`, `/practicum/ajukan`, `/practicum/status`,
`/practicum/jadwal`, dan `/admin/practicum-requests` tidak akan berfungsi.

### 1. Jalankan migrasi SQL

File `supabase/migrations/001_practicum_schema.sql` berisi skema tabel
`users`, `practicum_requests`, dan seluruh RLS policy-nya. Jalankan isinya
di **Supabase SQL Editor** pada project Supabase kamu (kalau belum pernah).

### 2. Isi environment variables

Salin `.env.local.example` → `.env.local`, lalu isi:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — dari Settings → API
- `SUPABASE_JWT_SECRET` — dari Settings → API → **JWT Settings**. Ini dipakai untuk menandatangani sesi login CAS supaya kompatibel dengan `auth.uid()` di RLS Supabase, meskipun user tidak login lewat Supabase Auth langsung.
- `CAS_BASE_URL` — default `https://sso.unej.ac.id/cas`, biasanya tidak perlu diubah.

Tambahkan variable yang sama di **Vercel → Project → Settings → Environment Variables** untuk production.

### 2b. Sesuaikan atribut CAS

`lib/auth/cas.ts` menebak nama tag atribut (`nama`, `prodi`, dst) dari
response XML CAS berdasarkan konvensi umum. Ini **perlu diverifikasi**
terhadap response asli dari `sso.unej.ac.id` — coba login sekali di
environment staging lalu cek log, atau curl manual ke endpoint
`serviceValidate` untuk melihat struktur XML sebenarnya, lalu sesuaikan
daftar `keys` di fungsi `extractAttribute`.

### 3. Cara kerja login

1. Mahasiswa klik "Masuk dengan SSO UNEJ" → diarahkan ke `sso.unej.ac.id/cas/login`
2. Setelah login berhasil di CAS, diarahkan balik ke `/api/auth/cas/callback?ticket=...`
3. Server memvalidasi ticket ke CAS, lalu **upsert** baris di tabel `users` (dibuat otomatis kalau NIM belum pernah login sebelumnya, dengan role default `mahasiswa`)
4. Sesi disimpan sebagai JWT di cookie httpOnly (kompatibel dengan `auth.uid()` Supabase), bukan lewat email/password Supabase Auth biasa

### 4. Menjadikan seseorang admin

Role tidak bisa diubah lewat UI (sesuai desain RLS-nya) — admin harus set
manual lewat SQL Editor setelah mahasiswa tersebut login minimal sekali
(supaya barisnya sudah ada di tabel `users`):

```sql
update public.users set role = 'admin' where nim = '2110xxxxxxxxx';
```

### 5. Halaman yang ditambahkan

| Route | Akses | Keterangan |
|---|---|---|
| `/login` | Publik | Tombol login SSO UNEJ |
| `/practicum/ajukan` | Login (mahasiswa/admin) | Form ajukan jadwal praktikum |
| `/practicum/status` | Login (mahasiswa/admin) | Status pengajuan milik sendiri |
| `/practicum/jadwal` | Publik | Jadwal yang sudah disetujui admin |
| `/admin/practicum-requests` | Login (khusus admin) | Setujui/tolak pengajuan masuk |

`middleware.ts` memproteksi `/admin/*`, `/practicum/ajukan`, dan
`/practicum/status` — redirect ke `/login` kalau belum ada sesi valid, dan
redirect ke `/practicum/status` kalau bukan admin tapi coba akses `/admin/*`.

**Catatan:** karena Navbar sekarang menampilkan status login di setiap
halaman, seluruh site menjadi server-rendered per-request (bukan murni
statis lagi seperti Tahap 1 awal) — ini tetap didukung penuh oleh Vercel
Hobby plan, tidak perlu upgrade paket.

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
