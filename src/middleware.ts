import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieOptions = {
    name: string
    value: string
    options?: Record<string, unknown>
}

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Check for missing environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/signup', '/auth/callback', '/forgot-password']
    const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname === route)
    const isApiRoute = request.nextUrl.pathname.startsWith('/api')
    const isStaticFile = request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/favicon') ||
        request.nextUrl.pathname.includes('.')

    // Allow public routes, API routes, and static files
    if (isPublicRoute || isApiRoute || isStaticFile) {
        return supabaseResponse
    }

    if (!supabaseUrl || !supabaseKey) {
        // If env vars are missing, we can't authenticate.
        // Allow request to proceed to show UI errors instead of hard crashing here.
        console.warn('⚠️ Middleware: Missing Supabase Credentials. Skipping auth check.')
        return supabaseResponse
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: CookieOptions[]) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // If not logged in, redirect to login
    if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
