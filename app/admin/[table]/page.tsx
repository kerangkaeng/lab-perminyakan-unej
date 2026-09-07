import Link from "next/link";
import { notFound } from "next/navigation";
import { adminTables } from "@/lib/admin/config";
import { supabaseServer } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const revalidate = 0;

export default async function AdminTableListPage({ params }: { params: { table: string } }) {
  const config = adminTables[params.table];
  if (!config) return notFound();

  const supabase = supabaseServer();
  const { data } = await supabase
    .from(config.table)
    .select("*")
    .order(config.orderBy ?? "created_at", { ascending: config.orderAsc ?? false });

  const rows = data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-semibold">{config.label}</h1>
        <Link href={`/admin/${params.table}/new`} className="bg-petrol text-paper px-4 py-2 text-sm font-medium hover:bg-petrol-light transition-colors">
          + Tambah Baru
        </Link>
      </div>
      <div className="overflow-x-auto border border-line">
        <table className="w-full text-sm">
          <thead className="bg-mist">
            <tr>
              {config.listColumns.map((col) => (
                <th key={col} className="text-left px-4 py-3 font-medium">{col}</th>
              ))}
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id} className="border-t border-line">
                {config.listColumns.map((col) => (
                  <td key={col} className="px-4 py-3">
                    {typeof row[col] === "boolean" ? (row[col] ? "Ya" : "Tidak") : String(row[col] ?? "—")}
                  </td>
                ))}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link href={`/admin/${params.table}/${row.id}`} className="text-petrol hover:text-rig underline mr-4">
                    Edit
                  </Link>
                  <DeleteButton table={params.table} id={row.id} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={config.listColumns.length + 1} className="px-4 py-6 text-center text-core">
                  Belum ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
