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

export type CasAttributes = Record<string, string[]>;

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
  /** Nilai mentah cas:foto — bisa path relatif ATAU URL penuh (lihat buildFotoUrl di app/profile/page.tsx). */
  foto?: string;
  /**
   * SEMUA atribut yang dikirim CAS apa adanya (nama tag -> daftar nilai).
   * Disimpan ke users.cas_attributes supaya nama atribut yang benar bisa
   * dilihat langsung dari data nyata, bukan ditebak.
   */
  attributes: CasAttributes;
};

// ---------------------------------------------------------------------------
// Parser XML minimal untuk respons serviceValidate. Struktur respons CAS
// sederhana (tanpa DTD/namespace rumit), jadi tidak perlu dependency
// tambahan. Sengaja TIDAK memakai regex per-nama-atribut lagi: semua tag di
// dalam <cas:attributes> dibaca generik, apa pun namanya.
// ---------------------------------------------------------------------------

type XmlNode = {
  name: string; // nama lokal tanpa prefix namespace
  attrs: Record<string, string>;
  children: XmlNode[];
  text: string;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function localName(qname: string): string {
  const i = qname.indexOf(":");
  return i === -1 ? qname : qname.slice(i + 1);
}

function parseAttrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) out[localName(m[1])] = decodeEntities(m[2] ?? m[3] ?? "");
  return out;
}

export function parseXml(xml: string): XmlNode {
  const root: XmlNode = { name: "#root", attrs: {}, children: [], text: "" };
  const stack: XmlNode[] = [root];
  const tokenRe = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<(\/?)([\w:.-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(xml))) {
    const top = stack[stack.length - 1];
    if (m[1] !== undefined) {
      top.text += m[1]; // CDATA: apa adanya
    } else if (m[3] !== undefined) {
      if (m[2] === "/") {
        if (stack.length > 1) stack.pop();
      } else {
        const node: XmlNode = { name: localName(m[3]), attrs: parseAttrs(m[4] ?? ""), children: [], text: "" };
        top.children.push(node);
        if (m[5] !== "/") stack.push(node);
      }
    } else if (m[6] !== undefined) {
      top.text += decodeEntities(m[6]);
    }
  }
  return root;
}

function find(node: XmlNode, name: string): XmlNode | undefined {
  for (const c of node.children) {
    if (c.name === name) return c;
    const deeper = find(c, name);
    if (deeper) return deeper;
  }
  return undefined;
}

function flatText(node: XmlNode): string {
  return (node.text + node.children.map(flatText).join(" ")).trim();
}

function addValue(out: CasAttributes, key: string, value: string) {
  const v = value.trim();
  if (!key || !v) return;
  (out[key] ??= []).push(v);
}

/** Kumpulkan SEMUA atribut dari blok <cas:authenticationSuccess>. */
function collectAttributes(success: XmlNode): CasAttributes {
  const out: CasAttributes = {};
  const attrsBlock = success.children.find((c) => c.name === "attributes");

  if (attrsBlock) {
    for (const c of attrsBlock.children) {
      // Gaya "jasig attributeStyle": <cas:attribute name="x" value="y"/>
      if (c.name === "attribute" && c.attrs.name) {
        addValue(out, c.attrs.name, c.attrs.value ?? flatText(c));
      } else {
        addValue(out, c.name, flatText(c));
      }
    }
  }

  // Beberapa server CAS (dan format CAS 2.0 lama) menaruh atribut langsung
  // di bawah authenticationSuccess, sejajar dengan <cas:user>.
  for (const c of success.children) {
    if (["user", "attributes", "proxyGrantingTicket", "proxies"].includes(c.name)) continue;
    addValue(out, c.name, flatText(c));
  }
  return out;
}

/** Ambil nilai pertama dari daftar kemungkinan nama (case-insensitive). */
function pick(attrs: CasAttributes, keys: string[]): string | undefined {
  const lower = new Map(Object.keys(attrs).map((k) => [k.toLowerCase(), k]));
  for (const key of keys) {
    const real = lower.get(key.toLowerCase());
    if (real && attrs[real][0]) return attrs[real][0];
  }
  return undefined;
}

/**
 * cas:leveluser isinya daftar affiliasi dipisah koma, mis.:
 * "Mahasiswa,Mahasiswa Teknik Perminyakan,Mahasiswa Fak. Teknik"
 * Bisa juga datang sebagai beberapa nilai terpisah — keduanya ditangani.
 */
function extractFakultas(attrs: CasAttributes): string | undefined {
  const lower = Object.keys(attrs).find((k) => k.toLowerCase() === "leveluser");
  if (!lower) return pick(attrs, ["fakultas", "namafakultas"]);

  const parts = attrs[lower].flatMap((v) => v.split(",")).map((p) => p.trim());
  const match = parts.find((p) => /fak\.?\s/i.test(p) || /fakultas/i.test(p));
  if (!match) return pick(attrs, ["fakultas", "namafakultas"]);
  return match.replace(/^(mahasiswa|dosen|tendik|staf|pegawai)\s+/i, "").trim() || undefined;
}

/**
 * Validasi ticket ke endpoint serviceValidate CAS 2.0/3.0.
 * `serviceUrl` yang dikirim ke sini HARUS persis sama (termasuk query string)
 * dengan yang dipakai saat redirect ke /cas/login, karena CAS mencocokkan
 * ticket terhadap service URL secara exact-match.
 *
 * Atribut dibaca dari respons nyata (lihat CasUser.attributes). Pemetaan ke
 * field aplikasi di bawah memakai daftar nama kandidat; nama yang SUDAH
 * terkonfirmasi dari XML sso.unej.ac.id ada di urutan pertama
 * (cn/displayname, namaunitkerja, status, emailsrd, leveluser, foto).
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

  const doc = parseXml(await res.text());
  const success = find(doc, "authenticationSuccess");
  if (!success) return null;

  const identifier = success.children.find((c) => c.name === "user")?.text.trim();
  if (!identifier) return null;

  const attributes = collectAttributes(success);

  return {
    identifier,
    nama: pick(attributes, ["cn", "displayname", "nama", "name", "fullname"]),
    prodi: pick(attributes, ["namaunitkerja", "prodi", "program_studi", "programStudi", "department"]),
    status: pick(attributes, ["status", "jenis", "tipe", "userType", "user_type", "kategori", "affiliation"]),
    email: pick(attributes, ["emailsrd", "email", "displaymail", "mail"]),
    foto: pick(attributes, ["foto", "photo", "fotourl", "picture", "image"]),
    fakultas: extractFakultas(attributes),
    attributes,
  };
}
