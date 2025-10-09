"use client";

import "./globals.css";
import { LanguageProvider } from "@/context/LanguageProvider";
import { ProfileProvider } from "@/context/ProfileProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Papaya</title>
        <meta name="description" content="Papaya Project" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/favicon-16x16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/favicon-32x32.png"
        />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/icons/site.webmanifest" />

        {/* Open Graph for social previews */}
        <meta property="og:title" content="Papaya" />
        <meta property="og:description" content="Papaya Project" />
        <meta property="og:image" content="/logo/logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com" />

        {/* Theme color + viewport for mobile */}
        <meta name="theme-color" content="#000000" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </head>

      <body className="bg-black text-white antialiased min-h-dvh flex flex-col overflow-x-hidden overscroll-none selection:bg-yellow-500/20 selection:text-yellow-300">
        <LanguageProvider>
          <ProfileProvider>
            <Header />
            <div id="page-root" className="relative flex-1 flex flex-col">
              <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-[4.5rem] pb-[env(safe-area-inset-bottom,3rem)]">
                {children}
              </main>
              <Footer />
            </div>
          </ProfileProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
