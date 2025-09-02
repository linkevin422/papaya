// /src/lib/supabase-server.ts
import { cookies as nextCookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export function createServerClientForNext() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Next can return a Promise for cookies(), so make these async.
        get: async (name: string) => {
          const store = await nextCookies()
          return store.get(name)?.value
        },
        set: async (name: string, value: string, options: any) => {
          const store = await nextCookies()
          store.set(name, value, options)
        },
        remove: async (name: string, options: any) => {
          const store = await nextCookies()
          store.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
}
