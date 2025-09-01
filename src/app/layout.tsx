// src/app/layout.tsx
'use client'

import './globals.css'
import { LanguageProvider } from '@/context/LanguageProvider'
import { ProfileProvider } from '@/context/ProfileProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <ProfileProvider>
            {children}
          </ProfileProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
