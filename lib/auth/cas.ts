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
  email?: string;
  fakultas?: string;
  /** Path relatif foto dari SISTER (mis. "images/foto/221910801047.JPG"), BUKAN URL penuh. */
  foto?: string;
};

/**
 * Validasi ticket ke endpoint serviceValidate CAS 2.0/3.0.
 * `serviceUrl` yang dikirim ke sini HARUS persis sama (termasuk query string)
 * dengan yang dipakai saat redirect ke /cas/login, karena CAS mencocokkan
 * ticket terhadap service URL secara exact-match.
 *
 * Nama tag atribut di bawah ini sudah DIKONFIRMASI dari XML asli
 * sso.unej.ac.id (dicek lewat log debug 2026-10-08):
 *   - nama      -> cas:cn / cas:displayname
 *   - prodi     -> cas:namaunitkerja (mis. "Teknik Perminyakan")
 *   - status    -> cas:status (mis. "Mahasiswa" / "Dosen" / "Tendik")
 *   - email     -> cas:emailsrd (format resmi @mail.unej.ac.id, lebih stabil
 *                  daripada cas:email/cas:displaymail yang kadang kosong
 *                  atau isinya email pribadi)
 *   - fakultas  -> diparsing dari cas:leveluser, format contoh:
 *                  "Mahasiswa,Mahasiswa Teknik Perminyakan,Mahasiswa Fak. Teknik"
 *                  (comma-separated, ambil segmen yang mengandung "Fak").
 *                  Pola ini baru diverifikasi untuk akun mahasiswa — kalau
 *                  nanti ada akun dosen/tendik yang fakultas-nya tidak
 *                  kebaca, cek lagi raw XML-nya, formatnya mungkin beda.
 *   - foto      -> cas:foto, path RELATIF (bukan URL penuh), domain dasarnya
 *                  belum dikonfirmasi — jangan dirender sebagai <img src>
 *                  langsung sebelum base URL-nya dipastikan.
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

  const isSuccess =
    xml.includes("cas:authenticationSuccess") || xml.includes("<authenticationSuccess");
  if (!isSuccess) return null;

  const userMatch =
    xml.match(/<cas:user>([^<]+)<\/cas:user>/) || xml.match(/<user>([^<]+)<\/user>/);
  if (!userMatch) return null;

  const identifier = userMatch[1].trim();
  const nama = extractAttribute(xml, ["cn", "displayname", "nama", "name", "fullname"]);
  const prodi = extractAttribute(xml, [
    "namaunitkerja",
    "prodi",
    "program_studi",
    "programStudi",
    "department",
  ]);
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
  const email = extractAttribute(xml, ["emailsrd", "email", "displaymail"]);
  const foto = extractAttribute(xml, ["foto"]);
  const fakultas = extractFakultas(xml);

  return { identifier, nama, prodi, status, email, foto, fakultas };
}

function extractAttribute(xml: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const re = new RegExp(`<cas:${key}>([^<]+)</cas:${key}>`, "i");
    const match = xml.match(re);
    if (match && match[1].trim()) return match[1].trim();
  }
  return undefined;
}

/**
 * cas:leveluser isinya daftar affiliasi dipisah koma, mis.:
 * "Mahasiswa,Mahasiswa Teknik Perminyakan,Mahasiswa Fak. Teknik"
 * Fakultas diambil dari segmen yang mengandung "Fak", lalu prefix status
 * (Mahasiswa/Dosen/Tendik/dst) di depannya dibuang.
 */
function extractFakultas(xml: string): string | undefined {
  const leveluser = extractAttribute(xml, ["leveluser"]);
  if (!leveluser) return undefined;

  const parts = leveluser.split(",").map((p) => p.trim());
  const match = parts.find((p) => /fak\.?\s/i.test(p) || /fakultas/i.test(p));
  if (!match) return undefined;

  return match.replace(/^(mahasiswa|dosen|tendik|staf|pegawai)\s+/i, "").trim() || undefined;
}
