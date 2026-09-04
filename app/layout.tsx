import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getSession } from "@/lib/auth/session";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Laboratorium Teknik Perminyakan",
  description:
    "Pusat pembelajaran, penelitian, dan pengembangan teknologi perminyakan.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="id" className={`${fraunces.variable} ${inter.variable} ${mono.variable}`}>
      <body>
        <Navbar session={session ? { nama: session.nama, appRole: session.appRole } : null} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
