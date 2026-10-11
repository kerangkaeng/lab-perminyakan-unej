// Navigasi utama situs (publik) — SATU sumber untuk Navbar desktop,
// MobileMenu, dan active-state. Dikelompokkan supaya menu atas tidak
// berisi delapan item sejajar. Semua label berbahasa Indonesia.

export type NavLeaf = {
  href: string;
  label: string;
  /** Hanya aktif kalau path PERSIS sama (tanpa turunannya). */
  exact?: boolean;
  /** Prefix path lain yang juga dianggap bagian dari item ini. */
  alsoMatches?: string[];
};
export type NavEntry = {
  label: string;
  /** Halaman tujuan saat label diklik. Grup dengan sub-menu tidak punya href (label hanya membuka menu). */
  href?: string;
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
    label: "Riset & Publikasi",
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
    highlight: true,
    items: [
      // Belum login -> middleware mengarahkan ke halaman login lalu kembali ke sini.
      { href: "/practicum/ajukan", label: "Pengajuan Kegiatan" },
      // Halaman baru, belum diimplementasikan (placeholder).
      { href: "/peminjaman", label: "Pengajuan Peminjaman" },
      // Pusat informasi praktikum (modul, jadwal, pengumuman).
      { href: "/practicum", label: "Praktikum", exact: true, alsoMatches: ["/practicum/modules"] },
    ],
  },
  { label: "Kontak", href: "/contact" },
];

function matches(pathname: string | null | undefined, href: string, exact = false): boolean {
  if (!pathname) return false;
  return pathname === href || (!exact && pathname.startsWith(href + "/"));
}

function leafMatches(leaf: NavLeaf, pathname: string | null | undefined): boolean {
  return (
    matches(pathname, leaf.href, leaf.exact) ||
    (leaf.alsoMatches ?? []).some((prefix) => matches(pathname, prefix))
  );
}

/** Sub-menu mana yang aktif: yang href-nya paling panjang (paling spesifik) cocok. */
export function activeLeaf(entry: NavEntry, pathname: string | null | undefined): NavLeaf | null {
  let best: NavLeaf | null = null;
  for (const leaf of entry.items ?? []) {
    if (leafMatches(leaf, pathname) && (!best || leaf.href.length > best.href.length)) best = leaf;
  }
  return best;
}

/**
 * Grup dengan sub-menu aktif kalau salah satu sub-menunya cocok (href grup
 * tidak ada). Tanpa sub-menu: cocokkan href-nya.
 */
export function isEntryActive(entry: NavEntry, pathname: string | null | undefined): boolean {
  if (entry.items?.length) return activeLeaf(entry, pathname) !== null;
  return entry.href ? matches(pathname, entry.href) : false;
}
