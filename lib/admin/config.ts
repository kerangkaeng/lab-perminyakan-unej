export type FieldType =
  | "text" | "textarea" | "number" | "date" | "checkbox"
  | "select" | "relation" | "tags" | "image" | "pdf" | "file";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  relationTable?: string;
  relationLabelField?: string;
  required?: boolean;
}

export interface TableConfig {
  table: string;
  label: string;
  fields: FieldConfig[];
  listColumns: string[];
  orderBy?: string;
  orderAsc?: boolean;
  manualId?: boolean; // true kalau primary key diisi manual (bukan uuid auto)
}

const STATUS: FieldConfig = { name: "status", label: "Status", type: "select", options: ["draft", "published"], required: true };

export const adminTables: Record<string, TableConfig> = {
  facilities: {
    table: "facilities",
    label: "Facilities",
    orderBy: "name",
    orderAsc: true,
    listColumns: ["name", "status"],
    fields: [
      { name: "slug", label: "Slug (unik, contoh: reservoir-laboratory)", type: "text", required: true },
      { name: "name", label: "Nama Lab", type: "text", required: true },
      { name: "name_en", label: "Nama (English)", type: "text" },
      { name: "short_description", label: "Deskripsi Singkat", type: "textarea" },
      { name: "description", label: "Deskripsi Lengkap", type: "textarea" },
      { name: "cover_image", label: "Cover Image", type: "image" },
      STATUS,
    ],
  },

  practicum_modules: {
    table: "practicum_modules",
    label: "Modul Praktikum",
    orderBy: "title",
    orderAsc: true,
    listColumns: ["title", "facility_id", "status"],
    fields: [
      { name: "facility_id", label: "Laboratorium", type: "relation", relationTable: "facilities", relationLabelField: "name", required: true },
      { name: "title", label: "Judul Modul (contoh: Praktikum Fluida Reservoir)", type: "text", required: true },
      { name: "slug", label: "Slug (unik, contoh: fluida-reservoir)", type: "text", required: true },
      { name: "description", label: "Deskripsi / Tujuan Pembelajaran", type: "textarea" },
      { name: "file_url", label: "Berkas Modul (PDF)", type: "pdf" },
      STATUS,
    ],
  },

  equipment: {
    table: "equipment",
    label: "Equipment (Alat Lab & Alat Umum)",
    orderBy: "name",
    orderAsc: true,
    listColumns: ["name", "facility_id", "status"],
    fields: [
      { name: "facility_id", label: "Milik Lab", type: "relation", relationTable: "facilities", relationLabelField: "name" },
      { name: "name", label: "Nama Alat", type: "text", required: true },
      { name: "spec", label: "Spesifikasi", type: "textarea" },
      { name: "function", label: "Fungsi", type: "textarea" },
      { name: "image", label: "Foto Alat", type: "image" },
      { name: "sop_pdf_url", label: "SOP Penggunaan (PDF)", type: "pdf" },
      STATUS,
    ],
  },

  lab_documents: {
    table: "lab_documents",
    label: "Dokumen & Keselamatan Kerja",
    orderBy: "category",
    orderAsc: true,
    listColumns: ["category", "title", "file_type", "status"],
    fields: [
      {
        name: "category", label: "Kategori", type: "select", required: true,
        options: [
          "tata_tertib_lab", "tata_tertib_praktikum", "sop_limbah_b3", "k3",
          "poster_larangan", "poster_bencana_alam", "poster_kebakaran", "pedoman_k3",
        ],
      },
      { name: "title", label: "Judul Dokumen", type: "text", required: true },
      { name: "file_type", label: "Tipe File", type: "select", options: ["pdf", "image"], required: true },
      { name: "file_url", label: "Upload File (PDF atau Gambar)", type: "file", required: true },
      STATUS,
    ],
  },

  publications: {
    table: "publications",
    label: "Publications",
    orderBy: "year",
    orderAsc: false,
    manualId: true,
    listColumns: ["id", "title", "year", "type", "status"],
    fields: [
      { name: "id", label: "ID (unik, contoh: pub-2026-02)", type: "text", required: true },
      { name: "year", label: "Tahun", type: "number", required: true },
      { name: "title", label: "Judul", type: "text", required: true },
      { name: "authors", label: "Penulis", type: "text", required: true },
      { name: "type", label: "Tipe", type: "select", options: ["Journal", "Conference", "Thesis"], required: true },
      { name: "url", label: "Link (opsional)", type: "text" },
      STATUS,
    ],
  },

  research_areas: {
    table: "research_areas",
    label: "Research Areas",
    orderBy: "name",
    orderAsc: true,
    listColumns: ["name", "status"],
    fields: [
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "name", label: "Nama Bidang", type: "text", required: true },
      { name: "description", label: "Deskripsi", type: "textarea" },
      STATUS,
    ],
  },

  research_projects: {
    table: "research_projects",
    label: "Research Projects",
    orderBy: "year",
    orderAsc: false,
    listColumns: ["title", "year", "status_project", "status"],
    fields: [
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "title", label: "Judul Riset", type: "text", required: true },
      { name: "researcher", label: "Peneliti", type: "text", required: true },
      { name: "year", label: "Tahun", type: "number", required: true },
      { name: "field", label: "Bidang", type: "text" },
      { name: "status_project", label: "Status Proyek", type: "select", options: ["Ongoing", "Completed", "Planned"], required: true },
      { name: "abstract", label: "Abstrak", type: "textarea" },
      STATUS,
    ],
  },

  researchers: {
    table: "researchers",
    label: "Researchers",
    orderBy: "name",
    orderAsc: true,
    listColumns: ["name", "role", "status"],
    fields: [
      { name: "name", label: "Nama", type: "text", required: true },
      { name: "role", label: "Jabatan", type: "text" },
      { name: "field", label: "Bidang", type: "text" },
      { name: "photo", label: "Foto", type: "image" },
      STATUS,
    ],
  },

  announcements: {
    table: "announcements",
    label: "Announcements",
    orderBy: "date",
    orderAsc: false,
    listColumns: ["title", "date", "is_pinned", "status"],
    fields: [
      { name: "title", label: "Judul", type: "text", required: true },
      { name: "content", label: "Isi", type: "textarea", required: true },
      { name: "date", label: "Tanggal", type: "date", required: true },
      { name: "is_pinned", label: "Sematkan (Pinned)", type: "checkbox" },
      STATUS,
    ],
  },

  gallery_items: {
    table: "gallery_items",
    label: "Gallery",
    orderBy: "date",
    orderAsc: false,
    listColumns: ["title", "category", "date", "status"],
    fields: [
      { name: "title", label: "Judul (opsional)", type: "text" },
      {
        name: "category", label: "Kategori", type: "select", required: true,
        options: ["Praktikum", "Training", "Workshop", "Seminar", "Kunjungan Industri", "Kunjungan Sekolah", "Penelitian", "Pengabdian Masyarakat"],
      },
      { name: "image_url", label: "Foto", type: "image", required: true },
      { name: "date", label: "Tanggal", type: "date", required: true },
      STATUS,
    ],
  },
};
