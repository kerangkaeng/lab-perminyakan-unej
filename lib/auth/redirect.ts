/**
 * Hanya terima path internal ("/practicum/status"). Menolak URL absolut,
 * "//evil.com", "/\evil.com", dan karakter kontrol — supaya parameter
 * `redirect` di alur login tidak bisa dipakai sebagai open redirect.
 */
export function safeRedirectPath(input: string | null | undefined, fallback = "/practicum/status"): string {
  if (!input) return fallback;
  if (!input.startsWith("/")) return fallback;
  if (input.startsWith("//") || input.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(input)) return fallback;
  return input;
}
