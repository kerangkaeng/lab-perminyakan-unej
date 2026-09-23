import { adminTables } from "@/lib/admin/config";

export type DashboardNavItem = {
  href: string;
  label: string;
  roles: Array<"mahasiswa" | "admin" | "asisten" | "dosen">;
};

export const primaryNavItems: DashboardNavItem[] = [
  { href: "/practicum/ajukan", label: "Ajukan Kegiatan", roles: ["mahasiswa", "admin"] },
  { href: "/practicum/status", label: "Status Pengajuan", roles: ["mahasiswa", "admin"] },
  { href: "/practicum/jadwal", label: "Jadwal", roles: ["mahasiswa", "admin"] },
  // asisten ikut ditambahkan di sini — halaman & tombol aksinya sendiri
  // yang menentukan dia cuma bisa lihat, bukan approve/reject (lihat
  // AdminRequestsTable.tsx + canManagePracticumRequests()).
  { href: "/admin/practicum-requests", label: "Kelola Pengajuan", roles: ["admin", "asisten"] },
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
