'use client'

import Hero from '@/components/Hero'
import { ProfileProvider } from '@/context/ProfileProvider'

export default function Home() {
  return (
    <ProfileProvider>
      <Hero />
    </ProfileProvider>
  )
}
