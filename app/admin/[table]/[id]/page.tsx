import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminTables } from "@/lib/admin/config";
import { AdminForm } from "@/components/admin/AdminForm";
import { upsertRecord } from "@/lib/admin/actions";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AdminRecordPage({ params }: { params: { table: string; id: string } }) {
  const config = adminTables[params.table];
  if (!config) return notFound();

  const supabase = supabaseServer();
  const isNew = params.id === "new";

  let initialData: Record<string, any> | undefined;
  if (!isNew) {
    const { data } = await supabase.from(config.table).select("*").eq("id", params.id).single();
    if (!data) return notFound();
    initialData = data;
  }

  const relationOptions: Record<string, { value: string; label: string }[]> = {};
  for (const field of config.fields) {
    if (field.type === "relation" && field.relationTable) {
      const labelField = field.relationLabelField ?? "name";
      const { data } = await supabase.from(field.relationTable).select(`id, ${labelField}`).order(labelField);
      relationOptions[field.name] = (data ?? []).map((row: any) => ({
        value: row.id,
        label: row[labelField],
      }));
    }
  }

  const fields = config.manualId && !isNew ? config.fields.filter((f) => f.name !== "id") : config.fields;
  const boundAction = upsertRecord.bind(null, params.table, params.id);

  return (
    <DashboardShell title={isNew ? `Tambah ${config.label}` : `Edit ${config.label}`}>
      <AdminForm
        fields={fields}
        initialData={initialData}
        action={boundAction}
        relationOptions={relationOptions}
        submitLabel={isNew ? "Buat" : "Simpan Perubahan"}
      />
    </DashboardShell>
  );
}
