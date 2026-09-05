import Link from "next/link";
import { MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-line bg-mist mt-24">
      <div className="container-lab py-12 sm:py-14 grid gap-10 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Laboratorium Teknik Perminyakan</p>
          <p className="mt-2 text-sm text-core max-w-xs leading-relaxed">
            Pusat pembelajaran, penelitian, dan pengembangan teknologi perminyakan.
          </p>
        </div>

        <div>
          <p className="eyebrow mb-3">Navigasi</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/facilities" className="hover:text-rig transition-colors">Facilities</Link></li>
            <li><Link href="/research" className="hover:text-rig transition-colors">Research</Link></li>
            <li><Link href="/publications" className="hover:text-rig transition-colors">Publications</Link></li>
            <li><Link href="/practicum" className="hover:text-rig transition-colors">Practicum</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-3">Kontak</p>
          <ul className="space-y-3 text-sm text-core">
            <li className="flex items-start gap-2.5">
              <MapPin size={16} className="shrink-0 mt-0.5 text-rig" />
              <span>Gedung Teknik Perminyakan, Kampus</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={16} className="shrink-0 text-rig" />
              <span className="break-all">lab.perminyakan@kampus.ac.id</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={16} className="shrink-0 text-rig" />
              <span>+62 xxx-xxxx-xxxx</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-lab py-4 text-xs text-core font-mono text-center sm:text-left">
          © {new Date().getFullYear()} Laboratorium Teknik Perminyakan. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
