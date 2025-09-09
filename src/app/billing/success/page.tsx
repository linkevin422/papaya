'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function SuccessContent() {
  const qp = useSearchParams();
  const sessionId = qp.get('session_id') ?? '';

  return (
    <>
      <h1 className="text-2xl font-semibold">Payment successful ✅</h1>
      <p className="opacity-80">Checkout session: {sessionId || '(none)'}</p>
      <Link href="/" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">
        Go to app
      </Link>
    </>
  );
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-10">
      <Suspense fallback={<p className="opacity-60">Loading…</p>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
