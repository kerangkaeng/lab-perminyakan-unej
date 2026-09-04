// Integrasi CAS SSO Universitas Jember (SISTER UNEJ).
// CAS pakai protokol XML lama (bukan OAuth2), jadi login dilakukan via
// redirect + validasi ticket server-side, bukan token exchange biasa.

const CAS_BASE_URL = process.env.CAS_BASE_URL || "https://sso.unej.ac.id/cas";

export function getCasLoginUrl(serviceUrl: string) {
  return `${CAS_BASE_URL}/login?service=${encodeURIComponent(serviceUrl)}`;
}

export function getCasLogoutUrl(serviceUrl?: string) {
  return serviceUrl
    ? `${CAS_BASE_URL}/logout?service=${encodeURIComponent(serviceUrl)}`
    : `${CAS_BASE_URL}/logout`;
}

export type CasUser = {
  nim: string;
  nama?: string;
  prodi?: string;
};

/**
 * Validasi ticket ke endpoint serviceValidate CAS 2.0/3.0.
 * `serviceUrl` yang dikirim ke sini HARUS persis sama (termasuk query string)
 * dengan yang dipakai saat redirect ke /cas/login, karena CAS mencocokkan
 * ticket terhadap service URL secara exact-match.
 *
 * CATATAN: nama tag atribut (nama, prodi, dst) di bawah ini adalah tebakan
 * berdasarkan konvensi umum CAS attribute release. Sesuaikan dengan respons
 * XML asli dari sso.unej.ac.id begitu tersedia (cek lewat curl manual ke
 * endpoint serviceValidate saat testing pertama kali).
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

  const nim = userMatch[1].trim();
  const nama = extractAttribute(xml, ["nama", "name", "fullname", "cn", "displayName"]);
  const prodi = extractAttribute(xml, ["prodi", "program_studi", "programStudi", "department"]);

  return { nim, nama, prodi };
}

function extractAttribute(xml: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const re = new RegExp(`<cas:${key}>([^<]+)</cas:${key}>`, "i");
    const match = xml.match(re);
    if (match) return match[1].trim();
  }
  return undefined;
}
