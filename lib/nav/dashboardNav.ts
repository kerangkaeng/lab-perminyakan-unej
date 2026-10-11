import { adminTables } from "@/lib/admin/config";

export type DashboardNavItem = {
  href: string;
  label: string;
  roles: Array<"mahasiswa" | "admin" | "asisten" | "dosen">;
};

export const primaryNavItems: DashboardNavItem[] = [
  // "asisten" ikut dimasukkan di tiga item ini — secara identitas dia
  // tetap mahasiswa aktif (lihat session.userType), jadi tetap boleh
  // mengajukan kegiatannya sendiri, memantau status pengajuannya sendiri,
  // dan melihat jadwal, terpisah dari tugasnya mengelola pengajuan orang
  // lain lewat "Kelola Pengajuan".
  { href: "/practicum/ajukan", label: "Ajukan Kegiatan", roles: ["mahasiswa", "admin", "asisten"] },
  { href: "/practicum/status", label: "Status Pengajuan", roles: ["mahasiswa", "admin", "asisten"] },
  { href: "/practicum/jadwal", label: "Jadwal", roles: ["mahasiswa", "admin", "asisten"] },
  // asisten ikut ditambahkan di sini — halaman & tombol aksinya sendiri
  // yang menentukan dia cuma bisa lihat, bukan approve/reject (lihat
  // AdminRequestsTable.tsx + canManagePracticumRequests()).
  { href: "/admin/practicum-requests", label: "Kelola Pengajuan", roles: ["admin", "asisten"] },
  // Rekap Excel admin-only (lihat catatan akses di recap/route.ts) — beda
  // dari "Kelola Pengajuan" yang juga boleh diakses asisten.
  { href: "/admin/rekap", label: "Rekap", roles: ["admin"] },
  { href: "/admin/news", label: "News", roles: ["admin"] },
  // Jabatan Lab: admin menetapkan Kepala Lab, Laboran, Dosen, Asisten dari user terdaftar.
  { href: "/admin/lab-roles", label: "Jabatan Lab", roles: ["admin"] },
  // "dosen" belum punya item nav sama sekali — belum ada fitur untuknya.
];

export const contentNavItems: DashboardNavItem[] = Object.entries(adminTables).map(
  ([key, config]) => ({
    href: `/admin/${key}`,
    label: config.label,
    // Cuma "announcements" yang dibuka untuk asisten — tabel admin
    // generic lainnya (facilities, equipment, dst) tetap admin-only.
    roles: key === "announcements" ? ["admin", "asisten"] : ["admin"],
  })
);

// ============================================================
// Pengelompokan untuk sidebar & menu mobile. Tiga kelompok berjudul:
//   - Kegiatan Saya : aktivitas pengguna sendiri (ajukan, status, jadwal)
//   - Pengelolaan   : tugas admin/asisten (kelola pengajuan, rekap, jabatan)
//   - Konten Situs  : berita + semua tabel konten
// Di sidebar tiap kelompok tampil sebagai akordeon.
// Hak akses tetap ditentukan oleh `roles` tiap item di atas.
// ============================================================
export type DashboardSection = {
  key: "kegiatan" | "pengelolaan" | "konten" | "publik";
  title: string;
  items: DashboardNavItem[];
};

const KEGIATAN = new Set(["/practicum/ajukan", "/practicum/status", "/practicum/jadwal"]);
const PENGELOLAAN = new Set(["/admin/practicum-requests", "/admin/rekap", "/admin/lab-roles"]);

export function dashboardSectionsFor(role: DashboardNavItem["roles"][number]): DashboardSection[] {
  const visible = (items: DashboardNavItem[]) => items.filter((i) => i.roles.includes(role));
  const primary = visible(primaryNavItems);
  const news = primary.filter((i) => i.href === "/admin/news");

  const sections: DashboardSection[] = [
    { key: "kegiatan", title: "Kegiatan Saya", items: primary.filter((i) => KEGIATAN.has(i.href)) },
    { key: "pengelolaan", title: "Pengelolaan", items: primary.filter((i) => PENGELOLAAN.has(i.href)) },
    { key: "konten", title: "Konten Situs", items: [...news, ...visible(contentNavItems)] },
  ];
  return sections.filter((s) => s.items.length > 0);
}

/**
 * Sidebar untuk pengunjung yang BELUM login: hanya informasi publik. Jadwal
 * kegiatan lab terbuka untuk umum (mahasiswa/dosen internal maupun pihak
 * eksternal), jadi tetap bisa dijangkau dari sidebar tanpa login.
 */
export const guestSections: DashboardSection[] = [
  {
    key: "publik",
    title: "Jadwal & Informasi",
    items: [
      { href: "/practicum/jadwal", label: "Jadwal Kegiatan Lab", roles: [] },
      { href: "/practicum/announcements", label: "Pengumuman", roles: [] },
      { href: "/practicum/modules", label: "Modul Praktikum", roles: [] },
    ],
  },
];
