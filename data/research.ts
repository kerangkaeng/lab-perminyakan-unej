import { ResearchArea, ResearchProject, Researcher } from "@/types";

export const researchAreas: ResearchArea[] = [
  { slug: "drilling-engineering", name: "Drilling Engineering", description: "Optimasi proses dan teknologi pemboran sumur migas." },
  { slug: "reservoir-engineering", name: "Reservoir Engineering", description: "Karakterisasi dan simulasi performa reservoir." },
  { slug: "production-engineering", name: "Production Engineering", description: "Optimasi sistem produksi dan artificial lift." },
  { slug: "petrophysics", name: "Petrophysics", description: "Evaluasi formasi dan sifat fisik batuan reservoir." },
  { slug: "enhanced-oil-recovery", name: "Enhanced Oil Recovery", description: "Metode peningkatan perolehan minyak lanjutan." },
  { slug: "geothermal", name: "Geothermal", description: "Eksplorasi dan pengembangan energi panas bumi." },
  { slug: "digital-oilfield", name: "Digital Oilfield", description: "Digitalisasi dan otomasi operasi lapangan migas." },
  { slug: "ai-in-petroleum", name: "Artificial Intelligence in Petroleum Engineering", description: "Penerapan machine learning untuk masalah teknik perminyakan." },
];

export const researchProjects: ResearchProject[] = [
  {
    slug: "surrogate-model-trayektori-pemboran",
    title: "Pengembangan Surrogate Model untuk Optimasi Trajektori Pemboran Berarah",
    researcher: "Dr. Ir. Nama Peneliti",
    year: 2026,
    field: "Drilling Engineering",
    status: "Ongoing",
    abstract: "Penelitian ini mengembangkan model surrogate berbasis machine learning untuk mempercepat optimasi trajektori sumur berarah dibandingkan simulasi konvensional.",
  },
  {
    slug: "eor-surfactant-polymer",
    title: "Studi Injeksi Surfactant-Polymer untuk Peningkatan Perolehan Minyak",
    researcher: "Dr. Nama Peneliti",
    year: 2025,
    field: "Enhanced Oil Recovery",
    status: "Completed",
    abstract: "Evaluasi laboratorium terhadap efektivitas injeksi surfactant-polymer pada batuan reservoir karbonat.",
  },
];

export const researchers: Researcher[] = [
  { name: "Dr. Ir. Nama Kepala Lab", role: "Kepala Laboratorium", field: "Reservoir Engineering" },
  { name: "Dr. Nama Dosen", role: "Dosen / Peneliti", field: "Drilling Engineering" },
];
