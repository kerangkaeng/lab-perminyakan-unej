import { Facility } from "@/types";

export const facilities: Facility[] = [
  {
    slug: "fluida-reservoir-laboratory",
    name: "Laboratorium Fluida Reservoir",
    nameEn: "Reservoir Fluid Laboratory",
    shortDescription: "Analisis perilaku fasa dan sifat fluida reservoir pada berbagai tekanan dan temperatur.",
    description:
      "Laboratorium Fluida Reservoir digunakan untuk mengkarakterisasi sifat fisik fluida reservoir seperti minyak, gas, dan air formasi pada kondisi tekanan dan temperatur reservoir. Data ini menjadi dasar untuk simulasi reservoir dan perhitungan cadangan.",
    coverImage: "/images/facilities/fluida-reservoir.jpg",
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
    modules: ["Praktikum Fluida Reservoir"],
  },
  {
    slug: "petrofisik-laboratory",
    name: "Laboratorium Petrofisik",
    nameEn: "Petrophysics Laboratory",
    shortDescription: "Pengujian sifat fisik batuan reservoir: porositas, permeabilitas, dan saturasi fluida.",
    description:
      "Laboratorium Petrofisik berfokus pada pengujian sifat fisik batuan reservoir seperti porositas, permeabilitas, dan saturasi fluida, yang menjadi dasar interpretasi data logging dan evaluasi formasi.",
    coverImage: "/images/facilities/petrofisik.jpg",
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
    modules: ["Praktikum Petrofisik"],
  },
  {
    slug: "pemboran-produksi-laboratory",
    name: "Laboratorium Pemboran & Produksi",
    nameEn: "Drilling & Production Laboratory",
    shortDescription: "Karakterisasi fluida pemboran serta studi sistem produksi dan optimasi sumur.",
    description:
      "Laboratorium Pemboran & Produksi digunakan untuk karakterisasi dan evaluasi sifat fisik serta rheologi fluida pemboran (densitas, viskositas, filtration loss, gel strength sesuai standar API), sekaligus mempelajari sistem produksi minyak dan gas termasuk artificial lift dan optimasi produksi sumur.",
    coverImage: "/images/facilities/pemboran-produksi.jpg",
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
      {
        name: "Flow Loop Simulator",
        spec: "Simulasi aliran multifasa skala laboratorium",
        function: "Mempelajari perilaku aliran fluida produksi",
      },
    ],
    modules: ["Praktikum Teknik Pemboran"],
  },
];

export function getFacilityBySlug(slug: string) {
  return facilities.find((f) => f.slug === slug);
}
