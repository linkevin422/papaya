'use client';

import { useSearchParams } from 'next/navigation';

export default function SuccessPage() {
  const qp = useSearchParams();
  const sessionId = qp.get('session_id') ?? '';

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-10">
      <h1 className="text-2xl font-semibold">Payment successful ✅</h1>
      <p className="opacity-80">Checkout session: {sessionId || '(none)'}</p>
      <a
        href="/"
        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
      >
        Go to app
      </a>
    </main>
  );
}
