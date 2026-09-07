// Integrasi CAS SSO Universitas Jember (SISTER UNEJ).
// CAS pakai protokol XML lama (bukan OAuth2), jadi login dilakukan via
// redirect + validasi ticket server-side, bukan token exchange biasa.

const CAS_BASE_URL = process.env.CAS_BASE_URL || "https://sso.unej.ac.id/cas";

export function getCasLoginUrl(serviceUrl: string, options?: { renew?: boolean }) {
  const url = `${CAS_BASE_URL}/login?service=${encodeURIComponent(serviceUrl)}`;
  // `renew=true` memaksa CAS menampilkan form login (NIM/password + 2FA jika ada)
  // walau sesi SSO di browser masih aktif — tanpa ini, CAS akan skip form
  // selama cookie TGT di sso.unej.ac.id belum expired/di-logout.
  return options?.renew ? `${url}&renew=true` : url;
}

export function getCasLogoutUrl(serviceUrl?: string) {
  return serviceUrl
    ? `${CAS_BASE_URL}/logout?service=${encodeURIComponent(serviceUrl)}`
    : `${CAS_BASE_URL}/logout`;
}

export type CasUser = {
  /** Identitas mentah dari <cas:user> — bisa berupa NIM (mahasiswa) atau NIP (staf/laboran). */
  identifier: string;
  nama?: string;
  prodi?: string;
  /**
   * Status/jenis akun dari SISTER (mis. "mahasiswa", "dosen", "tendik").
   * HANYA untuk label tampilan — tidak pernah dipakai untuk menentukan
   * kolom `role`/hak akses (itu tetap manual lewat SQL).
   */
  status?: string;
};

/**
 * Validasi ticket ke endpoint serviceValidate CAS 2.0/3.0.
 * `serviceUrl` yang dikirim ke sini HARUS persis sama (termasuk query string)
 * dengan yang dipakai saat redirect ke /cas/login, karena CAS mencocokkan
 * ticket terhadap service URL secara exact-match.
 *
 * CATATAN: nama tag atribut (nama, prodi, status, dst) di bawah ini adalah
 * tebakan berdasarkan konvensi umum CAS attribute release. Sesuaikan dengan
 * respons XML asli dari sso.unej.ac.id begitu tersedia (cek lewat log
 * DEBUG SEMENTARA di bawah saat testing login pertama kali).
 */
export async function validateCasTicket(
  ticket: string,
  serviceUrl: string
): Promise<CasUser | null> {
  const url = `${CAS_BASE_URL}/serviceValidate?service=${encodeURIComponent(
    serviceUrl
  )}&ticket=${encodeURIComponent(ticket)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const xml = await res.text();

  // DEBUG SEMENTARA: cetak XML mentah ke log server supaya kita bisa lihat
  // atribut asli apa saja yang dikirim CAS SISTER (nama tag untuk membedakan
  // mahasiswa/dosen/tendik, dsb). HAPUS blok ini setelah selesai diagnosis.
  console.log("=== CAS serviceValidate raw XML ===\n" + xml);

  const isSuccess =
    xml.includes("cas:authenticationSuccess") || xml.includes("<authenticationSuccess");
  if (!isSuccess) return null;

  const userMatch =
    xml.match(/<cas:user>([^<]+)<\/cas:user>/) || xml.match(/<user>([^<]+)<\/user>/);
  if (!userMatch) return null;

  const identifier = userMatch[1].trim();
  const nama = extractAttribute(xml, ["nama", "name", "fullname", "cn", "displayName"]);
  const prodi = extractAttribute(xml, ["prodi", "program_studi", "programStudi", "department"]);
  // Nama tag atribut ini masih tebakan — cek log XML mentah di atas saat
  // testing pertama kali, lalu tambahkan/sesuaikan key di sini kalau nama
  // atribut asli dari SISTER berbeda.
  const status = extractAttribute(xml, [
    "status",
    "jenis",
    "tipe",
    "userType",
    "user_type",
    "kategori",
    "memberOf",
    "affiliation",
  ]);

  return { identifier, nama, prodi, status };
}

function extractAttribute(xml: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const re = new RegExp(`<cas:${key}>([^<]+)</cas:${key}>`, "i");
    const match = xml.match(re);
    if (match) return match[1].trim();
  }
  return undefined;
}
