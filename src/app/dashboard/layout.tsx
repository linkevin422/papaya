// /src/app/dashboard/layout.tsx
'use client'

import React from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid grid-cols-1 md:grid-cols-[240px_1fr] bg-neutral-950 text-neutral-100">
      {/* Sidebar (desktop only) */}
      <aside className="hidden md:block border-r border-neutral-800 p-4">
        <nav className="space-y-2">
          <a
            href="/dashboard"
            className="block rounded-lg px-3 py-2 hover:bg-neutral-900"
          >
            Overview
          </a>
          <a
            href="/dashboard/settings"
            className="block rounded-lg px-3 py-2 hover:bg-neutral-900"
          >
            Settings
          </a>
        </nav>
      </aside>

      {/* Main content (no inner header) */}
      <main className="p-4">
        {children}
      </main>
    </div>
  )
}
