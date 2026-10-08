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
