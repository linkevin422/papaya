'use client'

import { useRouter } from 'next/navigation'

export default function UpgradeModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-neutral-900 p-6 shadow-xl">
        <h2 className="text-xl font-semibold">Upgrade to Pro</h2>
        <p className="mt-2 text-sm text-neutral-300">
          Basic plan supports 1 flow. Upgrade to Pro to create up to 10 flows
          and export without watermark.
        </p>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm bg-neutral-800 hover:bg-neutral-700"
          >
            Not now
          </button>
          <button
            onClick={() => router.push('/billing')}
            className="rounded-lg px-3 py-2 text-sm bg-white text-black hover:opacity-90"
          >
            Go to Billing
          </button>
        </div>
      </div>
    </div>
  )
}
