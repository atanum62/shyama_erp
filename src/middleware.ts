import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(req) {
        const isApiRoute = req.nextUrl.pathname.startsWith('/api');
        const token = req.nextauth.token;

        if (isApiRoute && !token) {
            return new NextResponse(
                JSON.stringify({ error: 'Authentication required' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const isApiRoute = req.nextUrl.pathname.startsWith('/api');
                if (isApiRoute) return true;
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        '/((?!api/auth|api/register|login|_next/static|_next/image|favicon.ico|$).*)',
    ],
};
