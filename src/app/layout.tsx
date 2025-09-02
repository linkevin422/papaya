'use client'

import './globals.css'
import { LanguageProvider } from '@/context/LanguageProvider'
import { ProfileProvider } from '@/context/ProfileProvider'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased min-h-screen flex flex-col">
        <LanguageProvider>
          <ProfileProvider>
            <Header />
            <main className="pt-16 flex-1">{children}</main>
            <Footer />
          </ProfileProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
