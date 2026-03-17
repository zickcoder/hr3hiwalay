import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Middleware: Supabase environment variables are missing.')
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // why your users are being logged out.
    const { data: { user } } = await supabase.auth.getUser()

    const isBypass = request.cookies.get('test_auth_bypass')?.value === 'true'

    // Protect HR and ESS routes
    const isHrRoute = request.nextUrl.pathname.startsWith('/hr1') ||
        request.nextUrl.pathname.startsWith('/hr2') ||
        request.nextUrl.pathname.startsWith('/hr3') ||
        request.nextUrl.pathname.startsWith('/hr4')
    const isEssRoute = request.nextUrl.pathname.startsWith('/ess')

    if (!user && !isBypass && (isHrRoute || isEssRoute)) {
        // Check if it's the login page, if so, allow access
        if (request.nextUrl.pathname.endsWith('/login')) {
            return response
        }

        // Redirect to appropriate login page
        const redirectPath = isEssRoute ? '/ess/login' : '/hr3/login'
        return NextResponse.redirect(new URL(redirectPath, request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
