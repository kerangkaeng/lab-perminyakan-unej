const errorMessages: Record<string, string> = {
  missing_ticket: "Login dibatalkan atau ticket tidak ditemukan.",
  invalid_ticket: "Ticket SSO tidak valid atau sudah kedaluwarsa. Coba login ulang.",
  server_error: "Terjadi kesalahan pada server. Silakan coba lagi.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string };
}) {
  const redirectPath = searchParams?.redirect || "/practicum/status";
  const casLoginHref = `/api/auth/cas/login?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <div className="container-lab py-24 max-w-md">
      <p className="eyebrow mb-3">Masuk</p>
      <h1 className="text-3xl font-display font-semibold mb-6">Login Mahasiswa</h1>
      <p className="text-core mb-8">
        Gunakan akun SISTER Universitas Jember untuk mengajukan jadwal praktikum
        dan memantau status pengajuan kamu.
      </p>

      {searchParams?.error && (
        <p className="mb-6 text-sm text-red-700 border border-red-300 bg-red-50 px-4 py-3">
          {errorMessages[searchParams.error] ?? "Terjadi kesalahan saat login."}
        </p>
      )}

      <a
        href={casLoginHref}
        className="inline-flex items-center gap-2 bg-petrol text-paper px-6 py-3 text-sm font-medium hover:bg-petrol-light transition-colors"
      >
        Masuk dengan SSO UNEJ
      </a>
    </div>
  );
}
