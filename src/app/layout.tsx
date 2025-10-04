//src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Marba Giotto", template: "%s — Marba Giotto" },
  description: "Painel do Ateliê Marba Giotto",
  // opcional, bom para OG/Twitter
  metadataBase: new URL("https://app.marbagiotto.com.br"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--bg)] text-[var(--ink)]`}>
        {children}
      </body>
    </html>
  );
}
