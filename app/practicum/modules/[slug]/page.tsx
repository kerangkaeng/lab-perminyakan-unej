import { Button } from "@/components/ui/Button";

export default function ModuleDetailPage({ params }: { params: { slug: string } }) {
  const title = params.slug.replace(/-/g, " ");

  return (
    <div className="container-lab py-16 max-w-2xl">
      <p className="eyebrow mb-3">Modul Praktikum</p>
      <h1 className="text-2xl md:text-3xl font-display font-semibold mb-6 capitalize">{title}</h1>
      <p className="text-core mb-8">
        Deskripsi modul praktikum, tujuan pembelajaran, dan prosedur pelaksanaan akan
        ditampilkan di sini. Modul lengkap dapat diunduh melalui tombol di bawah.
      </p>
      <Button href="#">Download Modul</Button>
    </div>
  );
}
