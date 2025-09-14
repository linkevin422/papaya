// src/app/billing/success/page.tsx

// --- SERVER COMPONENT PART ---
import BillingSuccessClient from './SuccessClient'

export default function BillingSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const sessionId = searchParams.session_id

  return (
    <BillingSuccessClient sessionId={sessionId} />
  )
}
