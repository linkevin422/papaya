'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageProvider'

const MIN_LEN = 3
const MAX_LEN = 20
const HANDLE_REGEX = /^[a-z0-9_-]+$/
const BANNED: string[] = ['admin', 'root', 'support', 'moderator', 'hitler', 'nazi', 'kkk', 'isis', 'nigger']

export default function RegisterPage() {
  const router = useRouter()
  const { t } = useLanguage()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [masterCurrency, setMasterCurrency] = useState('TWD')
  const [agreed, setAgreed] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  type HandleStatus = 'idle' | 'checking' | 'available' | 'taken'
  const [handleStatus, setHandleStatus] = useState<HandleStatus>('idle')

  const lastRequested = useRef<string>('')
  const lastValidated = useRef<string>('')

  const handleError: string | null = (() => {
    if (!handle) return null
    if (handle.length < MIN_LEN) return t('handle_too_short')
    if (handle.length > MAX_LEN) return t('handle_too_long')
    if (!HANDLE_REGEX.test(handle)) return t('handle_invalid')
    if (BANNED.includes(handle)) return t('handle_banned')
    return null
  })()

  useEffect(() => {
    if (!handle || handleError) {
      setHandleStatus('idle')
      return
    }
    if (lastValidated.current === handle && (handleStatus === 'available' || handleStatus === 'taken')) return

    setHandleStatus('checking')
    const current = handle
    lastRequested.current = current

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/check-handle?handle=' + current)
        const { taken } = await res.json()
        if (lastRequested.current !== current) return
        setHandleStatus(taken ? 'taken' : 'available')
        lastValidated.current = current
      } catch (err) {
        console.error(err)
        setHandleStatus('idle')
      }
    }, 450)

    return () => clearTimeout(timer)
  }, [handle, handleError, handleStatus, t])

  const passwordsMatch = confirmPassword === '' || password === confirmPassword

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!passwordsMatch) return setError(t('passwords_do_not_match'))
    if (handleError) return setError(handleError)
    if (handleStatus !== 'available') return setError(t('handle_not_available'))
    if (!agreed) return setError(t('must_agree_terms') || 'Please agree to the Terms and Privacy Policy.')

    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, handle, master_currency: masterCurrency }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to register')

      setEmailSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    const emailDomain = email.split('@')[1] || 'gmail.com'
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-zinc-900 p-8 rounded-xl shadow-xl text-center">
          <h2 className="text-2xl text-white font-semibold mb-4">{t('email_sent') || 'Email sent!'}</h2>
          <p className="text-gray-400 mb-6">{t('check_your_inbox') || 'Check your inbox to confirm your email.'}</p>
          <a
            href={`https://${emailDomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-white text-black font-semibold rounded hover:bg-gray-200 transition"
          >
            {t('go_to_email') || `Go to ${emailDomain}`}
          </a>
        </div>
      </div>
    )
  }

  const isSubmitDisabled =
    loading ||
    !!handleError ||
    handleStatus !== 'available' ||
    !passwordsMatch ||
    !email ||
    !name ||
    !handle ||
    !password ||
    !confirmPassword ||
    !agreed

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleRegister} className="w-full max-w-md bg-zinc-900 p-8 rounded-xl shadow-xl">
        <h1 className="text-2xl font-bold mb-6 text-white">{t('create_account')}</h1>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm text-gray-300 mb-1">{t('email')}</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-400 border border-zinc-700 focus:outline-none" />
        </div>

        {/* Name */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm text-gray-300 mb-1">{t('name') || 'Name'}</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-400 border border-zinc-700 focus:outline-none" />
        </div>

        {/* Handle */}
        <div className="mb-4">
          <label htmlFor="handle" className="block text-sm text-gray-300 mb-1">{t('handle')}</label>
          <input id="handle" type="text" value={handle}
            onChange={(e) => {
              const v = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
              setHandle(v)
            }}
            className={`w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-400 focus:outline-none border ${
              handleError ? 'border-red-500' : handleStatus === 'taken' ? 'border-red-500' : handleStatus === 'available' ? 'border-green-500' : 'border-zinc-700'
            }`} required />
          {handleError && <p className="text-red-500 text-sm mt-1">{handleError}</p>}
          {!handleError && handleStatus === 'checking' && <p className="text-gray-400 text-sm mt-1">{t('checking_handle')}</p>}
          {!handleError && handleStatus === 'available' && <p className="text-green-500 text-sm mt-1">{t('handle_available')}</p>}
          {!handleError && handleStatus === 'taken' && <p className="text-red-500 text-sm mt-1">{t('handle_taken')}</p>}
        </div>

        {/* Master Currency */}
        <div className="mb-4">
          <label htmlFor="master_currency" className="block text-sm text-gray-300 mb-1">{t('master_currency') || 'Preferred Currency'}</label>
          <select id="master_currency" value={masterCurrency} onChange={(e) => setMasterCurrency(e.target.value)}
            className="w-full p-3 rounded bg-zinc-800 text-white border border-zinc-700 focus:outline-none" required>
            <option value="TWD">TWD (New Taiwan Dollar)</option>
            <option value="USD">USD (US Dollar)</option>
            <option value="EUR">EUR (Euro)</option>
            <option value="JPY">JPY (Japanese Yen)</option>
            <option value="CAD">CAD (Canadian Dollar)</option>
            <option value="GBP">GBP (British Pound)</option>
          </select>
        </div>

        {/* Password */}
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm text-gray-300 mb-1">{t('password')}</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-400 border border-zinc-700 focus:outline-none" />
        </div>

        {/* Confirm */}
        <div className="mb-2">
          <label htmlFor="confirm_password" className="block text-sm text-gray-300 mb-1">{t('confirm_password')}</label>
          <input id="confirm_password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
            className={`w-full p-3 rounded placeholder-gray-400 focus:outline-none bg-zinc-800 text-white ${
              confirmPassword && !passwordsMatch ? 'border border-red-500' : 'border border-zinc-700'
            }`} />
        </div>

        {!passwordsMatch && <p className="text-red-500 text-sm mb-2">{t('passwords_do_not_match')}</p>}

        {/* Terms */}
        <div className="mt-4 mb-4 p-3 rounded-lg bg-zinc-800/60 border border-zinc-700">
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-white" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
            <span className="text-sm text-gray-300">
              {t('agree_prefix') || 'I have read and agree to the'}{' '}
              <Link href="/legal/terms" className="underline hover:text-white" target="_blank" rel="noopener noreferrer">{t('terms_of_service') || 'Terms of Service'}</Link>{' '}
              {t('and') || 'and'}{' '}
              <Link href="/legal/privacy" className="underline hover:text-white" target="_blank" rel="noopener noreferrer">{t('privacy_policy') || 'Privacy Policy'}</Link>.
            </span>
          </label>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full py-3 bg-white text-black font-semibold rounded hover:bg-gray-200 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <span aria-hidden className="inline-block h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />}
          <span>{t('signup')}</span>
        </button>
      </form>
    </div>
  )
}
