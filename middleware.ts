import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que requerem autenticação
const protectedRoutes = ['/corretor', '/profile', '/admin'];

// Rotas públicas que redirecionam usuários autenticados
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Verifica se há token de autenticação
    const token = request.cookies.get('auth_token')?.value;
    const isAuthenticated = !!token;

    // Redireciona usuários autenticados das páginas de auth para o corretor
    if (isAuthenticated && authRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/corretor', request.url));
    }

    // Redireciona usuários não autenticados das páginas protegidas para login
    if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
};
