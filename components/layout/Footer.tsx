import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line bg-mist mt-24">
      <div className="container-lab py-12 grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Laboratorium Teknik Perminyakan</p>
          <p className="mt-2 text-sm text-core max-w-xs">
            Pusat pembelajaran, penelitian, dan pengembangan teknologi perminyakan.
          </p>
        </div>

        <div>
          <p className="eyebrow mb-3">Navigasi</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/facilities" className="hover:text-rig">Facilities</Link></li>
            <li><Link href="/research" className="hover:text-rig">Research</Link></li>
            <li><Link href="/publications" className="hover:text-rig">Publications</Link></li>
            <li><Link href="/practicum" className="hover:text-rig">Practicum</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-3">Kontak</p>
          <ul className="space-y-2 text-sm text-core">
            <li>Gedung Teknik Perminyakan, Kampus</li>
            <li>lab.perminyakan@kampus.ac.id</li>
            <li>+62 xxx-xxxx-xxxx</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-lab py-4 text-xs text-core font-mono">
          © {new Date().getFullYear()} Laboratorium Teknik Perminyakan. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
