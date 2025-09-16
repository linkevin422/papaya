'use client'

import { cn } from '@/lib/utils'

export type ViewMode = 'daily' | 'monthly' | 'yearly'

type Props = {
  viewMode: ViewMode
  setViewMode: (m: ViewMode) => void
}

export default function TimeframeSwitcher({ viewMode, setViewMode }: Props) {
  return (
    <div className="inline-flex gap-1 rounded-md bg-neutral-900 border border-neutral-800 p-1">
      {(['daily', 'monthly', 'yearly'] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={cn(
            'text-xs px-3 py-1.5 rounded-md transition',
            viewMode === mode
              ? 'bg-white text-black font-medium'
              : 'text-neutral-400 hover:bg-neutral-800'
          )}
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      ))}
    </div>
  )
}
