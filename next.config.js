/** @type {import('next').NextConfig} */
const nextConfig = {
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
