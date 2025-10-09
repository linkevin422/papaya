"use client";

import Hero from "@/components/Hero";
import { ProfileProvider } from "@/context/ProfileProvider";

export default function Home() {
  return (
    <ProfileProvider>
      <main className="flex flex-col items-center justify-center px-4 sm:px-6 pt-20 pb-16 min-h-dvh text-center">
        <Hero />
      </main>
    </ProfileProvider>
  );
}
