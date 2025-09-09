import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { to, token } = await req.json()

    // Build your confirmation URL (this replaces Supabase's emailRedirectTo)
    const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?token=${token}`

    const data = await resend.emails.send({
      from: 'Papayaa <noreply@papaya.im>', // set up domain in Resend
      to,
      subject: 'Confirm your account',
      html: `
        <h2>Welcome</h2>
        <p>Click below to confirm your account:</p>
        <a href="${confirmUrl}">Confirm Account</a>
      `,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error }, { status: 500 })
  }
}
