import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Routes that require the user to be authenticated AND approved.
// Any path that *starts with* one of these strings is protected.
const PROTECTED_ROUTES = ['/dashboard', '/pick', '/profile']

// Routes that require the user to be authenticated AND an admin.
const ADMIN_ROUTES = ['/admin']

// Routes for unauthenticated users only.
// An already-authenticated user visiting these gets redirected to /dashboard.
const AUTH_ONLY_ROUTES = [
  '/login',
  '/signup',
  '/reset-password',
  '/verify-email',
  '/update-password',
]

export async function proxy(request: NextRequest) {
  // We start with a passthrough response and may replace it below
  // if Supabase needs to rotate the session token (sets new cookies).
  let response = NextResponse.next({ request })

  // Create a Supabase client that can read/write cookies on this request.
  // The cookie callbacks here follow the required @supabase/ssr pattern:
  // setAll must update BOTH the request object AND the response object
  // so that the rotated token reaches the browser AND is visible to
  // Server Components in the same render pass.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update the request so downstream Server Components see the new token.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          // Replace the response so the browser receives the updated cookies.
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // getUser() also refreshes the session token when it's about to expire.
  // This MUST be called on every request — it's what keeps users logged in.
  // Do not use getSession() here: it reads from the cookie without verification.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  )
  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    pathname.startsWith(route),
  )
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route),
  )
  const isPendingApprovalRoute = pathname.startsWith('/pending-approval')

  // Unauthenticated user trying to access any restricted route → send to login.
  if ((isProtectedRoute || isAdminRoute || isPendingApprovalRoute) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authenticated user: fetch their approval and admin status from the DB.
  // This is a fast primary-key lookup — one round trip per request.
  let isApproved = false
  let isAdmin = false

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_approved, is_admin')
      .eq('id', user.id)
      .single()

    isApproved = profile?.is_approved ?? false
    isAdmin = profile?.is_admin ?? false
  }

  // Authenticated but not yet approved: can only see /pending-approval.
  if (user && !isApproved && !isAdmin && isProtectedRoute) {
    return NextResponse.redirect(new URL('/pending-approval', request.url))
  }

  // Approved user visiting /pending-approval → no longer needed, send to dashboard.
  if (user && isApproved && isPendingApprovalRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Non-admin trying to access admin routes → send to dashboard.
  if (isAdminRoute && user && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Authenticated user trying to access auth pages → send to dashboard.
  if (isAuthOnlyRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    // Run on all routes EXCEPT Next.js internals and static assets.
    // This regex excludes: _next/static, _next/image, favicon.ico,
    // and any file with a common static extension.
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
