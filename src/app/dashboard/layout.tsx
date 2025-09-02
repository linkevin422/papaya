// /src/app/dashboard/layout.tsx
'use client'

import React from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid grid-cols-1 md:grid-cols-[240px_1fr] bg-neutral-950 text-neutral-100">
      <aside className="hidden md:block border-r border-neutral-800 p-4">
        <nav className="space-y-2">
          <a href="/dashboard" className="block rounded-lg px-3 py-2 hover:bg-neutral-900">Overview</a>
          <a href="/dashboard/settings" className="block rounded-lg px-3 py-2 hover:bg-neutral-900">Settings</a>
        </nav>
      </aside>
      <div className="flex flex-col">
        <header className="sticky top-0 z-10 border-b border-neutral-800 px-4 py-3 backdrop-blur-sm bg-neutral-950/70">
          <div className="flex items-center justify-between">
            <div className="md:hidden">
              <span className="text-sm opacity-70">Menu</span>
            </div>
            <div className="font-semibold">Papaya</div>
            <a href="/dashboard/settings" className="rounded-lg px-3 py-1.5 hover:bg-neutral-900 text-sm">
              Settings
            </a>
          </div>
        </header>
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}
