
import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host')
            const isProd = forwardedHost === 'tulanh.online' || requestUrl.host === 'tulanh.online'

            if (isProd) {
                return NextResponse.redirect(`https://tulanh.online${next}`)
            }

            return NextResponse.redirect(`${requestUrl.origin}${next}`)
        } else {
            console.error('Auth callback error:', error)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${requestUrl.origin}/auth?error=auth_code_error`)
}
