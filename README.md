# Petroleum Engineering Laboratory Website

Official website for the Petroleum Engineering Laboratory, Petroleum Engineering
Study Program, Faculty of Engineering, Universitas Jember — laboratory profile,
scientific publications, practicum scheduling requests, and activity documentation.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase · Vercel

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Most pages require a connection to a configured
Supabase project (see Environment Variables below) for content to render.

## Data Architecture

All site content is stored in Supabase and fetched via Server Components, using
either `supabasePublic()` (anon key — respects Row Level Security, used on public
pages) or `supabaseServer()` (service role key — used exclusively within `/admin/*`
for write operations).

### Content tables (managed via the Admin Panel)

| Table | Purpose |
|---|---|
| `facilities` | The three laboratories (Reservoir, Petrophysics, Drilling & Production) |
| `equipment` | Lab-specific equipment (`facility_id` set) and shared equipment (`facility_id` null) |
| `lab_documents` | Hazardous waste (B3) SOPs, occupational health & safety (K3) documents, lab rules, safety posters |
| `publications` | Scientific publications — presented as a journal-style overview with full metadata, abstract, keywords, and DOI |
| `research_areas` | Laboratory research focus areas |
| `research_projects` | Research projects (Ongoing / Completed / Planned) |
| `researchers` | Research team members |
| `announcements` | Announcements |
| `gallery_items` | Activity documentation (categories: Practicum, Workshop, etc.) |
| `news` | News articles, managed via a dedicated `/admin/news` interface with a rich-text editor |

All tables above (except `news`) are automatically rendered as list/create/edit
admin pages via configuration in `lib/admin/config.ts` — adding a new content
type only requires a new entry in that file, not a new admin page from scratch.

## Admin Panel

Accessible at `/admin` (an "Admin" link appears in the navbar for users with the
admin role after SSO login). Capabilities:

- Dashboard with per-table record counts
- Generic CRUD for the nine content tables above, with forms generated dynamically
  from field definitions in `lib/admin/config.ts`
- Direct file uploads (images/PDFs) to Supabase Storage from within the form
- News (`/admin/news`) and practicum request approvals (`/admin/practicum-requests`)
  use dedicated pages/forms instead, due to more specific requirements (rich-text
  editing, an approve/reject workflow)

`middleware.ts` protects all `/admin/*` routes — unauthenticated users are
redirected to `/login`, and non-admin users are redirected away.

## UNEJ SSO Login & Practicum Requests

### How login works

1. Students click "Sign in with UNEJ SSO" on `/login` and are redirected to
   `sso.unej.ac.id/cas/login`
2. On successful authentication, CAS redirects back to
   `/api/auth/cas/callback?ticket=...`
3. The server validates the ticket against CAS, then upserts a row in the `users`
   table (created automatically on first login, with the default `mahasiswa` role)
4. The session is stored as a JWT in an httpOnly cookie, signed with
   `SUPABASE_JWT_SECRET`, so `auth.uid()` continues to work correctly in Supabase
   RLS policies even though the user did not authenticate via Supabase Auth directly

### Granting admin access

Roles cannot be changed through the UI by design — an admin must set it manually
via the SQL Editor, after the target user has logged in at least once (so their
row already exists in `users`):

```sql
update public.users set role = 'admin' where nim = '2110xxxxxxxxx';
```

### Related routes

| Route | Access | Description |
|---|---|---|
| `/login` | Public | UNEJ SSO login button |
| `/practicum/ajukan` | Authenticated | Submit a practicum schedule request |
| `/practicum/status` | Authenticated | View the status of one's own requests |
| `/practicum/jadwal` | Public | Approved practicum schedule |
| `/admin/practicum-requests` | Admin | Approve/reject incoming requests |

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Settings → API
- `SUPABASE_JWT_SECRET` — from Settings → API → JWT Settings
- `CAS_BASE_URL` — defaults to `https://sso.unej.ac.id/cas`

Add the same variables under **Vercel → Project → Settings → Environment Variables**
for production.

## Deploying to Vercel

1. Push this repository to GitHub and import it at https://vercel.com/new
2. Set the Install Command to `npm install` (instead of the default `npm ci`)
   under Settings → Build and Deployment, to tolerate a `package-lock.json`
   that is slightly behind `package.json`
3. Add the environment variables in the dashboard
4. Deploy

## Page Structure
