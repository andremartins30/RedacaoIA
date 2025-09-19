'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    redirectTo?: string;
}

/**
 * Componente que protege rotas, redirecionando usuários não autenticados
 */
export default function ProtectedRoute({
    children,
    fallback,
    redirectTo = '/login'
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Se não está carregando e não está autenticado, redireciona
        if (!isLoading && !isAuthenticated) {
            router.replace(redirectTo);
        }
    }, [isAuthenticated, isLoading, router, redirectTo]);

    // Mostra carregamento enquanto verifica autenticação
    if (isLoading) {
        return fallback || (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-white text-lg">Verificando autenticação...</p>
                </div>
            </div>
        );
    }

    // Se não está autenticado, não renderiza nada (será redirecionado)
    if (!isAuthenticated) {
        return null;
    }

    // Se está autenticado, renderiza o conteúdo
    return <>{children}</>;
}
