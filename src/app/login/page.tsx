'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLanguage } from '@/context/LanguageProvider'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleLogin} className="w-full max-w-md bg-zinc-900 p-8 rounded-xl shadow-xl">
        <h1 className="text-2xl font-bold mb-6 text-white">{t('login')}</h1>

        <input
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-zinc-800 text-white placeholder-gray-400 border border-zinc-700 focus:outline-none"
          required
        />

        <input
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-zinc-800 text-white placeholder-gray-400 border border-zinc-700 focus:outline-none"
          required
        />

{error && <p className="text-red-500 text-sm mb-4">{error}</p>}

<div className="flex justify-end mb-4">
  <button
    type="button"
    onClick={() => router.push('/forgot-password')}
    className="text-sm text-blue-400 hover:underline"
  >
    {t('forgot_password')}
  </button>
</div>

<button
  type="submit"
  disabled={loading}
  className="w-full py-3 bg-white text-black font-semibold rounded hover:bg-gray-200 transition"
>
  {loading ? `${t('login')}…` : t('login')}
</button>
      </form>
    </div>
  )
}
