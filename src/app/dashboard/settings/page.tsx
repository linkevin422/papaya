'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const supabase = createClient()

type Profile = {
  handle: string
  display_name: string
  locale: string
  master_currency: string
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({
    handle: '',
    display_name: '',
    locale: 'en',
    master_currency: 'TWD',
  })
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('handle, display_name, locale, master_currency')
        .eq('id', session.user.id)
        .single()
      if (!mounted) return
      if (data) {
        setProfile({
          handle: data.handle || '',
          display_name: data.display_name || '',
          locale: data.locale || 'en',
          master_currency: data.master_currency || 'TWD',
        })
      } else {
        console.error(error)
        setMsg('Failed to load profile')
      }
      setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  async function save() {
    setMsg(null)
    const handleOk = /^[a-zA-Z0-9_-]{3,20}$/.test(profile.handle)
    if (!handleOk) {
      setMsg('Handle must be 3–20 chars, letters/numbers/underscore/dash only.')
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    const id = userData.user?.id
    const { error } = await supabase.from('profiles').upsert({ id, ...profile })
    setMsg(error ? error.message : 'Saved.')
  }

  async function deleteAccount() {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) return

    // delete from profiles
    await supabase.from('profiles').delete().eq('id', userId)

    // delete from auth
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      setMsg('Error deleting user: ' + error.message)
    } else {
      setMsg('Account deleted.')
      window.location.href = '/'
    }
  }

  if (loading)
    return <p className="opacity-70 text-sm px-4 py-6">Loading…</p>

  return (
    <div className="max-w-md space-y-6 px-4 py-6">
      <h1 className="text-lg font-semibold">Settings</h1>

      <label className="block">
        <span className="text-sm opacity-80">Display Name</span>
        <input
          className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2"
          value={profile.display_name}
          onChange={(e) =>
            setProfile((p) => ({ ...p, display_name: e.target.value }))
          }
        />
      </label>

      <label className="block">
        <span className="text-sm opacity-80">Handle</span>
        <input
          className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2"
          value={profile.handle}
          onChange={(e) =>
            setProfile((p) => ({ ...p, handle: e.target.value }))
          }
        />
        <p className="text-xs opacity-60 mt-1">
          3–20 chars. Only letters, numbers, underscores, or dashes.
        </p>
      </label>

      <label className="block">
        <span className="text-sm opacity-80">Language</span>
        <select
          className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2"
          value={profile.locale}
          onChange={(e) =>
            setProfile((p) => ({ ...p, locale: e.target.value }))
          }
        >
          <option value="en">English</option>
          <option value="zh_tw">繁體中文</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm opacity-80">Master Currency</span>
        <select
          className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2"
          value={profile.master_currency}
          onChange={(e) =>
            setProfile((p) => ({ ...p, master_currency: e.target.value }))
          }
        >
          <option value="TWD">NTD (New Taiwan Dollar)</option>
          <option value="USD">USD (US Dollar)</option>
          <option value="EUR">EUR (Euro)</option>
          <option value="JPY">JPY (Japanese Yen)</option>
          <option value="CAD">CAD (Canadian Dollar)</option>
          <option value="GBP">GBP (British Pound)</option>
          <option value="AUD">AUD (Australian Dollar)</option>
          <option value="HKD">HKD (Hong Kong Dollar)</option>
          <option value="CNY">CNY (Chinese Yuan)</option>
          <option value="SGD">SGD (Singapore Dollar)</option>
        </select>
      </label>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="rounded-lg px-4 py-2 bg-neutral-100 text-neutral-900 text-sm"
        >
          Save
        </button>
        {msg && <span className="text-sm opacity-80">{msg}</span>}
      </div>

      <hr className="border-neutral-800" />

      {/* Billing section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Billing</h2>
          <button
            onClick={async () => {
              setMsg(null)
              const {
                data: { user },
              } = await supabase.auth.getUser()
              if (!user) {
                window.location.href = '/login'
                return
              }
              const { data: profileData } = await supabase
                .from('profiles')
                .select('stripe_customer_id')
                .eq('id', user.id)
                .single()
              const customerId = profileData?.stripe_customer_id
              if (!customerId) {
                setMsg('No Stripe customer ID found.')
                return
              }
              const res = await fetch('/api/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId }),
              })
              const json = await res.json()
              if (json.url) {
                window.location.href = json.url
              } else {
                setMsg(json.error || 'Failed to open billing portal')
              }
            }}
            className="rounded-lg px-4 py-2 bg-neutral-100 text-neutral-900 text-sm mt-2"
          >
            Manage Subscription
          </button>
        </div>

        <hr className="border-neutral-800" />

        <div>
          <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-500 hover:underline"
            >
              Delete account
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm opacity-80">
                Are you sure? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={deleteAccount}
                  className="rounded-lg px-3 py-2 text-sm bg-red-600 text-white"
                >
                  Confirm delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg px-3 py-2 text-sm bg-neutral-800 text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
