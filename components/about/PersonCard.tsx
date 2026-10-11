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

type Tone = "kepala" | "laboran" | "plain" | "dosen" | "asisten";

const TONE: Record<Tone, string> = {
  kepala: "bg-basalt text-[#F3EFE8] border-basalt hover:bg-basalt-light",
  dosen: "bg-oxide-deep text-[#F6EFE9] border-oxide-deep hover:bg-oxide-deeper",
  laboran: "bg-mist text-ink border-line border-l-4 border-l-basalt hover:border-basalt",
  plain: "bg-white text-ink border-line hover:border-basalt",
  asisten: "bg-white text-ink border-line border-t-2 border-t-oxide hover:border-oxide hover:-translate-y-0.5",
};

// Warna teks sekunder (label jabatan & nomor identitas) per tone.
const LABEL: Record<Tone, string> = {
  kepala: "text-[#C9BFAE]",
  dosen: "text-[#E7B9A5]",
  laboran: "text-muted",
  plain: "text-muted",
  asisten: "text-oxide-dark",
};
const IDENT: Record<Tone, string> = {
  kepala: "text-[#B9B3A8]",
  dosen: "text-[#D9BFB3]",
  laboran: "text-muted",
  plain: "text-muted",
  asisten: "text-muted",
};

/** Foto persegi (sudut membulat) dengan sedikit jarak dari tepi kartu; kalau belum ada / gagal dimuat, tampil inisial. */
function SquarePhoto({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <span className="relative block aspect-square w-full overflow-hidden rounded-lg bg-mist">
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Foto ${name}`}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden className="flex h-full w-full items-center justify-center font-display text-5xl text-muted">
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
  

  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      aria-label={`${person.nama}${person.ident ? `, ${person.ident}` : ""}. ${open ? "Tutup" : "Lihat"} foto`}
      className={`relative w-full overflow-hidden rounded border text-left shadow-card transition duration-300 ease-smooth hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-oxide ${TONE[tone]} ${className}`}
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
            <span className="block p-2 pb-0">
              <SquarePhoto src={person.photo} name={person.nama} />
            </span>
          </motion.span>
        )}
      </AnimatePresence>

      {index !== undefined && !open && (
        <span
          className={`absolute right-3 top-3 font-mono text-[10px] ${LABEL[tone]}`}
          aria-hidden
        >
          {String(index).padStart(2, "0")}
        </span>
      )}

      <span className="block px-4 py-3">
        {label && (
          <span className={`mb-1 block font-mono text-[11px] uppercase tracking-wider ${LABEL[tone]}`}>
            {label}
          </span>
        )}
        <span className="block pr-6 text-sm font-semibold leading-snug">{person.nama}</span>
        {person.ident && (
          <span className={`mt-0.5 block font-mono text-xs ${IDENT[tone]}`}>
            {person.ident}
          </span>
        )}
      </span>
    </button>
  );
}

/** Slot jabatan yang belum diisi. */
export function EmptySlot({ label }: { label: string }) {
  return (
    <div className="w-full rounded border border-dashed border-line bg-mist px-4 py-3 text-left">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">{label}</span>
      <span className="block text-sm italic text-muted">Belum ditetapkan</span>
    </div>
  );
}
