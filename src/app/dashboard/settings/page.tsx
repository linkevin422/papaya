'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Profile = {
  handle: string | null
  display_name: string | null
  locale: string | null
  plan: 'basic' | 'pro' | null
}

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile>({ handle: '', display_name: '', locale: 'en', plan: 'basic' })
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data, error } = await supabase
        .from('profiles')
        .select('handle, display_name, locale, plan')
        .eq('id', session.user.id)
        .single()
      if (!mounted) return
      if (error) setMsg(error.message)
      else if (data) setProfile({ ...profile, ...data })
      setLoading(false)
    })()
    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save() {
    setMsg(null)
    const handleOk = /^[a-zA-Z0-9_-]{3,20}$/.test(profile.handle || '')
    if (!handleOk) { setMsg('Handle must be 3–20 chars, letters/numbers/underscore/dash only.'); return }
    const { error } = await supabase.from('profiles').upsert({
      id: (await supabase.auth.getUser()).data.user?.id,
      ...profile
    })
    setMsg(error ? error.message : 'Saved.')
  }

  if (loading) return <p className="opacity-70">Loading…</p>

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-lg font-semibold">Settings</h1>
      <label className="block">
        <span className="text-sm opacity-80">Display name</span>
        <input className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2"
          value={profile.display_name || ''} onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))} />
      </label>
      <label className="block">
        <span className="text-sm opacity-80">Handle</span>
        <input className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2"
          value={profile.handle || ''} onChange={e => setProfile(p => ({ ...p, handle: e.target.value }))} />
        <p className="text-xs opacity-60 mt-1">3–20 chars, letters, numbers, underscore, dash.</p>
      </label>
      <label className="block">
        <span className="text-sm opacity-80">Language</span>
        <select className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2"
          value={profile.locale || 'en'} onChange={e => setProfile(p => ({ ...p, locale: e.target.value }))}>
          <option value="en">English</option>
          <option value="zh-TW">繁體中文</option>
        </select>
      </label>
      <div className="flex items-center gap-3">
        <button onClick={save} className="rounded-lg px-3 py-2 bg-neutral-100 text-neutral-900">Save</button>
        {msg && <span className="text-sm opacity-80">{msg}</span>}
      </div>
    </div>
  )
}
