"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { EmptySlot, PersonCard, type OrgPerson } from "./PersonCard";

export type PraktikumUnit = {
  id: string;
  title: string;
  dosen: OrgPerson[];
  asisten: OrgPerson[];
};

export type LabUnit = {
  key: string;
  /** Mis. "Pemboran & Produksi". */
  name: string;
  kepala: OrgPerson | null;
  laboran: OrgPerson | null;
  /** Sudah terurut sesuai semester. */
  praktikum: PraktikumUnit[];
};

const ease = [0.22, 1, 0.36, 1] as const;

function Step({ delay = 0, children, className = "" }: { delay?: number; children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/** Garis penghubung vertikal: statis & solid supaya selalu menyambung antar kotak. */
function Link({ h = 24 }: { h?: number }) {
  return <div aria-hidden className="mx-auto w-0.5 shrink-0 bg-core" style={{ height: h }} />;
}

function Praktikum({ p, defaultOpen }: { p: PraktikumUnit; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();

  return (
    <div className="overflow-hidden rounded border border-petrol bg-mist">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rig"
      >
        <span className="min-w-0 break-words font-display text-sm font-semibold text-ink lg:text-base">{p.title}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-petrol transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="overflow-hidden"
          >
            <div className="space-y-5 px-4 pb-5 pt-1">
              {p.dosen.length === 0 ? (
                <EmptySlot label="Dosen MK" />
              ) : (
                <div className="space-y-3">
                  {p.dosen.map((d) => (
                    <PersonCard key={d.id} person={d} tone="dosen" label="Dosen MK" />
                  ))}
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center gap-3">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-core">Asisten Praktikum</p>
                  <span className="h-px flex-1 bg-line" />
                </div>
                {p.asisten.length === 0 ? (
                  <EmptySlot label="Asisten" />
                ) : (
                  <ul className="grid gap-3">
                    {p.asisten.map((a, i) => (
                      <motion.li
                        key={a.id}
                        initial={reduce ? false : { opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.4), ease }}
                      >
                        <PersonCard person={a} tone="asisten" index={i + 1} />
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function OrgChart({ labs, peneliti }: { labs: LabUnit[]; peneliti: OrgPerson[] }) {
  if (labs.length === 0) return null;

  // Lebar kolom lab = 24px (padding md:px-3 kiri+kanan) + bagian sebanding
  // jumlah praktikum dari sisa lebar. Dengan begitu tiap kartu praktikum
  // (di semua lab) PERSIS sama lebar, berapa pun lebar layarnya.
  //   kolom_i = 24px + g_i * (100% - 24px * jumlahLab) / totalPraktikum
  const L = labs.length;
  const weights = labs.map((l) => Math.max(1, l.praktikum.length));
  const N = weights.reduce((a, b) => a + b, 0);
  const colW = (g: number) => `(24px + ${g} * (100% - ${24 * L}px) / ${N})`;
  const first = colW(weights[0]);
  const last = colW(weights[L - 1]);

  // Garis datar: dari pusat kolom pertama sampai pusat kolom terakhir.
  const barL = `calc(${first} / 2)`;
  const barR = `calc(${last} / 2)`;
  // Akar tepat di tengah antara kedua pusat itu.
  const rootX = `calc((${first} / 2 + 100% - ${last} / 2) / 2)`;

  const cardCls = "mx-auto w-full max-w-sm md:max-w-[var(--card-max)]";

  return (
    <div className="flex flex-col items-center">
      <div className="w-full" style={{ ["--root-x" as string]: rootX }}>
        <div className="org-root">
          <Step>
            <div className="rounded border border-petrol bg-petrol px-8 py-4 text-center text-paper shadow-card">
              <span className="block font-mono text-[11px] uppercase tracking-wider text-rig-light">Pengelola</span>
              <span className="font-display text-lg font-semibold">Teknik Perminyakan UNEJ</span>
            </div>
          </Step>
          <Link />
        </div>
      </div>

      <div className="org-row" style={{ ["--bar-l" as string]: barL, ["--bar-r" as string]: barR }}>
        {labs.map((lab, i) => {
          const n = lab.praktikum.length;
          const g = weights[i];
          return (
            <div
              key={lab.key}
              className="org-col"
              style={{ ["--grow" as string]: g, ["--card-max" as string]: `calc(100% / ${g})` }}
            >
              <Step delay={0.1 + i * 0.05} className={cardCls}>
                <div className="rounded border border-line bg-white px-4 py-3 text-center shadow-card">
                  <span className="block font-mono text-[11px] uppercase tracking-wider text-core">Laboratorium</span>
                  <span className="font-semibold">{lab.name}</span>
                </div>
              </Step>
              <Link />
              <Step delay={0.2} className={cardCls}>
                {lab.kepala ? (
                  <PersonCard person={lab.kepala} tone="core" label="Kepala Laboratorium" />
                ) : (
                  <EmptySlot label="Kepala Laboratorium" />
                )}
              </Step>
              <Link />
              <Step delay={0.3} className={cardCls}>
                {lab.laboran ? (
                  <PersonCard person={lab.laboran} tone="plain" label="Laboran / Teknisi" />
                ) : (
                  <EmptySlot label="Laboran / Teknisi" />
                )}
              </Step>

              {n > 0 && (
                <>
                  <Link />
                  <div
                    className={`prak-row ${n > 1 ? "multi" : ""}`}
                    style={{
                      ["--bar-l" as string]: `${100 / (2 * n)}%`,
                      ["--bar-r" as string]: `${100 / (2 * n)}%`,
                    }}
                  >
                    {lab.praktikum.map((p) => (
                      <div key={p.id} className="prak-col">
                        <Step delay={0.1}>
                          <Praktikum p={p} defaultOpen />
                        </Step>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {peneliti.length > 0 && (
        <Step className="mt-14 w-full border-t border-line pt-8">
          <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-wider text-core">Dosen Peneliti</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {peneliti.map((d) => (
              <PersonCard key={d.id} person={d} tone="plain" />
            ))}
          </div>
        </Step>
      )}
    </div>
  );
}
