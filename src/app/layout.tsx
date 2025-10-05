// src/app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Marba Giotto", template: "%s — Marba Giotto" },
  description: "Painel do Ateliê Marba Giotto",
  metadataBase: new URL("https://app.marbagiotto.com.br"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="croche">{/* default = croche */}
      <head>
        {/* seta o tema salvo no localStorage antes de tudo, evitando flash */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{
             var t = localStorage.getItem('theme') || 'croche';
             document.documentElement.dataset.theme = t;
           }catch(e){}`}
        </Script>
      </head>
      <body className="antialiased">
        {/* seletor flutuante */}
        <div className="fixed right-4 top-4 z-50"><ThemeSwitcher/></div>
        {children}
      </body>
    </html>
  );
}

// IMPORTANT: como é app router, este arquivo é Server Component.
// Coloque o ThemeSwitcher abaixo em src/components e importe assim:
import ThemeSwitcher from "@/components/ThemeSwitcher";
