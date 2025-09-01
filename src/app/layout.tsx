import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { LanguageProvider } from '@/context/LanguageProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen flex flex-col">
        <LanguageProvider>
          <Header />
          <main className="flex-1 pt-20">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  )
}
