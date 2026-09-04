import { Facility } from "@/types";

export const facilities: Facility[] = [
  {
    slug: "pvt-laboratory",
    name: "Laboratorium PVT",
    nameEn: "PVT Laboratory",
    shortDescription: "Analisis perilaku fasa dan sifat fluida reservoir pada berbagai tekanan dan temperatur.",
    description:
      "Laboratorium PVT (Pressure-Volume-Temperature) digunakan untuk mengkarakterisasi sifat fisik fluida reservoir seperti minyak, gas, dan air formasi pada kondisi tekanan dan temperatur reservoir. Data ini menjadi dasar untuk simulasi reservoir dan perhitungan cadangan.",
    coverImage: "/images/facilities/pvt.jpg",
    equipment: [
      {
        name: "PVT Cell Apparatus",
        spec: "Tekanan kerja hingga 10,000 psi, temperatur hingga 200°C",
        function: "Mengukur perilaku fasa fluida reservoir pada kondisi in-situ",
      },
      {
        name: "Mercury-Free Pump",
        spec: "Sistem pompa presisi tinggi tanpa merkuri",
        function: "Mengontrol tekanan sel PVT secara presisi",
      },
    ],
    modules: ["Analisis Bubble Point", "Konstanta Fasa Fluida"],
  },
  {
    slug: "drilling-fluid-laboratory",
    name: "Laboratorium Lumpur Pemboran",
    nameEn: "Drilling Fluid Laboratory",
    shortDescription: "Karakterisasi dan evaluasi sifat fisik serta rheologi fluida pemboran.",
    description:
      "Laboratorium ini digunakan untuk melakukan karakterisasi dan evaluasi sifat fisik serta rheologi fluida pemboran, termasuk pengujian densitas, viskositas, filtration loss, dan gel strength sesuai standar API.",
    coverImage: "/images/facilities/drilling-fluid.jpg",
    equipment: [
      {
        name: "Rotational Viscometer",
        spec: "Kecepatan 3–600 RPM, standar API RP 13B-1",
        function: "Mengukur viskositas dan sifat rheologi lumpur pemboran",
      },
      {
        name: "Mud Balance",
        spec: "Ketelitian ±0.01 g/cc",
        function: "Mengukur densitas fluida pemboran",
      },
      {
        name: "Filter Press API",
        spec: "Tekanan 100 psi, standar API",
        function: "Mengukur filtration loss dan ketebalan mud cake",
      },
    ],
    modules: ["Pengukuran Rheologi Lumpur", "Uji Filtration Loss"],
  },
  {
    slug: "petrophysics-laboratory",
    name: "Laboratorium Petrofisika",
    nameEn: "Petrophysics Laboratory",
    shortDescription: "Pengujian sifat fisik batuan reservoir: porositas, permeabilitas, dan saturasi fluida.",
    description:
      "Laboratorium Petrofisika berfokus pada pengujian sifat fisik batuan reservoir seperti porositas, permeabilitas, dan saturasi fluida, yang menjadi dasar interpretasi data logging dan evaluasi formasi.",
    coverImage: "/images/facilities/petrophysics.jpg",
    equipment: [
      {
        name: "Helium Porosimeter",
        spec: "Berbasis hukum Boyle, akurasi tinggi untuk sampel core",
        function: "Mengukur porositas efektif batuan",
      },
      {
        name: "Gas Permeameter",
        spec: "Steady-state, tekanan hingga 500 psi",
        function: "Mengukur permeabilitas absolut batuan reservoir",
      },
    ],
    modules: ["Pengukuran Porositas", "Pengukuran Permeabilitas"],
  },
  {
    slug: "reservoir-engineering-laboratory",
    name: "Laboratorium Teknik Reservoir",
    nameEn: "Reservoir Engineering Laboratory",
    shortDescription: "Simulasi dan analisis perilaku reservoir untuk optimasi produksi.",
    description:
      "Laboratorium ini mendukung studi simulasi reservoir, well testing, dan analisis performa reservoir menggunakan perangkat lunak industri serta data lapangan.",
    coverImage: "/images/facilities/reservoir.jpg",
    equipment: [
      {
        name: "Workstation Simulasi Reservoir",
        spec: "Lisensi perangkat lunak simulasi standar industri",
        function: "Pemodelan dan simulasi performa reservoir",
      },
    ],
    modules: ["Dasar Simulasi Reservoir"],
  },
  {
    slug: "production-engineering-laboratory",
    name: "Laboratorium Teknik Produksi",
    nameEn: "Production Engineering Laboratory",
    shortDescription: "Studi sistem produksi, artificial lift, dan optimasi sumur.",
    description:
      "Laboratorium Teknik Produksi digunakan untuk mempelajari sistem produksi minyak dan gas, termasuk artificial lift, well completion, dan optimasi produksi sumur.",
    coverImage: "/images/facilities/production.jpg",
    equipment: [
      {
        name: "Flow Loop Simulator",
        spec: "Simulasi aliran multifasa skala laboratorium",
        function: "Mempelajari perilaku aliran fluida produksi",
      },
    ],
    modules: ["Dasar Artificial Lift"],
  },
  {
    slug: "core-analysis-laboratory",
    name: "Laboratorium Analisis Core",
    nameEn: "Core Analysis Laboratory",
    shortDescription: "Analisis sampel inti batuan untuk karakterisasi reservoir.",
    description:
      "Laboratorium ini melakukan analisis rutin dan khusus terhadap sampel core batuan reservoir untuk mendukung karakterisasi statik reservoir.",
    coverImage: "/images/facilities/core-analysis.jpg",
    equipment: [
      {
        name: "Core Cutting & Preparation Unit",
        spec: "Presisi potong sampel core standar laboratorium",
        function: "Persiapan sampel core untuk pengujian lanjutan",
      },
    ],
    modules: ["Preparasi Sampel Core"],
  },
  {
    slug: "well-logging-laboratory",
    name: "Laboratorium Well Logging",
    nameEn: "Well Logging Laboratory",
    shortDescription: "Interpretasi data log sumur untuk evaluasi formasi bawah permukaan.",
    description:
      "Laboratorium Well Logging digunakan untuk mempelajari prinsip dan interpretasi data logging sumur, termasuk log resistivitas, log densitas, dan log neutron.",
    coverImage: "/images/facilities/well-logging.jpg",
    equipment: [
      {
        name: "Wireline Log Interpretation Software",
        spec: "Perangkat lunak interpretasi log standar industri",
        function: "Interpretasi data log untuk evaluasi formasi",
      },
    ],
    modules: ["Dasar Interpretasi Log", "Well Logging Lanjutan"],
  },
];

export function getFacilityBySlug(slug: string) {
  return facilities.find((f) => f.slug === slug);
}
