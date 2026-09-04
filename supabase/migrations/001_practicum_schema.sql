-- ============================================================
-- Schema: users, practicum_requests + RLS
-- Jalankan di Supabase SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- users ----------
-- Catatan: tabel ini terpisah dari auth.users bawaan Supabase Auth,
-- karena identitas berasal dari CAS SISTER UNEJ, bukan email/password Supabase.
-- auth_uid menyimpan id dari auth.users yang dibuat lewat Admin API saat login CAS pertama kali.
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_uid uuid unique references auth.users(id) on delete cascade,
  nim text unique not null,
  nama text not null,
  prodi text,
  role text not null default 'mahasiswa' check (role in ('mahasiswa','admin')),
  created_at timestamptz not null default now()
);

-- ---------- practicum_requests ----------
create table if not exists public.practicum_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  praktikum_nama text not null,
  modul text not null,
  tanggal date not null,
  jam_mulai time not null,
  jam_selesai time not null,
  lokasi text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  catatan_admin text,
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_practicum_requests_status on public.practicum_requests(status);
create index if not exists idx_practicum_requests_requester on public.practicum_requests(requester_id);

-- ---------- RLS ----------
alter table public.users enable row level security;
alter table public.practicum_requests enable row level security;

-- Helper: cek role admin dari baris public.users milik auth.uid() saat ini
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.users
    where auth_uid = auth.uid() and role = 'admin'
  );
$$;

-- users: user bisa baca baris sendiri; admin baca semua
drop policy if exists "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin"
  on public.users for select
  using (auth_uid = auth.uid() or public.is_admin());

-- practicum_requests: mahasiswa insert milik sendiri
drop policy if exists "requests_insert_own" on public.practicum_requests;
create policy "requests_insert_own"
  on public.practicum_requests for insert
  with check (
    requester_id = (select id from public.users where auth_uid = auth.uid())
  );

-- practicum_requests: mahasiswa select milik sendiri; admin select semua
drop policy if exists "requests_select_own_or_admin" on public.practicum_requests;
create policy "requests_select_own_or_admin"
  on public.practicum_requests for select
  using (
    requester_id = (select id from public.users where auth_uid = auth.uid())
    or public.is_admin()
  );

-- practicum_requests: hanya admin yang bisa update (approve/reject)
drop policy if exists "requests_update_admin_only" on public.practicum_requests;
create policy "requests_update_admin_only"
  on public.practicum_requests for update
  using (public.is_admin())
  with check (public.is_admin());

-- practicum_requests: publik (anon) boleh baca yang approved saja, untuk menu Jadwal
drop policy if exists "requests_select_approved_public" on public.practicum_requests;
create policy "requests_select_approved_public"
  on public.practicum_requests for select
  to anon
  using (status = 'approved');
