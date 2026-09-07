import { supabasePublic } from "@/lib/supabase/authed";

export const revalidate = 0;

interface EquipmentRow {
  id: string;
  name: string;
  spec: string | null;
  function: string | null;
  sop_pdf_url: string | null;
}

export default async function AlatUmumPage() {
  const supabase = supabasePublic();
  const { data } = await supabase
    .from("equipment")
    .select("*")
    .is("facility_id", null)
    .eq("status", "published")
    .order("name");

  const equipment = (data ?? []) as EquipmentRow[];

  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Fasilitas Laboratorium</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-4">Alat Umum</h1>
      <p className="text-core max-w-2xl mb-12">
        Peralatan pendukung yang digunakan bersama di seluruh laboratorium.
      </p>
      {equipment.length === 0 ? (
        <p className="text-core text-sm">Belum ada data alat umum.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map((eq) => (
            <div key={eq.id} className="border border-line p-5">
              <p className="font-display font-semibold text-ink mb-1">{eq.name}</p>
              {eq.spec && <p className="text-sm text-core mb-2">{eq.spec}</p>}
              {eq.function && <p className="text-sm text-core">{eq.function}</p>}
              {eq.sop_pdf_url && (
                <a href={eq.sop_pdf_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs font-mono text-petrol hover:text-rig underline">
                  Lihat SOP Penggunaan (PDF) →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
