'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLanguage } from '@/context/LanguageProvider'

// handle rules
const MIN_LEN = 3
const MAX_LEN = 20
const HANDLE_REGEX = /^[a-z0-9_-]+$/
const BANNED: string[] = [
    'admin',
    'root',
    'support',
    'moderator',
    'hitler',
    'nazi',
    'kkk',
    'isis',
    'nigger'
  ]
  
export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  const [email, setEmail] = useState('')
  const [handle, setHandle] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  type HandleStatus = 'idle' | 'checking' | 'available' | 'taken'
  const [handleStatus, setHandleStatus] = useState<HandleStatus>('idle')

  const lastRequested = useRef<string>('')
  const lastValidated = useRef<string>('')

  // validate handle before DB check
  const handleError: string | null = (() => {
    if (!handle) return null
    if (handle.length < MIN_LEN) return t('handle_too_short')
    if (handle.length > MAX_LEN) return t('handle_too_long')
    if (!HANDLE_REGEX.test(handle)) return t('handle_invalid')
    if (BANNED.includes(handle)) return t('handle_banned')
    return null
  })()

  // check availability
  useEffect(() => {
    if (!handle || handleError) {
      setHandleStatus('idle')
      return
    }

    // skip re-check if this handle was already validated
    if (
      lastValidated.current === handle &&
      (handleStatus === 'available' || handleStatus === 'taken')
    ) {
      return
    }

    setHandleStatus('checking')
    const current = handle
    lastRequested.current = current

    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('handle', current)
        .maybeSingle()

      if (lastRequested.current !== current) return // stale result

      if (error) {
        console.error(error)
        setHandleStatus('idle')
        return
      }

      setHandleStatus(data ? 'taken' : 'available')
      lastValidated.current = current // remember this result
    }, 500)

    return () => clearTimeout(timer)
  }, [handle, handleError, supabase])

  const passwordsMatch = confirmPassword === '' || password === confirmPassword

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!passwordsMatch) {
      setError(t('passwords_do_not_match'))
      return
    }
    if (handleError) {
      setError(handleError)
      return
    }
    if (handleStatus !== 'available') {
      setError(t('handle_not_available'))
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ handle })
        .eq('id', data.user.id)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md bg-zinc-900 p-8 rounded-xl shadow-xl"
      >
        <h1 className="text-2xl font-bold mb-6 text-white">{t('create_account')}</h1>

        {/* Email */}
        <input
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-zinc-800 text-white placeholder-gray-400 border border-zinc-700 focus:outline-none"
          required
        />

        {/* Handle */}
        <div className="mb-3">
          <input
            type="text"
            placeholder={t('handle')}
            value={handle}
            onChange={(e) => {
              const v = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
              setHandle(v)
            }}
            className={`w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-400 focus:outline-none border ${
              handleError
                ? 'border-red-500'
                : handleStatus === 'taken'
                ? 'border-red-500'
                : handleStatus === 'available'
                ? 'border-green-500'
                : 'border-zinc-700'
            }`}
            required
          />

          <p className="text-xs text-gray-500 mt-1">
            {MIN_LEN}-{MAX_LEN} {t('chars') || 'chars'}. a-z, 0-9, _ -
          </p>

          {handleError && <p className="text-red-500 text-sm mt-1">{handleError}</p>}
          {!handleError && handle && handleStatus === 'checking' && (
            <p className="text-gray-400 text-sm mt-1">{t('checking_handle')}</p>
          )}
          {!handleError && handle && handleStatus === 'available' && (
            <p className="text-green-500 text-sm mt-1">{t('handle_available')}</p>
          )}
          {!handleError && handle && handleStatus === 'taken' && (
            <p className="text-red-500 text-sm mt-1">{t('handle_taken')}</p>
          )}
        </div>

        {/* Password */}
        <input
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-zinc-800 text-white placeholder-gray-400 border border-zinc-700 focus:outline-none"
          required
        />

        {/* Confirm password */}
        <input
          type="password"
          placeholder={t('confirm_password')}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`w-full mb-2 p-3 rounded placeholder-gray-400 focus:outline-none bg-zinc-800 text-white ${
            confirmPassword && !passwordsMatch ? 'border border-red-500' : 'border border-zinc-700'
          }`}
          required
        />

        {!passwordsMatch && (
          <p className="text-red-500 text-sm mb-2">{t('passwords_do_not_match')}</p>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={
            loading ||
            !!handleError ||
            handleStatus !== 'available' ||
            !passwordsMatch ||
            !email ||
            !handle ||
            !password ||
            !confirmPassword
          }
          className="w-full py-3 bg-white text-black font-semibold rounded hover:bg-gray-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? `${t('signup')}…` : t('signup')}
        </button>
      </form>
    </div>
  )
}
