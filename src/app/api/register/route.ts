import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: Request) {
  try {
    const { email, password, name, handle, master_currency } = await req.json()

    // 1) Create user (no Supabase email)
    const { data: userData, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, handle, master_currency },
        email_confirm: false,
      })

    if (createErr || !userData?.user) {
      console.error('Create user error:', createErr)
      return NextResponse.json({ error: createErr?.message || 'createUser failed' }, { status: 400 })
    }

    const user = userData.user

    // 1.5) ✅ Upsert profile NOW with service role (bypasses RLS)
    const { error: upsertErr } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ?? email,
          name: user.user_metadata?.name ?? name,
          handle: user.user_metadata?.handle ?? handle,
          master_currency: user.user_metadata?.master_currency ?? master_currency ?? 'USD',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

    if (upsertErr) {
      console.error('Profile upsert (register) failed:', upsertErr)
      return NextResponse.json({ error: upsertErr.message || 'profile upsert failed' }, { status: 500 })
    }

    // 2) Generate confirmation link
    const { data: linkData, error: linkErr } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email,
        password, // required
      })

    if (linkErr || !linkData?.properties?.action_link) {
      console.error('Link error:', linkErr)
      return NextResponse.json({ error: linkErr?.message || 'generateLink failed' }, { status: 400 })
    }

    const confirmUrl = linkData.properties.action_link

    // 3) Send email via Resend
    const { data: emailData, error: emailErr } = await resend.emails.send({
      from: 'Papaya <noreply@papaya.im>',
      to: email,
      subject: 'Confirm your Papaya account',
      text: `Hello ${name || ''},\n\nClick to confirm:\n${confirmUrl}\n`,
      html: `<h2>Welcome ${name || ''}</h2><p><a href="${confirmUrl}">Confirm Account</a></p>`,
    })

    if (emailErr) {
      console.error('Resend error:', emailErr)
      return NextResponse.json({ error: emailErr.message || 'resend failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: emailData?.id })
  } catch (err: any) {
    console.error('Register route fatal:', err)
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 })
  }
}
