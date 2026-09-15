import { adminTables } from "@/lib/admin/config";

export type DashboardNavItem = {
  href: string;
  label: string;
  roles: Array<"mahasiswa" | "admin">;
};

export const primaryNavItems: DashboardNavItem[] = [
  { href: "/practicum/ajukan", label: "Ajukan Kegiatan", roles: ["mahasiswa", "admin"] },
  { href: "/practicum/status", label: "Status Pengajuan", roles: ["mahasiswa", "admin"] },
  { href: "/practicum/jadwal", label: "Jadwal", roles: ["mahasiswa", "admin"] },
  { href: "/admin/practicum-requests", label: "Kelola Pengajuan", roles: ["admin"] },
  { href: "/admin/news", label: "News", roles: ["admin"] },
];

export const contentNavItems: DashboardNavItem[] = Object.entries(adminTables).map(
  ([key, config]) => ({
    href: `/admin/${key}`,
    label: config.label,
    roles: ["admin"],
  })
);
