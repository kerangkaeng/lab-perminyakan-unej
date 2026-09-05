export type Facility = {
  slug: string;
  name: string;
  nameEn: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  equipment: Equipment[];
  modules?: string[];
};

export type Equipment = {
  name: string;
  spec: string;
  function: string;
  image?: string;
};

export type ResearchArea = {
  slug: string;
  name: string;
  description: string;
};

export type ResearchProject = {
  slug: string;
  title: string;
  researcher: string;
  year: number;
  field: string;
  status: "Ongoing" | "Completed" | "Planned";
  abstract: string;
};

export type Researcher = {
  name: string;
  role: string;
  field: string;
  photo?: string;
};

export type Publication = {
  id: string;
  year: number;
  title: string;
  authors: string;
  type: "Journal" | "Conference" | "Thesis";
  url?: string;
};

export type NewsItem = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  coverImage?: string;
};

export type PracticumModule = {
  slug: string;
  title: string;
  facility: string;
  description: string;
  fileUrl?: string;
};

export type TeamMember = {
  name: string;
  role: string;
  photo?: string;
};

// ---- Supabase-backed types (Tahap 2: praktikum request/approval) ----

export type UserRole = "mahasiswa" | "admin";

export type UserRecord = {
  id: string;
  auth_uid: string | null;
  nim: string;
  nama: string;
  prodi: string | null;
  role: UserRole;
  created_at: string;
};

export type PracticumRequestStatus = "pending" | "approved" | "rejected";
export type JenisKegiatan = "praktikum" | "non_praktikum";
export type IncidentType = "rusak_pecah" | "hilang" | "tumpah" | "lainnya";

export type PracticumRequest = {
  id: string;
  requester_id: string;
  jenis_kegiatan: JenisKegiatan;
  praktikum_nama: string | null;
  modul: string | null;
  kegiatan_non_praktikum: string | null;
  deskripsi_lainnya: string | null;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  lokasi: string | null;
  status: PracticumRequestStatus;
  catatan_admin: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  // hanya terisi saat di-join oleh admin (lihat AdminRequestsTable)
  requester?: { nama: string; nim: string; prodi: string | null } | null;

  // ---- Administrasi penyelesaian kegiatan ----
  completed: boolean;
  completed_at: string | null;
  doc_pretest: string[] | null;
  doc_tes_alat: string[] | null;
  doc_praktikum: string[] | null;
  doc_kegiatan: string[] | null;
  ada_insiden: boolean;
  insiden_jenis: IncidentType | null;
  insiden_jenis_lainnya: string | null;
  insiden_nama_alat: string | null;
  insiden_jumlah: string | null;
  insiden_penyebab: string | null;
  insiden_pihak_terkait: string | null;
  insiden_dokumentasi: string[] | null;
  insiden_tanggung_jawab: string | null;
};
