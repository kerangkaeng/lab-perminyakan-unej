import { notFound } from "next/navigation";
import { publications } from "@/data/publications";
import { Button } from "@/components/ui/Button";

export function generateStaticParams() {
  return publications.map((p) => ({ id: p.id }));
}

export default function PublicationDetailPage({ params }: { params: { id: string } }) {
  const pub = publications.find((p) => p.id === params.id);
  if (!pub) return notFound();

  return (
    <div className="container-lab py-16 max-w-2xl">
      <p className="font-mono text-xs text-core mb-3">{pub.year} · {pub.type}</p>
      <h1 className="text-2xl md:text-3xl font-display font-semibold mb-4">{pub.title}</h1>
      <p className="text-core mb-8">{pub.authors}</p>
      <div className="flex gap-4">
        <Button href={pub.url ?? "#"}>Download PDF</Button>
      </div>
    </div>
  );
}
