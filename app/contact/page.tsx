export default function ContactPage() {
  return (
    <div className="container-lab py-16 grid gap-12 md:grid-cols-2">
      <div>
        <p className="eyebrow mb-3">Contact</p>
        <h1 className="text-3xl md:text-4xl font-display font-semibold mb-6">Hubungi Kami</h1>
        <p className="text-core mb-8">
          Untuk pertanyaan seputar praktikum, kerja sama riset, atau kunjungan
          laboratorium, silakan hubungi kami melalui form berikut.
        </p>
        <ul className="text-sm text-core space-y-2 font-mono">
          <li>lab.perminyakan@kampus.ac.id</li>
          <li>+62 xxx-xxxx-xxxx</li>
          <li>Gedung Teknik Perminyakan, Kampus</li>
        </ul>
      </div>

      <form action="/api/contact" method="POST" className="space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Nama</label>
          <input name="name" required className="w-full border border-line bg-mist px-4 py-2.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Email</label>
          <input name="email" type="email" required className="w-full border border-line bg-mist px-4 py-2.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Pesan</label>
          <textarea name="message" rows={5} required className="w-full border border-line bg-mist px-4 py-2.5 text-sm" />
        </div>
        <button type="submit" className="bg-petrol text-paper px-6 py-2.5 text-sm font-medium hover:bg-petrol-light transition-colors">
          Kirim Pesan
        </button>
      </form>
    </div>
  );
}
