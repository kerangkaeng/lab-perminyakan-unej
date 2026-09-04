import { publications } from "@/data/publications";
import { PublicationTable } from "@/components/publications/PublicationTable";

export default function PublicationsPage() {
  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Publications</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Publikasi</h1>
      <PublicationTable publications={publications} />
    </div>
  );
}
