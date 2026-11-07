/** @type {import('next').NextConfig} */
const nextConfig = {
  // Default body server action hanya 1 MB -> upload modul praktikum (5 MB) akan ditolak
  // sebelum sampai ke validasi. Diberi 6 MB supaya muat 5 MB + overhead multipart.
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  // Template header PDF dibaca lewat fs saat runtime -> wajib disertakan di bundle serverless.
  outputFileTracingIncludes: {
    "/api/loans/**/*": ["./lib/loans/templates/*.pdf"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

module.exports = nextConfig;
