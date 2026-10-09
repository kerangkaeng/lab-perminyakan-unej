"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { initialsOf } from "@/components/profile/Avatar";

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

/** Foto persegi selebar kartu; kalau belum ada / gagal dimuat, tampil inisial. */
function SquarePhoto({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <span className="relative block aspect-square w-full overflow-hidden bg-mist">
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Foto ${name}`}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden className="flex h-full w-full items-center justify-center font-display text-5xl text-core">
          {initialsOf(name)}
        </span>
      )}
    </span>
  );
}

/**
 * Kartu satu orang. Awalnya hanya nama + NIM/NIP; klik untuk membuka foto
 * di atas identitas (persegi, selebar kartu), klik lagi untuk menutup.
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
      className={`relative w-full overflow-hidden rounded border text-left shadow-card transition duration-300 ease-smooth hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-rig ${TONE[tone]} ${className}`}
    >
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
            <SquarePhoto src={person.photo} name={person.nama} />
          </motion.span>
        )}
      </AnimatePresence>

      {index !== undefined && !open && (
        <span
          className={`absolute right-3 top-3 font-mono text-[10px] ${dark ? "text-rig-light" : "text-rig"}`}
          aria-hidden
        >
          {String(index).padStart(2, "0")}
        </span>
      )}

      <span className="block px-4 py-3">
        {label && (
          <span className={`mb-1 block font-mono text-[11px] uppercase tracking-wider ${dark ? "text-rig-light" : "text-core"}`}>
            {label}
          </span>
        )}
        <span className="block pr-6 text-sm font-semibold leading-snug">{person.nama}</span>
        <span className={`mt-0.5 block font-mono text-xs ${dark ? "text-paper/70" : "text-core"}`}>
          {person.ident ?? "—"}
        </span>
      </span>
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
