"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Avatar } from "@/components/profile/Avatar";

export type OrgPerson = {
  id: string;
  nama: string;
  /** NIM atau NIP. */
  ident: string | null;
  /** URL foto publik, atau null kalau belum punya. */
  photo: string | null;
};

type Tone = "core" | "plain" | "dosen" | "asisten";

const TONE: Record<Tone, string> = {
  core: "bg-petrol text-paper border-petrol hover:bg-petrol-light",
  plain: "bg-white text-ink border-line hover:border-petrol",
  dosen: "bg-petrol text-paper border-petrol hover:bg-petrol-light",
  asisten: "bg-white text-ink border-line border-t-2 border-t-rig hover:border-petrol hover:-translate-y-0.5",
};

/**
 * Kartu satu orang. Awalnya hanya nama + NIM/NIP; klik untuk membuka foto
 * di tempat (tanpa pindah halaman), klik lagi untuk menutup.
 */
export function PersonCard({
  person,
  tone = "plain",
  label,
  index,
  className = "",
}: {
  person: OrgPerson;
  tone?: Tone;
  /** Teks kecil di atas nama (nama jabatan). */
  label?: string;
  /** Nomor urut kecil di pojok (dipakai asisten). */
  index?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const dark = tone === "core" || tone === "dosen";

  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      aria-label={`${person.nama}${person.ident ? `, ${person.ident}` : ""}. ${open ? "Tutup" : "Lihat"} foto`}
      className={`relative w-full rounded border px-4 py-3 text-left shadow-card transition duration-300 ease-smooth hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-rig ${TONE[tone]} ${className}`}
    >
      {index !== undefined && (
        <span
          className={`absolute right-3 top-3 font-mono text-[10px] ${dark ? "text-rig-light" : "text-rig"}`}
          aria-hidden
        >
          {String(index).padStart(2, "0")}
        </span>
      )}
      {label && (
        <span className={`mb-1 block font-mono text-[11px] uppercase tracking-wider ${dark ? "text-rig-light" : "text-core"}`}>
          {label}
        </span>
      )}
      <span className="block pr-6 text-sm font-semibold leading-snug">{person.nama}</span>
      <span className={`mt-0.5 block font-mono text-xs ${dark ? "text-paper/70" : "text-core"}`}>
        {person.ident ?? "—"}
      </span>

      <AnimatePresence initial={false}>
        {open && (
          <motion.span
            key="photo"
            className="block overflow-hidden"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="mt-3 flex justify-center">
              <Avatar src={person.photo} name={person.nama} size={112} className={dark ? "border-paper/30" : ""} />
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

/** Slot jabatan yang belum diisi. */
export function EmptySlot({ label }: { label: string }) {
  return (
    <div className="w-full rounded border border-dashed border-line bg-mist px-4 py-3 text-left">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-core">{label}</span>
      <span className="block text-sm italic text-core">Belum ditetapkan</span>
    </div>
  );
}
