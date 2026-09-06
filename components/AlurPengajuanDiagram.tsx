"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface Step {
  id: number;
  title: string;
  desc: string;
}

const steps: Step[] = [
  { id: 1, title: "Login", desc: "Mahasiswa/dosen masuk menggunakan akun SSO." },
  { id: 2, title: "Ajukan Permohonan", desc: "Mengisi form pengajuan penggunaan laboratorium." },
  { id: 3, title: "Verifikasi Admin", desc: "Admin lab memeriksa kelengkapan berkas." },
  { id: 4, title: "Persetujuan Kepala Lab", desc: "Kepala laboratorium menyetujui atau menolak." },
  { id: 5, title: "Penjadwalan", desc: "Slot waktu & alat dialokasikan ke pemohon." },
  { id: 6, title: "Selesai & Notifikasi", desc: "Pemohon menerima konfirmasi via email/dashboard." },
];

const MOBILE_PREVIEW_COUNT = 2;

export function AlurPengajuanDiagram() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full">
      {/* Desktop: horizontal flow */}
      <div className="hidden md:flex items-start justify-between gap-2">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              onMouseEnter={() => setActiveStep(step.id)}
              onMouseLeave={() => setActiveStep(null)}
              className={`flex-1 rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                activeStep === step.id
                  ? "border-rig bg-rig/5 scale-105 shadow-md"
                  : "border-mist bg-paper"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono mb-2 transition-colors ${
                  activeStep === step.id ? "bg-rig text-white" : "bg-petrol text-white"
                }`}
              >
                {step.id}
              </div>
              <h4 className="font-semibold text-petrol">{step.title}</h4>
              <p className="text-sm text-core mt-1">{step.desc}</p>
            </motion.div>

            {i < steps.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.12 + 0.2 }}
                className="h-px w-6 bg-mist origin-left mx-1 mt-8"
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile: vertical, collapsible */}
      <div className="md:hidden flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {steps
            .slice(0, expanded ? steps.length : MOBILE_PREVIEW_COUNT)
            .map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                className={`rounded-xl border p-4 transition-colors ${
                  activeStep === step.id ? "border-rig bg-rig/5" : "border-mist bg-paper"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-petrol text-white flex items-center justify-center text-xs font-mono shrink-0">
                    {step.id}
                  </div>
                  <h4 className="font-semibold text-petrol">{step.title}</h4>
                </div>
                <p className="text-sm text-core mt-2 pl-10">{step.desc}</p>
              </motion.div>
            ))}
        </AnimatePresence>

        {steps.length > MOBILE_PREVIEW_COUNT && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center justify-center gap-1 text-sm text-petrol py-2 font-medium"
          >
            {expanded ? "Sembunyikan" : `Lihat semua ${steps.length} langkah`}
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={16} />
            </motion.span>
          </button>
        )}
      </div>
    </div>
  );
}
