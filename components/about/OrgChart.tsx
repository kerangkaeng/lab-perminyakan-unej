"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { EmptySlot, PersonCard, type OrgPerson } from "./PersonCard";

export type LabUnit = {
  key: string;
  /** Mis. "Pemboran & Produksi". */
  name: string;
  kepala: OrgPerson | null;
  laboran: OrgPerson | null;
};

export type PraktikumUnit = {
  id: string;
  title: string;
  dosen: OrgPerson[];
  asisten: OrgPerson[];
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

function VLine({ h = 24 }: { h?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className="w-0.5 origin-top bg-core"
      style={{ height: h }}
      initial={reduce ? false : { scaleY: 0 }}
      whileInView={{ scaleY: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, ease }}
    />
  );
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
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rig"
      >
        <span>
          <span className="block font-mono text-[11px] uppercase tracking-wider text-rig">Praktikum</span>
          <span className="block font-display text-lg font-semibold text-ink">{p.title.replace(/^Praktikum\s+/i, "")}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="hidden font-mono text-xs text-core sm:block">
            {p.dosen.length} Dosen · {p.asisten.length} Asisten
          </span>
          <ChevronDown className={`h-5 w-5 text-petrol transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </span>
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
            <div className="space-y-6 px-5 pb-6 pt-2">
              {/* Dosen pengampu: kartu utama */}
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-core">Dosen Pengampu</p>
                {p.dosen.length === 0 ? (
                  <EmptySlot label="Dosen MK Praktikum" />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {p.dosen.map((d) => (
                      <PersonCard key={d.id} person={d} tone="dosen" label="Dosen MK" />
                    ))}
                  </div>
                )}
              </div>

              {/* Asisten: grid kartu dengan muncul bertahap */}
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-core">Asisten Praktikum</p>
                  <span className="rounded-full border border-rig px-2 py-0.5 font-mono text-[10px] text-rig">
                    {p.asisten.length} orang
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>
                {p.asisten.length === 0 ? (
                  <EmptySlot label="Asisten Praktikum" />
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              <p className="text-xs text-core">Klik kartu untuk melihat foto.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function OrgChart({
  labs,
  praktikum,
  peneliti,
}: {
  labs: LabUnit[];
  praktikum: PraktikumUnit[];
  peneliti: OrgPerson[];
}) {
  return (
    <div className="flex flex-col items-center">
      {/* Akar */}
      <Step>
        <div className="rounded border border-petrol bg-petrol px-8 py-4 text-center text-paper shadow-card">
          <span className="block font-mono text-[11px] uppercase tracking-wider text-rig-light">Pengelola</span>
          <span className="font-display text-lg font-semibold">Teknik Perminyakan UNEJ</span>
        </div>
      </Step>

      <VLine />

      {/* Dua laboratorium */}
      <div className="org-row">
        {labs.map((lab, i) => (
          <div key={lab.key} className="org-col">
            <Step delay={0.1 + i * 0.05} className="w-full">
              <div className="rounded border border-line bg-white px-4 py-3 text-center shadow-card">
                <span className="block font-mono text-[11px] uppercase tracking-wider text-core">Laboratorium</span>
                <span className="font-semibold">{lab.name}</span>
              </div>
            </Step>
            <VLine />
            <Step delay={0.2} className="w-full">
              {lab.kepala ? (
                <PersonCard person={lab.kepala} tone="core" label="Kepala Laboratorium" />
              ) : (
                <EmptySlot label="Kepala Laboratorium" />
              )}
            </Step>
            <VLine />
            <Step delay={0.3} className="w-full">
              {lab.laboran ? (
                <PersonCard person={lab.laboran} tone="plain" label="Laboran / Teknisi" />
              ) : (
                <EmptySlot label="Laboran / Teknisi" />
              )}
            </Step>
          </div>
        ))}
      </div>

      {/* Praktikum */}
      <VLine h={32} />
      <Step>
        <span className="rounded-full border-[1.5px] border-rig bg-mist px-4 py-1 font-mono text-xs font-semibold text-rig">
          PRAKTIKUM
        </span>
      </Step>
      <VLine h={20} />
      <div className="w-full max-w-3xl space-y-3">
        {praktikum.length === 0 ? (
          <p className="text-center text-sm text-core">Belum ada praktikum yang dipublikasikan.</p>
        ) : (
          praktikum.map((p, i) => (
            <Step key={p.id} delay={Math.min(i * 0.05, 0.3)}>
              <Praktikum p={p} defaultOpen={i === 0} />
            </Step>
          ))
        )}
      </div>

      {/* Dosen Peneliti: tidak terikat laboratorium/praktikum */}
      <Step className="mt-10 w-full max-w-3xl border-t-2 border-dashed border-core pt-6">
        <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-wider text-core">
          Dosen Peneliti · tidak terikat laboratorium / praktikum
        </p>
        {peneliti.length === 0 ? (
          <EmptySlot label="Dosen Peneliti" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {peneliti.map((d) => (
              <PersonCard key={d.id} person={d} tone="plain" label="Dosen Peneliti" />
            ))}
          </div>
        )}
      </Step>
    </div>
  );
}
