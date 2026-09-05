import { Button } from "@/components/ui/Button";

// Signature element: a vertical "wireline log" strip — the same kind of curve
// read in the Well Logging Laboratory — standing in for the lab's core instrument.
function LogStrip({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const bars = Array.from({ length: 40 });
  const viewBox = orientation === "vertical" ? "0 0 120 480" : "0 0 480 60";

  return (
    <svg viewBox={viewBox} className="h-full w-full" preserveAspectRatio="none" aria-hidden>
      <rect x="0" y="0" width="100%" height="100%" fill="#0B3B4E" />
      {bars.map((_, i) => {
        const seed = Math.sin(i * 12.9) * 0.5 + 0.5;
        if (orientation === "vertical") {
          const y = i * 12;
          const w = 20 + seed * 70;
          return <rect key={i} x="10" y={y + 2} width={w} height="4" fill="#E2A459" opacity={0.25 + seed * 0.55} />;
        }
        const x = i * 12;
        const h = 10 + seed * 34;
        return <rect key={i} x={x + 2} y={30 - h / 2} width="4" height={h} fill="#E2A459" opacity={0.25 + seed * 0.55} />;
      })}
      {orientation === "vertical" ? (
        <line x1="10" y1="0" x2="10" y2="480" stroke="#F6F7F5" strokeWidth="1" opacity="0.3" />
      ) : (
        <line x1="0" y1="30" x2="480" y2="30" stroke="#F6F7F5" strokeWidth="1" opacity="0.3" />
      )}
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* Subtle horizontal log strip as a mobile/tablet accent, replaced by the full vertical strip on desktop */}
      <div className="lg:hidden h-12 sm:h-14">
        <LogStrip orientation="horizontal" />
      </div>

      <div className="container-lab grid gap-10 py-12 sm:py-16 md:py-20 lg:py-24 lg:grid-cols-[1fr_140px] lg:gap-16">
        <div className="animate-fade-in-up">
          <p className="eyebrow mb-4">Fakultas Teknik &middot; Program Studi Teknik Perminyakan</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-semibold leading-[1.05] text-ink max-w-3xl">
            Laboratorium Teknik Perminyakan
          </h1>
          <p className="mt-6 text-base sm:text-lg text-core max-w-xl leading-relaxed">
            Pusat pembelajaran, penelitian, dan pengembangan teknologi perminyakan —
            dari analisis fluida reservoir hingga interpretasi log sumur.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Button href="/facilities">Lihat Fasilitas</Button>
            <Button href="/contact" variant="outline">Hubungi Kami</Button>
          </div>

          <dl className="mt-12 sm:mt-14 grid grid-cols-3 gap-4 sm:gap-6 max-w-md font-mono">
            <div>
              <dt className="text-[10px] sm:text-xs text-core uppercase tracking-wide">Laboratorium</dt>
              <dd className="text-xl sm:text-2xl text-petrol">7</dd>
            </div>
            <div>
              <dt className="text-[10px] sm:text-xs text-core uppercase tracking-wide">Riset Aktif</dt>
              <dd className="text-xl sm:text-2xl text-petrol">12+</dd>
            </div>
            <div>
              <dt className="text-[10px] sm:text-xs text-core uppercase tracking-wide">Publikasi</dt>
              <dd className="text-xl sm:text-2xl text-petrol">80+</dd>
            </div>
          </dl>
        </div>

        <div className="hidden lg:block h-full min-h-[420px]">
          <LogStrip orientation="vertical" />
        </div>
      </div>
    </section>
  );
}
