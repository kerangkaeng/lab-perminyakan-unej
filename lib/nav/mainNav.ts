// Navigasi utama situs (publik) — SATU sumber untuk Navbar desktop,
// MobileMenu, dan active-state. Dikelompokkan supaya menu atas tidak
// berisi delapan item sejajar. Semua label berbahasa Indonesia.

export type NavLeaf = { href: string; label: string };
export type NavEntry = {
  label: string;
  /** Halaman tujuan saat label grup diklik. */
  href: string;
  /** Sub-menu (opsional). Tanpa items = link biasa. */
  items?: NavLeaf[];
  /** Ditonjolkan sebagai fitur utama (Praktikum). */
  highlight?: boolean;
};

export const mainNav: NavEntry[] = [
  {
    label: "Profil",
    href: "/about",
    items: [
      { href: "/about", label: "Tentang Laboratorium" },
      { href: "/about/visi-misi", label: "Visi & Misi" },
      { href: "/about/struktur-organisasi", label: "Struktur Organisasi" },
      { href: "/about/team", label: "Tim" },
    ],
  },
  { label: "Fasilitas", href: "/facilities" },
  {
    label: "Riset",
    href: "/research",
    items: [
      { href: "/research", label: "Riset" },
      { href: "/publications", label: "Publikasi" },
    ],
  },
  {
    label: "Informasi",
    href: "/news",
    items: [
      { href: "/news", label: "Berita" },
      { href: "/gallery", label: "Galeri" },
      { href: "/practicum/announcements", label: "Pengumuman" },
    ],
  },
  // Jadwal kegiatan lab (praktikum maupun non-praktikum) adalah fitur utama
  // untuk mahasiswa/dosen internal MAUPUN pihak eksternal, jadi berdiri
  // sendiri di menu atas dan terbuka untuk umum.
  { label: "Jadwal", href: "/practicum/jadwal" },
  {
    label: "Layanan Lab",
    href: "/practicum",
    highlight: true,
    items: [
      { href: "/practicum/ajukan", label: "Ajukan Kegiatan" },
      { href: "/practicum/status", label: "Status Pengajuan" },
      { href: "/practicum/modules", label: "Modul Praktikum" },
    ],
  },
  { label: "Kontak", href: "/contact" },
];

function matches(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

/** Sub-menu mana yang aktif: yang href-nya paling panjang (paling spesifik) cocok. */
export function activeLeaf(entry: NavEntry, pathname: string | null | undefined): NavLeaf | null {
  let best: NavLeaf | null = null;
  for (const leaf of entry.items ?? []) {
    if (matches(pathname, leaf.href) && (!best || leaf.href.length > best.href.length)) best = leaf;
  }
  return best;
}

/**
 * Grup aktif kalau salah satu sub-menunya cocok. Untuk grup dengan sub-menu,
 * href grup sendiri TIDAK dipakai (mis. /practicum/announcements milik
 * "Informasi", bukan "Praktikum"). Tanpa sub-menu: cocokkan href-nya.
 */
export function isEntryActive(entry: NavEntry, pathname: string | null | undefined): boolean {
  if (entry.items?.length) return activeLeaf(entry, pathname) !== null || pathname === entry.href;
  return matches(pathname, entry.href);
}
