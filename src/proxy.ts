import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isPublicPage = pathname === '/';

  if (isAuthPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL('/dashboard', req.nextUrl));
    }
    return;
  }

  // Protect all other routes except public page and API (APIs have their own auth checks)
  if (!isLoggedIn && !isPublicPage && !pathname.startsWith('/api')) {
    return Response.redirect(new URL('/login', req.nextUrl));
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
