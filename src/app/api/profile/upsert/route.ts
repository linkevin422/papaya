import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const { id, email, name, handle } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 })

    // if any field missing, fetch from Auth
    let finalEmail = email as string | null | undefined
    let finalName = name as string | null | undefined
    let finalHandle = handle as string | null | undefined

    if (!finalEmail || finalName === undefined || finalHandle === undefined) {
      const { data: udata, error: uerr } = await supabaseAdmin.auth.admin.getUserById(id)
      if (uerr) return NextResponse.json({ error: uerr.message }, { status: 400 })
      const u = udata.user
      finalEmail = finalEmail ?? u?.email ?? null
      finalName = finalName ?? (u?.user_metadata?.name as string | undefined) ?? null
      finalHandle = finalHandle ?? (u?.user_metadata?.handle as string | undefined) ?? null
    }

    const { error: upsertErr } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id,
          email: finalEmail ?? null,
          name: finalName ?? null,
          handle: finalHandle ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
