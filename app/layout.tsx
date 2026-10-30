import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const serif = Fraunces({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["600"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Muhamad Rizki — Portofolio & Life Journey",
  description:
    "Mahasiswa Teknik Informatika yang belajar Web & Mobile Development. Proyek, perjalanan, dan peta jelajah.",
};

export const revalidate = 60;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { data: profile } = await supabase
    .from("profile")
    .select("github_url, linkedin_url, instagram_url, email")
    .eq("id", 1)
    .maybeSingle();

  return (
    <html lang="id" className={`${inter.variable} ${mono.variable} ${serif.variable}`}>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer
          github={profile?.github_url}
          linkedin={profile?.linkedin_url}
          instagram={profile?.instagram_url}
          email={profile?.email}
        />
      </body>
    </html>
  );
}
