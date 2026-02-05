
import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/'

    // Use NEXT_PUBLIC_SITE_URL to prevent localhost redirect when behind proxy
    // Use NEXT_PUBLIC_SITE_URL to prevent localhost redirect when behind proxy
    const siteUrl = 'https://tulanh.online';

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(`${siteUrl}${next}`)
        } else {
            console.error('Auth callback error:', error)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${siteUrl}/auth?error=auth_code_error`)
}
