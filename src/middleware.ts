import { withAuth } from 'next-auth/middleware';

export default withAuth({
    callbacks: {
        authorized: ({ token }) => !!token,
    },
});

export const config = {
    // Specify which routes to protect
    // For example, protect everything except the landing page, login, and registration APIs
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth routes)
         * - api/register (if you want this public)
         * - login (login page)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - / (landing page)
         */
        '/((?!api/auth|api/register|login|_next/static|_next/image|favicon.ico|$).*)',
    ],
};
