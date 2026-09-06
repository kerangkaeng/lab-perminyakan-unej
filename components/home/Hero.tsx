import { Button } from "@/components/ui/Button";

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
    <section className="relative overflow-hidden">
      <div className="lg:hidden h-10">
        <LogStrip orientation="horizontal" />
      </div>

      <div className="container-lab grid gap-16 pt-16 pb-24 sm:pt-24 sm:pb-32 lg:grid-cols-[1fr_120px] lg:items-start lg:pt-32 lg:pb-40">
        <div className="animate-fade-in-up max-w-3xl">
          <p className="eyebrow mb-6">
            Universitas Jember &middot; Fakultas Teknik &middot; Program Studi Teknik Perminyakan
          </p>
          <h1 className="text-[2.75rem] leading-[1.03] font-display font-semibold text-ink sm:text-6xl md:text-7xl">
            Laboratorium Teknik Perminyakan
          </h1>
          <p className="mt-8 max-w-xl text-lg text-core sm:text-xl">
            Pusat pembelajaran, penelitian, dan pengembangan teknologi perminyakan —
            dari analisis fluida reservoir hingga interpretasi log sumur.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Button href="/facilities">Lihat Fasilitas</Button>
            <Button href="/contact" variant="outline">Hubungi Kami</Button>
          </div>

          <dl className="mt-24 grid grid-cols-3 gap-8 sm:gap-14">
            <div>
              <dd className="font-display text-4xl text-petrol sm:text-5xl">3</dd>
              <dt className="mt-2 text-xs uppercase tracking-wide text-core">Laboratorium</dt>
            </div>
            <div>
              <dd className="font-display text-4xl text-petrol sm:text-5xl">12+</dd>
              <dt className="mt-2 text-xs uppercase tracking-wide text-core">Riset Aktif</dt>
            </div>
            <div>
              <dd className="font-display text-4xl text-petrol sm:text-5xl">80+</dd>
              <dt className="mt-2 text-xs uppercase tracking-wide text-core">Publikasi</dt>
            </div>
          </dl>
        </div>

        <div className="hidden lg:block h-full min-h-[440px] self-stretch">
          <LogStrip orientation="vertical" />
        </div>
      </div>
    </section>
  );
}
