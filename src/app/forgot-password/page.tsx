'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useLanguage } from '@/context/LanguageProvider'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const { t } = useLanguage()

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    setLoading(true)

    // Supabase has a built-in method to send reset links
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage(t('reset_link_sent'))
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form
        onSubmit={handleForgotPassword}
        className="w-full max-w-md bg-zinc-900 p-8 rounded-xl shadow-xl"
      >
        <h1 className="text-2xl font-bold mb-6 text-white">
          {t('forgot_password')}
        </h1>

        <input
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-zinc-800 text-white placeholder-gray-400 border border-zinc-700 focus:outline-none"
          required
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {message && <p className="text-green-500 text-sm mb-4">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-white text-black font-semibold rounded hover:bg-gray-200 transition"
        >
          {loading ? `${t('sending')}…` : t('send_reset_link')}
        </button>
      </form>
    </div>
  )
}
