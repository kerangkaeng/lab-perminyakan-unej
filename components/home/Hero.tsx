import { Button } from "@/components/ui/Button";

// Signature element: a vertical "wireline log" strip — the same kind of curve
// read in the Well Logging Laboratory — standing in for the lab's core instrument.
function LogStrip() {
  const bars = Array.from({ length: 40 });
  return (
    <svg viewBox="0 0 120 480" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
      <rect x="0" y="0" width="120" height="480" fill="#0B3B4E" />
      {bars.map((_, i) => {
        const y = i * 12;
        const seed = Math.sin(i * 12.9) * 0.5 + 0.5;
        const w = 20 + seed * 70;
        return (
          <rect key={i} x="10" y={y + 2} width={w} height="4" fill="#E2A459" opacity={0.25 + seed * 0.55} />
        );
      })}
      <line x1="10" y1="0" x2="10" y2="480" stroke="#F6F7F5" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="container-lab grid gap-10 py-16 md:py-24 lg:grid-cols-[1fr_140px] lg:gap-16">
        <div>
          <p className="eyebrow mb-4">Fakultas Teknik &middot; Program Studi Teknik Perminyakan</p>
          <h1 className="text-4xl md:text-6xl font-display font-semibold leading-[1.05] text-ink max-w-3xl">
            Laboratorium Teknik Perminyakan
          </h1>
          <p className="mt-6 text-lg text-core max-w-xl">
            Pusat pembelajaran, penelitian, dan pengembangan teknologi perminyakan —
            dari analisis fluida reservoir hingga interpretasi log sumur.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Button href="/facilities">Lihat Fasilitas</Button>
            <Button href="/contact" variant="outline">Hubungi Kami</Button>
          </div>

          <dl className="mt-14 grid grid-cols-3 gap-6 max-w-md font-mono">
            <div>
              <dt className="text-xs text-core uppercase tracking-wide">Laboratorium</dt>
              <dd className="text-2xl text-petrol">7</dd>
            </div>
            <div>
              <dt className="text-xs text-core uppercase tracking-wide">Riset Aktif</dt>
              <dd className="text-2xl text-petrol">12+</dd>
            </div>
            <div>
              <dt className="text-xs text-core uppercase tracking-wide">Publikasi</dt>
              <dd className="text-2xl text-petrol">80+</dd>
            </div>
          </dl>
        </div>

        <div className="hidden lg:block h-full min-h-[420px]">
          <LogStrip />
        </div>
      </div>
    </section>
  );
}
