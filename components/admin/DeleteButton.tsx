"use client";

import { useTransition } from "react";
import { deleteRecord } from "@/lib/admin/actions";

export function DeleteButton({ table, id }: { table: string; id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm("Yakin hapus data ini? Tindakan ini tidak bisa dibatalkan.")) {
          startTransition(() => {
            deleteRecord(table, id);
          });
        }
      }}
      className="text-red-600 hover:text-red-800 underline disabled:opacity-50"
    >
      {isPending ? "Menghapus..." : "Hapus"}
    </button>
  );
}
